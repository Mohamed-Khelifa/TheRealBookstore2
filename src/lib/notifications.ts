import { formatOrderRef } from './utils';

export async function notifyDeliveredOrder(order: any) {
  if (!order) return;

  const sentKey = `notified_delivered_${order.id || order.tracking_code || order.phone}`;
  try {
    if (localStorage.getItem(sentKey)) {
      return;
    }
  } catch (e) {
    // Ignore localStorage check if disabled
  }

  try {
    const res = await fetch('/api/notify-delivered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        order_ref: order.id ? formatOrderRef(order.id) : undefined,
        customer_name: order.customer_name,
        phone: order.phone,
        wilaya: order.wilaya,
        commune: order.commune,
        total_price: order.total_price,
        tracking: order.tracking_code || order.tracking,
        items: order.items || []
      })
    });

    if (res.ok) {
      try {
        localStorage.setItem(sentKey, 'true');
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to send delivered notification:', err);
  }
}
