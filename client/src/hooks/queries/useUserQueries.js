import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../../services/userService";
import { queryKeys } from "../queryKeys";

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
  });
}
