import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fix() {
  await supabase.from('site_settings').update({ value: '2124874741697456' }).eq('key', 'meta_pixel_id');
  console.log("Updated pixel ID to 2124874741697456");
}
fix();
