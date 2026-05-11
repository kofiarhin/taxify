const app = require('./app');
const connectDb = require('./config/db');
const env = require('./config/env');
const http = require('http');
const { initializeSocketServer } = require('./realtime/socket');

connectDb()
  .then(() => {
    const server = http.createServer(app);
    initializeSocketServer(server);

    server.listen(env.PORT, () => {
      console.log(`Taxify API listening on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Taxify API', error);
    process.exit(1);
  });
