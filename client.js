const os = require('os');
const express = require('express');

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
    exec(`ping -c 1 -W 1 ${ip}`, (error, stdout, stderr) => {
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

async function scanPortTcp(ip, port) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, ip);
  });
}

// async function scanPortUdp(ip, port) {
//   return new Promise((resolve, reject) => {
//     exec(`nc -u -z -w 1 ${ip} ${port}`, (error, stdout, stderr) => {
//       if (error) {
//         resolve(false);
//       } else {
//         resolve(true);
//       }
//     });
//   });
// }

const openedPorts = {};

function openPort(port) {
  try {
    const app = express();
    app.get('/', (req, res) => {
      res.send('Client ' + clientId + ' listening on port ' + port);
    });
    openedPorts[port] = true;
    app.listen(port, (err) => {
      if (err) {
        openedPorts[port] = false;
        console.error('Error listening on port', port, err);
      } else {
        console.log('Listening on port', port);
      }
    }).on('error', (err) => {
      openedPorts[port] = false;
      console.error('Error listening on port', port, err);
    });
  } catch (e) {
    openedPorts[port] = false;
    console.error('Error listening on port', port, e);
  }
}

let pingResults = {};

let running = false
async function updateStatus() {
  if (running) return console.log('Already running')
  running = true
  try {
    const fetch = (await import('node-fetch')).default;
    console.log(clientId, pingResults)
    const localIPs = getLocalIPs();

    // Send initial status request
    const openPorts = Object.keys(openedPorts).filter(port => openedPorts[port] !== false);
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId, ips: localIPs, pingResults, openPorts })
    });
    pingResults = {};

    const { clientId: newClientId, scan_ips, scan_ports } = await response.json();
    clientId = newClientId;

    // check all local ports are open
    for (let port of scan_ports) {
      if (openedPorts[port] === undefined) {
        openPort(port);
      }
    }

    // ping all IPs and check all ports
    await Promise.all([
      ...scan_ips.map(async ip => {
        const isAlive = await ping(ip);
        console.log(`Ping ${ip}:`, isAlive ? 'Alive' : 'Dead');
        if (isAlive) {
          if (!pingResults[ip]) pingResults[ip] = {}
          pingResults[ip]["ping"] = isAlive;
        }
      }),
      ...scan_ips.map(async ip => {
        await Promise.all(scan_ports.map(async port => {
          const isTCP = await scanPortTcp(ip, port);
          console.log(`Port ${ip} on ${port}:`, isTCP ? 'Open' : 'Closed');

          if (isTCP) {
            if (!pingResults[ip]) pingResults[ip] = {}
            pingResults[ip][String(port)] = isTCP;
          }
        }));
      }),
    ]);

  } catch (e) {
    console.error('Error updating status:', e);
  }
  running = false
}

updateStatus()
setInterval(updateStatus, 2000); // Update status every 2 seconds
