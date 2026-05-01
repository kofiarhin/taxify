import { api } from "../lib/api";

export async function getUsers(params = {}) {
  const response = await api.get("/users", { params });
  return response.data.data.users;
}
