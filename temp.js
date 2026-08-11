  app.post("/api/guepex-parcels", async (req, res) => {
    try {
      const { action } = req.body;
      
      if (action === "merge-labels") {
        const { trackingCodes } = req.body;
        if (!trackingCodes || !Array.isArray(trackingCodes) || trackingCodes.length === 0) {
          return res.status(400).json({ error: "Missing trackingCodes array" });
        }
        
        const outDoc = await PDFDocument.create();
        const A6_WIDTH = 297.64;
        const A6_HEIGHT = 419.53;

        for (const tracking of trackingCodes) {
          try {
            const urlStr = `https://guepex.app/app/bordereau.php?tracking=${tracking}`;
            const parsed = new URL(urlStr);
            
            const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
              const client = http2.connect(parsed.origin);
              client.on("error", (err) => reject(err));
              
              const req = client.request({
                ":path": parsed.pathname + parsed.search,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/pdf, text/html, */*"
              });
