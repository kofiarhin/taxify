import { api } from "../lib/api";

export async function registerDriver(payload) {
  const response = await api.post("/drivers/register", payload);
  return response.data.data;
}

export async function getMyDriverProfile() {
  const response = await api.get("/drivers/me");
  return response.data.data.driver;
}

export async function getPendingDrivers() {
  const response = await api.get("/drivers/pending");
  return response.data.data.drivers;
}

export async function getDrivers() {
  const response = await api.get("/drivers");
  return response.data.data.drivers;
}

export async function approveDriver(id) {
  const response = await api.post(`/drivers/${id}/approve`);
  return response.data.data.driver;
}

export async function suspendDriver(id, reason = "") {
  const response = await api.post(`/drivers/${id}/suspend`, { reason });
  return response.data.data.driver;
}

export async function reactivateDriver(id) {
  const response = await api.post(`/drivers/${id}/reactivate`);
  return response.data.data.driver;
}

export async function deactivateDriver(id, reason = "") {
  const response = await api.post(`/drivers/${id}/deactivate`, { reason });
  return response.data.data.driver;
}
