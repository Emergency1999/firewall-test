const os = require('os');

const serverUrl = 'https://pingtest.kamaux.de/status';
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

const { exec } = require('child_process');

async function ping(ip) {
  return new Promise((resolve, reject) => {
    exec(`ping -c 1 ${ip}`, (error, stdout, stderr) => {
      if (error) {
        // If there's an error, assume the host is not alive
        resolve(false);
      } else {
        // Check the output to determine if the ping was successful
        const match = stdout.match(/1 received/);
        if (match) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
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
