import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Insert DNS resolution order at the very top, after imports
const importDns = "import dns from 'node:dns';\ndns.setDefaultResultOrder('ipv4first');\n";
content = importDns + content;

fs.writeFileSync('server.ts', content);
