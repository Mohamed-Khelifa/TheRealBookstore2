import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const oldColorLogic = `                          <div className={\`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1
                            \${activeTab === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                              activeTab === 'RETURNED' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                              activeTab === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'}\`}
                          >
                            {statusText}
                          </div>`;

const newColorLogic = `                          <div className={\`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1
                            \${['Tentative échouée', 'Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour à retirer'].includes(statusText) 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                              : ['Sorti en livraison', 'Expédié'].includes(statusText) 
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}\`}
                          >
                            {statusText}
                          </div>`;

code = code.replace(oldColorLogic, newColorLogic);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
