import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log("Keys:", data ? Object.keys(data[0]) : null);
}

run();
