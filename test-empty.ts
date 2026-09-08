async function run() {
  const parcelsRes = await fetch('http://localhost:3000/api/guepex-parcels?page_size=200');
  const parcels = (await parcelsRes.json()).data || [];
  
  let parcelsMap: Record<string, any> = {};
  parcels.forEach((p: any) => {
    if (p.order_id) parcelsMap[p.order_id] = p;
    else if (p.tracking) parcelsMap[p.tracking] = p;
  });
  
  console.log("Empty string in map?", !!parcelsMap['']);
  if (parcelsMap['']) console.log("Status:", parcelsMap[''].last_status);
}
run();
