import { api } from '../lib/api';

export const driverService = {
  list: () => api.get('/drivers').then((res) => res.data),
  me: () => api.get('/drivers/me').then((res) => res.data),
  updateOnboarding: (payload) => api.patch('/drivers/me/onboarding', payload).then((res) => res.data),
  updateAvailability: (payload) => api.patch('/drivers/me/availability', payload).then((res) => res.data),
  updateStatus: (driverId, payload) => api.patch(`/drivers/${driverId}/status`, payload).then((res) => res.data)
};
