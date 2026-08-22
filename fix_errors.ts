import fs from 'fs';

// Fix Home.tsx
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Replace select(...) with select('*') in initialBooks
homeContent = homeContent.replace(
  /.select\('id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books'\)/,
  ".select('*')"
);

// fix categories not found (I defined famousGenres but wait)
// let's see what categories was used for
homeContent = homeContent.replace(/categories.reduce/g, 'famousGenres.reduce');
homeContent = homeContent.replace(/const categoryCounts = categories.reduce/g, 'const categoryCounts = famousGenres.reduce');

// fix featuredBooks missing (it was probably used for the hero section)
homeContent = homeContent.replace(/featuredBooks/g, 'books.filter(b => b.featured)');

fs.writeFileSync('src/pages/Home.tsx', homeContent);

// Fix Categories.tsx
let catContent = fs.readFileSync('src/pages/Categories.tsx', 'utf-8');
catContent = catContent.replace(
  /.select\('id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books'\)/,
  ".select('*')"
);
fs.writeFileSync('src/pages/Categories.tsx', catContent);

// Fix ReaderSpace.tsx
let rsContent = fs.readFileSync('src/pages/ReaderSpace.tsx', 'utf-8');
rsContent = rsContent.replace(
  /.select\('id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books'\)/,
  ".select('*')"
);
fs.writeFileSync('src/pages/ReaderSpace.tsx', rsContent);

