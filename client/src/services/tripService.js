import { api } from "../lib/api";

export async function getMyAssignment() {
  const response = await api.get("/assignments/me");
  return response.data.data;
}

export async function acceptAssignment(attemptId) {
  const response = await api.post(`/assignments/${attemptId}/accept`);
  return response.data.data;
}

export async function rejectAssignment(attemptId, reason = "") {
  const response = await api.post(`/assignments/${attemptId}/reject`, { reason });
  return response.data.data;
}

export async function startTrip(bookingId) {
  const response = await api.post(`/trips/${bookingId}/start`);
  return response.data.data;
}

export async function endTrip(bookingId) {
  const response = await api.post(`/trips/${bookingId}/end`, {});
  return response.data.data;
}

export async function confirmPayment(bookingId) {
  const response = await api.post(`/trips/${bookingId}/confirm-payment`);
  return response.data.data;
}

export async function getMyTrips(params = {}) {
  const response = await api.get("/trips/mine", { params });
  return response.data.data;
}

export async function getAllTrips(params = {}) {
  const response = await api.get("/trips", { params });
  return response.data.data;
}
