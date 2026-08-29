import fs from 'fs';

let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const COLS = 'id, title, author, price, old_price, cover_image_url, rating, is_bundle, bundle_books, featured, categories, created_at';

// Replace initialBooks fetch
code = code.replace(
  /\.select\('\*'\)\s*\.order\('created_at', \{ ascending: false \}\)\s*\.range\(0, 49\);/,
  `.select('${COLS}')
        .order('created_at', { ascending: false })
        .range(0, 49);`
);

// Replace initialFeatured fetch
code = code.replace(
  /\.select\('\*'\)\s*\.eq\('featured', true\)\.limit\(20\)\s*\.order\('created_at', \{ ascending: false \}\);/,
  `.select('${COLS}')
        .eq('featured', true).limit(20)
        .order('created_at', { ascending: false });`
);

// Replace filteredBooks query
code = code.replace(
  /let query = supabase\.from\('books'\)\.select\('\*', \{ count: 'exact' \}\);/,
  `let query = supabase.from('books').select('${COLS}', { count: 'exact' });`
);

// We should also look for SWR or React Query caching disable, but they use simple useEffect.
// To stop silent refetching on window focus, since they don't use SWR, we are good.

fs.writeFileSync('src/pages/Home.tsx', code);
