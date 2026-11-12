import { Room, Booking, TestConfig } from '@/types';

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room-101',
    name: 'Room 101',
    building: 'Engineering Block',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard'],
    blocked: false,
  },
  {
    id: 'room-102',
    name: 'Room 102',
    building: 'Engineering Block',
    capacity: 30,
    equipment: ['Whiteboard'],
    blocked: false,
  },
  {
    id: 'room-201',
    name: 'Room 201',
    building: 'Science Wing',
    capacity: 25,
    equipment: ['Projector', 'Video Conferencing'],
    blocked: true,
    blockedReason: 'Under maintenance until 18:00.',
  },
  {
    id: 'room-305',
    name: 'Room 305',
    building: 'Library Tower',
    capacity: 50,
    equipment: ['Projector', 'Whiteboard', 'Video Conferencing', 'Audio System'],
    blocked: false,
  },
  {
    id: 'room-410',
    name: 'Room 410',
    building: 'Business Center',
    capacity: 20,
    equipment: ['Video Conferencing'],
    blocked: false,
  },
];

export const SAMPLE_BOOKINGS: Booking[] = [
  { id: 'B-001', roomId: 'room-101', startTime: 540, endTime: 600, bookedBy: 'Dr. Smith' },
  { id: 'B-002', roomId: 'room-101', startTime: 720, endTime: 780, bookedBy: 'Prof. Lee' },
  { id: 'B-003', roomId: 'room-102', startTime: 600, endTime: 660, bookedBy: 'Dr. Patel' },
  { id: 'B-004', roomId: 'room-305', startTime: 900, endTime: 960, bookedBy: 'Dr. Garcia' },
  { id: 'B-005', roomId: 'room-305', startTime: 600, endTime: 660, bookedBy: 'Prof. Ng' },
  { id: 'B-006', roomId: 'room-410', startTime: 660, endTime: 720, bookedBy: 'Dr. Brown' },
];

// Deterministic test config: current time = 10:00 (600 min)
export const DEFAULT_TEST_CONFIG: TestConfig = {
  enabled: true,
  currentTimeInMinutes: 600,
  bookings: SAMPLE_BOOKINGS,
  rooms: SAMPLE_ROOMS,
};
