const fs = require('fs');

let content = fs.readFileSync('api/meta-capi.ts', 'utf8');

content = content.replace(
`    if (user_data?.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data?.fbc) hashedUserData.fbc = user_data.fbc;`,
`    if (user_data?.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data?.fbc) hashedUserData.fbc = user_data.fbc;
    
    if (user_data?.external_id) {
      hashedUserData.external_id = [processHash(user_data.external_id)];
    }`
);

fs.writeFileSync('api/meta-capi.ts', content);
