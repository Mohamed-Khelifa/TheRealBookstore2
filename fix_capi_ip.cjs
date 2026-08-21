const fs = require('fs');
let content = fs.readFileSync('api/meta-capi.ts', 'utf8');

content = content.replace(
`    // Client IP & User Agent
    const clientIp = req.headers?.['x-forwarded-for']
      ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
      : req.socket?.remoteAddress || req.connection?.remoteAddress;`,
`    // Client IP & User Agent
    const clientIp = 
      req.headers?.['cf-connecting-ip'] || 
      req.headers?.['x-real-ip'] || 
      (req.headers?.['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : null) || 
      req.socket?.remoteAddress || 
      req.connection?.remoteAddress;`
);

fs.writeFileSync('api/meta-capi.ts', content);
