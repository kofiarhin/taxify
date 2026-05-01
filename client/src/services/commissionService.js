import { api } from "../lib/api";

export async function getAllCommissions(params = {}) {
  const response = await api.get("/commissions", { params });
  return response.data.data;
}

export async function getMyCommissions(params = {}) {
  const response = await api.get("/commissions/mine", { params });
  return response.data.data;
}

export async function getCommission(id) {
  const response = await api.get(`/commissions/${id}`);
  return response.data.data.statement;
}

export async function submitReceipt(id, file) {
  const formData = new FormData();
  formData.append("receipt", file);
  const response = await api.post(`/commissions/${id}/submit-receipt`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data.statement;
}

export async function approveCommission(id, notes = "") {
  const response = await api.post(`/commissions/${id}/approve`, { notes });
  return response.data.data.statement;
}

export async function rejectCommission(id, notes = "") {
  const response = await api.post(`/commissions/${id}/reject`, { notes });
  return response.data.data.statement;
}
