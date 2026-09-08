import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

code = code.replace(
  /orders\.filter\(o => \(o\.guepex_status \|\| ''\) === status\)\.length/,
  `orders.filter(o => (o.guepex_status || '').toLowerCase().trim() === status.toLowerCase().trim()).length`
);

code = code.replace(
  /const guepexStatus = o\.guepex_status \|\| '';\n    return guepexStatus === activeTab;/,
  `const guepexStatus = o.guepex_status || '';\n    return guepexStatus.toLowerCase().trim() === activeTab.toLowerCase().trim();`
);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
