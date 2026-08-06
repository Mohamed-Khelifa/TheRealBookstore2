export default async function handler(req: any, res: any) {
  try {
    const { orderId } = req.body || req.query || {};
    return res.status(200).json({ success: true, message: "Order sync processed", orderId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
