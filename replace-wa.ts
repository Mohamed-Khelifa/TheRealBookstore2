import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const regex = /const getWhatsAppMessage = \(order: Order, tracking: string, status: string\) => \{[\s\S]*?return encodeURIComponent\(message\);\n\s*\};/;

const newFunction = `const getWhatsAppMessage = (order: Order, tracking: string, status: string) => {
    const name = order.customer_name || 'Client';
    const orderRef = tracking || order.id || 'N/A';
    const price = order.total_price ? \`\${order.total_price} DA\` : '';
    
    let message = \`Hello \${name}, from BigDeal Bookstore! 📚\\nBonjour \${name}, de BigDeal Bookstore !\\nمرحباً \${name}، من مكتبة BigDeal!\\n\\nOrder / Commande / الطلب : *\${orderRef}*\\n\\n\`;
    
    const s = (status || '').toLowerCase().trim();
    
    if (s === 'sorti en livraison') {
      message += \`🚚 Out for delivery! Please keep your phone reachable, the driver will call you soon. (\${price})\\n\\n🚚 En cours de livraison ! Gardez votre téléphone joignable, le livreur va appeler. (\${price})\\n\\n🚚 في الطريق إليك! يرجى إبقاء هاتفك متاحاً، سيتصل بك المندوب قريباً. (\${price})\`;
    } else if (s === 'en attente du client') {
      message += \`⚠️ The driver tried to reach you. Please call back to receive your order before it is returned.\\n\\n⚠️ Le livreur a essayé de vous joindre. Veuillez le rappeler pour éviter le retour de votre commande.\\n\\n⚠️ حاول المندوب الاتصال بك. يرجى معاودة الاتصال لاستلام طلبك قبل إرجاعه.\`;
    } else if (['tentative échouée', 'echèc livraison'].includes(s)) {
      message += \`⚠️ Delivery attempt failed. Please tell us when you are available to reschedule.\\n\\n⚠️ Tentative de livraison échouée. Dites-nous quand vous serez disponible pour reprogrammer.\\n\\n⚠️ فشلت محاولة التوصيل. يرجى إخبارنا متى ستكون متاحاً لإعادة الجدولة.\`;
    } else if (['expédié', 'centre', 'vers wilaya', 'en localisation'].includes(s)) {
      message += \`📦 Your package is on the way! The driver will contact you once it arrives in your city.\\n\\n📦 Votre colis est en route ! Le livreur vous contactera dès son arrivée dans votre ville.\\n\\n📦 طلبك في الطريق إليك! سيتصل بك المندوب فور وصوله إلى مدينتك.\`;
    } else if (s.includes('retour')) {
      message += \`🔄 Your package was marked as returned. Let us know if you still want to receive it.\\n\\n🔄 Votre colis a été marqué comme retour. Dites-nous si vous souhaitez toujours le recevoir.\\n\\n🔄 تم تسجيل الطرد كمرتجع. أخبرنا إذا كنت لا تزال ترغب في استلامه.\`;
    } else if (s === 'livré' || s === 'livre') {
      message += \`🎉 Delivered! Enjoy your books and feel free to tag us.\\n\\n🎉 Livré ! Bonne lecture, n'hésitez pas à nous taguer.\\n\\n🎉 تم التوصيل! قراءة ممتعة، لا تتردد في الإشارة إلينا.\`;
    } else {
      message += \`Current status: *\${status}*. Let us know if you have questions!\\n\\nStatut actuel: *\${status}*. Contactez-nous si vous avez des questions !\\n\\nالحالة الحالية: *\${status}*. تواصل معنا إذا كان لديك أي أسئلة!\`;
    }
    
    return encodeURIComponent(message);
  };`;

code = code.replace(regex, newFunction);
fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
