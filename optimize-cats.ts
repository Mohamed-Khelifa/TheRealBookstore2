import fs from 'fs';

let code = fs.readFileSync('src/pages/Categories.tsx', 'utf-8');

const COLS = 'id, featured, is_bundle, rating, categories';

// In Categories.tsx, it fetches books only to calculate category counts.
// So we only need: id, featured, is_bundle, rating, categories
// But it uses `.select('*').order('created_at', { ascending: false }).limit(50);`

code = code.replace(
  /\.select\('\*'\)\.order\('created_at', \{ ascending: false \}\)\.limit\(50\);/,
  `.select('${COLS}').order('created_at', { ascending: false }).limit(50);`
);

fs.writeFileSync('src/pages/Categories.tsx', code);
