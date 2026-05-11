const { expect } = require('@playwright/test');
const { connectIfNeeded, seedE2eData } = require('./e2eSeed');
const { readState } = require('./e2eState');

const rolePaths = {
  admin: '/admin',
  agent: '/agent',
  client: '/client',
  driver: '/driver'
};

const getE2eState = () => readState();

const resetE2eData = async () => {
  const state = getE2eState();
  process.env.NODE_ENV = 'test';
  await connectIfNeeded(state.mongoUri);
  const seeded = await seedE2eData();
  return { ...state, ...seeded };
};

const loginAs = async (page, role) => {
  const state = getE2eState();
  const credentials = state.credentials[role];

  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(new RegExp(`${rolePaths[role]}(?:$|/)`));
};

module.exports = { getE2eState, loginAs, resetE2eData };
