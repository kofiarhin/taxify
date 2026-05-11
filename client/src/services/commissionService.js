import { api } from '../lib/api';

export const commissionService = {
  list: (params) => api.get('/commissions', { params }).then((res) => res.data),
  submitReceipt: (commissionId, payload) => api.patch(`/commissions/${commissionId}/receipt`, payload).then((res) => res.data),
  reviewReceipt: (commissionId, payload) => api.patch(`/commissions/${commissionId}/review`, payload).then((res) => res.data)
};
