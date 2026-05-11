import { api } from '../lib/api';

export const bookingService = {
  list: (params) => api.get('/bookings', { params }).then((res) => res.data),
  create: (payload) => api.post('/bookings', payload).then((res) => res.data),
  retry: (bookingId) => api.post(`/bookings/${bookingId}/retry-assignment`).then((res) => res.data),
  reassign: (bookingId) => api.post(`/bookings/${bookingId}/reassign`).then((res) => res.data),
  complete: (bookingId) => api.post(`/bookings/${bookingId}/complete`).then((res) => res.data),
  cancel: (bookingId) => api.post(`/bookings/${bookingId}/cancel`).then((res) => res.data),
  dispute: (bookingId) => api.post(`/bookings/${bookingId}/dispute`).then((res) => res.data)
};
