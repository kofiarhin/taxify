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

const sortNewestFirstWhenPossible = (bookings) => {
  const hasCreatedAt = bookings.some((booking) => booking?.createdAt);
  if (!hasCreatedAt) return bookings;

  return [...bookings].sort((left, right) => {
    const parsedLeftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
    const parsedRightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
    const leftTime = Number.isNaN(parsedLeftTime) ? 0 : parsedLeftTime;
    const rightTime = Number.isNaN(parsedRightTime) ? 0 : parsedRightTime;
    return rightTime - leftTime;
  });
};

const updateBookingLists = (queryClient, updatedBooking) => {
  const updatedId = bookingIdFor(updatedBooking);
  if (!updatedId) return;

  queryClient.setQueriesData({ queryKey: queryKeys.bookings }, (data) => {
    if (!data?.bookings) return data;
    const existingIndex = data.bookings.findIndex((booking) => bookingIdFor(booking) === updatedId);
    const bookings =
      existingIndex >= 0
        ? data.bookings.map((booking, index) => (index === existingIndex ? updatedBooking : booking))
        : [updatedBooking, ...data.bookings];

    return {
      ...data,
      bookings: sortNewestFirstWhenPossible(bookings)
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
