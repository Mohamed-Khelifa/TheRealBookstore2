import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const regex = /switch\(activeTab\) \{[\s\S]*?case 'IN_TRANSIT':[\s\S]*?case 'PENDING':[\s\S]*?return o\.status === 'PENDING' \|\| o\.order_state === 'IN_STOCK_UNPACKAGED';\n\s*default:\n\s*return true;\n\s*\}/;

const newLogic = `
    if (activeTab === 'WEBHOOKS') return true;
    const guepexStatus = o.guepex_status || '';
    return guepexStatus === activeTab;
`;

code = code.replace(regex, newLogic);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
