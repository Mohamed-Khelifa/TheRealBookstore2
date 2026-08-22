import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Remove the full fetch setTimeout block
content = content.replace(/\/\/ 4\. Hydrate complete book catalog[\s\S]*?}, 250\);/m, '// Removed full catalog background fetch');

// ...
fs.writeFileSync('src/pages/Home.tsx', content);
