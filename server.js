const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

process.on('SIGINT', function () {
  process.exit();
});

app.use(bodyParser.json());

let clients = {}

const defaultIPs = [
  "192.168.1.3",
  // "192.168.1.11",
  // "192.168.40.4",
  "192.168.80.4",
  // "192.168.80.10",
  // "192.168.81.129",
  // "192.168.81.193",
]

const ports = [
  53,
  80,
  443,
  5683,
  1883,
  6053,
  8123,
  8883,
]

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/data', (req, res) => {
  res.json(clients);
});

app.post('/status', (req, res) => {
  const { id, ips, pingResults, openPorts } = req.body;
  const now = new Date();

  let clientId = id;

  // Assign a new ID if it is 0
  if (id === 0) {
    clientId = uuidv4();
  }
  console.log('Received status update from', clientId);

  // Update client information
  clients[clientId] = {
    ips: ips,
    openPorts: openPorts,
    lastSeen: now,
    pingResults: pingResults
  };

  // Send back client ID, all IPs to ping and all ports
  const scan_ips = Object.keys(clients).reduce((acc, clientId) => {
    if (clientId === id) return acc;
    return acc.concat(clients[clientId].ips);
  }, [...defaultIPs]);
  const response = {
    clientId: clientId,
    scan_ips,
    scan_ports: ports
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// filter clients with last_seen > 20 seconds
setInterval(() => {
  const now = new Date();
  for (let clientId in clients) {
    if (now - clients[clientId].lastSeen > 20000) {
      delete clients[clientId];
    }
  }
}, 1000); // Check every second
