import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      ALTER TABLE public.orders 
      ADD COLUMN IF NOT EXISTS tracking_code text,
      ADD COLUMN IF NOT EXISTS guepex_status text,
      ADD COLUMN IF NOT EXISTS guepex_reason text;
    `
  });
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
