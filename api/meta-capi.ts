import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || '';

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

function isSha256(val: string): boolean {
  return /^[a-f0-9]{64}$/i.test(val);
}

function processHash(val: string): string {
  if (!val) return '';
  const trimmed = val.trim().toLowerCase();
  if (isSha256(trimmed)) return trimmed;
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return '213' + digits.slice(1);
  if (digits.length === 9) return '213' + digits;
  return digits;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_name, event_id, event_source_url, custom_data, user_data } = req.body || {};
    if (!event_name) {
      return res.status(400).json({ error: 'Missing event_name in request body' });
    }

    let pixelId = getEnv('META_PIXEL_ID') || getEnv('VITE_META_PIXEL_ID') || '2124874741697456';
    let accessToken = getEnv('META_CAPI_TOKEN') || getEnv('META_ACCESS_TOKEN') || 'EAASpkZAwXaZAkBSG8sdxGMxmVL9K47lqtZC6ZATcN0iUHx8xzIB2RPOsopUe2h47PpZAMEkJOkZAc5imjKEYCzRciicX71g4ftIZBJxzRLFZBXgckzQ48qBVE4fRz7JeXkgdBvbWZCkSK3toZAAdI98CHtew3A5pyU1waidAsubHBhVykAqPZCGMrZBxgEcQhzrXjxT2vgZDZD';
    let testEventCode = getEnv('META_TEST_EVENT_CODE') || '';

    // Check Supabase site_settings for overrides
    if (supabase) {
      try {
        const { data: settings } = await supabase.from('site_settings').select('*');
        if (settings && Array.isArray(settings)) {
          const storedPixel = settings.find((s: any) => s.key === 'meta_pixel_id')?.value;
          const storedToken = settings.find((s: any) => s.key === 'meta_capi_token')?.value;
          const storedTestCode = settings.find((s: any) => s.key === 'meta_test_event_code')?.value;

          if (storedPixel && storedPixel.trim()) pixelId = storedPixel.trim();
          if (storedToken && storedToken.trim()) accessToken = storedToken.trim();
          if (storedTestCode && storedTestCode.trim()) testEventCode = storedTestCode.trim();
        }
      } catch (e) {
        // Ignore DB lookup error
      }
    }

    // Process & hash user_data for Meta Advanced Matching
    const hashedUserData: Record<string, any> = {};

    if (user_data?.email) {
      hashedUserData.em = [processHash(user_data.email)];
    }

    if (user_data?.phone) {
      const cleanPh = normalizePhone(user_data.phone);
      if (cleanPh) {
        hashedUserData.ph = [processHash(cleanPh)];
      }
    }

    if (user_data?.full_name) {
      const parts = user_data.full_name.trim().toLowerCase().split(/\s+/);
      const fn = parts[0] || '';
      const ln = parts.slice(1).join(' ') || fn;
      if (fn) hashedUserData.fn = [processHash(fn)];
      if (ln) hashedUserData.ln = [processHash(ln)];
    }

    if (user_data?.baladia) {
      const cleanBaladia = user_data.baladia.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanBaladia) hashedUserData.ct = [processHash(cleanBaladia)];
    }

    if (user_data?.wilaya) {
      const cleanWilaya = user_data.wilaya.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWilaya) hashedUserData.st = [processHash(cleanWilaya)];
    }

    // Always include country hash for DZ (Algeria)
    hashedUserData.country = [processHash('dz')];

    // Client IP & User Agent
    const clientIp = req.headers?.['x-forwarded-for']
      ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
      : req.socket?.remoteAddress || req.connection?.remoteAddress;

    if (clientIp) hashedUserData.client_ip_address = clientIp;
    if (req.headers?.['user-agent']) hashedUserData.client_user_agent = req.headers['user-agent'];

    if (user_data?.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data?.fbc) hashedUserData.fbc = user_data.fbc;

    const eventPayload: any = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      event_source_url: event_source_url || req.headers?.referer || 'https://bigdealbookstore.com',
      action_source: 'website',
      user_data: hashedUserData,
      custom_data: custom_data || {}
    };

    const postBody: any = {
      data: [eventPayload]
    };

    const activeTestCode = req.body.test_event_code || testEventCode;
    if (activeTestCode) {
      postBody.test_event_code = activeTestCode;
    }

    if (!accessToken) {
      return res.status(200).json({
        success: false,
        warning: 'CAPI Access Token is not set. Go to Admin Panel > Meta Pixel & CAPI to enter your token.',
        pixelId,
        event: eventPayload
      });
    }

    const fbUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const fbRes = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody)
    });

    const result = await fbRes.json();
    if (!fbRes.ok) {
      let userHint = '';
      if (result?.error?.code === 100 || result?.error?.error_subcode === 33) {
        userHint = `Invalid or missing CAPI Access Token for Pixel ID ${pixelId}. Please paste your generated Access Token in Admin Dashboard > Meta Pixel & CAPI.`;
        console.warn('[Meta CAPI Access Token Notice]', userHint);
      } else {
        console.error('[Meta CAPI Response Error]', result);
        if (result?.error?.message) userHint = result.error.message;
      }
      return res.status(200).json({ success: false, error: result, userHint, pixelId });
    }

    return res.status(200).json({ success: true, pixelId, result });
  } catch (err: any) {
    console.error('[Meta CAPI Endpoint Exception]', err);
    return res.status(500).json({ error: err.message || 'Server error processing CAPI event' });
  }
}
