const http = require('http');
const path = require('path');
const { pathToFileURL } = require('url');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { removeState, writeState } = require('./e2eState');
const { seedE2eData } = require('./e2eSeed');

const apiPort = Number(process.env.E2E_API_PORT || 5000);
const clientPort = Number(process.env.E2E_CLIENT_PORT || 5173);
const host = '127.0.0.1';
const apiUrl = `http://${host}:${apiPort}/api`;
const baseUrl = `http://${host}:${clientPort}`;
const clientRoot = path.join(__dirname, '..', '..', 'client');

let mongo;
let apiServer;
let viteServer;
let shuttingDown = false;

const listen = (app) =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.once('error', reject);
    server.listen(apiPort, host, () => resolve(server));
  });

const shutdown = async (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    if (viteServer) await viteServer.close();
    if (apiServer) {
      await new Promise((resolve) => apiServer.close(resolve));
    }
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
    removeState();
  } catch (error) {
    console.error('Failed to stop E2E server cleanly', error);
    process.exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
};

const start = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-secret-with-enough-length';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  process.env.CLIENT_ORIGIN = baseUrl;
  process.env.FARE_BASE = process.env.FARE_BASE || '10';
  process.env.FARE_PER_KM = process.env.FARE_PER_KM || '3';
  process.env.FARE_PER_MINUTE = process.env.FARE_PER_MINUTE || '1';
  process.env.COMMISSION_RATE = process.env.COMMISSION_RATE || '0.1';
  process.env.VITE_API_URL = apiUrl;

  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGO_URI);

  const seedState = await seedE2eData();
  const app = require('../../server/app');
  apiServer = await listen(app);

  const viteEntry = require.resolve('vite', { paths: [clientRoot] });
  const { createServer } = await import(pathToFileURL(viteEntry).href);
  viteServer = await createServer({
    root: clientRoot,
    configFile: path.join(clientRoot, 'vite.config.js'),
    mode: 'test',
    server: {
      host,
      port: clientPort,
      strictPort: true
    }
  });
  await viteServer.listen();

  writeState({
    apiUrl,
    baseUrl,
    mongoUri: process.env.MONGO_URI,
    ...seedState
  });

  console.log(`Taxify E2E server ready: ${baseUrl}`);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown(1);
});
process.on('unhandledRejection', (error) => {
  console.error(error);
  shutdown(1);
});

start().catch((error) => {
  console.error(error);
  shutdown(1);
});
