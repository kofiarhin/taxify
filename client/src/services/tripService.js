import { api } from '../lib/api';

export const tripService = {
  accept: (bookingId) => api.post(`/trips/${bookingId}/accept`).then((res) => res.data),
  reject: (bookingId) => api.post(`/trips/${bookingId}/reject`).then((res) => res.data),
  start: (bookingId) => api.post(`/trips/${bookingId}/start`).then((res) => res.data),
  end: (bookingId, payload) => api.post(`/trips/${bookingId}/end`, payload).then((res) => res.data),
  clientArrived: (bookingId) => api.post(`/trips/${bookingId}/client-arrived`).then((res) => res.data),
  clientPaid: (bookingId) => api.post(`/trips/${bookingId}/client-paid`).then((res) => res.data),
  driverReceived: (bookingId) => api.post(`/trips/${bookingId}/driver-received`).then((res) => res.data)
};
