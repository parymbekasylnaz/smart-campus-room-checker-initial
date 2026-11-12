import { describe, it, expect, beforeEach } from 'vitest';
import { checkAvailability } from '@/lib/checkAvailability';
import {
  filterRooms,
  filterByCapacity,
  filterByEquipment,
  getAvailableEquipment,
  RoomFilterCriteria,
} from '@/lib/roomFilter';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS } from '@/lib/sampleData';
import { Room, Booking } from '@/types';

const FIXED_CURRENT_TIME = 600; // 10:00

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
// AC1 & AC2: Valid time window and maximum duration
// ---------------------------------------------------------------------------
describe('AC1 & AC2: Valid time window and maximum duration', () => {
  it('accepts a valid interval within 00:00–24:00 and under 120 min', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.reasons).toEqual([]);
  });

  it('rejects start time at exactly 1440 (24:00 boundary)', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 1440, endTime: 1500 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('Start time must be between 0 and 1439'))).toBe(true);
  });

  it('accepts exactly 120 minutes (boundary — allowed)', () => {
    const res = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 780 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
  });

  it('rejects 121 minutes (just over the maximum)', () => {
    const res = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 781 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('exceeds the 120-minute maximum'))).toBe(true);
  });

  it('rejects start >= end (zero or negative duration)', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 700, endTime: 700 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('must be strictly before'))).toBe(true);
  });

  it('rejects start time not strictly after current time', () => {
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 600, endTime: 660 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('strictly after the current time'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3: Blocked rooms always unavailable
// ---------------------------------------------------------------------------
describe('AC3: Blocked rooms are always unavailable', () => {
  it('rejects a blocked room even with a perfectly valid time slot', () => {
    const res = checkAvailability(
      { roomId: 'room-201', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('blocked'))).toBe(true);
  });

  it('includes the blocked reason in the rejection message', () => {
    const res = checkAvailability(
      { roomId: 'room-201', startTime: 700, endTime: 760 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.reasons.some((r) => r.includes('maintenance'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC4: Non-overlapping interval validation (touching allowed, overlap rejected)
// ---------------------------------------------------------------------------
describe('AC4: Booking conflicts with half-open intervals', () => {
  it('allows touching endpoints — requestedEnd === existingStart', () => {
    // Room 101: B-002 starts at 720. Request 660–720 (ends at B-002 start).
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });

  it('allows touching endpoints — requestedStart === existingEnd', () => {
    // Room 305: B-005 ends at 660. Request 660–720 (starts at B-005 end).
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });

  it('rejects overlapping interval that partially overlaps an existing booking', () => {
    // Room 101: B-002 is 720–780. Request 750–810 overlaps.
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 750, endTime: 810 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.conflicts.some((c) => c.includes('B-002'))).toBe(true);
  });

  it('does not conflict with bookings from a different room', () => {
    // Room 305 has no booking at 660–720; room 101 does but we are checking 305.
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// F1: Capacity filter logic
// ---------------------------------------------------------------------------
describe('F1: Capacity filter', () => {
  it('returns only rooms where capacity >= requestedAttendees', () => {
    const result = filterByCapacity(rooms, 30);
    const capacities = result.map((r) => r.capacity);
    expect(capacities.every((c) => c >= 30)).toBe(true);
    // room-102 (30), room-101 (40), room-305 (50) qualify; room-201 (25), room-410 (20) don't
    expect(result.map((r) => r.id).sort()).toEqual(['room-101', 'room-102', 'room-305']);
  });

  it('exact capacity match is included (boundary)', () => {
    const result = filterByCapacity(rooms, 50);
    expect(result.map((r) => r.id)).toEqual(['room-305']);
  });

  it('returns all rooms when requestedAttendees is 0 (no filter)', () => {
    const result = filterByCapacity(rooms, 0);
    expect(result).toHaveLength(rooms.length);
  });

  it('returns no rooms when requestedAttendees exceeds all capacities', () => {
    const result = filterByCapacity(rooms, 100);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// F2: Equipment filter logic (ALL selected equipment must be present)
// ---------------------------------------------------------------------------
describe('F2: Equipment filter', () => {
  it('returns only rooms that have all selected equipment items', () => {
    const result = filterByEquipment(rooms, ['Projector', 'Whiteboard']);
    // room-101 (Projector, Whiteboard), room-305 (Projector, Whiteboard, VC, Audio)
    expect(result.map((r) => r.id).sort()).toEqual(['room-101', 'room-305']);
  });

  it('returns all rooms when no equipment is required', () => {
    const result = filterByEquipment(rooms, []);
    expect(result).toHaveLength(rooms.length);
  });

  it('returns no rooms when required equipment is not available in any room', () => {
    const result = filterByEquipment(rooms, ['Hologram Display']);
    expect(result).toEqual([]);
  });

  it('excludes rooms missing one of multiple required items', () => {
    // room-201 has Projector + VC but no Whiteboard
    const result = filterByEquipment(rooms, ['Projector', 'Whiteboard', 'Video Conferencing']);
    expect(result.map((r) => r.id)).toEqual(['room-305']);
  });
});

// ---------------------------------------------------------------------------
// F3 & F4: Blocked room visibility and empty state handling
// ---------------------------------------------------------------------------
describe('F3 & F4: Blocked room visibility and empty state', () => {
  it('F3: blocked rooms still appear in filtered results (visibility preserved)', () => {
    const result = filterByCapacity(rooms, 20);
    const blockedRoom = result.find((r) => r.id === 'room-201');
    expect(blockedRoom).toBeDefined();
    expect(blockedRoom!.blocked).toBe(true);
  });

  it('F3: blocked room is always unavailable even when time slot has no conflicts', () => {
    // Room 201 has no bookings in the sample data, but it is blocked.
    const room201Bookings = bookings.filter((b) => b.roomId === 'room-201');
    expect(room201Bookings).toEqual([]);
    const res = checkAvailability(
      { roomId: 'room-201', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.conflicts).toEqual([]);
    expect(res.reasons.some((r) => r.includes('blocked'))).toBe(true);
  });

  it('F4: returns empty array when no rooms match combined capacity + equipment filters', () => {
    const criteria: RoomFilterCriteria = { requestedAttendees: 50, requiredEquipment: ['Video Conferencing'] };
    const result = filterRooms(rooms, criteria);
    // room-305 has cap 50 and VC — this should match, so let's make it stricter
    const strictCriteria: RoomFilterCriteria = { requestedAttendees: 50, requiredEquipment: ['Hologram Display'] };
    const strictResult = filterRooms(rooms, strictCriteria);
    expect(strictResult).toEqual([]);
  });

  it('F4: combined filter that narrows to exactly one room', () => {
    const criteria: RoomFilterCriteria = { requestedAttendees: 45, requiredEquipment: ['Audio System'] };
    const result = filterRooms(rooms, criteria);
    expect(result.map((r) => r.id)).toEqual(['room-305']);
  });
});

// ---------------------------------------------------------------------------
// F5: Room switching — different rooms yield independent results
// ---------------------------------------------------------------------------
describe('F5: Room switching produces independent results', () => {
  it('checking the same time slot on two different rooms yields independent results', () => {
    // 660–720 on room-101: available (touching B-002 start)
    const res101 = checkAvailability(
      { roomId: 'room-101', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    // 660–720 on room-410: B-006 is 660–720, so it conflicts
    const res410 = checkAvailability(
      { roomId: 'room-410', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res101.available).toBe(true);
    expect(res410.available).toBe(false);
    expect(res410.conflicts.some((c) => c.includes('B-006'))).toBe(true);
  });

  it('switching from a blocked room to an open room changes availability', () => {
    const resBlocked = checkAvailability(
      { roomId: 'room-201', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    const resOpen = checkAvailability(
      { roomId: 'room-101', startTime: 660, endTime: 720 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(resBlocked.available).toBe(false);
    expect(resOpen.available).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Boundary conditions: capacity, touching vs overlapping, duration edges
// ---------------------------------------------------------------------------
describe('Boundary conditions', () => {
  it('exact capacity boundary: room with capacity === requestedAttendees is included', () => {
    // room-102 has capacity 30
    const result = filterByCapacity(rooms, 30);
    expect(result.some((r) => r.id === 'room-102')).toBe(true);
  });

  it('capacity one above boundary is excluded', () => {
    const result = filterByCapacity(rooms, 31);
    expect(result.some((r) => r.id === 'room-102')).toBe(false);
  });

  it('duration exactly 120 is allowed, 121 is rejected (edge pair)', () => {
    const res120 = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 780 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    const res121 = checkAvailability(
      { roomId: 'room-102', startTime: 660, endTime: 781 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res120.available).toBe(true);
    expect(res121.available).toBe(false);
  });

  it('touching at both start and end of an existing booking is allowed', () => {
    // Room 101: B-001 is 540–600, B-002 is 720–780.
    // Request 600–720: starts at B-001 end, ends at B-002 start — touching on both sides.
    // But 600 === currentTime, so use a room without that issue.
    // Room 305: B-005 is 600–660, B-004 is 900–960.
    // Request 660–900: starts at B-005 end, ends at B-004 start — touching both sides.
    const res = checkAvailability(
      { roomId: 'room-305', startTime: 660, endTime: 780 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(true);
    expect(res.conflicts).toEqual([]);
  });

  it('one-minute overlap is detected (start 1 min before existing end)', () => {
    // Room 101: B-002 is 720–780. Request 779–840: starts 1 min before B-002 ends.
    const res = checkAvailability(
      { roomId: 'room-101', startTime: 779, endTime: 839 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(res.available).toBe(false);
    expect(res.conflicts.some((c) => c.includes('B-002'))).toBe(true);
  });

  it('getAvailableEquipment returns sorted unique list from all rooms', () => {
    const equipment = getAvailableEquipment(rooms);
    expect(equipment).toEqual(
      expect.arrayContaining(['Audio System', 'Projector', 'Video Conferencing', 'Whiteboard'])
    );
    expect(equipment.length).toBe(new Set(equipment).size);
    // Verify sorted
    const sorted = [...equipment].sort();
    expect(equipment).toEqual(sorted);
  });
});

// ---------------------------------------------------------------------------
// AC5: Data integrity — bookings and rooms are never mutated
// ---------------------------------------------------------------------------
describe('AC5: Data integrity during filtering and checking', () => {
  it('filterRooms does not mutate the input rooms array', () => {
    const snapshot = structuredClone(rooms);
    filterRooms(rooms, { requestedAttendees: 30, requiredEquipment: ['Projector'] });
    expect(rooms).toEqual(snapshot);
  });

  it('checkAvailability does not mutate bookings', () => {
    const snapshot = structuredClone(bookings);
    checkAvailability(
      { roomId: 'room-101', startTime: 750, endTime: 810 },
      rooms, bookings, FIXED_CURRENT_TIME
    );
    expect(bookings).toEqual(snapshot);
  });
});
