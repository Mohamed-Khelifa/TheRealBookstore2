function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  // Handle CORS preflight requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.warn("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in environment.");
      return res.status(200).json({ skipped: true, message: "Telegram credentials not configured." });
    }

    const { 
      order_id, 
      order_ref, 
      tracking_code, 
      customer_name, 
      total_price, 
      wilaya, 
      baladia, 
      phone, 
      shipping_method, 
      notes, 
      items 
    } = req.body || {};
    
    const itemsList = (items || []).map((item) => 
      `• <b>${escapeHtml(item.qty || 1)}x</b> ${escapeHtml(item.title || item.name || 'Book')} ${item.price ? `(${escapeHtml(item.price)} DA)` : ''}`
    ).join('\n');

    const message = `🔔 <b>New Order Registered!</b>\n\n` +
      `🆔 <b>Order Ref:</b> #${escapeHtml(order_ref || order_id || 'N/A')}\n` +
      (tracking_code ? `📦 <b>Tracking Code:</b> <code>${escapeHtml(tracking_code)}</code>\n` : '') +
      `👤 <b>Customer:</b> ${escapeHtml(customer_name || 'N/A')}\n` +
      `📱 <b>Phone:</b> <code>${escapeHtml(phone || 'N/A')}</code>\n` +
      `📍 <b>Location:</b> ${escapeHtml(wilaya || 'N/A')}${baladia ? `, ${escapeHtml(baladia)}` : ''}\n` +
      (shipping_method ? `🚚 <b>Shipping:</b> ${escapeHtml(shipping_method)}\n` : '') +
      `💰 <b>Total Price:</b> <b>${escapeHtml(total_price || 0)} DA</b>\n` +
      (notes ? `📝 <b>Note:</b> ${escapeHtml(notes)}\n` : '') +
      `\n📚 <b>Order Items:</b>\n${itemsList || '- Books'}`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Telegram API Error Response:", errorData);
      return res.status(500).json({ error: "Failed to send Telegram notification", details: errorData });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending order notification:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
