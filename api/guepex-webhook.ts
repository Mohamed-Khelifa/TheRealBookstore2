import crypto from 'crypto';
import { supabase } from '../src/lib/supabase.js';

interface WebhookLogEntry {
  id: string;
  timestamp: string;
  type: string;
  event_id?: string;
  tracking?: string;
  status?: string;
  success: boolean;
  message: string;
}

// In-memory store for recent webhook events log (max 100)
const webhookLogs: WebhookLogEntry[] = [];
// Processed event ID deduplication set (max 1000)
const processedEvents = new Set<string>();

function addLog(entry: Omit<WebhookLogEntry, 'id' | 'timestamp'>) {
  const log: WebhookLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...entry
  };
  webhookLogs.unshift(log);
  if (webhookLogs.length > 100) webhookLogs.pop();
  console.log(`[GUEPEX WEBHOOK] ${log.timestamp} - ${log.type}: ${log.message}`);
}

function escapeHtml(text: any) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mapGuepexStatusToOrderState(status: string): { order_state?: 'DELIVERED_PAID' | 'DELIVERED_RETURNED' | 'READY_NOT_DELIVERED' | 'DID_NOT_ARRIVE'; status?: 'DELIVERED' | 'CANCELLED' | 'SHIPPED' | 'PENDING' } {
  if (!status) return {};
  const s = status.toLowerCase().trim();

  // Delivered / Paid / Collected
  if (
    s.includes('livré') || s.includes('livre') ||
    s.includes('payé') || s.includes('paye') ||
    s.includes('encaissé') || s.includes('encaisse') ||
    s.includes('delivered') || s.includes('soldé') || s.includes('solde') ||
    s.includes('echec de livraison - livre')
  ) {
    return { order_state: 'DELIVERED_PAID', status: 'DELIVERED' };
  }

  // Returned / Delivery Failed / Cancelled / Refused
  if (
    s.includes('retour') || s.includes('échec') || s.includes('echec') ||
    s.includes('échoué') || s.includes('echoue') || s.includes('annulé') ||
    s.includes('annule') || s.includes('refusé') || s.includes('refuse') ||
    s.includes('returned') || s.includes('failed') || s.includes('injoignable') ||
    s.includes('non livrable') || s.includes('perdu') || s.includes('dégradé')
  ) {
    return { order_state: 'DELIVERED_RETURNED', status: 'CANCELLED' };
  }

  // Out for delivery / In transit / Arrived at hub / Shipped
  if (
    s.includes('sorti') || s.includes('transit') || s.includes('centre') ||
    s.includes('expédié') || s.includes('expedie') || s.includes('wilaya') ||
    s.includes('livraison') || s.includes('en attente') || s.includes('reçu') ||
    s.includes('recu') || s.includes('shipped') || s.includes('hub') ||
    s.includes('transfert') || s.includes('livreur') || s.includes('dispatch') ||
    s.includes('acheminement') || s.includes('receptionne')
  ) {
    return { order_state: 'READY_NOT_DELIVERED', status: 'SHIPPED' };
  }

  // Pending / Created
  if (s.includes('créé') || s.includes('cree') || s.includes('ramassage') || s.includes('enregistré')) {
    return { order_state: 'DID_NOT_ARRIVE', status: 'PENDING' };
  }

  return {};
}

async function awardLoyaltyPointsIfDelivered(order: any) {
  if (!order || !order.phone || !order.total_price) return;
  const isAwarded = order.items && order.items.length > 0 && order.items[0]?.is_points_awarded;
  if (isAwarded) return;

  try {
    const earnedPoints = 10 + Math.floor((order.total_price || 0) / 100);
    const { data: existingPoints } = await supabase
      .from('loyalty_points')
      .select('points')
      .eq('phone', order.phone)
      .single();

    const currentPoints = existingPoints?.points || 0;
    await supabase
      .from('loyalty_points')
      .upsert({ phone: order.phone, points: currentPoints + earnedPoints }, { onConflict: 'phone' });

    if (Array.isArray(order.items) && order.items.length > 0) {
      const updatedItems = [...order.items];
      updatedItems[0] = { ...updatedItems[0], is_points_awarded: true };
      await supabase
        .from('orders')
        .update({ items: updatedItems })
        .eq('id', order.id);
    }
    console.log(`[GUEPEX WEBHOOK] Awarded ${earnedPoints} points to phone ${order.phone} for order ${order.id}`);
  } catch (err) {
    console.error('[GUEPEX WEBHOOK] Error awarding points:', err);
  }
}

