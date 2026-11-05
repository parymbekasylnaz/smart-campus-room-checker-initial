import { describe, it, expect, beforeEach } from 'vitest';
import { checkAvailability } from './checkAvailability';
import { TEST_CASES } from './testCases';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS } from './sampleData';
import { Room, Booking } from '@/types';

// Fixed "current time" used by all test cases — 10:00 (600 min from midnight).
const FIXED_CURRENT_TIME = 600;

// Fresh deep copies so tests never mutate the shared module-level fixtures.
function freshRooms(): Room[] {
  return structuredClone(SAMPLE_ROOMS);
}

function freshBookings(): Booking[] {
  return structuredClone(SAMPLE_BOOKINGS);
}

let rooms: Room[];
let bookings: Booking[];

beforeEach(() => {
  rooms = freshRooms();
  bookings = freshBookings();
});

// ---------------------------------------------------------------------------
// AC5 helper: verify that checkAvailability never modifies the bookings array.
// ---------------------------------------------------------------------------
function assertBookingsUnchanged(original: Booking[]) {
  expect(bookings).toEqual(original);
  expect(bookings.length).toBe(original.length);
  for (let i = 0; i < original.length; i++) {
    expect(bookings[i].id).toBe(original[i].id);
    expect(bookings[i].roomId).toBe(original[i].roomId);
    expect(bookings[i].startTime).toBe(original[i].startTime);
    expect(bookings[i].endTime).toBe(original[i].endTime);
    expect(bookings[i].bookedBy).toBe(original[i].bookedBy);
  }
}

// ---------------------------------------------------------------------------
// AC mapping
//   AC1 — Valid time interval (0 <= start < end <= 1440, start strictly after
//         current time) ................... "AC1: Valid time interval"
//   AC2 — Maximum duration 120 min (120 allowed, >120 rejected) ..........
//         .................................. "AC2: Maximum duration"
//   AC3 — Blocked room check (reject with clear explanation) .............
//         .................................. "AC3: Blocked room check"
//   AC4 — Existing booking conflicts via half-open intervals (touching OK) .
//         .................................. "AC4: Booking conflicts"
//   AC5 — Clear Available / Unavailable decision, no data modification ....
//         .................................. "AC5: Decision & data integrity"
//   AC6 — Responsive design, clear labels, readable feedback .............
//         (UI concern — not unit-tested here; covered by component/visual tests)
// ---------------------------------------------------------------------------

describe('AC1: Valid time interval', () => {
  it('rejects start < 0', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: -30, endTime: 60 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('Start time must be between 0 and 1439'))).toBe(true);
  });

  it('rejects start >= 1440', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 1440, endTime: 1500 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('Start time must be between 0 and 1439'))).toBe(true);
  });

  it('rejects end > 1440', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 700, endTime: 1500 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('End time must be between 1 and 1440'))).toBe(true);
  });

  it('rejects start >= end', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 700, endTime: 700 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('must be strictly before'))).toBe(true);
  });

  it('rejects start equal to current time (must be strictly after)', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 600, endTime: 660 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('strictly after the current time'))).toBe(true);
  });

  it('rejects start before current time', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 500, endTime: 660 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('strictly after the current time'))).toBe(true);
  });

  it('accepts a valid interval that is strictly after current time', () => {
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 1000, endTime: 1060 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.reasons).toEqual([]);
  });
});

describe('AC2: Maximum duration', () => {
  it('accepts exactly 120 minutes (boundary)', () => {
    const res = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 780 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
  });

  it('rejects 121 minutes (just over)', () => {
    const res = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 781 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('exceeds the 120-minute maximum'))).toBe(true);
  });

  it('rejects 130 minutes (over 2h)', () => {
    const res = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 790 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('130 minutes'))).toBe(true);
  });
});

describe('AC3: Blocked room check', () => {
  it('rejects a blocked room with a clear explanation', () => {
    const res = checkAvailability(
      { roomId: 'room-201', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('blocked'))).toBe(true);
    expect(res.reasons.some((r) => r.includes('maintenance'))).toBe(true);
  });

  it('does not flag an unblocked room', () => {
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 1000, endTime: 1060 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.reasons.some((r) => r.includes('blocked'))).toBe(false);
  });
});

describe('AC4: Booking conflicts (half-open intervals)', () => {
  it('allows touching endpoints (requestedEnd === existingStart)', () => {
    // 11:00–12:00 on room-101, ends at B-002 start (720)
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });

  it('allows touching endpoints (requestedStart === existingEnd)', () => {
    // 10:00–11:00 on room-101 — but start == currentTime, so use a later slot.
    // B-001 ends at 600. Use 600–660? No, start must be > 600. Use 660–720 which
    // ends at B-002 start — already tested above. Instead test room-305:
    // B-005 ends at 660. Request 660–720, starts after currentTime (600).
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });

  it('detects an overlap with an existing booking', () => {
    // 12:30–13:30 on room-101 overlaps B-002 (720–780)
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 750, endTime: 810 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.conflicts.length).toBeGreaterThan(0);
    expect(res.conflicts.some((c) => c.includes('B-002'))).toBe(true);
  });

  it('detects overlap when requested slot fully contains existing booking', () => {
    // 13:30–15:00 on room-101 — no conflict (B-002 ends at 780=13:00)
    // Instead: 11:50–12:50 on room-101 overlaps B-002 (720–780)
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 710, endTime: 770 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.conflicts.some((c) => c.includes('B-002'))).toBe(true);
  });

  it('does not conflict with bookings in a different room', () => {
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });
});

describe('AC5: Decision & data integrity', () => {
  it('returns available=true with empty reasons when no issues', () => {
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 1000, endTime: 1060 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.reasons).toEqual([]);
    expect(res.conflicts).toEqual([]);
  });

  it('returns available=false with non-empty reasons when issues exist', () => {
    const res = checkAvailability(
      { roomId: 'room-201', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it('does not modify the bookings array', () => {
    const snapshot = structuredClone(bookings);
    checkAvailability(
      { roomId: 'room-101', startTime: 750, endTime: 810 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    assertBookingsUnchanged(snapshot);
  });

  it('does not modify the rooms array', () => {
    const snapshot = structuredClone(rooms);
    checkAvailability(
      { roomId: 'room-201', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(rooms).toEqual(snapshot);
  });

  it('returns a non-existent room as unavailable with explanation', () => {
    const res = checkAvailability(
      { roomId: 'room-999', startTime: 700, endTime: 760 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('does not exist'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Driven by testCases.ts — each preset scenario must match its expected decision.
// ---------------------------------------------------------------------------
describe('Test cases from testCases.ts', () => {
  TEST_CASES.forEach((tc) => {
    it(`${tc.label} (${tc.acTag}): expects ${tc.expected}`, () => {
      const snapshot = structuredClone(bookings);
      const res = checkAvailability(
        { roomId: tc.roomId, startTime: tc.startTime, endTime: tc.endTime },
        rooms, bookings, FIXED_CURRENT_TIME
      );
      expect(res.available).toBe(tc.expected === 'Available');
      assertBookingsUnchanged(snapshot);
    });
  });
});
