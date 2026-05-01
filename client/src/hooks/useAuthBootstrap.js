import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  authCheckFinished,
  authFailed,
  authResolved,
} from "../redux/auth/authSlice";
import { getCurrentUser } from "../services/authService";

export function useAuthBootstrap() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      if (!token) {
        dispatch(authCheckFinished());
        return;
      }

      try {
        const user = await getCurrentUser();

        if (isMounted) {
          dispatch(authResolved({ user }));
        }
      } catch {
        window.localStorage.removeItem("taxify_token");

        if (isMounted) {
          dispatch(authFailed("Session expired"));
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, token]);
}