async function sendTelegramNotification(order: any, guepexStatus: string, mappedState?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId || !order) return;

  try {
    const isDelivered = mappedState === 'DELIVERED_PAID' || guepexStatus?.toLowerCase().includes('livr');
    const isReturned = mappedState === 'DELIVERED_RETURNED' || guepexStatus?.toLowerCase().includes('retour');
    
    let title = '📦 <b>Order Status Update (Guepex Webhook)</b>';
    if (isDelivered) title = '🎉 <b>Order Delivered Successfully! (Guepex Webhook)</b> ✅';
    else if (isReturned) title = '⚠️ <b>Order Delivery Returned/Failed! (Guepex)</b> ❌';

    const itemsList = (order.items || []).map((item: any) => 
      `• <b>${escapeHtml(item.qty || 1)}x</b> ${escapeHtml(item.title || item.name || 'Book')}`
    ).join('\n');

    const message = `${title}\n\n` +
      `🆔 <b>Order Ref:</b> #${escapeHtml(order.id)}\n` +
      (order.tracking_code ? `📦 <b>Tracking:</b> <code>${escapeHtml(order.tracking_code)}</code>\n` : '') +
      `👤 <b>Customer:</b> ${escapeHtml(order.customer_name || 'N/A')}\n` +
      `📱 <b>Phone:</b> <code>${escapeHtml(order.phone || 'N/A')}</code>\n` +
      `📍 <b>Location:</b> ${escapeHtml(order.wilaya || 'N/A')}${order.baladia ? `, ${escapeHtml(order.baladia)}` : ''}\n` +
      `🏷️ <b>Guepex Status:</b> ${escapeHtml(guepexStatus || 'Updated')}\n` +
      `💰 <b>Total Price:</b> <b>${escapeHtml(order.total_price || 0)} DA</b>\n` +
      `\n📚 <b>Items:</b>\n${itemsList || '- Books'}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });
  } catch (err) {
    console.error('[GUEPEX WEBHOOK] Error sending Telegram status notification:', err);
  }
}

export async function guepexWebhookHandler(req: any, res: any) {
  // Set CORS and standard headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // 0. Handle OPTIONS and HEAD requests (CORS / preflight checks)
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).send('OK');
  }

  // 1. Extract CRC token from query parameters, URL searchParams, request body, or headers
  const urlObj = new URL(req.url || '', 'http://localhost');
  const crcToken =
    urlObj.searchParams.get('crc_token') ||
    urlObj.searchParams.get('crcToken') ||
    req.query?.crc_token ||
    req.query?.crcToken ||
    (typeof req.body === 'object' && req.body ? (req.body.crc_token || req.body.crcToken) : undefined) ||
    req.headers['crc_token'] ||
    req.headers['x-crc-token'];

  const hasSubscribeParam =
    urlObj.searchParams.has('subscribe') ||
    req.query?.subscribe !== undefined ||
    (typeof req.body === 'object' && req.body ? req.body.subscribe !== undefined : false);

  // If this is a CRC challenge or subscription verification request from Guepex
  if (crcToken !== undefined || hasSubscribeParam) {
    const tokenToEcho = String(crcToken || req.query?.crc_token || urlObj.searchParams.get('crc_token') || 'OK');
    addLog({
      type: 'CRC_CHALLENGE',
      success: true,
      message: `CRC Challenge answered with token: "${tokenToEcho}"`
    });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(tokenToEcho);
  }

  // 2. Handle GET requests (Health check, Status ping, or Logs query)
  if (req.method === 'GET') {
    const { logs } = req.query || {};
    if (logs === 'true') {
      return res.status(200).json({
        success: true,
        count: webhookLogs.length,
        logs: webhookLogs
      });
    }

    return res.status(200).json({
      status: 'active',
      endpoint: '/api/guepex-webhook',
      message: 'Guepex Express Webhook Endpoint is online and active.',
      logsCount: webhookLogs.length
    });
  }

  // 3. Handle POST requests - Incoming Events or Test Pings
  try {
    let body = req.body || {};

    // Parse body if it's string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // Fallback for urlencoded data
        try {
          const params = new URLSearchParams(body);
          const obj: Record<string, any> = {};
          params.forEach((v, k) => { obj[k] = v; });
          body = obj;
        } catch (e2) {}
      }
    }

    // Check if this is an empty body or a test/ping request from Guepex
    const isPing =
      !body ||
      (typeof body === 'object' && Object.keys(body).length === 0) ||
      body.type === 'ping' ||
      body.type === 'test' ||
      body.event === 'ping' ||
      body.event === 'test';

    if (isPing) {
      addLog({
        type: 'PING',
        success: true,
        message: 'Ping / Test request received and acknowledged with 200 OK'
      });
      return res.status(200).json({
        success: true,
        message: 'Guepex webhook endpoint is active and healthy.'
      });
    }

    // 4. Security Signature Verification (Optional)
    const secretKey = process.env.GUEPEX_WEBHOOK_SECRET || process.env.YALIDINE_WEBHOOK_SECRET;
    const signatureHeader = (
      req.headers['x-yalidine-signature'] ||
      req.headers['x_yalidine_signature'] ||
      req.headers['http_x_yalidine_signature']
    ) as string | undefined;

    if (secretKey && signatureHeader) {
      const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const computedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(rawPayload)
        .digest('hex');

      if (signatureHeader.toLowerCase() !== computedSignature.toLowerCase()) {
        addLog({
          type: 'SECURITY_ERROR',
          success: false,
          message: `Signature mismatch. Expected: ${computedSignature}, Received: ${signatureHeader}`
        });
        return res.status(400).json({ error: 'Invalid signature verification failed' });
      }
    }

    // 5. Normalize events payload into array
    const eventType = body.type || body.event || 'status_changed';
    let rawEvents: any[] = [];

    if (Array.isArray(body)) {
      rawEvents = body;
    } else if (Array.isArray(body.events)) {
      rawEvents = body.events;
    } else if (Array.isArray(body.data)) {
      rawEvents = body.data;
    } else if (Array.isArray(body.parcels)) {
      rawEvents = body.parcels;
    } else {
      rawEvents = [body];
    }

    const results: Array<{ event_id?: string; tracking?: string; status: string }> = [];

    for (const eventItem of rawEvents) {
      if (!eventItem || typeof eventItem !== 'object') continue;

      const data = eventItem.data || eventItem.parcel || eventItem;
      const eventId = eventItem.event_id || eventItem.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Deduplication check
      if (processedEvents.has(eventId)) {
        addLog({
          type: eventType,
          event_id: eventId,
          success: true,
          message: `Event ${eventId} already processed (skipped duplicate)`
        });
        results.push({ event_id: eventId, status: 'skipped_duplicate' });
        continue;
      }

      processedEvents.add(eventId);
      if (processedEvents.size > 1000) {
        const first = processedEvents.values().next().value;
        if (first) processedEvents.delete(first);
      }

      const tracking = data.tracking || data.tracking_code || data.code_suivi || data.parcel_tracking;
      const guepexStatus = data.status || data.order_state || data.state || data.last_status || data.event;
      const guepexReason = data.reason || data.motif;
      const orderId = data.order_id || data.id_commande || data.ref || data.reference;

      let matchedOrder: any = null;

      // a) Try finding order strictly by tracking_code in Supabase
      if (tracking) {
        const { data: byTracking } = await supabase
          .from('orders')
          .select('*')
          .eq('tracking_code', tracking)
          .maybeSingle();
        matchedOrder = byTracking;
      }

      // b) Try finding order by orderId or numeric tracking in Supabase (safe integer check)
      const potentialNumericId = orderId || (tracking && !isNaN(Number(tracking)) ? Number(tracking) : null);
      if (!matchedOrder && potentialNumericId && !isNaN(Number(potentialNumericId))) {
        const { data: byOrderId } = await supabase
          .from('orders')
          .select('*')
          .eq('id', Number(potentialNumericId))
          .maybeSingle();
        matchedOrder = byOrderId;
      }

      // c) Try matching tracking inside client_note or tracking_code ilike
      if (!matchedOrder && tracking) {
        const { data: byNote } = await supabase
          .from('orders')
          .select('*')
          .ilike('client_note', `%${tracking}%`)
          .maybeSingle();
        matchedOrder = byNote;
      }

      // d) Fallback: Fetch parcel details from Guepex API using tracking to get stored order_id
      if (!matchedOrder && tracking) {
        try {
          const apiId = process.env.GUEPEX_API_ID;
          const apiToken = process.env.GUEPEX_API_TOKEN;
          if (apiId && apiToken) {
            const gRes = await fetch(`https://api.guepex.app/v1/parcels/?tracking=${tracking}`, {
              headers: { "X-API-ID": apiId, "X-API-TOKEN": apiToken }
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              const parcelList = Array.isArray(gData) ? gData : (gData.data || Object.values(gData));
              const foundParcel = parcelList?.find((p: any) => p.tracking === tracking || p.order_id);
              if (foundParcel && foundParcel.order_id && !isNaN(Number(foundParcel.order_id))) {
                const { data: byGuepexOrderId } = await supabase
                  .from('orders')
                  .select('*')
                  .eq('id', Number(foundParcel.order_id))
                  .maybeSingle();
                matchedOrder = byGuepexOrderId;
              }
            }
          }
        } catch (apiErr) {
          console.warn('[GUEPEX WEBHOOK] Guepex API fallback lookup failed:', apiErr);
        }
      }

      if (!matchedOrder) {
        addLog({
          type: eventType,
          event_id: eventId,
          tracking,
          status: guepexStatus,
          success: false,
          message: `Order not found for tracking: ${tracking || 'N/A'}, order_id: ${orderId || 'N/A'}`
        });
        results.push({ event_id: eventId, tracking, status: 'order_not_found' });
        continue;
      }

      // Map Guepex status to internal order_state & status
      const mapped = mapGuepexStatusToOrderState(guepexStatus);
      const updateData: Record<string, any> = {};

      if (tracking) updateData.tracking_code = tracking;
      if (guepexStatus) updateData.guepex_status = guepexStatus;
      if (guepexReason !== undefined) updateData.guepex_reason = guepexReason;
      if (mapped.order_state) updateData.order_state = mapped.order_state;
      if (mapped.status) updateData.status = mapped.status;

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', matchedOrder.id);

      if (updateError) {
        addLog({
          type: eventType,
          event_id: eventId,
          tracking,
          status: guepexStatus,
          success: false,
          message: `Failed to update order ${matchedOrder.id} in Supabase: ${updateError.message}`
        });
        results.push({ event_id: eventId, tracking, status: 'database_update_failed' });
      } else {
        addLog({
          type: eventType,
          event_id: eventId,
          tracking,
          status: guepexStatus,
          success: true,
          message: `Order ${matchedOrder.id} updated! State: ${mapped.order_state || matchedOrder.order_state || 'UNCHANGED'}, Guepex Status: ${guepexStatus}`
        });

        // Award points if state became DELIVERED_PAID
        const wasAlreadyDelivered = matchedOrder.order_state === 'DELIVERED_PAID' || matchedOrder.status === 'DELIVERED';
        const isNowDelivered = mapped.order_state === 'DELIVERED_PAID' || mapped.status === 'DELIVERED';

        if (isNowDelivered) {
          await awardLoyaltyPointsIfDelivered(matchedOrder);
        }

        // Send Telegram notification ONLY if this is a newly delivered order or an active state change
        if (isNowDelivered) {
          if (!wasAlreadyDelivered) {
            await sendTelegramNotification(matchedOrder, guepexStatus, mapped.order_state);
          }
        } else {
          const stateChanged = (mapped.order_state && mapped.order_state !== matchedOrder.order_state) ||
                               (mapped.status && mapped.status !== matchedOrder.status) ||
                               (guepexStatus && guepexStatus !== matchedOrder.guepex_status);
          if (stateChanged) {
            await sendTelegramNotification(matchedOrder, guepexStatus, mapped.order_state);
          }
        }

        results.push({ event_id: eventId, tracking, status: 'updated_successfully' });
      }
    }

    // Always respond 200 OK within 10 seconds as required by Guepex
    return res.status(200).json({
      success: true,
      type: eventType,
      processedCount: results.length,
      results
    });
  } catch (err: any) {
    console.error('[GUEPEX WEBHOOK] Unhandled processing error:', err);
    addLog({
      type: 'EXCEPTION',
      success: false,
      message: `Fatal error: ${err.message}`
    });
    // Respond 200 OK with error detail to acknowledge receipt to Guepex avoiding infinite retries
    return res.status(200).json({
      success: false,
      error: err.message
    });
  }
}

export default guepexWebhookHandler;
