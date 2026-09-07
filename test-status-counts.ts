async function run() {
  const res = await fetch('http://localhost:3000/api/guepex-parcels?page_size=200');
  const data = await res.json();
  const parcels = data.data || [];
  const counts: any = {};
  parcels.forEach((p: any) => {
    const s = p.last_status;
    counts[s] = (counts[s] || 0) + 1;
  });
  console.log("Status counts:", counts);
}
run();
