import fs from 'fs';
let code = fs.readFileSync('src/components/BundleCover.tsx', 'utf-8');
code = code.replace(/\.select\('\*'\)\.in\('id', missingIds\)/, ".select('id, title, cover_image_url').in('id', missingIds)");
fs.writeFileSync('src/components/BundleCover.tsx', code);
