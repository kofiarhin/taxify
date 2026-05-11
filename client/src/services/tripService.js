import { api } from '../lib/api';

export const tripService = {
  accept: (bookingId) => api.post(`/trips/${bookingId}/accept`).then((res) => res.data),
  reject: (bookingId) => api.post(`/trips/${bookingId}/reject`).then((res) => res.data),
  start: (bookingId) => api.post(`/trips/${bookingId}/start`).then((res) => res.data),
  end: (bookingId, payload) => api.post(`/trips/${bookingId}/end`, payload).then((res) => res.data),
  clientConfirm: (bookingId) => api.post(`/trips/${bookingId}/client-confirm`).then((res) => res.data),
  paymentConfirm: (bookingId) => api.post(`/trips/${bookingId}/payment-confirm`).then((res) => res.data)
};
