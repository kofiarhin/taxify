import { api } from "../lib/api";

export async function getBookings(params = {}) {
  const response = await api.get("/bookings", { params });
  return response.data.data;
}

export async function getBooking(id) {
  const response = await api.get(`/bookings/${id}`);
  return response.data.data.booking;
}

export async function createBooking(payload) {
  const response = await api.post("/bookings", payload);
  return response.data.data.booking;
}

export async function cancelBooking(id, reason = "") {
  const response = await api.post(`/bookings/${id}/cancel`, { reason });
  return response.data.data.booking;
}

export async function retryAssignment(id) {
  const response = await api.post(`/bookings/${id}/retry-assignment`);
  return response.data.data.booking;
}

export async function getQueue() {
  const response = await api.get("/bookings/queue");
  return response.data.data.bookings;
}
