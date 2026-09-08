import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const api_id = process.env.GUEPEX_API_ID;
  const api_token = process.env.GUEPEX_API_TOKEN;
  
  const response = await fetch(`https://api.guepex.app/v1/parcels/?page_size=1`, {
    method: "GET",
    headers: {
      "X-API-ID": api_id || '',
      "X-API-TOKEN": api_token || ''
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log(data.data[0]);
  }
}
run();
