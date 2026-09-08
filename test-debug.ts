import { supabase } from './src/lib/supabase';
async function run() {
  const [ordersRes, parcelsRes] = await Promise.all([
    supabase.from('orders').select('id'),
    fetch('http://localhost:3000/api/guepex-parcels?page_size=200')
  ]);
  
  const parcels = (await parcelsRes.json()).data || [];
  const orders = ordersRes.data || [];
  
  let parcelsMap: Record<string, any> = {};
  parcels.forEach((p: any) => {
    if (p.order_id) parcelsMap[p.order_id] = p;
    else if (p.tracking) parcelsMap[p.tracking] = p;
  });
  
  let found = 0;
  orders.forEach(o => {
    const p = parcelsMap[o.id];
    if (p && p.last_status === 'Sorti en livraison') {
      found++;
    }
  });
  console.log("Found:", found);
}
run();
