import { supabase } from './src/lib/supabase';
async function run() {
  const [ordersRes, parcelsRes] = await Promise.all([
    supabase.from('orders').select('id, tracking_code'),
    fetch('http://localhost:3000/api/guepex-parcels?page_size=200')
  ]);
  
  const parcels = (await parcelsRes.json()).data || [];
  const orders = ordersRes.data || [];
  
  let parcelsMap: Record<string, any> = {};
  parcels.forEach((p: any) => {
    if (p.order_id) parcelsMap[p.order_id] = p;
    else if (p.tracking) parcelsMap[p.tracking] = p;
  });
  
  let matchCount = 0;
  let sortiCount = 0;
  
  orders.forEach(o => {
    const parcel = parcelsMap[o.id] || parcelsMap[o.tracking_code || ''];
    if (parcel) {
      matchCount++;
      if (parcel.last_status === 'Sorti en livraison') sortiCount++;
    }
  });
  
  console.log("Match Count:", matchCount);
  console.log("Sorti count:", sortiCount);
}
run();
