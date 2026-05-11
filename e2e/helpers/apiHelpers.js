const { expect } = require('@playwright/test');
const { getE2eState } = require('./testHelpers');

const apiLogin = async (request, role) => {
  const state = getE2eState();
  const response = await request.post(`${state.apiUrl}/auth/login`, {
    data: state.credentials[role]
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.token;
};

const postAsRole = async (request, role, path, data) => {
  const state = getE2eState();
  const token = await apiLogin(request, role);
  const response = await request.post(`${state.apiUrl}${path}`, {
    data,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
};

module.exports = { apiLogin, postAsRole };
