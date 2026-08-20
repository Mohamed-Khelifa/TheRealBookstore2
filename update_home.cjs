const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const regex = /const \{ data: fullBooks \} = await fetchAllRows\('books', 'id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books', 'created_at', false\); \/\/[\s\S]*?false\s*\);/g;

content = content.replace(regex, `const { data: fullBooks } = await fetchAllRows(
          'books',
          'id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books',
          'created_at',
          false
        );`);

fs.writeFileSync('src/pages/Home.tsx', content);
