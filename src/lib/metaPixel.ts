// Meta Pixel and Conversions API (CAPI) Integration Engine
// Pixel ID: 2124874741697456

export const DEFAULT_PIXEL_ID = '4261930954059397';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function getFbpCookie(): string | undefined {
  return getCookie('_fbp') || undefined;
}

export function getFbcCookie(): string | undefined {
  const fbc = getCookie('_fbc');
  if (fbc) return fbc;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      const creationTime = Date.now();
      return `fb.1.${creationTime}.${fbclid}`;
    }
  }
  return undefined;
}

export function generateEventId(prefix: string = 'evt'): string {
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${Date.now()}_${rand}`;
}

// Ensure window.fbq is initialized
export function initMetaPixel(pixelId: string = DEFAULT_PIXEL_ID): void {
  if (typeof window === 'undefined') return;

  if (!(window as any).fbq) {
    const n: any = function (...args: any[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    };
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    (window as any).fbq = n;
    (window as any)._fbq = n;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  if (!(window as any)._fbq_initialized) {
    try {
      (window as any).fbq('init', pixelId);
      (window as any)._fbq_initialized = true;
    } catch (e) {
      console.warn('[Meta Pixel] Init warning:', e);
    }
  }
}

export interface UserDataParams {
  email?: string;
  phone?: string;
  full_name?: string;
  wilaya?: string;
  baladia?: string;
  fbp?: string;
  fbc?: string;
}

export interface TrackEventOptions {
  eventName: string;
  customData?: Record<string, any>;
  userData?: UserDataParams;
  eventId?: string;
}

export async function trackMetaEvent({
  eventName,
  customData = {},
  userData = {},
  eventId
}: TrackEventOptions): Promise<string> {
  const activeEventId = eventId || generateEventId(eventName.toLowerCase());

  // 1. Browser Meta Pixel Tracking
  try {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, customData, { eventID: activeEventId });
      console.log(`[Meta Pixel Browser] Tracked '${eventName}' (ID: ${activeEventId})`, customData);
    }
  } catch (err) {
    console.warn(`[Meta Pixel Browser Warning] Event '${eventName}':`, err);
  }

  // 2. Server-Side Conversions API (CAPI) Tracking
  try {
    const fbp = userData.fbp || getFbpCookie();
    const fbc = userData.fbc || getFbcCookie();

    const payload = {
      event_name: eventName,
      event_id: activeEventId,
      event_source_url: typeof window !== 'undefined' ? window.location.href : '',
      custom_data: customData,
      user_data: {
        ...userData,
        fbp,
        fbc
      }
    };

    fetch('/api/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        console.log(`[Meta CAPI Server] Tracked '${eventName}' (ID: ${activeEventId})`, data);
      } else if (data.warning) {
        console.warn(`[Meta CAPI Notice] ${data.warning}`);
      }
    }).catch(err => {
      console.warn('[Meta CAPI Request Error]', err);
    });
  } catch (err) {
    console.warn(`[Meta CAPI Trigger Error] Event '${eventName}':`, err);
  }

  return activeEventId;
}

// Helpers for specific standard Meta events

export function trackPageView(url?: string): Promise<string> {
  return trackMetaEvent({
    eventName: 'PageView',
    customData: url ? { page_url: url } : {}
  });
}

export function trackViewContent(book: { id?: string; title?: string; price?: number }): Promise<string> {
  const price = Number(book.price || 0);
  const bookId = String(book.id || 'book_item');

  return trackMetaEvent({
    eventName: 'ViewContent',
    customData: {
      content_ids: [bookId],
      content_name: book.title || 'Book',
      content_type: 'product',
      currency: 'DZD',
      value: price
    }
  });
}

export function trackAddToCart(book: { id?: string; title?: string; price?: number }, qty: number = 1): Promise<string> {
  const price = Number(book.price || 0);
  const bookId = String(book.id || 'book_item');

  return trackMetaEvent({
    eventName: 'AddToCart',
    customData: {
      content_ids: [bookId],
      content_name: book.title || 'Book',
      content_type: 'product',
      currency: 'DZD',
      value: price * qty,
      contents: [{ id: bookId, quantity: qty, item_price: price }]
    }
  });
}

export function trackInitiateCheckout(items: any[], total: number): Promise<string> {
  const contentIds = items.map(i => String(i.book_id || i.id || 'item'));
  const contents = items.map(i => ({
    id: String(i.book_id || i.id || 'item'),
    quantity: Number(i.qty || 1),
    item_price: Number(i.price || 0)
  }));

  return trackMetaEvent({
    eventName: 'InitiateCheckout',
    customData: {
      content_ids: contentIds,
      content_type: 'product',
      currency: 'DZD',
      value: Number(total || 0),
      num_items: items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0),
      contents
    }
  });
}

export function trackAddPaymentInfo(items: any[], total: number, userData?: UserDataParams): Promise<string> {
  const contentIds = items.map(i => String(i.book_id || i.id || 'item'));

  return trackMetaEvent({
    eventName: 'AddPaymentInfo',
    customData: {
      content_ids: contentIds,
      content_type: 'product',
      currency: 'DZD',
      value: Number(total || 0)
    },
    userData
  });
}

export function trackPurchase(
  order: { id?: string; total_price?: number; items?: any[] },
  userData?: UserDataParams
): Promise<string> {
  const orderId = order.id ? String(order.id) : generateEventId('pur');
  const items = order.items || [];
  const contentIds = items.map(i => String(i.book_id || i.id || 'item'));
  const contents = items.map(i => ({
    id: String(i.book_id || i.id || 'item'),
    quantity: Number(i.qty || 1),
    item_price: Number(i.price || 0)
  }));
  const total = Number(order.total_price || 0);

  return trackMetaEvent({
    eventName: 'Purchase',
    eventId: orderId, // Critical for Deduplication!
    customData: {
      content_ids: contentIds,
      content_type: 'product',
      currency: 'DZD',
      value: total,
      num_items: items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0),
      contents
    },
    userData
  });
}

export function trackSearch(searchQuery: string): Promise<string> {
  return trackMetaEvent({
    eventName: 'Search',
    customData: {
      search_string: searchQuery
    }
  });
}

export function trackLead(formName: string, userData?: UserDataParams): Promise<string> {
  return trackMetaEvent({
    eventName: 'Lead',
    customData: {
      content_name: formName
    },
    userData
  });
}
