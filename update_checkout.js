const fs = require('fs');
const content = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');

const effectCode = `
  useEffect(() => {
    if (formData.email) localStorage.setItem('bigdeal_user_email', formData.email);
    if (formData.phone) localStorage.setItem('bigdeal_user_phone', formData.phone);
    if (formData.full_name) localStorage.setItem('bigdeal_user_name', formData.full_name);
    if (formData.wilaya) localStorage.setItem('bigdeal_user_wilaya', formData.wilaya);
    if (formData.baladia) localStorage.setItem('bigdeal_user_baladia', formData.baladia);
  }, [formData.email, formData.phone, formData.full_name, formData.wilaya, formData.baladia]);
`;

const replaceTarget = `  useEffect(() => {
    const map = formData.shipping_method === 'office' ? allStopdeskCommunes : allWilayaCommunes;`;

const newContent = content.replace(replaceTarget, effectCode + '\n  useEffect(() => {\n    const map = formData.shipping_method === \'office\' ? allStopdeskCommunes : allWilayaCommunes;');

fs.writeFileSync('src/pages/Checkout.tsx', newContent);
