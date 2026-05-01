import { useQuery } from "@tanstack/react-query";
import { AppShell } from "../../components/shared/AppShell";
import { api } from "../../lib/api";

async function getUsers() {
  const response = await api.get("/users");
  return response.data.data.users;
}

export function AdminUsersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  return (
    <AppShell
      eyebrow="Admin workspace"
      title="Shape the team."
      summary="This page is wired to the admin user list endpoint. It provides loading, error, and empty states now so the later user-management forms can drop into an already stable surface."
    >
      {isLoading ? (
        <div className="grid gap-4">
          <div className="h-16 animate-pulse rounded-[1.6rem] bg-white/6" />
          <div className="h-16 animate-pulse rounded-[1.6rem] bg-white/6" />
          <div className="h-16 animate-pulse rounded-[1.6rem] bg-white/6" />
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
          Unable to load users. Confirm the seeded admin account and API environment are available.
        </div>
      ) : null}

      {!isLoading && !isError && (!data || data.length === 0) ? (
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
          <p className="text-sm text-zinc-400">No staff users found yet. Create the first dispatch desk account from the API.</p>
        </div>
      ) : null}

      {!isLoading && !isError && data?.length ? (
        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03]">
          {data.map((user) => (
            <div
              key={user._id}
              className="grid gap-2 border-b border-white/8 px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_140px] md:items-center"
            >
              <div>
                <p className="text-base text-white">{user.fullName}</p>
                <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
              </div>
              <p className="text-sm text-zinc-400">{user.phone}</p>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/70">{user.role}</p>
            </div>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
