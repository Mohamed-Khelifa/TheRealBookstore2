const WILAYA_CODES: Record<string, number> = {
  "Adrar": 1, "Chlef": 2, "Laghouat": 3, "Oum El Bouaghi": 4, "Batna": 5, "Béjaïa": 6, "Biskra": 7, "Béchar": 8, "Blida": 9, "Bouira": 10,
  "Tamanrasset": 11, "Tébessa": 12, "Tlemcen": 13, "Tiaret": 14, "Tizi Ouzou": 15, "Alger": 16, "Djelfa": 17, "Jijel": 18, "Sétif": 19, "Saïda": 20,
  "Skikda": 21, "Sidi Bel Abbès": 22, "Annaba": 23, "Guelma": 24, "Constantine": 25, "Médéa": 26, "Mostaganem": 27, "M'Sila": 28, "Mascara": 29, "Ouargla": 30,
  "Oran": 31, "El Bayadh": 32, "Illizi": 33, "Bordj Bou Arreridj": 34, "Boumerdès": 35, "El Tarf": 36, "Tindouf": 37, "Tissemsilt": 38, "El Oued": 39, "Khenchela": 40,
  "Souk Ahras": 41, "Tipaza": 42, "Mila": 43, "Aïn Defla": 44, "Naâma": 45, "Aïn Témouchent": 46, "Ghardaïa": 47, "Relizane": 48,
  "Timimoun": 49, "Bordj Baji Mokhtar": 50, "Ouled Djellal": 51, "Béni Abbès": 52, "In Salah": 53, "In Guezzam": 54, "Touggourt": 55, "Djanet": 56, "El M'Ghair": 57, "El Menia": 58
};

export default async function handler(req: any, res: any) {
  try {
    const wilaya_name = req.query?.wilaya_name as string;
    if (!wilaya_name) {
      return res.status(400).json({ error: "Missing wilaya_name" });
    }
    const wilaya_id = WILAYA_CODES[wilaya_name];
    if (!wilaya_id) {
      return res.status(400).json({ error: "Invalid wilaya_name" });
    }
    const api_id = process.env.GUEPEX_API_ID;
    const api_token = process.env.GUEPEX_API_TOKEN;
    if (!api_id || !api_token) {
      return res.status(500).json({ error: "GUEPEX credentials are not configured" });
    }
    const response = await fetch(`https://api.guepex.app/v1/centers/?wilaya_id=${wilaya_id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-ID": api_id,
        "X-API-TOKEN": api_token
      }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
