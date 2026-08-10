import { supabase } from '../src/lib/supabase.js';

export async function syncGuepexOrders() {
  console.log('[CRON] Starting Guepex Sync...');
  try {
    const api_id = process.env.GUEPEX_API_ID;
    const api_token = process.env.GUEPEX_API_TOKEN;
    if (!api_id || !api_token) {
      console.log('[CRON] Missing GUEPEX credentials');
      return;
    }

    // Fetch guepex parcels
    const response = await fetch(`https://api.guepex.app/v1/parcels/?page_size=200`, {
      method: "GET",
      headers: {
        "X-API-ID": api_id,
        "X-API-TOKEN": api_token
      }
    });

    if (!response.ok) {
      console.log('[CRON] Failed to fetch guepex parcels', response.status);
      return;
    }
    
    const guepexData = await response.json();
    const parcels = guepexData.data || [];
    const parcelMap: Record<string, any> = {};
    parcels.forEach((p: any) => {
      if (p.order_id) parcelMap[p.order_id] = p;
    });

    // Fetch active orders from supabase
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .not('order_state', 'in', '("DELIVERED_PAID", "DELIVERED_RETURNED", "CANCELLED")');

    if (error || !ordersData) {
      console.log('[CRON] Failed to fetch orders', error);
      return;
    }

    for (const order of ordersData) {
      const parcel = parcelMap[order.id];
      if (parcel && parcel.last_status) {
        const statusLower = parcel.last_status.toLowerCase();
        let newState = order.order_state;

        const isDelivered = statusLower === 'livré' || statusLower === 'livre' || statusLower.startsWith('livré ') || statusLower.startsWith('livre ');
        const isReturned = statusLower.includes('retour') || statusLower.includes("echec de livraison") || statusLower.includes("échec de livraison") || statusLower.includes("echec d'livraison") || statusLower.includes("échec d'livraison");

        if (isDelivered) {
          newState = 'DELIVERED_PAID';
        } else if (isReturned) {
          newState = 'DELIVERED_RETURNED';
        }

        if (newState !== order.order_state) {
          console.log(`[CRON] Order ${order.id} state changed to ${newState}`);
          await supabase.from('orders').update({ order_state: newState }).eq('id', order.id);
          
          if (newState === 'DELIVERED_PAID') {
            // Trigger delivery notification
            await sendDeliveredNotification(order);
          }
        }
      }
    }
    
    console.log('[CRON] Sync Complete.');
  } catch (err) {
    console.error('[CRON] Sync error', err);
  }
}

async function sendDeliveredNotification(order: any) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  
  const escapeHtml = (text: any) => {
    if (text == null) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  
  const itemsList = (order.items || []).map((item: any) => 
    `• <b>${escapeHtml(item.qty || 1)}x</b> ${escapeHtml(item.title || item.name || 'Book')} ${item.price ? `(${escapeHtml(item.price)} DA)` : ''}`
  ).join('\n');
  
  const tracking = order.tracking_code || order.tracking;
  
  const message = `🎉 <b>Order Delivered Successfully!</b> ✅\n\n` +
    `🆔 <b>Order Ref:</b> #${escapeHtml(order.id || 'N/A')}\n` +
    (tracking ? `📦 <b>Tracking Code:</b> <code>${escapeHtml(tracking)}</code>\n` : '') +
    `👤 <b>Customer:</b> ${escapeHtml(order.customer_name || 'N/A')}\n` +
    `📱 <b>Phone:</b> <code>${escapeHtml(order.phone || 'N/A')}</code>\n` +
    `📍 <b>Location:</b> ${escapeHtml(order.wilaya || 'N/A')}${order.commune || order.baladia ? `, ${escapeHtml(order.commune || order.baladia)}` : ''}\n` +
    `💰 <b>Total Collected:</b> <b>${escapeHtml(order.total_price || 0)} DA</b>\n` +
    `\n📚 <b>Books Delivered:</b>\n${itemsList || '- Books'}`;
    
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML"
    })
  }).catch(e => console.error('[CRON] Telegram send error', e));
}
