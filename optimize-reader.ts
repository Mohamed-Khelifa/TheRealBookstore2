import fs from 'fs';

let code = fs.readFileSync('src/pages/ReaderSpace.tsx', 'utf-8');
const COLS = 'id, title, author, price, old_price, cover_image_url, rating, is_bundle, bundle_books, featured, categories, created_at';

code = code.replace(
  /const \{ data \} = await supabase\.from\('books'\)\.select\('\*'\)\.order\('created_at', \{ ascending: false \}\)\.limit\(50\);/,
  `const { data } = await supabase.from('books').select('${COLS}').order('created_at', { ascending: false }).limit(50);`
);

code = code.replace(
  /const \{ data: oData \} = await supabase\s*\.from\('orders'\)\s*\.select\('\*'\)/,
  `const { data: oData } = await supabase
        .from('orders')
        .select('id, created_at, status, total_price, tracking_code, items')`
);

fs.writeFileSync('src/pages/ReaderSpace.tsx', code);
