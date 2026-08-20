import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const syncCode = `
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
`;

content = content.replace('app.all("/api/meta-capi", metaCapiHandler);', 'app.all("/api/meta-capi", metaCapiHandler);\n' + syncCode);

fs.writeFileSync('server.ts', content);
