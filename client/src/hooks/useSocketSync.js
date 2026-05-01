import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { getSocket } from "../lib/socket";
import { setSocketState } from "../redux/ui/uiSlice";

const EVENT_INVALIDATIONS = {
  "booking.created": [queryKeys.agentBookings, queryKeys.bookingsRoot, queryKeys.dashboardSummary],
  "booking.assigned": [queryKeys.agentBookings, queryKeys.bookingsRoot, queryKeys.queue, queryKeys.myAssignment, queryKeys.dashboardSummary],
  "booking.queued": [queryKeys.agentBookings, queryKeys.bookingsRoot, queryKeys.queue, queryKeys.dashboardSummary],
  "driver.accepted": [queryKeys.agentBookings, queryKeys.myAssignment, queryKeys.dashboardSummary],
  "driver.rejected": [queryKeys.agentBookings, queryKeys.queue, queryKeys.myAssignment, queryKeys.dashboardSummary],
  "trip.started": [queryKeys.myAssignment, queryKeys.driverTrips, queryKeys.tripsAll, queryKeys.dashboardSummary],
  "trip.ended": [queryKeys.myAssignment, queryKeys.driverTrips, queryKeys.tripsAll, queryKeys.dashboardSummary],
  "payment.confirmed": [
    queryKeys.myAssignment,
    queryKeys.driverTrips,
    queryKeys.driverCommissions,
    queryKeys.tripsAll,
    queryKeys.dashboardSummary,
  ],
  "commission.updated": [queryKeys.driverCommissions, queryKeys.commissionsAll, queryKeys.dashboardSummary],
};

export function useSocketSync() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const socket = getSocket();

    if (!token) {
      socket.disconnect();
      dispatch(setSocketState("offline"));
      return undefined;
    }

    function invalidate(eventName) {
      const keys = EVENT_INVALIDATIONS[eventName] ?? [];
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }

    const connectHandler = () => dispatch(setSocketState("connected"));
    const disconnectHandler = () => dispatch(setSocketState("disconnected"));
    const reconnectingHandler = () => dispatch(setSocketState("reconnecting"));

    socket.on("connect", connectHandler);
    socket.on("disconnect", disconnectHandler);
    socket.io.on("reconnect_attempt", reconnectingHandler);

    Object.keys(EVENT_INVALIDATIONS).forEach((eventName) => {
      socket.on(eventName, () => invalidate(eventName));
    });

    socket.connect();

    return () => {
      socket.off("connect", connectHandler);
      socket.off("disconnect", disconnectHandler);
      socket.io.off("reconnect_attempt", reconnectingHandler);
      Object.keys(EVENT_INVALIDATIONS).forEach((eventName) => {
        socket.off(eventName);
      });
    };
  }, [dispatch, queryClient, token]);
}
