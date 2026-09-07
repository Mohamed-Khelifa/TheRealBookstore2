import { supabase } from './src/lib/supabase';
async function run() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1);
  console.log(error);
}
run();
