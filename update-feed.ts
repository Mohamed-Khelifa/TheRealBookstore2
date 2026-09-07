import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const GUEPEX_STATUSES = [
  "Expédié",
  "Centre",
  "Vers Wilaya",
  "En localisation",
  "En attente du client",
  "Sorti en livraison",
  "Tentative échouée",
  "Echèc livraison",
  "Retour vers centre",
  "Retourné au centre",
  "Retour à retirer"
];

code = code.replace(
  /const \[activeTab, setActiveTab\] = useState.*?;/,
  "const [activeTab, setActiveTab] = useState<string>('Sorti en livraison');"
);

// Replace the filtering logic
const filterRegex = /switch\(activeTab\) \{\s*case 'IN_TRANSIT':[\s\S]*?case 'PENDING':[\s\S]*?return o\.status === 'PENDING' || o\.order_state === 'IN_STOCK_UNPACKAGED';\s*default:\s*return true;\s*\}/;

const newFilter = `
    if (activeTab === 'WEBHOOKS') return true;
    const guepexStatus = o.guepex_status || '';
    return guepexStatus === activeTab;
`;

code = code.replace(filterRegex, newFilter.trim());

// Replace the tabs rendering
const tabsRegex = /<div className="flex flex-wrap items-center gap-4 border-b border-white\/10">[\s\S]*?<\/div>\s*<div className="space-y-6">/;

const newTabs = `<div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/10 scrollbar-hide">
        {[
          "Expédié",
          "Centre",
          "Vers Wilaya",
          "En localisation",
          "En attente du client",
          "Sorti en livraison",
          "Tentative échouée",
          "Echèc livraison",
          "Retour vers centre",
          "Retourné au centre",
          "Retour à retirer",
          "WEBHOOKS"
        ].map(status => {
          const count = status === 'WEBHOOKS' ? webhookLogs.length : orders.filter(o => (o.guepex_status || '') === status).length;
          
          let colorClass = 'border-transparent text-white/50 hover:text-white bg-white/5';
          let activeClass = 'border-primary text-primary-light bg-primary/10';
          
          if (['Sorti en livraison', 'Expédié'].includes(status)) activeClass = 'border-blue-500 text-blue-400 bg-blue-500/10';
          else if (['Tentative échouée', 'Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour à retirer'].includes(status)) activeClass = 'border-red-500 text-red-400 bg-red-500/10';
          else if (status === 'WEBHOOKS') activeClass = 'border-purple-500 text-purple-400 bg-purple-500/10';

          const isActive = activeTab === status;
          
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={\`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 border transition-all \${isActive ? activeClass : colorClass}\`}
            >
              {status}
              <span className={\`px-1.5 py-0.5 rounded-md text-[10px] \${isActive ? 'bg-white/20' : 'bg-black/30'}\`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">`;

code = code.replace(tabsRegex, newTabs);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
