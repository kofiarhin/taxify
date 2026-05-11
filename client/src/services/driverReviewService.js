import { api } from '../lib/api';

export const driverReviewService = {
  create: (bookingId, payload) => api.post(`/reviews/bookings/${bookingId}`, payload).then((res) => res.data),
  listForDriver: (driverId) => api.get(`/reviews/drivers/${driverId}`).then((res) => res.data)
};
