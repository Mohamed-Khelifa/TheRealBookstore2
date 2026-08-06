export interface Book {
  id: string;
  title: string;
  author: string;
  sku: string;
  price: number;
  old_price?: number;
  description: string;
  cover_image_url: string;
  categories: string[];
  stock: number;
  featured: boolean;
  rating: number;
  created_at: string;
  is_bundle?: boolean;
  bundle_books?: string[]; // Array of book IDs included in the bundle
}

export interface Discount {
  id: string;
  code: string;
  percent: number;
  one_time_use?: boolean;
  used?: boolean;
  created_at: string;
}

export interface CartItem {
  book_id: string;
  title: string;
  author?: string;
  price: number;
  qty: number;
  cover_image_url: string;
}

export interface ShippingRate {
  wilaya: string;
  rate_per_item: number;
  office_pickup_rate: number;
}

export interface Order {
  id: string;
  created_at: string;
  items: any[];
  customer_name: string;
  wilaya: string;
  baladia: string;
  phone: string;
  instagram_account?: string;
  shipping_method: 'direct' | 'office';
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  order_state?: 'DID_NOT_ARRIVE' | 'IN_STOCK_UNPACKAGED' | 'READY_NOT_DELIVERED' | 'DELIVERED_PAID' | 'DELIVERED_RETURNED';
  tracking_code?: string;
  guepex_status?: string;
  guepex_reason?: string;
  special_note?: string;
  client_note?: string;
}

export interface Review {
  id: string;
  book_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'OWNER' | 'CUSTOMER';
  fullName: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  book?: string;
  created_at: string;
}

export interface SpecialRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  wilaya: string;
  baladia: string;
  book_name: string;
  author: string;
  instagram_account: string;
  notes?: string;
  shipping_method?: 'direct' | 'office';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  created_at: string;
}

export interface LoyaltyPoints {
  phone: string;
  points: number;
  instagram?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_phone: string;
  referred_phone: string;
  visit_points_awarded: boolean;
  purchase_points_awarded: boolean;
  created_at: string;
}

declare global {
  interface Window {
    fbq: any;
  }
}
