import { api } from "../lib/api";

export async function createClientBooking(payload) {
  const response = await api.post("/client/bookings", payload);
  return response.data.data;
}

export async function getCurrentClientBooking() {
  const response = await api.get("/client/bookings/current");
  return response.data.data;
}

export async function confirmClientBookingComplete(bookingId) {
  const response = await api.post(`/client/bookings/${bookingId}/confirm-complete`);
  return response.data.data;
}
