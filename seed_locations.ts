import { supabase } from './src/lib/supabase';
import fs from 'fs';

(async () => {
  console.log('Loading wilaya_communes.json...');
  const wilayaCommunes = JSON.parse(fs.readFileSync('./public/wilaya_communes.json', 'utf8'));

  console.log('Fetching agencies from Guepex for all wilayas...');
  // We need to fetch for each wilaya because the API requires wilaya_id
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

  const API_ID = process.env.GUEPEX_API_ID || '11776';
  const API_TOKEN = process.env.GUEPEX_API_TOKEN || 'aNndG6Kj7jP7P83L97h8Jqg9m2xJ4E';
  
  let allAgencies: Record<string, any[]> = {};
  
  for (const [name, id] of Object.entries(WILAYA_CODES)) {
    try {
      const res = await fetch(`https://api.guepex.app/v1/centers/?wilaya_id=${id}`, {
        headers: {
          "X-API-ID": API_ID,
          "X-API-TOKEN": API_TOKEN
        }
      });
      const data = await res.json();
      if (data && data.data) {
        allAgencies[name] = data.data;
      }
    } catch (e) {
      console.error('Error fetching for', name, e);
    }
  }

  console.log('Saving to Supabase site_settings...');
  
  const { error: e1 } = await supabase.from('site_settings').upsert({
    key: 'wilaya_communes',
    value: wilayaCommunes
  }, { onConflict: 'key' });
  
  if (e1) console.error('Error saving wilaya_communes:', e1);

  const { error: e2 } = await supabase.from('site_settings').upsert({
    key: 'guepex_agencies',
    value: allAgencies
  }, { onConflict: 'key' });
  
  if (e2) console.error('Error saving guepex_agencies:', e2);

  console.log('Done!');
})();
