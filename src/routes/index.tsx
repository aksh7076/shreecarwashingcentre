import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/foam-wash.jpg";
import interiorImg from "@/assets/interior.jpg";
import detailImg from "@/assets/foam-detail.jpg";

export const PHONE = "8698601101";
export const EMAIL = "pawankumarbobade49@gmail.com";

const SERVICES = [
  { name: "Foam Wash", desc: "Thick snow foam exterior wash, rinse and dry." },
  { name: "Interior Cleaning", desc: "Vacuum, dashboard, seats and mats deep clean." },
  { name: "Full Detailing", desc: "Foam wash + complete interior detailing." },
  { name: "Wax & Polish", desc: "Shine and protect your car's paint." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foam Car Wash & Interior Detailing — Book Your Car" },
      { name: "description", content: "Professional foam wash and interior cleaning at your location. Call 8698601101 or book online." },
      { property: "og:title", content: "Foam Car Wash & Interior Detailing" },
      { property: "og:description", content: "Book foam wash and interior cleaning at your location." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
        <span className="font-display text-2xl text-primary">FOAM WASH</span>
        <a href={`tel:${PHONE}`} className="text-sm font-semibold">📞 {PHONE}</a>
      </header>

      <section className="relative flex min-h-[90vh] items-end">
        <img src={heroImg} alt="Car covered in foam" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-16">
          <h1 className="font-display text-6xl leading-none md:text-8xl">Foam Wash.<br /><span className="text-primary">Showroom Shine.</span></h1>
          <p className="mt-4 max-w-md text-muted-foreground">Exterior foam wash and interior detailing — we come to your location.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-glow"><a href="#book">Book Your Car</a></Button>
            <Button asChild size="lg" variant="outline"><a href={`tel:${PHONE}`}>Call Now</a></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-5xl">Our Services</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-3xl text-primary">{s.name}</h3>
              <p className="mt-1 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-16 md:grid-cols-2">
        <figure className="overflow-hidden rounded-xl">
          <img src={detailImg} alt="Foam washing a car" loading="lazy" width={1200} height={912} className="h-full w-full object-cover" />
        </figure>
        <figure className="relative overflow-hidden rounded-xl">
          <img src={interiorImg} alt="Clean car interior" loading="lazy" width={1200} height={912} className="h-full w-full object-cover" />
          <figcaption className="absolute bottom-3 left-3 rounded bg-background/80 px-3 py-1 font-display text-xl">Interior Detailing</figcaption>
        </figure>
      </section>

      <BookingForm />

      <footer className="border-t px-5 py-10 text-center text-sm text-muted-foreground">
        <p>📞 <a href={`tel:${PHONE}`} className="text-foreground">{PHONE}</a> · ✉️ <a href={`mailto:${EMAIL}`} className="text-foreground">{EMAIL}</a></p>
        <p className="mt-3"><Link to="/admin" className="underline">Admin panel</Link></p>
      </footer>
    </main>
  );
}

function BookingForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus("sending");
    const { error } = await supabase.from("bookings").insert({
      name: String(f.get("name")).trim(),
      phone: String(f.get("phone")).trim(),
      car_model: String(f.get("car_model") || "").trim() || null,
      service: String(f.get("service")),
      location: String(f.get("location")).trim(),
      requirement: String(f.get("requirement") || "").trim() || null,
      preferred_date: (f.get("preferred_date") as string) || null,
    });
    setStatus(error ? "error" : "done");
    if (!error) e.currentTarget?.reset();
  }

  const field = "w-full rounded-lg border bg-input/40 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <section id="book" className="mx-auto max-w-2xl px-5 pb-20">
      <h2 className="font-display text-5xl">Book Your Car</h2>
      {status === "done" ? (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <p className="font-display text-3xl text-primary">Booking received!</p>
          <p className="mt-2 text-muted-foreground">We'll call you soon. Questions? Call {PHONE}.</p>
          <Button className="mt-4" variant="outline" onClick={() => setStatus("idle")}>Book another</Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <input name="name" required maxLength={100} placeholder="Your name" className={field} />
          <input name="phone" required type="tel" minLength={6} maxLength={20} placeholder="Mobile number" className={field} />
          <input name="car_model" maxLength={100} placeholder="Car model (e.g. Swift, Creta)" className={field} />
          <select name="service" required defaultValue="" className={field}>
            <option value="" disabled>Your service</option>
            {SERVICES.map((s) => <option key={s.name}>{s.name}</option>)}
          </select>
          <input name="location" required maxLength={300} placeholder="Customer location / address" className={field} />
          <textarea name="requirement" maxLength={1000} rows={3} placeholder="Customer requirement (anything specific?)" className={field} />
          <input name="preferred_date" type="date" className={field} />
          {status === "error" && <p className="text-destructive">Something went wrong. Please call {PHONE}.</p>}
          <Button type="submit" size="lg" disabled={status === "sending"} className="shadow-glow">
            {status === "sending" ? "Sending..." : "Confirm Booking"}
          </Button>
        </form>
      )}
    </section>
  );
}
