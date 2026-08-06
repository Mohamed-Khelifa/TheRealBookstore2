export default function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  const expectedEmail = process.env.ADMIN_EMAIL || "mohamedkhelifa205@gmail.com";
  const expectedPassword = process.env.ADMIN_PASSWORD || "Odette9905otto";

  if (email === expectedEmail && password === expectedPassword) {
    return res.json({
      success: true,
      user: {
        id: "admin-id",
        email: expectedEmail,
        role: "OWNER",
        fullName: "Mohamed Khelifa"
      }
    });
  }

  return res.status(401).json({ success: false, error: "Invalid credentials" });
}
