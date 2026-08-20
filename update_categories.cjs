const fs = require('fs');
let content = fs.readFileSync('src/pages/Categories.tsx', 'utf-8');

content = content.replace(
  /fetchAllRows\('books',\s*'\*'/g,
  "fetchAllRows('books', 'id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books'"
);

fs.writeFileSync('src/pages/Categories.tsx', content);

let readerContent = fs.readFileSync('src/pages/ReaderSpace.tsx', 'utf-8');
readerContent = readerContent.replace(
  /fetchAllRows\('books',\s*'\*'/g,
  "fetchAllRows('books', 'id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books'"
);

fs.writeFileSync('src/pages/ReaderSpace.tsx', readerContent);
