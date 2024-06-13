const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let clients = {};

app.get('/', (req, res) => {
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
      lastSeen: clients[clientId].lastSeen
    }))
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
