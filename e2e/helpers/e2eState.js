const fs = require('fs');
const path = require('path');

const stateDir = path.join(__dirname, '..', '.state');
const statePath = path.join(stateDir, 'e2e-state.json');

const writeState = (state) => {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
};

const readState = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));

const removeState = () => {
  fs.rmSync(stateDir, { recursive: true, force: true });
};

module.exports = { readState, removeState, statePath, writeState };
