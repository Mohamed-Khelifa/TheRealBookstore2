const fs = require('fs');
const content = fs.readFileSync('src/data/shippingRates.ts', 'utf8');

const userRates = `
Médéa : 500 DA home delivery / 400 DA desk stop
Blida : 550 DA home delivery / 450 DA desk stop
Bouira : 550 DA home delivery / 450 DA desk stop
Tiaret : 550 DA home delivery / 450 DA desk stop
Alger : 550 DA home delivery / 450 DA desk stop
M'Sila : 550 DA home delivery / 450 DA desk stop
Tissemsilt : 550 DA home delivery / 450 DA desk stop
Chlef : 700 DA home delivery / 600 DA desk stop
Oum El Bouaghi : 700 DA home delivery / 600 DA desk stop
Batna : 700 DA home delivery / 600 DA desk stop
Béjaïa : 700 DA home delivery / 600 DA desk stop
Tlemcen : 700 DA home delivery / 600 DA desk stop
Tizi Ouzou : 700 DA home delivery / 600 DA desk stop
Djelfa : 700 DA home delivery / 600 DA desk stop
Jijel : 700 DA home delivery / 600 DA desk stop
Sétif : 700 DA home delivery / 600 DA desk stop
Saida : 700 DA home delivery / 600 DA desk stop
Skikda : 700 DA home delivery / 600 DA desk stop
Sidi Bel Abbès : 700 DA home delivery / 600 DA desk stop
Annaba : 700 DA home delivery / 600 DA desk stop
Guelma : 700 DA home delivery / 600 DA desk stop
Constantine : 700 DA home delivery / 600 DA desk stop
Mostaganem : 700 DA home delivery / 600 DA desk stop
Mascara : 700 DA home delivery / 600 DA desk stop
Oran : 700 DA home delivery / 600 DA desk stop
Bordj Bou Arreridj : 700 DA home delivery / 600 DA desk stop
Boumerdès : 700 DA home delivery / 600 DA desk stop
El Tarf : 700 DA home delivery / 600 DA desk stop
Khenchela : 700 DA home delivery / 600 DA desk stop
Souk Ahras : 700 DA home delivery / 600 DA desk stop
Tipaza : 700 DA home delivery / 600 DA desk stop
Mila : 700 DA home delivery / 600 DA desk stop
Aïn Defla : 700 DA home delivery / 600 DA desk stop
Aïn Témouchent : 700 DA home delivery / 600 DA desk stop
Relizane : 700 DA home delivery / 600 DA desk stop
Laghouat : 850 DA home delivery / 700 DA desk stop
Biskra : 850 DA home delivery / 700 DA desk stop
Tébessa : 850 DA home delivery / 700 DA desk stop
Ouargla : 850 DA home delivery / 700 DA desk stop
El Oued : 850 DA home delivery / 700 DA desk stop
Ghardaïa : 850 DA home delivery / 700 DA desk stop
Ouled Djellal : 850 DA home delivery / 700 DA desk stop
Touggourt : 850 DA home delivery / 700 DA desk stop
El M'Ghair : 850 DA home delivery / 700 DA desk stop
El Menia : 850 DA home delivery / 700 DA desk stop
Adrar : 1650 DA home delivery / 1550 DA desk stop
Béchar : 1650 DA home delivery / 1550 DA desk stop
El Bayadh : 1650 DA home delivery / 1550 DA desk stop
Naäma : 1650 DA home delivery / 1550 DA desk stop
Timimoun : 1650 DA home delivery / 1550 DA desk stop
Bordj Badji Mokhtar : 1650 DA home delivery / 1550 DA desk stop
Béni Abbès : 1650 DA home delivery / 1550 DA desk stop
Tamanrasset : 1650 DA home delivery / 1550 DA desk stop
Illizi : 1650 DA home delivery / 1550 DA desk stop
Tindouf : 1650 DA home delivery / 1550 DA desk stop
In Salah : 1650 DA home delivery / 1550 DA desk stop
In Guezzam : 1650 DA home delivery / 1550 DA desk stop
Djanet : 1650 DA home delivery / 1550 DA desk stop
`;

const lines = userRates.trim().split('\n');
const parsed = lines.map(line => {
  const [wilaya, rates] = line.split(' : ');
  const [home, desk] = rates.split(' / ');
  return {
    wilaya: wilaya.trim(),
    home: parseInt(home),
    desk: parseInt(desk)
  };
});

let matches = true;
parsed.forEach(p => {
  // Try to find it in the content
  const regex = new RegExp(`wilaya:\\s*['"]${p.wilaya.replace(/['"]/g, '.*')}['"],\\s*rate_per_item:\\s*${p.home},\\s*office_pickup_rate:\\s*${p.desk}`, 'i');
  if (!regex.test(content)) {
    console.log("MISMATCH OR MISSING:", p);
    matches = false;
  }
});

if (matches) console.log("ALL MATCH!");
