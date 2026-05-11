import { api } from '../lib/api';

export const complaintService = {
  list: (params) => api.get('/complaints', { params }).then((res) => res.data),
  create: (payload) => api.post('/complaints', payload).then((res) => res.data),
  update: (complaintId, payload) => api.patch(`/complaints/${complaintId}`, payload).then((res) => res.data)
};
