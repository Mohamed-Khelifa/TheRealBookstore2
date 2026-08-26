import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

content = content.replace(
  /query = query\.contains\('categories', \['Personal Development'\]\);/,
  "query = query.overlaps('categories', ['Personal Development', 'personal development', 'Self Help', 'self help', 'Self-Help', 'self-help']);"
);

content = content.replace(
  /query = query\.contains\('categories', \[selectedCategory\]\);/,
  "query = query.overlaps('categories', [selectedCategory, selectedCategory.toLowerCase(), selectedCategory.toUpperCase()]);"
);

fs.writeFileSync('src/pages/Home.tsx', content);
