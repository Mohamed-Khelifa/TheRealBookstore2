const fs = require('fs');

let content = fs.readFileSync('src/lib/metaPixel.ts', 'utf8');

// 1. Add external_id to UserDataParams
content = content.replace(
`export interface UserDataParams {
  email?: string;
  phone?: string;
  full_name?: string;
  wilaya?: string;
  baladia?: string;
  fbp?: string;
  fbc?: string;
}`,
`export interface UserDataParams {
  email?: string;
  phone?: string;
  full_name?: string;
  wilaya?: string;
  baladia?: string;
  fbp?: string;
  fbc?: string;
  external_id?: string;
}`
);

// 2. Add helper functions
content = content.replace(
`export function getFbpCookie(): string | undefined {`,
`export function getOrCreateExternalId(): string {
  if (typeof window === 'undefined') return '';
  let extId = localStorage.getItem('bigdeal_external_id');
  if (!extId) {
    extId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('bigdeal_external_id', extId);
  }
  return extId;
}

export function getOrCreateFbp(): string | undefined {
  let fbp = getCookie('_fbp');
  if (!fbp && typeof document !== 'undefined') {
    const creationTime = Date.now();
    const rand = Math.floor(Math.random() * 10000000000);
    fbp = \`fb.1.\${creationTime}.\${rand}\`;
    document.cookie = \`_fbp=\${fbp}; path=/; max-age=7776000; SameSite=Lax\`;
  }
  return fbp;
}

export function getFbpCookie(): string | undefined {`
);

// 3. Update getEnrichedUserData to use the new helpers
content = content.replace(
`  userData.fbp = provided.fbp || getFbpCookie();
  userData.fbc = provided.fbc || getFbcCookie();`,
`  userData.fbp = provided.fbp || getOrCreateFbp();
  userData.fbc = provided.fbc || getFbcCookie();
  userData.external_id = provided.external_id || getOrCreateExternalId();`
);

// 4. Update initMetaPixel to map external_id
content = content.replace(
`  if (mergedData.wilaya) {
    const cleanWilaya = mergedData.wilaya.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanWilaya) advancedMatching.st = await hashMetaValue(cleanWilaya);
  }

  // Always set DZ country
  advancedMatching.country = await hashMetaValue('dz');`,
`  if (mergedData.wilaya) {
    const cleanWilaya = mergedData.wilaya.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanWilaya) advancedMatching.st = await hashMetaValue(cleanWilaya);
  }

  if (mergedData.external_id) {
    advancedMatching.external_id = await hashMetaValue(mergedData.external_id);
  }

  // Always set DZ country
  advancedMatching.country = await hashMetaValue('dz');`
);

fs.writeFileSync('src/lib/metaPixel.ts', content);
