const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

content = content.replace(
  /\.from\('books'\)\s*\.select\('\*'\)/g,
  ".from('books')\n        .select('id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books')"
);

fs.writeFileSync('src/pages/Home.tsx', content);
