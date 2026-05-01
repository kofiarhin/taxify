import { api } from "../lib/api";

export async function getDashboardSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data.data;
}
