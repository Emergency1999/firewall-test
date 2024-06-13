const fetch = require('node-fetch');
const os = require('os');

const serverUrl = 'http://localhost:3000/status';
let clientId = 0;

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (let iface of Object.values(interfaces)) {
    for (let address of iface) {
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses;
}

async function ping(ip) {
  // Simulate a ping command
  // In a real implementation, you might use a library or native ping command
  const isAlive = Math.random() > 0.2; // 80% chance it's alive
  return isAlive;
}

let pingResults = {};

async function updateStatus() {
  const localIPs = getLocalIPs();

  // Send initial status request
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: clientId, ips: localIPs, pingResults})
  });
  pingResults = {};

  const { clientId: newClientId, clients } = await response.json();
  clientId = newClientId;
  console.log('Status updated. Client ID:', clientId);

  for (let client of clients) {
    if (client.id !== clientId) {
      for (let ip of client.ips) {
        const isAlive = await ping(ip);
        pingResults[ip] = isAlive;
      }
    }
  }

}

setInterval(updateStatus, 10000); // Update status every 10 seconds
