import { supabase } from './src/lib/supabase';

async function run() {
  const { data } = await supabase.from('orders').select('guepex_status, tracking_code, id').not('guepex_status', 'is', null).limit(10);
  console.log(data);
}

run();
