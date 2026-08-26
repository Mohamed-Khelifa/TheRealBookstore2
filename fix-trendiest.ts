import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const regex = /\} else if \(selectedCategory === 'Featured'\) \{\n\s*query = query\.eq\('featured', true\);\n\s*\}/m;

const replacement = `} else if (selectedCategory === 'Featured') {
        query = query.eq('featured', true);
      } else if (selectedCategory === 'Trendiest') {
        query = query.gte('rating', 4.5);
      }`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/Home.tsx', content);
