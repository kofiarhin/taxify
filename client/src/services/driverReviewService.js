import { api } from "../lib/api";

export async function submitDriverReview({ bookingId, rating, comment }) {
  const response = await api.post(`/client/bookings/${bookingId}/review`, {
    rating,
    comment,
  });
  return response.data.data;
}
