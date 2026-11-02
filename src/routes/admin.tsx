import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  component: Admin,
});

type Booking = {
  id: string; name: string; phone: string; car_model: string | null; service: string;
  location: string; requirement: string | null; preferred_date: string | null; status: string; created_at: string;
};

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!session) return <Shell><Login /></Shell>;
  return <Shell><Dashboard userId={session.user.id} /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
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
    const email = String(f.get("email")); const password = String(f.get("password"));
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
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
      <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "First time? Create account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

function Dashboard({ userId }: { userId: string }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Booking[]>([]);

  async function load() {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    setRows((data as Booking[]) ?? []);
  }

  useEffect(() => {
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); if (data) load(); });
  }, [userId]);

  async function setStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this booking?")) return;
    await supabase.from("bookings").delete().eq("id", id); load();
  }

  const signOut = <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>;

  if (isAdmin === null) return <p className="text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <div className="space-y-4"><p>This account is not an admin.</p>{signOut}</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-4xl">Bookings ({rows.length})</h1>
        {signOut}
      </div>
      {rows.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
      <div className="grid gap-4">
        {rows.map((b) => (
          <div key={b.id} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-2xl">{b.name} · <span className="text-primary">{b.service}</span></p>
                <a href={`tel:${b.phone}`} className="text-sm underline">{b.phone}</a>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{b.status}</span>
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
    </div>
  );
}
