import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import https from "https";
import http from "http";
import http2 from "http2";
import { URL } from "url";
import { PDFDocument } from "pdf-lib";
import metaCapiHandler from "./api/meta-capi.js";
import guepexWebhookHandler from "./api/guepex-webhook.js";
import { syncGuepexOrders } from "./src/server-utils/cron-guepex.js";

const WILAYA_CODES: Record<string, number> = {
  "Adrar": 1, "Chlef": 2, "Laghouat": 3, "Oum El Bouaghi": 4, "Batna": 5, "Béjaïa": 6, "Biskra": 7, "Béchar": 8, "Blida": 9, "Bouira": 10,
  "Tamanrasset": 11, "Tébessa": 12, "Tlemcen": 13, "Tiaret": 14, "Tizi Ouzou": 15, "Alger": 16, "Djelfa": 17, "Jijel": 18, "Sétif": 19, "Saïda": 20,
  "Skikda": 21, "Sidi Bel Abbès": 22, "Annaba": 23, "Guelma": 24, "Constantine": 25, "Médéa": 26, "Mostaganem": 27, "M'Sila": 28, "Mascara": 29, "Ouargla": 30,
  "Oran": 31, "El Bayadh": 32, "Illizi": 33, "Bordj Bou Arreridj": 34, "Boumerdès": 35, "El Tarf": 36, "Tindouf": 37, "Tissemsilt": 38, "El Oued": 39, "Khenchela": 40,
  "Souk Ahras": 41, "Tipaza": 42, "Mila": 43, "Aïn Defla": 44, "Naâma": 45, "Aïn Témouchent": 46, "Ghardaïa": 47, "Relizane": 48,
  "Timimoun": 49, "Bordj Baji Mokhtar": 50, "Ouled Djellal": 51, "Béni Abbès": 52, "In Salah": 53, "In Guezzam": 54, "Touggourt": 55, "Djanet": 56, "El M'Ghair": 57, "El Menia": 58
};

const CHEF_LIEU_MAP: Record<string, string> = {
  "Adrar": "Adrar",
  "Chlef": "Chlef",
  "Laghouat": "Laghouat",
  "Oum El Bouaghi": "Oum el Bouaghi",
  "Batna": "Batna",
  "Béjaïa": "Béjaïa",
  "Biskra": "Biskra",
  "Béchar": "Béchar",
  "Blida": "Blida",
  "Bouira": "Bouira",
  "Tamanrasset": "Tamanrasset",
  "Tébessa": "Tébessa",
  "Tlemcen": "Tlemcen",
  "Tiaret": "Tiaret",
  "Tizi Ouzou": "Tizi Ouzou",
  "Alger": "Alger Centre",
  "Djelfa": "Djelfa",
  "Jijel": "Jijel",
  "Sétif": "Sétif",
  "Saïda": "Saïda",
  "Skikda": "Skikda",
  "Sidi Bel Abbès": "Sidi Bel Abbes",
  "Annaba": "Annaba",
  "Guelma": "Guelma",
  "Constantine": "Constantine",
  "Médéa": "Médéa",
  "Mostaganem": "Mostaganem",
  "M'Sila": "M'Sila",
  "Mascara": "Mascara",
  "Ouargla": "Ouargla",
  "Oran": "Oran",
  "El Bayadh": "El Bayadh",
  "Illizi": "Illizi",
  "Bordj Bou Arreridj": "Bordj Bou Arreridj",
  "Boumerdès": "Boumerdes",
  "El Tarf": "El Tarf",
  "Tindouf": "Tindouf",
  "Tissemsilt": "Tissemsilt",
  "El Oued": "El Oued",
  "Khenchela": "Khenchela",
  "Souk Ahras": "Souk Ahras",
  "Tipaza": "Tipaza",
  "Mila": "Mila",
  "Aïn Defla": "Aïn Defla",
  "Naâma": "Naâma",
  "Aïn Témouchent": "Aïn Témouchent",
  "Ghardaïa": "Ghardaïa",
  "Relizane": "Relizane",
  "Timimoun": "Timimoun",
  "Ouled Djellal": "Ouled Djellal",
  "Béni Abbès": "Béni Abbès",
  "In Salah": "In Salah",
  "Touggourt": "Touggourt",
  "Djanet": "Djanet",
  "El M'Ghair": "El M'Ghair",
  "El Menia": "El Menia"
};

function getChefLieu(wilayaName: string): string {
  if (!wilayaName) return "";
  const normalize = (str: string) => 
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z]/g, "");

  const normalizedInput = normalize(wilayaName);
  for (const [key, chefLieu] of Object.entries(CHEF_LIEU_MAP)) {
    if (normalize(key) === normalizedInput) {
      return chefLieu;
    }
  }
  return wilayaName;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Start background sync
  syncGuepexOrders();
  setInterval(syncGuepexOrders, 5 * 60 * 1000); // Every 5 minutes

  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  app.all("/api/guepex-webhook", guepexWebhookHandler);

  
