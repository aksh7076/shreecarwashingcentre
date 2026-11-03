import { describe, expect, it } from "vitest";

import {
  ALL_STATUS,
  countByStatus,
  filterBookings,
  type Booking,
} from "@/lib/booking-filters";

function booking(over: Partial<Booking> = {}): Booking {
  return {
    id: "id-1",
    name: "Akash Manchalwar",
    phone: "09699962260",
    car_model: "Maruti Swift",
    service: "Foam Wash",
    location: "Panyachi taki majara (re) chandrapur Maharashtra",
    requirement: "Please come tomorrow morning",
    preferred_date: "2026-11-04",
    status: "new",
    created_at: "2026-11-03T14:26:17.000Z",
    ...over,
  };
}

const rows = [
  booking(),
  booking({
    id: "id-2",
    name: "Pawan Bobade",
    phone: "8698601101",
    service: "Interior Cleaning",
    status: "confirmed",
  }),
  booking({
    id: "id-3",
    name: "Ravi Kumar",
    phone: "9876543210",
    service: "Full Detailing",
    status: "completed",
  }),
];

describe("filterBookings", () => {
  it("returns every booking for the all filter", () => {
    expect(filterBookings(rows, { status: ALL_STATUS, q: "" })).toHaveLength(3);
  });

  it("keeps only the booking whose status matches the filter", () => {
    const confirmed = filterBookings(rows, { status: "confirmed", q: "" });
    expect(confirmed.map((b) => b.id)).toEqual(["id-2"]);
    expect(confirmed[0]?.status).toBe("confirmed");
  });

  it("finds a booking by customer name", () => {
    expect(filterBookings(rows, { status: ALL_STATUS, q: "ravi" }).map((b) => b.id)).toEqual(["id-3"]);
  });

  it("finds a booking by phone even when the stored number has a leading zero", () => {
    expect(filterBookings(rows, { status: ALL_STATUS, q: "9699962260" }).map((b) => b.id)).toEqual(["id-1"]);
  });

  it("combines the status filter with the search text", () => {
    expect(filterBookings(rows, { status: "new", q: "ravi" })).toEqual([]);
    expect(filterBookings(rows, { status: "new", q: "akash" }).map((b) => b.id)).toEqual(["id-1"]);
  });

  it("ignores search text that matches nothing", () => {
    expect(filterBookings(rows, { status: ALL_STATUS, q: "zzz-nothing" })).toEqual([]);
  });
});

describe("countByStatus", () => {
  it("counts every booking under all plus one per status", () => {
    expect(countByStatus(rows)).toEqual({ all: 3, new: 1, confirmed: 1, completed: 1 });
  });

  it("reports zero for a status with no bookings", () => {
    expect(countByStatus([booking()])).toEqual({ all: 1, new: 1, confirmed: 0, completed: 0 });
  });
});
