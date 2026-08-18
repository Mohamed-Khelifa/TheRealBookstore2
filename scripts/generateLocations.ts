import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const api_id = process.env.GUEPEX_API_ID;
const api_token = process.env.GUEPEX_API_TOKEN;

if (!api_id || !api_token) {
  console.error('Missing GUEPEX credentials in environment');
  process.exit(1);
}

const headers = { 'X-API-ID': api_id, 'X-API-TOKEN': api_token };

async function fetchAllCommunes() {
  let all: any[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`https://api.guepex.app/v1/communes/?page=${page}&page_size=1000`, { headers });
    const data = await res.json();
    const items = data.data || [];
    all = all.concat(items);
    console.log(`Communes Page ${page}: fetched ${items.length} (Total: ${all.length})`);
    if (!data.has_more && !data.next && items.length === 0) break;
    if (items.length < 1000) break;
    page++;
  }
  return all;
}

async function fetchAllCenters() {
  let all: any[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`https://api.guepex.app/v1/centers/?page=${page}&page_size=1000`, { headers });
    const data = await res.json();
    const items = data.data || [];
    all = all.concat(items);
    console.log(`Centers Page ${page}: fetched ${items.length} (Total: ${all.length})`);
    if (!data.has_more && !data.next && items.length === 0) break;
    if (items.length < 1000) break;
    page++;
  }
  return all;
}

(async () => {
  console.log('Fetching complete Guepex data...');
  const communes = await fetchAllCommunes();
  const centers = await fetchAllCenters();

  const wilayaCommunesMap: Record<string, string[]> = {};
  const stopdeskCommunesMap: Record<string, string[]> = {};
  const wilayaAgenciesMap: Record<string, Array<{ id: number; name: string; address: string; commune_name: string; wilaya_name: string }>> = {};

  communes.forEach((c: any) => {
    const wName = c.wilaya_name?.trim();
    const cName = c.name?.trim();
    if (!wName || !cName) return;

    if (!wilayaCommunesMap[wName]) wilayaCommunesMap[wName] = [];
    if (!wilayaCommunesMap[wName].includes(cName)) wilayaCommunesMap[wName].push(cName);

    if (c.has_stop_desk === 1) {
      if (!stopdeskCommunesMap[wName]) stopdeskCommunesMap[wName] = [];
      if (!stopdeskCommunesMap[wName].includes(cName)) stopdeskCommunesMap[wName].push(cName);
    }
  });

  // Sort commune lists alphabetically
  Object.keys(wilayaCommunesMap).forEach(w => {
    wilayaCommunesMap[w].sort();
  });
  Object.keys(stopdeskCommunesMap).forEach(w => {
    stopdeskCommunesMap[w].sort();
  });

  centers.forEach((center: any) => {
    const wName = center.wilaya_name?.trim();
    if (!wName) return;
    if (!wilayaAgenciesMap[wName]) wilayaAgenciesMap[wName] = [];
    wilayaAgenciesMap[wName].push({
      id: Number(center.center_id),
      name: center.name || 'Agence',
      address: center.address || center.name || '',
      commune_name: center.commune_name || '',
      wilaya_name: wName
    });
  });

  // Sort agencies by name
  Object.keys(wilayaAgenciesMap).forEach(w => {
    wilayaAgenciesMap[w].sort((a, b) => a.name.localeCompare(b.name));
  });

  console.log('Generating src/data/locationData.ts...');

  const fileContent = `// Official 100% Complete Guepex Location Data for all 58 Wilayas of Algeria
// Generated directly from Guepex API (${communes.length} Communes, ${centers.length} Centers)

export const DEFAULT_WILAYA_COMMUNES: Record<string, string[]> = ${JSON.stringify(wilayaCommunesMap, null, 2)};

export const DEFAULT_STOPDESK_COMMUNES: Record<string, string[]> = ${JSON.stringify(stopdeskCommunesMap, null, 2)};

export const DEFAULT_GUEPEX_AGENCIES: Record<string, Array<{ id: number; name: string; address: string; commune_name: string; wilaya_name: string }>> = ${JSON.stringify(wilayaAgenciesMap, null, 2)};
`;

  fs.writeFileSync('src/data/locationData.ts', fileContent);
  console.log('Successfully wrote src/data/locationData.ts!');
})();
