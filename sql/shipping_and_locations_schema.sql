-- SQL Schema for Site Settings, Wilayas, Communes, Agencies, and Shipping Rates

-- 1. Create site_settings table (stores JSON objects for wilaya_communes, stopdesk_communes, and guepex_agencies)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create shipping_rates table (stores direct delivery and office pickup tariffs per wilaya)
CREATE TABLE IF NOT EXISTS shipping_rates (
  wilaya TEXT PRIMARY KEY,
  rate_per_item NUMERIC DEFAULT 0,
  office_pickup_rate NUMERIC DEFAULT 0
);

-- Enable RLS (Row Level Security) and grant public read access
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on site_settings" ON site_settings FOR ALL USING (true);

CREATE POLICY "Allow public read access on shipping_rates" ON shipping_rates FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on shipping_rates" ON shipping_rates FOR ALL USING (true);
