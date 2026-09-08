async function run() {
  const res = await fetch('http://localhost:3000/api/guepex-parcels?page_size=20');
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Is array?", Array.isArray(data));
  console.log("Keys:", Object.keys(data || {}));
}
run();
