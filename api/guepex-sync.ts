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

export default async function handler(req: any, res: any) {
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
              chosenCenter = centersList.find((c: any) => Number(c.center_id) === Number(stopdesk_id));
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
              stopdesk_id = Number(chosenCenter.center_id);
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
      const chefLieu = getChefLieu(to_wilaya_name);
      if (chefLieu && chefLieu.toLowerCase() !== to_commune_name.toLowerCase()) {
        final_commune_name = chefLieu;
        const communePrefix = `${to_commune_name}, `;
        if (!address.toLowerCase().includes(to_commune_name.toLowerCase())) {
          final_address = `${communePrefix}${address}`;
        }
      }
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
      freeshipping: false,
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
}
