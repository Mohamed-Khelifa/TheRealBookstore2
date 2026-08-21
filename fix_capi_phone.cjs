const fs = require('fs');

let content = fs.readFileSync('api/meta-capi.ts', 'utf8');

// Update how normalizePhone handles hashes
content = content.replace(
`function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\\D/g, '');
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return '213' + digits.slice(1);
  if (digits.length === 9) return '213' + digits;
  return digits;
}`,
`function normalizePhone(phone: string): string {
  if (!phone) return '';
  if (isSha256(phone.trim().toLowerCase())) return phone.trim().toLowerCase();
  
  const digits = phone.replace(/\\D/g, '');
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return '213' + digits.slice(1);
  if (digits.length === 9) return '213' + digits;
  return digits;
}`
);

fs.writeFileSync('api/meta-capi.ts', content);
