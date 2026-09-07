import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('orders').select('id, guepex_status').limit(10);
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
