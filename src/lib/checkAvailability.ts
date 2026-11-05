import { Room, Booking, AvailabilityRequest, AvailabilityResult } from '@/types';

const DAY_START = 0;
const DAY_END = 1440;
const MAX_DURATION = 120;

export function checkAvailability(
  request: AvailabilityRequest,
  rooms: Room[],
  bookings: Booking[],
  currentTimeInMinutes: number
): AvailabilityResult {
  const reasons: string[] = [];
  const conflicts: string[] = [];

  const { roomId, startTime, endTime } = request;
  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    return {
      available: false,
      reasons: [`Room "${roomId}" does not exist.`],
      conflicts: [],
    };
  }

  // AC1: Valid time interval (0 <= start < end <= 1440, start strictly after current time)
  if (startTime < DAY_START || startTime >= DAY_END) {
    reasons.push(
      `Start time must be between 0 and 1439 (got ${startTime}).`
    );
  }
  if (endTime <= DAY_START || endTime > DAY_END) {
    reasons.push(
      `End time must be between 1 and 1440 (got ${endTime}).`
    );
  }
  if (startTime >= endTime) {
    reasons.push(
      `Start time (${startTime}) must be strictly before end time (${endTime}).`
    );
  }
  if (startTime <= currentTimeInMinutes) {
    reasons.push(
      `Start time must be strictly after the current time (${currentTimeInMinutes}). Requested start: ${startTime}.`
    );
  }

  // AC2: Maximum duration of 120 minutes
  const duration = endTime - startTime;
  if (duration > MAX_DURATION) {
    reasons.push(
      `Booking duration is ${duration} minutes, which exceeds the 120-minute maximum.`
    );
  }

  // AC3: Blocked room check
  if (room.blocked) {
    reasons.push(
      `Room "${room.name}" is currently blocked: ${room.blockedReason ?? 'No reason provided.'}`
    );
  }

  // AC4: Existing booking conflicts using half-open intervals
  // Conflict when: requestedStart < existingEnd AND existingStart < requestedEnd
  // Touching endpoints (e.g. requestedStart === existingEnd) are allowed.
  const roomBookings = bookings.filter((b) => b.roomId === roomId);
  for (const booking of roomBookings) {
    const overlaps = startTime < booking.endTime && booking.startTime < endTime;
    if (overlaps) {
      conflicts.push(
        `Conflict with booking "${booking.id}" by ${booking.bookedBy} (${booking.startTime}–${booking.endTime}).`
      );
    }
  }

  if (conflicts.length > 0) {
    reasons.push(...conflicts);
  }

  const available = reasons.length === 0;

  return { available, reasons, conflicts };
}
