import fs from 'fs';

const rates = [
  { wilaya: 'Médéa', home: 500, desk: 400 },
  { wilaya: 'Blida', home: 550, desk: 450 },
  { wilaya: 'Bouira', home: 550, desk: 450 },
  { wilaya: 'Tiaret', home: 550, desk: 450 },
  { wilaya: 'Alger', home: 550, desk: 450 },
  { wilaya: "M'Sila", home: 550, desk: 450 },
  { wilaya: 'Tissemsilt', home: 550, desk: 450 },
  { wilaya: 'Chlef', home: 700, desk: 600 },
  { wilaya: 'Oum El Bouaghi', home: 700, desk: 600 },
  { wilaya: 'Batna', home: 700, desk: 600 },
  { wilaya: 'Béjaïa', home: 700, desk: 600 },
  { wilaya: 'Tlemcen', home: 700, desk: 600 },
  { wilaya: 'Tizi Ouzou', home: 700, desk: 600 },
  { wilaya: 'Djelfa', home: 700, desk: 600 },
  { wilaya: 'Jijel', home: 700, desk: 600 },
  { wilaya: 'Sétif', home: 700, desk: 600 },
  { wilaya: 'Saida', home: 700, desk: 600 },
  { wilaya: 'Skikda', home: 700, desk: 600 },
  { wilaya: 'Sidi Bel Abbès', home: 700, desk: 600 },
  { wilaya: 'Annaba', home: 700, desk: 600 },
  { wilaya: 'Guelma', home: 700, desk: 600 },
  { wilaya: 'Constantine', home: 700, desk: 600 },
  { wilaya: 'Mostaganem', home: 700, desk: 600 },
  { wilaya: 'Mascara', home: 700, desk: 600 },
  { wilaya: 'Oran', home: 700, desk: 600 },
  { wilaya: 'Bordj Bou Arreridj', home: 700, desk: 600 },
  { wilaya: 'Boumerdès', home: 700, desk: 600 },
  { wilaya: 'El Tarf', home: 700, desk: 600 },
  { wilaya: 'Khenchela', home: 700, desk: 600 },
  { wilaya: 'Souk Ahras', home: 700, desk: 600 },
  { wilaya: 'Tipaza', home: 700, desk: 600 },
  { wilaya: 'Mila', home: 700, desk: 600 },
  { wilaya: 'Aïn Defla', home: 700, desk: 600 },
  { wilaya: 'Aïn Témouchent', home: 700, desk: 600 },
  { wilaya: 'Relizane', home: 700, desk: 600 },
  { wilaya: 'Laghouat', home: 850, desk: 700 },
  { wilaya: 'Biskra', home: 850, desk: 700 },
  { wilaya: 'Tébessa', home: 850, desk: 700 },
  { wilaya: 'Ouargla', home: 850, desk: 700 },
  { wilaya: 'El Oued', home: 850, desk: 700 },
  { wilaya: 'Ghardaïa', home: 850, desk: 700 },
  { wilaya: 'Ouled Djellal', home: 850, desk: 700 },
  { wilaya: 'Touggourt', home: 850, desk: 700 },
  { wilaya: "El M'Ghair", home: 850, desk: 700 },
  { wilaya: 'El Menia', home: 850, desk: 700 },
  { wilaya: 'Adrar', home: 1650, desk: 1550 },
  { wilaya: 'Béchar', home: 1650, desk: 1550 },
  { wilaya: 'El Bayadh', home: 1650, desk: 1550 },
  { wilaya: 'Naäma', home: 1650, desk: 1550 },
  { wilaya: 'Timimoun', home: 1650, desk: 1550 },
  { wilaya: 'Bordj Badji Mokhtar', home: 1650, desk: 1550 },
  { wilaya: 'Béni Abbès', home: 1650, desk: 1550 },
  { wilaya: 'Tamanrasset', home: 1650, desk: 1550 },
  { wilaya: 'Illizi', home: 1650, desk: 1550 },
  { wilaya: 'Tindouf', home: 1650, desk: 1550 },
  { wilaya: 'In Salah', home: 1650, desk: 1550 },
  { wilaya: 'In Guezzam', home: 1650, desk: 1550 },
  { wilaya: 'Djanet', home: 1650, desk: 1550 }
];

let content = `import { ShippingRate } from '../types';

export const ECONOMIC_RATES: ShippingRate[] = [
`;

rates.forEach(r => {
  content += `  { wilaya: "${r.wilaya}", rate_per_item: ${r.home}, office_pickup_rate: ${r.desk} },\n`;
});

content += `];

export function getEconomicRate(wilayaName: string): ShippingRate | undefined {
  if (!wilayaName) return undefined;
  const normalize = (str: string) =>
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\\u0300-\\u036f]/g, "")
       .replace(/[^a-z]/g, "");

  const normInput = normalize(wilayaName);
  return ECONOMIC_RATES.find(r => normalize(r.wilaya) === normInput);
}
`;

fs.writeFileSync('src/data/shippingRates.ts', content);
