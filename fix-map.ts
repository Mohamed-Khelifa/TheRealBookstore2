import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

code = code.replace(
  /if \(p\.order_id\) parcelsMap\[p\.order_id\] = p;\n           else if \(p\.tracking\) parcelsMap\[p\.tracking\] = p;/,
  `if (p.order_id) parcelsMap[String(p.order_id).toLowerCase()] = p;
           else if (p.tracking) parcelsMap[String(p.tracking).toLowerCase()] = p;`
);

code = code.replace(
  /const parcel = parcelsMap\[o\.id\] \|\| parcelsMap\[o\.tracking_code \|\| ''\];/,
  `const parcel = parcelsMap[String(o.id).toLowerCase()] || parcelsMap[String(o.tracking_code || '').toLowerCase()];`
);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
