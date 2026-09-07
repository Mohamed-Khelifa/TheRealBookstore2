import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const waFunction = `
  const getWhatsAppMessage = (order: Order, tracking: string, status: string) => {
    const name = order.customer_name || 'Client';
    const orderRef = tracking || order.id || 'N/A';
    
    let message = \`Bonjour \${name}, c'est BigDeal Bookstore ! 📚\\n\\nConcernant votre commande (\${orderRef}) : \`;
    
    const s = (status || '').toLowerCase().trim();
    
    if (s === 'sorti en livraison') {
      message += \`Votre colis est *sorti en livraison* aujourd'hui ! 🚚\\n\\n👉 *Que devez-vous faire ?*\\nS'il vous plaît, gardez votre téléphone à portée de main et restez joignable. Le livreur va vous appeler très prochainement pour vous remettre vos livres. Merci d'avoir préparé le montant de \${order.total_price || ''} DA.\`;
    } else if (s === 'en attente du client') {
      message += \`Le livreur a essayé de vous joindre pour la livraison de votre colis. ⚠️\\n\\n👉 *Que devez-vous faire ?*\\nVeuillez rappeler le livreur ou nous contacter au plus vite pour récupérer votre commande avant qu'elle ne nous soit retournée.\`;
    } else if (['tentative échouée', 'echèc livraison'].includes(s)) {
      message += \`La tentative de livraison a échoué. ⚠️\\n\\n👉 *Que devez-vous faire ?*\\nPour ne pas rater vos livres, merci de nous indiquer quand vous serez disponible pour que nous puissions reprogrammer la livraison rapidement.\`;
    } else if (['expédié', 'centre', 'vers wilaya', 'en localisation'].includes(s)) {
      message += \`Votre colis est en route vers vous ! (Statut actuel: \${status}). 📦\\n\\n👉 *Que devez-vous faire ?*\\nRien pour l'instant ! Veuillez simplement garder votre téléphone allumé, le livreur vous contactera dès que la commande arrivera dans votre région.\`;
    } else if (s.includes('retour')) {
      message += \`Votre colis a été marqué comme retour (Statut: \${status}). 🔄\\n\\n👉 *Que devez-vous faire ?*\\nSi vous souhaitez toujours recevoir vos livres, faites-le nous savoir pour que nous puissions trouver une solution ensemble.\`;
    } else if (s === 'livré' || s === 'livre') {
      message += \`Votre commande a été marquée comme livrée ! 🎉\\n\\n👉 Nous espérons que vos nouveaux livres vous plairont. N'hésitez pas à nous laisser un avis ou à nous taguer sur les réseaux sociaux. Bonne lecture !\`;
    } else {
      message += \`Le statut de votre colis est actuellement : *\${status}*.\\n\\nSi vous avez des questions, nous sommes à votre disposition !\`;
    }
    
    return encodeURIComponent(message);
  };
`;

if (!code.includes('getWhatsAppMessage')) {
  code = code.replace(
    /const fetchOrders = async/,
    waFunction + '\n  const fetchOrders = async'
  );
}

code = code.replace(
  /href=\{\`https:\/\/wa\.me\/213\$\{\(order\.phone \|\| ''\)\.replace\(\/\^0\/, ''\)\}\?text=\$\{encodeURIComponent\(\`Bonjour \$\{order\.customer_name\}, concernant votre commande BigDeal Bookstore \(\$\{tracking \|\| order\.id\}\): Le statut actuel est "\$\{statusText\}"\.\`\)\}\`\}/g,
  "href={`https://wa.me/213${(order.phone || '').replace(/^0/, '')}?text=${getWhatsAppMessage(order, tracking || '', statusText)}`}"
);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
