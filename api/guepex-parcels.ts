export default async function handler(req: any, res: any) {
  try {
    const api_id = process.env.GUEPEX_API_ID;
    const api_token = process.env.GUEPEX_API_TOKEN;
    if (!api_id || !api_token) {
      return res.status(500).json({ error: "GUEPEX credentials are not configured" });
    }
    const query = new URLSearchParams(req.query || {}).toString();
    const response = await fetch(`https://api.guepex.app/v1/parcels/?${query}`, {
      method: req.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-ID": api_id,
        "X-API-TOKEN": api_token
      },
      ...(req.method !== "GET" && req.method !== "HEAD" && { body: JSON.stringify(req.body) })
    });
    const data = await response.json().catch(() => null);
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
