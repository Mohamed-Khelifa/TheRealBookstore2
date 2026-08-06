export default async function handler(req, res) {
  try {
    const api_id = process.env.GUEPEX_API_ID;
    const api_token = process.env.GUEPEX_API_TOKEN;
    if (!api_id || !api_token) return res.status(500).json({ error: "GUEPEX missing" });

    const params = new URLSearchParams(req.query);
    const response = await fetch(`https://api.guepex.app/v1/communes/?${params.toString()}`, {
      method: "GET",
      headers: {
        "X-API-ID": api_id,
        "X-API-TOKEN": api_token
      }
    });
    
    const data = await response.json().catch(() => null);
    if (!response.ok) return res.status(response.status).json(data);
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
