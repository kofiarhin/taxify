import { api } from '../lib/api';

export const dashboardService = {
  adminSummary: () => api.get('/dashboard/admin').then((res) => res.data)
};
