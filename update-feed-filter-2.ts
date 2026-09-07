import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const regex = /switch\(activeTab\) \{[\s\S]*?default:\s*return true;\s*\}/;

const newLogic = `
    if (activeTab === 'WEBHOOKS') return true;
    const guepexStatus = o.guepex_status || '';
    return guepexStatus === activeTab;
`;

code = code.replace(regex, newLogic.trim());

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
