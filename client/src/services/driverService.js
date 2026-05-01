import { api } from "../lib/api";

export async function registerDriver(payload) {
  const response = await api.post("/drivers/register", payload);
  return response.data.data;
}
