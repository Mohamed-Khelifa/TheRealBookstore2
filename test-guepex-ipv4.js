const https = require('https');
const options = {
  hostname: 'api.guepex.app',
  port: 443,
  path: '/v1/parcels/',
  method: 'GET',
  family: 4, // Force IPv4
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json"
  }
};
const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => { process.stdout.write(d); });
});
req.on('error', error => { console.error(error); });
req.end();