app.get("/api/guepex/locations", async (req, res) => {
  try {
    const api_id = process.env.GUEPEX_API_ID;
    const api_token = process.env.GUEPEX_API_TOKEN;
    if (!api_id || !api_token) {
      return res.status(500).json({ error: "GUEPEX credentials are not configured" });
    }

    const headers = { "X-API-ID": api_id, "X-API-TOKEN": api_token };

    // Fetch communes
    const communesRes = await fetch("https://api.guepex.app/v1/communes/?page_size=2000", { headers });
    const communesData = await communesRes.json().catch(() => null);

    // Fetch centers
    const centersRes = await fetch("https://api.guepex.app/v1/centers/?page_size=500", { headers });
    const centersData = await centersRes.json().catch(() => null);

    return res.status(200).json({
      success: true,
      communes: communesData?.data || [],
      centers: centersData?.data || []
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "BigDealBookstore API is running" });
  });

  app.post("/api/admin-auth", (req, res) => {
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

    return res.status(401).json({ success: false, message: "Invalid admin credentials" });
  });

  app.all("/api/meta-capi", metaCapiHandler);

  app.post("/api/admin/sync-locations", async (req, res) => {
    try {
      const { adminCode } = req.body;
      const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '314159';
      if (adminCode !== ADMIN_ACCESS_CODE) {
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });
      }

      const WILAYA_CODES: Record<string, number> = {
        "Adrar": 1, "Chlef": 2, "Laghouat": 3, "Oum El Bouaghi": 4, "Batna": 5,
        "Béjaïa": 6, "Biskra": 7, "Béchar": 8, "Blida": 9, "Bouira": 10,
        "Tamanrasset": 11, "Tébessa": 12, "Tlemcen": 13, "Tiaret": 14, "Tizi Ouzou": 15,
        "Alger": 16, "Djelfa": 17, "Jijel": 18, "Sétif": 19, "Saïda": 20,
        "Skikda": 21, "Sidi Bel Abbès": 22, "Annaba": 23, "Guelma": 24, "Constantine": 25,
        "Médéa": 26, "Mostaganem": 27, "M'Sila": 28, "Mascara": 29, "Ouargla": 30,
        "Oran": 31, "El Bayadh": 32, "Illizi": 33, "Bordj Bou Arreridj": 34, "Boumerdès": 35,
        "El Tarf": 36, "Tindouf": 37, "Tissemsilt": 38, "El Oued": 39, "Khenchela": 40,
        "Souk Ahras": 41, "Tipaza": 42, "Mila": 43, "Aïn Defla": 44, "Naâma": 45,
        "Aïn Témouchent": 46, "Ghardaïa": 47, "Relizane": 48, "Timimoun": 49, "Bordj Badji Mokhtar": 50,
        "Ouled Djellal": 51, "Béni Abbès": 52, "In Salah": 53, "In Guezzam": 54, "Touggourt": 55,
        "Djanet": 56, "El M'Ghair": 57, "El Menia": 58
      };

      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) {
        return res.status(500).json({ error: "GUEPEX credentials are not configured" });
      }

      let allAgencies: Record<string, any[]> = {};
      
      for (const [name, id] of Object.entries(WILAYA_CODES)) {
        try {
          const centersUrl = new URL("https://api.guepex.app/v1/centers/");
          centersUrl.searchParams.append("wilaya_id", id.toString());
          const response = await fetch(centersUrl.toString(), {
            headers: {
              "Content-Type": "application/json",
              "X-API-ID": api_id,
              "X-API-TOKEN": api_token
            }
          });
          const data = await response.json().catch(()=>null);
          if (data && data.data) {
            allAgencies[name] = data.data;
          }
        } catch (e) {
          console.error('Error fetching for', name, e);
        }
      }

      return res.status(200).json({ success: true, allAgencies });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });


  app.post("/api/guepex-sync", async (req, res) => {
    try {
      const {
        order_id,
        firstname,
        familyname,
        contact_phone,
        address,
        to_commune_name,
        to_wilaya_name,
        price,
        product_list,
        is_stopdesk,
        stopdesk_id: body_stopdesk_id
      } = req.body;

      if (!order_id || !firstname || !familyname || !contact_phone || !address || !to_wilaya_name || !to_commune_name || price === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) {
        return res.status(500).json({ error: "GUEPEX credentials are not configured" });
      }

      let stopdesk_id = body_stopdesk_id ? Number(body_stopdesk_id) : null;
      let final_commune_name = to_commune_name;
      let final_address = address;

      const isStopdeskOrder = Boolean(is_stopdesk || stopdesk_id);

      if (isStopdeskOrder) {
        // Fetch and verify stopdesk center from Guepex to guarantee commune consistency
        try {
          const centersUrl = new URL("https://api.guepex.app/v1/centers/");
          const wilaya_id = WILAYA_CODES[to_wilaya_name];
          if (wilaya_id) {
            centersUrl.searchParams.append("wilaya_id", wilaya_id.toString());
          }
          const centersRes = await fetch(centersUrl.toString(), {
            method: "GET",
            headers: {
              "X-API-ID": api_id,
              "X-API-TOKEN": api_token
            }
          });
          
          const responseText = await centersRes.text();
          try {
            const centersData = JSON.parse(responseText);
            const centersList = centersData?.data || (Array.isArray(centersData) ? centersData : []);
            if (centersList.length > 0) {
              let chosenCenter = null;
              if (stopdesk_id) {
                chosenCenter = centersList.find((c: any) => Number(c.center_id || c.id) === Number(stopdesk_id));
              }
              if (!chosenCenter) {
                const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                chosenCenter = centersList.find((c: any) => 
                  normalize(c.commune_name) === normalize(to_commune_name) || 
                  normalize(c.name) === normalize(to_commune_name) ||
                  normalize(c.name).includes(normalize(to_commune_name))
                ) || centersList[0];
              }
              if (chosenCenter) {
                stopdesk_id = Number(chosenCenter.center_id || chosenCenter.id);
                if (chosenCenter.commune_name) {
                  // FORCE the commune name to follow the chosen agency
                  final_commune_name = chosenCenter.commune_name;
                }
              }
            }
          } catch (jsonErr) {
            console.error("Guepex Centers API returned non-JSON:", responseText);
          }
        } catch (e) {
          console.error("Failed to fetch stopdesk center:", e);
        }
      } else {
        // Direct home delivery order: use exact selected commune name
        final_commune_name = to_commune_name;
        final_address = address;
      }

      const parcel = {
        order_id,
        from_wilaya_name: "Médéa",
        firstname,
        familyname,
        contact_phone,
        address: final_address,
        to_commune_name: final_commune_name,
        to_wilaya_name,
        product_list: product_list || "Livres",
        price: Number(price),
        do_insurance: true,
        declared_value: Number(price),
        is_oversized: false,
        freeshipping: true,
        is_stopdesk: Boolean(is_stopdesk || stopdesk_id),
        economic: 1,
        ...(stopdesk_id && { stopdesk_id: Number(stopdesk_id) }),
        has_exchange: false
      };

      const payload = [parcel];

      const response = await fetch("https://api.guepex.app/v1/parcels/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-ID": api_id,
          "X-API-TOKEN": api_token
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Guepex API Error Details:", JSON.stringify(data, null, 2));
        return res.status(response.status === 422 ? 422 : 500).json({ 
          error: "Failed to sync with Guepex", 
          details: data 
        });
      }

      return res.status(200).json({ success: true, message: "Order synced perfectly", data });
    } catch (error: any) {
      console.error("Error syncing order:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  app.get("/api/guepex-parcels", async (req, res) => {
    try {
      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) {
        return res.status(500).json({ error: "GUEPEX credentials are not configured" });
      }

      const params = new URLSearchParams(req.query as Record<string, string>);
      const response = await fetch(`https://api.guepex.app/v1/parcels/?${params.toString()}`, {
        method: "GET",
        headers: {
          "X-API-ID": api_id,
          "X-API-TOKEN": api_token
        }
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/guepex-parcels/:tracking", async (req, res) => {
    try {
      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) return res.status(500).json({ error: "GUEPEX missing" });

      const tracking = req.params.tracking;
      const response = await fetch(`https://api.guepex.app/v1/parcels/${tracking}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-API-ID": api_id,
          "X-API-TOKEN": api_token
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/guepex-parcels/:tracking", async (req, res) => {
    try {
      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) return res.status(500).json({ error: "GUEPEX missing" });

      const tracking = req.params.tracking;
      const response = await fetch(`https://api.guepex.app/v1/parcels/${tracking}`, {
        method: "DELETE",
        headers: {
          "X-API-ID": api_id,
          "X-API-TOKEN": api_token
        }
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/guepex-histories", async (req, res) => {
    try {
      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) return res.status(500).json({ error: "GUEPEX missing" });

      const params = new URLSearchParams(req.query as Record<string, string>);
      const response = await fetch(`https://api.guepex.app/v1/histories/?${params.toString()}`, {
        method: "GET",
        headers: {
          "X-API-ID": api_id,
          "X-API-TOKEN": api_token
        }
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/guepex-communes", async (req, res) => {
    try {
      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) return res.status(500).json({ error: "GUEPEX missing" });

      const params = new URLSearchParams(req.query as Record<string, string>);
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
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/notify-order", async (req, res) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (!botToken || !chatId) {
        return res.status(200).json({ skipped: true, message: "Telegram credentials not configured." });
      }

      const escapeHtml = (text: any) => {
        if (text == null) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      };

      const { 
        order_id, 
        order_ref, 
        tracking_code, 
        customer_name, 
        total_price, 
        wilaya, 
        baladia, 
        phone, 
        shipping_method, 
        notes, 
        items 
      } = req.body || {};
      
      const itemsList = (items || []).map((item: any) => 
        `• <b>${escapeHtml(item.qty || 1)}x</b> ${escapeHtml(item.title || item.name || 'Book')} ${item.price ? `(${escapeHtml(item.price)} DA)` : ''}`
      ).join('\n');

      const message = `🔔 <b>New Order Registered!</b>\n\n` +
        `🆔 <b>Order Ref:</b> #${escapeHtml(order_ref || order_id || 'N/A')}\n` +
        (tracking_code ? `📦 <b>Tracking Code:</b> <code>${escapeHtml(tracking_code)}</code>\n` : '') +
        `👤 <b>Customer:</b> ${escapeHtml(customer_name || 'N/A')}\n` +
        `📱 <b>Phone:</b> <code>${escapeHtml(phone || 'N/A')}</code>\n` +
        `📍 <b>Location:</b> ${escapeHtml(wilaya || 'N/A')}${baladia ? `, ${escapeHtml(baladia)}` : ''}\n` +
        (shipping_method ? `🚚 <b>Shipping:</b> ${escapeHtml(shipping_method)}\n` : '') +
        `💰 <b>Total Price:</b> <b>${escapeHtml(total_price || 0)} DA</b>\n` +
        (notes ? `📝 <b>Note:</b> ${escapeHtml(notes)}\n` : '') +
        `\n📚 <b>Order Items:</b>\n${itemsList || '- Books'}`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Telegram API Error:", errorData);
        return res.status(500).json({ error: "Failed to send Telegram notification", details: errorData });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  app.post("/api/notify-delivered", async (req, res) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (!botToken || !chatId) {
        return res.status(200).json({ skipped: true, message: "Telegram credentials not configured." });
      }

      const escapeHtml = (text: any) => {
        if (text == null) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      };

      const { id, order_ref, customer_name, phone, wilaya, commune, baladia, total_price, items, tracking } = req.body || {};
      
      const itemsList = (items || []).map((item: any) => 
        `• <b>${escapeHtml(item.qty || 1)}x</b> ${escapeHtml(item.title || item.name || 'Book')} ${item.price ? `(${escapeHtml(item.price)} DA)` : ''}`
      ).join('\n');

      const message = `🎉 <b>Order Delivered Successfully!</b> ✅\n\n` +
        `🆔 <b>Order Ref:</b> #${escapeHtml(order_ref || id || 'N/A')}\n` +
        (tracking ? `📦 <b>Tracking Code:</b> <code>${escapeHtml(tracking)}</code>\n` : '') +
        `👤 <b>Customer:</b> ${escapeHtml(customer_name || 'N/A')}\n` +
        `📱 <b>Phone:</b> <code>${escapeHtml(phone || 'N/A')}</code>\n` +
        `📍 <b>Location:</b> ${escapeHtml(wilaya || 'N/A')}${commune || baladia ? `, ${escapeHtml(commune || baladia)}` : ''}\n` +
        `💰 <b>Total Collected:</b> <b>${escapeHtml(total_price || 0)} DA</b>\n` +
        `\n📚 <b>Books Delivered:</b>\n${itemsList || '- Books'}`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Telegram API Error:", errorData);
        return res.status(500).json({ error: "Failed to send Telegram notification", details: errorData });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error sending delivered notification:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

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
            console.error(`Failed to process label PDF for ${item.tracking}:`, err.message);
          }
        }
        
        const mergedPdfBytes = await outDoc.save();
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="merged_labels_a6.pdf"');
        return res.send(Buffer.from(mergedPdfBytes));
      }

      // Default POST proxy behavior (creation of parcel)
      const api_id = process.env.GUEPEX_API_ID;
      const api_token = process.env.GUEPEX_API_TOKEN;
      if (!api_id || !api_token) {
        return res.status(500).json({ error: "GUEPEX credentials are not configured" });
      }

      const query = new URLSearchParams(req.query as any).toString();
      const response = await fetch(`https://api.guepex.app/v1/parcels/?${query}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-ID": api_id,
          "X-API-TOKEN": api_token
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json().catch(() => null);
      return res.status(response.status).json(data);
      
    } catch (e: any) {
      console.error("Guepex POST proxy error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();