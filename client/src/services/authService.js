import { api } from "../lib/api";

const INVALID_LOGIN_RESPONSE = "Invalid login response from server";

function normalizeAuthResponse(responseBody) {
  const authData = responseBody?.data ?? responseBody;
  const token = authData?.token;
  const user = authData?.user;

  if (!token || !user) {
    throw new Error(INVALID_LOGIN_RESPONSE);
  }

  return { token, user };
}

export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);
  return normalizeAuthResponse(response.data);
}

export async function registerClient(payload) {
  const response = await api.post("/auth/register-client", payload);
  return normalizeAuthResponse(response.data);
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.data.user;
}

export { normalizeAuthResponse };
