import { supabase } from './src/lib/supabase';
async function run() {
  const [ordersRes, parcelsRes] = await Promise.all([
    supabase.from('orders').select('id'),
    fetch('http://localhost:3000/api/guepex-parcels?page_size=200')
  ]);
  
  const parcels = (await parcelsRes.json()).data || [];
  const orders = ordersRes.data || [];
  
  console.log("Total orders:", orders.length);
  console.log("Total parcels:", parcels.length);
  
  const orderIds = new Set(orders.map(o => String(o.id)));
  let matched = 0;
  for (const p of parcels) {
    if (p.order_id && orderIds.has(String(p.order_id))) {
      matched++;
    }
  }
  console.log("Matched:", matched);
}
run();
