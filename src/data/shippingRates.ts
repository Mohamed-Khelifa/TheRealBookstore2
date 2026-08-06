import { ShippingRate } from '../types';

export const ECONOMIC_RATES: ShippingRate[] = [
  { wilaya: 'Médéa', rate_per_item: 500, office_pickup_rate: 400 },
  
  // Zone 1
  { wilaya: 'Blida', rate_per_item: 550, office_pickup_rate: 450 },
  { wilaya: 'Bouira', rate_per_item: 550, office_pickup_rate: 450 },
  { wilaya: 'Tiaret', rate_per_item: 550, office_pickup_rate: 450 },
  { wilaya: 'Alger', rate_per_item: 550, office_pickup_rate: 450 },
  { wilaya: "M'Sila", rate_per_item: 550, office_pickup_rate: 450 },
  { wilaya: 'Tissemsilt', rate_per_item: 550, office_pickup_rate: 450 },

  // Zone 2
  { wilaya: 'Chlef', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Oum El Bouaghi', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Batna', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Béjaïa', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Tlemcen', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Tizi Ouzou', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Djelfa', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Jijel', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Sétif', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Saïda', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Skikda', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Sidi Bel Abbès', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Annaba', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Guelma', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Constantine', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Mostaganem', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Mascara', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Oran', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Bordj Bou Arreridj', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Boumerdès', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'El Tarf', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Khenchela', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Souk Ahras', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Tipaza', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Mila', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Aïn Defla', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Aïn Témouchent', rate_per_item: 700, office_pickup_rate: 600 },
  { wilaya: 'Relizane', rate_per_item: 700, office_pickup_rate: 600 },

  // Zone 3
  { wilaya: 'Laghouat', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'Biskra', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'Tébessa', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'Ouargla', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'El Oued', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'Ghardaïa', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'Ouled Djellal', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'Touggourt', rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: "El M'Ghair", rate_per_item: 850, office_pickup_rate: 700 },
  { wilaya: 'El Menia', rate_per_item: 850, office_pickup_rate: 700 },

  // Zone 4 & 5
  { wilaya: 'Adrar', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Béchar', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'El Bayadh', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Naâma', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Timimoun', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Bordj Badji Mokhtar', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Bordj Baji Mokhtar', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Béni Abbès', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Tamanrasset', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Illizi', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Tindouf', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'In Salah', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'In Guezzam', rate_per_item: 1650, office_pickup_rate: 1550 },
  { wilaya: 'Djanet', rate_per_item: 1650, office_pickup_rate: 1550 }
];

export function getEconomicRate(wilayaName: string): ShippingRate | undefined {
  if (!wilayaName) return undefined;
  const normalize = (str: string) =>
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z]/g, "");

  const normInput = normalize(wilayaName);
  return ECONOMIC_RATES.find(r => normalize(r.wilaya) === normInput);
}
