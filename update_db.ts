import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { ECONOMIC_RATES } from './src/data/shippingRates.js';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function sync() {
  const { data, error } = await supabase.from('shipping_rates').upsert(
    ECONOMIC_RATES,
    { onConflict: 'wilaya' }
  );
  console.log("Upsert error:", error);
  
  const { error: delError1 } = await supabase.from('shipping_rates').delete().eq('wilaya', 'Bordj Baji Mokhtar');
  const { error: delError2 } = await supabase.from('shipping_rates').delete().eq('wilaya', 'Saïda');
  const { error: delError3 } = await supabase.from('shipping_rates').delete().eq('wilaya', 'Naâma');
  console.log("Delete error:", delError1, delError2, delError3);
}
sync();
