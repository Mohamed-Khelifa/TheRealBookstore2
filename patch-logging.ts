import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

code = code.replace(
  /setOrders\(merged\);/,
  `console.log('Merged orders length:', merged.length, 'With guepex_status:', merged.filter(o => o.guepex_status).length); setOrders(merged);`
);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
