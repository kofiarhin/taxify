export const BOOKING_STATUS = {
  PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT',
  QUEUED: 'QUEUED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ACCEPTED: 'DRIVER_ACCEPTED',
  TRIP_IN_PROGRESS: 'TRIP_IN_PROGRESS',
  TRIP_AWAITING_ARRIVAL_ACK: 'TRIP_AWAITING_ARRIVAL_ACK',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED'
};

export const statusTone = {
  COMPLETED: 'bg-teal-50 text-teal-800 border-teal-200',
  ACTIVE: 'bg-teal-50 text-teal-800 border-teal-200',
  QUEUED: 'bg-amber-50 text-amber-800 border-amber-200',
  DRIVER_ASSIGNED: 'bg-sky-50 text-sky-800 border-sky-200',
  DRIVER_ACCEPTED: 'bg-sky-50 text-sky-800 border-sky-200',
  TRIP_IN_PROGRESS: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  TRIP_AWAITING_ARRIVAL_ACK: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  AWAITING_PAYMENT: 'bg-amber-50 text-amber-800 border-amber-200',
  PAID: 'bg-teal-50 text-teal-800 border-teal-200',
  DISPUTED: 'bg-rose-50 text-rose-800 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200'
};
