import http2 from "http2";
import { PDFDocument } from "pdf-lib";
import { URL } from "url";

export default async function handler(req: any, res: any) {
  try {
    const api_id = process.env.GUEPEX_API_ID;
    const api_token = process.env.GUEPEX_API_TOKEN;

    if (!api_id || !api_token) {
      return res.status(500).json({ error: "GUEPEX credentials are not configured" });
    }

    if (req.method === "POST" && req.body?.action === "merge-labels") {
      const trackingCodes = req.body.trackingCodes;
      if (!trackingCodes || !Array.isArray(trackingCodes) || trackingCodes.length === 0) {
        return res.status(400).json({ error: "Missing trackingCodes array" });
      }
      
      const outDoc = await PDFDocument.create();
      const A6_WIDTH = 297.64;
      const A6_HEIGHT = 419.53;

      const pdfBuffers = await Promise.all(
        trackingCodes.map(async (tracking: string) => {
          try {
            const urlStr = `https://guepex.app/app/bordereau.php?tracking=${tracking}`;
            const parsed = new URL(urlStr);
            
            const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
              const client = http2.connect(parsed.origin);
              client.on("error", (err) => reject(err));
              
              const clientReq = client.request({
                ":path": parsed.pathname + parsed.search,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/pdf, text/html, */*"
              });
              
              let isResolved = false;
              const timeout = setTimeout(() => {
                 if (!isResolved) {
                   clientReq.close();
                   client.close();
                   reject(new Error("Timeout fetching PDF from Guepex"));
                 }
              }, 8000);

              const chunks: Buffer[] = [];
              clientReq.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
              clientReq.on("end", () => {
                isResolved = true;
                clearTimeout(timeout);
                client.close();
                resolve(Buffer.concat(chunks));
              });
              clientReq.end();
            });
            
            if (pdfBuffer.length < 1000) {
              console.error(`PDF too small for ${tracking}`);
              return null;
            }
            return { tracking, buffer: pdfBuffer };
          } catch (err: any) {
            console.error(`Failed to process label for ${tracking}:`, err.message);
            return null;
          }
        })
      );

      for (const item of pdfBuffers) {
        if (!item) continue;
        try {
          const srcDoc = await PDFDocument.load(item.buffer);
          const srcPages = srcDoc.getPages();
          
          for (let i = 0; i < srcPages.length; i++) {
            const srcPage = srcPages[i];
            const { width, height } = srcPage.getSize();
            
            const outPage = outDoc.addPage([A6_WIDTH, A6_HEIGHT]);
            const embedded = await outDoc.embedPage(srcPage);
            
            outPage.drawPage(embedded, {
              x: 0,
              y: A6_HEIGHT - height,
              width: width,
              height: height
            });
          }
        } catch (err: any) {
          console.error(`Failed to process PDF load for ${item.tracking}:`, err.message);
        }
      }
      
      const mergedPdfBytes = await outDoc.save();
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="merged_labels_a6.pdf"');
      return res.send(Buffer.from(mergedPdfBytes));
    }

    // Default behavior
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
