import { api } from "../lib/api";

export async function getComplaints(params = {}) {
  const response = await api.get("/complaints", { params });
  return response.data.data;
}

export async function getComplaint(id) {
  const response = await api.get(`/complaints/${id}`);
  return response.data.data.complaint;
}

export async function createComplaint(payload) {
  const response = await api.post("/complaints", payload);
  return response.data.data.complaint;
}

export async function updateComplaint(id, payload) {
  const response = await api.patch(`/complaints/${id}`, payload);
  return response.data.data.complaint;
}

export async function resolveComplaint(id, resolutionNotes) {
  const response = await api.post(`/complaints/${id}/resolve`, { resolutionNotes });
  return response.data.data.complaint;
}
