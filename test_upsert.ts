import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { ECONOMIC_RATES } from './src/data/shippingRates.js';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('shipping_rates').upsert(
    [{ wilaya: 'Alger', rate_per_item: 550, office_pickup_rate: 450 }],
    { onConflict: 'wilaya' }
  );
  console.log("Error:", error);
}
test();
