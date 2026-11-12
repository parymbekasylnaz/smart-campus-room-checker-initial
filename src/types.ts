export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  blocked: boolean;
  blockedReason?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  startTime: number; // minutes from midnight
  endTime: number;   // minutes from midnight
  bookedBy: string;
}

export interface AvailabilityRequest {
  roomId: string;
  startTime: number;
  endTime: number;
}

export interface AvailabilityResult {
  available: boolean;
  reasons: string[];
  conflicts: string[];
}

export interface TestConfig {
  enabled: boolean;
  currentTimeInMinutes: number;
  bookings: Booking[];
  rooms: Room[];
}
