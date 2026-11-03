// Pure filtering helpers for the admin bookings list. Kept out of the route so the
// status-filter and search rules can be tested without rendering the page.

export type Booking = {
  id: string;
  name: string;
  phone: string;
  car_model: string | null;
  service: string;
  location: string;
  requirement: string | null;
  preferred_date: string | null;
  status: string;
  created_at: string;
};

export const BOOKING_STATUSES = ["new", "confirmed", "completed"] as const;
export const ALL_STATUS = "all";

export function filterBookings(
  rows: Booking[],
  opts: { status: string; q: string },
): Booking[] {
  const status = opts.status.trim().toLowerCase();
  const q = opts.q.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");

  return rows.filter((r) => {
    if (status && status !== ALL_STATUS && r.status !== status) return false;
    if (!q) return true;

    const haystack = [
      r.name,
      r.phone,
      r.car_model ?? "",
      r.service,
      r.location,
      r.requirement ?? "",
      r.preferred_date ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) return true;

    // "96999..." should still find a phone stored as "096999..."
    if (qDigits.length >= 3 && r.phone.replace(/\D/g, "").includes(qDigits)) return true;

    return false;
  });
}

export function countByStatus(rows: Booking[]): Record<string, number> {
  const counts: Record<string, number> = { [ALL_STATUS]: rows.length };
  for (const s of BOOKING_STATUSES) counts[s] = 0;
  for (const r of rows) {
    if (r.status in counts) counts[r.status] += 1;
  }
  return counts;
}
