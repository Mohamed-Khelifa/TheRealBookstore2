import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

code = code.replace(
  /return prev\.map\(o => o\.id === newOrder\.id \? newOrder : o\);/,
  "return prev.map(o => o.id === newOrder.id ? { ...newOrder, guepex_status: o.guepex_status, tracking_code: o.tracking_code, guepex_reason: o.guepex_reason } : o);"
);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
