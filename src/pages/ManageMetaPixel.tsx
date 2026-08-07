import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, CheckCircle, RefreshCw, AlertCircle, ShieldCheck, Zap, Send, Activity, Info, Key, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackMetaEvent, DEFAULT_PIXEL_ID } from '../lib/metaPixel';

export const DEFAULT_CAPI_TOKEN = 'EAASpkZAwXaZAkBSG8sdxGMxmVL9K47lqtZC6ZATcN0iUHx8xzIB2RPOsopUe2h47PpZAMEkJOkZAc5imjKEYCzRciicX71g4ftIZBJxzRLFZBXgckzQ48qBVE4fRz7JeXkgdBvbWZCkSK3toZAAdI98CHtew3A5pyU1waidAsubHBhVykAqPZCGMrZBxgEcQhzrXjxT2vgZDZD';

export default function ManageMetaPixel() {
  const [pixelId, setPixelId] = useState(DEFAULT_PIXEL_ID);
  const [capiToken, setCapiToken] = useState(DEFAULT_CAPI_TOKEN);
  const [testEventCode, setTestEventCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Diagnostic Test States
  const [testEventType, setTestEventType] = useState('Purchase');
  const [testing, setTesting] = useState(false);
  const [testLog, setTestLog] = useState<any>(null);

  useEffect(() => {
    fetchMetaSettings();
  }, []);

  const fetchMetaSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;

      if (data && Array.isArray(data)) {
        const pId = data.find(s => s.key === 'meta_pixel_id')?.value;
        const cTok = data.find(s => s.key === 'meta_capi_token')?.value;
        const tCode = data.find(s => s.key === 'meta_test_event_code')?.value;

        if (pId) setPixelId(pId);
        if (cTok) setCapiToken(cTok);
        if (tCode) setTestEventCode(tCode);
      }
    } catch (err: any) {
      console.error('Error fetching Meta Pixel settings:', err);
      setErrorMsg('Could not load stored Meta settings from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg('');

    try {
      const settingsToUpsert = [
        { key: 'meta_pixel_id', value: pixelId.trim() },
        { key: 'meta_capi_token', value: capiToken.trim() },
        { key: 'meta_test_event_code', value: testEventCode.trim() }
      ];

      const { error } = await supabase.from('site_settings').upsert(settingsToUpsert, { onConflict: 'key' });
      if (error) throw error;

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving Meta settings:', err);
      setErrorMsg(err.message || 'Failed to save Meta configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEvent = async () => {
    setTesting(true);
    setTestLog(null);

    const sampleEventId = `test_evt_${Date.now()}`;
    const customData = testEventType === 'Purchase' 
      ? { currency: 'DZD', value: 4500, content_type: 'product', content_ids: ['test_book_101'], num_items: 1 }
      : testEventType === 'AddToCart'
      ? { currency: 'DZD', value: 2000, content_type: 'product', content_ids: ['test_book_101'] }
      : { page_name: 'Diagnostic Test' };

    const sampleUserData = {
      email: 'testcustomer@example.com',
      phone: '0555123456',
      full_name: 'Mohamed Khelifa',
      wilaya: 'Alger',
      baladia: 'Alger Centre'
    };

    try {
      // 1. Browser Event Trigger
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', testEventType, customData, { eventID: sampleEventId });
      }

      // 2. Direct CAPI Backend Trigger
      const capiRes = await fetch('/api/meta-capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: testEventType,
          event_id: sampleEventId,
          event_source_url: window.location.href,
          custom_data: customData,
          user_data: sampleUserData,
          test_event_code: testEventCode.trim() || undefined
        })
      });

      const resData = await capiRes.json();
      setTestLog({
        status: capiRes.status,
        ok: capiRes.ok,
        eventId: sampleEventId,
        response: resData
      });
    } catch (err: any) {
      setTestLog({
        ok: false,
        error: err.message || 'Network error executing CAPI test'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl text-primary border border-primary/30">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">Meta Pixel & Conversions API (CAPI)</h1>
            </div>
            <p className="text-white/60 text-sm max-w-2xl">
              Configure dual browser pixel and server-side CAPI tracking for reliable event delivery (Purchase, InitiateCheckout, AddToCart, ViewContent) with automatic event deduplication.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Dual Tracking Active</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <span>Meta API Credentials</span>
            </h2>

            {/* Pixel ID */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>Meta Pixel ID (Dataset ID)</span>
                <span className="text-[10px] text-primary">Required</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="e.g. 2124874741697456"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary text-sm font-mono"
                />
              </div>
              <p className="text-xs text-white/40">
                Default dataset ID from Meta Events Manager: <code className="text-primary font-mono">{DEFAULT_PIXEL_ID}</code>
              </p>
            </div>

            {/* CAPI Token */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>Conversions API Access Token (CAPI)</span>
                <span className="text-[10px] text-amber-400">Recommended for 100% Sales Tracking</span>
              </label>
              <textarea
                rows={3}
                value={capiToken}
                onChange={(e) => setCapiToken(e.target.value)}
                placeholder="Paste EAAG... access token generated from Meta Events Manager > Settings > Conversions API"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary text-xs font-mono resize-none"
              />
              <p className="text-xs text-white/40">
                To generate: Meta Events Manager &gt; Select Dataset &gt; Settings &gt; Conversions API &gt; "Generate access token".
              </p>
            </div>

            {/* Test Event Code */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>Test Event Code (Optional)</span>
                <span className="text-[10px] text-white/40">For Meta Live Testing</span>
              </label>
              <input
                type="text"
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                placeholder="e.g. TEST12345"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary text-sm font-mono"
              />
              <p className="text-xs text-white/40">
                Found under Meta Events Manager &gt; "Test events" tab. Leave blank in production.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : savedSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Meta Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test Event Simulator */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Live Diagnostic Tester</span>
            </h2>

            <p className="text-xs text-white/60">
              Trigger a real test event to verify that your Pixel and CAPI endpoint are properly dispatching payloads to Meta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={testEventType}
                onChange={(e) => setTestEventType(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="Purchase" className="bg-slate-900 text-white">Purchase (Sale Event)</option>
                <option value="AddToCart" className="bg-slate-900 text-white">AddToCart</option>
                <option value="InitiateCheckout" className="bg-slate-900 text-white">InitiateCheckout</option>
                <option value="PageView" className="bg-slate-900 text-white">PageView</option>
              </select>

              <button
                type="button"
                onClick={handleSendTestEvent}
                disabled={testing}
                className="py-3 px-6 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Test {testEventType} Event</span>
                  </>
                )}
              </button>
            </div>

            {testLog && (
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-white">Diagnostic Output:</span>
                  <span className={testLog.ok ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    HTTP {testLog.status || 'N/A'} {testLog.ok ? 'SUCCESS' : 'NOTICE'}
                  </span>
                </div>
                {testLog.response?.userHint && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-sans text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <span>{testLog.response.userHint}</span>
                  </div>
                )}
                <div className="text-white/60">
                  Event ID (Deduplication Key): <span className="text-primary">{testLog.eventId}</span>
                </div>
                <pre className="p-3 bg-black/50 rounded-xl text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(testLog.response || testLog, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Troubleshooting (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>Why Were Sales Missing?</span>
            </h3>

            <div className="space-y-3 text-xs text-white/70 leading-relaxed">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 space-y-1">
                <div className="font-bold">1. Browser Pixel Blockers</div>
                <div>iOS 14.5+ and ad-blockers block 30-50% of client-side browser pixels.</div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 space-y-1">
                <div className="font-bold">2. Server CAPI Solution</div>
                <div>With Conversions API (CAPI), sales are sent directly from your backend server to Meta, bypassing all browser blockers.</div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 space-y-1">
                <div className="font-bold">3. Automatic Deduplication</div>
                <div>Both browser and CAPI events share the exact same <code className="font-mono bg-black/30 px-1 rounded">event_id</code> (e.g., Order ID), so Meta merges them automatically without double-counting!</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">How to Get CAPI Token</h3>
            <ol className="text-xs text-white/70 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Open <a href="https://eventsmanager.facebook.com" target="_blank" rel="noreferrer" className="text-primary underline">Meta Events Manager</a>.</li>
              <li>Select Dataset: <strong>Mohamed Khelifa's Pixel</strong>.</li>
              <li>Click <strong>Settings</strong> tab.</li>
              <li>Scroll down to <strong>Conversions API</strong>.</li>
              <li>Click <strong>"Generate access token"</strong> under Set up direct integration.</li>
              <li>Copy and paste the token into the field above and click <strong>Save</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
