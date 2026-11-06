import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ALL_STATUS,
  BOOKING_STATUSES,
  countByStatus,
  filterBookings,
  type Booking,
} from "@/lib/booking-filters";

type Search = { status: string; q: string };

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Foam Car Wash" },
      { name: "description", content: "Manage car wash bookings." },
      { property: "og:title", content: "Admin Panel — Foam Car Wash" },
      { property: "og:description", content: "Manage car wash bookings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search): Search => ({
    status: typeof search["status"] === "string" && search["status"] ? search["status"] : ALL_STATUS,
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  component: Admin,
});

const STATUS_STYLE: Record<string, string> = {
  new: "border-primary/40 bg-primary/15 text-primary",
  confirmed: "border-accent/40 bg-accent/15 text-accent",
  completed: "border-chart-2/40 bg-chart-2/15 text-chart-2",
};

function statusBadge(status: string) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        STATUS_STYLE[status] ?? "border-border bg-secondary text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!session) return <Shell><Login /></Shell>;
  return <Shell><Dashboard userId={session.user.id} /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-primary">FOAM WASH · ADMIN</Link>
        </div>
        {children}
      </div>
    </main>
  );
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const field = "w-full rounded-lg border bg-input/40 px-4 py-3";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setMsg(error ? error.message : "Check your email to confirm your account, then sign in.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-sm gap-4">
      <h1 className="font-display text-4xl">{mode === "in" ? "Admin Sign In" : "Create Admin Account"}</h1>
      <input name="email" type="email" required placeholder="Email" className={field} />
      <input name="password" type="password" required minLength={6} placeholder="Password" className={field} />
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <Button type="submit">{mode === "in" ? "Sign in" : "Sign up"}</Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "First time? Create account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

function SiteToggle() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.from("site_settings").select("is_open").eq("id", 1).maybeSingle()
      .then(({ data }) => setOpen(data?.is_open ?? true));
  }, []);
  async function toggle() {
    const next = !open;
    const { error } = await supabase.from("site_settings").update({ is_open: next, updated_at: new Date().toISOString() }).eq("id", 1);
    if (!error) setOpen(next);
  }
  if (open === null) return null;
  return (
    <Button size="sm" variant={open ? "default" : "destructive"} onClick={toggle}>
      Website: {open ? "ON" : "OFF"}
    </Button>
  );
}

function Dashboard({ userId }: { userId: string }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  const { status, q } = Route.useSearch();
  const navigate = useNavigate();

  function setParam(patch: Partial<Search>) {
    const next: Search = { status: patch.status ?? status, q: patch.q ?? q };
    navigate({ to: "/admin", search: next, replace: true });
  }

  async function load() {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    setRows((data as Booking[]) ?? []);
  }

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        if (data) load();
      });
  }, [userId]);

  async function setStatus(id: string, next: string) {
    await supabase.from("bookings").update({ status: next }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this booking?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    load();
  }

  const signOut = (
    <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
  );

  if (isAdmin === null) return <p className="text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <div className="space-y-4"><p>This account is not an admin.</p>{signOut}</div>;

  const counts = countByStatus(rows);
  const visible = filterBookings(rows, { status, q });
  const filtering = status !== ALL_STATUS || q.trim() !== "";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Bookings ({rows.length})</h1>
        <div className="flex items-center gap-2">
          <SiteToggle />
          {signOut}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[ALL_STATUS, ...BOOKING_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setParam({ status: s })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
              status === s
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s === ALL_STATUS ? "All" : s}
            <span className="ml-1.5 text-xs opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setParam({ q: e.target.value })}
          placeholder="Search name, phone, car, location…"
          className="ml-auto w-full max-w-xs rounded-lg border bg-input/40 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border bg-card px-5 py-8 text-center text-muted-foreground">
          {filtering ? "No bookings match this filter or search." : "No bookings yet."}
        </p>
      ) : (
        <>
          {/* Desktop: spreadsheet-style table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-secondary/60 text-left font-display text-base uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3 font-normal">#</th>
                  <th className="px-3 py-3 font-normal">Received</th>
                  <th className="px-3 py-3 font-normal">Customer</th>
                  <th className="px-3 py-3 font-normal">Phone</th>
                  <th className="px-3 py-3 font-normal">Car</th>
                  <th className="px-3 py-3 font-normal">Service</th>
                  <th className="px-3 py-3 font-normal">Location</th>
                  <th className="px-3 py-3 font-normal">Requirement</th>
                  <th className="px-3 py-3 font-normal">Preferred date</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-3 py-3 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b, i) => (
                  <tr key={b.id} className="border-b align-top last:border-0 hover:bg-secondary/40">
                    <td className="px-3 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-semibold">{b.name}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <a href={`tel:${b.phone}`} className="underline">{b.phone}</a>
                    </td>
                    <td className="px-3 py-3">{b.car_model || "—"}</td>
                    <td className="px-3 py-3 text-primary">{b.service}</td>
                    <td className="max-w-[220px] px-3 py-3" title={b.location}>{b.location}</td>
                    <td className="max-w-[220px] px-3 py-3 text-muted-foreground" title={b.requirement ?? ""}>
                      {b.requirement || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{b.preferred_date || "—"}</td>
                    <td className="px-3 py-3">{statusBadge(b.status)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "confirmed")}>Confirm</Button>
                        <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "completed")}>Completed</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="grid gap-4 md:hidden">
            {visible.map((b) => (
              <div key={b.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-2xl">{b.name} · <span className="text-primary">{b.service}</span></p>
                    <a href={`tel:${b.phone}`} className="text-sm underline">{b.phone}</a>
                  </div>
                  {statusBadge(b.status)}
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {b.car_model && <div><b className="text-foreground">Car:</b> {b.car_model}</div>}
                  <div><b className="text-foreground">Location:</b> {b.location}</div>
                  {b.requirement && <div><b className="text-foreground">Requirement:</b> {b.requirement}</div>}
                  {b.preferred_date && <div><b className="text-foreground">Date:</b> {b.preferred_date}</div>}
                  <div>Received {new Date(b.created_at).toLocaleString()}</div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "confirmed")}>Confirm</Button>
                  <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "completed")}>Completed</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
