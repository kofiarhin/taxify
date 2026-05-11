import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { useSocket } from '../realtime/socketContext';

export const BOOKING_REALTIME_EVENTS = [
  'booking:created',
  'booking:assigned',
  'booking:queued',
  'booking:accepted',
  'booking:rejected',
  'booking:reassigned',
  'booking:cancelled',
  'booking:disputed',
  'trip:started',
  'trip:ended',
  'payment:client_confirmed',
  'payment:driver_confirmed',
  'booking:completed'
];

const bookingIdFor = (booking) => booking?._id || booking?.id;

const updateBookingLists = (queryClient, updatedBooking) => {
  const updatedId = bookingIdFor(updatedBooking);
  if (!updatedId) return;

  queryClient.setQueriesData({ queryKey: queryKeys.bookings }, (data) => {
    if (!data?.bookings) return data;

    return {
      ...data,
      bookings: data.bookings.map((booking) => (bookingIdFor(booking) === updatedId ? updatedBooking : booking))
    };
  });
};

export const useRealtimeBookings = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return undefined;

    const handleBookingEvent = (payload) => {
      if (payload?.booking) {
        updateBookingLists(queryClient, payload.booking);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    };

    BOOKING_REALTIME_EVENTS.forEach((event) => socket.on(event, handleBookingEvent));

    return () => {
      BOOKING_REALTIME_EVENTS.forEach((event) => socket.off(event, handleBookingEvent));
    };
  }, [queryClient, socket]);
};
