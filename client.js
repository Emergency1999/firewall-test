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
  const fetch = (await import('node-fetch')).default;
  console.log(clientId, pingResults)
  try {
    const localIPs = getLocalIPs();

    // Send initial status request
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId, ips: localIPs, pingResults })
    });
    pingResults = {};

    const { clientId: newClientId, clients } = await response.json();
    clientId = newClientId;

    for (let client of clients) {
      if (client.id !== clientId) {
        for (let ip of client.ips) {
          const isAlive = await ping(ip);
          console.log(`Ping ${ip}:`, isAlive ? 'Alive' : 'Dead');
          pingResults[ip] = isAlive;
        }
      }
    }

  } catch (e) {
    console.error('Error updating status:', e);
  }
}

updateStatus()
setInterval(updateStatus, 5000); // Update status every 5 seconds
