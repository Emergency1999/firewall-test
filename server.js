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

let clients = {};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/data', (req, res) => {
  res.json(clients);
});

app.post('/status', (req, res) => {
  const { id, ips, pingResults } = req.body;
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
    lastSeen: now,
    pingResults: pingResults
  };

  // Send back the list of clients and their last seen time
  const response = {
    clientId: clientId,
    clients: Object.keys(clients).map(clientId => ({
      id: clientId,
      ips: clients[clientId].ips,
    }))
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// filter clients with last_seen > 60 seconds
setInterval(() => {
  const now = new Date();
  for (let clientId in clients) {
    if (now - clients[clientId].lastSeen > 60000) {
      delete clients[clientId];
    }
  }
}, 1000); // Check every second
