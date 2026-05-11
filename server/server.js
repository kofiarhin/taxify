const app = require('./app');
const connectDb = require('./config/db');
const env = require('./config/env');

connectDb()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Taxify API listening on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Taxify API', error);
    process.exit(1);
  });
