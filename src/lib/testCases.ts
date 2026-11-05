import { minutesToLabel } from '@/lib/timeUtils';

export interface TestCase {
  id: string;
  label: string;
  description: string;
  roomId: string;
  startTime: number;
  endTime: number;
  expected: 'Available' | 'Unavailable';
  acTag: string;
}

// All cases assume test-mode current time = 600 (10:00) and sample bookings.
export const TEST_CASES: TestCase[] = [
  {
    id: 'touching',
    label: 'Touching',
    description: '11:00–12:00 on Room 101; slot ends exactly at existing booking B-002 start (12:00). Touching endpoints are allowed.',
    roomId: 'room-101',
    startTime: 660,
    endTime: 720,
    expected: 'Available',
    acTag: 'AC4',
  },
  {
    id: 'overlap',
    label: 'Overlap',
    description: '12:30–13:30 on Room 101; overlaps existing booking B-002 (12:00–13:00).',
    roomId: 'room-101',
    startTime: 750,
    endTime: 810,
    expected: 'Unavailable',
    acTag: 'AC4',
  },
  {
    id: 'blocked',
    label: 'Blocked',
    description: '11:00–12:00 on Room 201; room is blocked for maintenance.',
    roomId: 'room-201',
    startTime: 660,
    endTime: 720,
    expected: 'Unavailable',
    acTag: 'AC3',
  },
  {
    id: 'exactly-2h',
    label: 'Exactly 2 hours',
    description: '11:00–13:00 on Room 102; 120 min duration is the allowed maximum.',
    roomId: 'room-102',
    startTime: 660,
    endTime: 780,
    expected: 'Available',
    acTag: 'AC2',
  },
  {
    id: 'over-2h',
    label: 'Over 2 hours',
    description: '11:00–13:10 on Room 102; 130 min exceeds the 120 min maximum.',
    roomId: 'room-102',
    startTime: 660,
    endTime: 790,
    expected: 'Unavailable',
    acTag: 'AC2',
  },
  {
    id: 'starts-now',
    label: 'Starts now',
    description: '10:00–11:00 on Room 101; start equals current time, must be strictly after.',
    roomId: 'room-101',
    startTime: 600,
    endTime: 660,
    expected: 'Unavailable',
    acTag: 'AC1',
  },
];

export function testCaseSummary(tc: TestCase): string {
  return `${minutesToLabel(tc.startTime)}–${minutesToLabel(tc.endTime)} · expects ${tc.expected} (${tc.acTag})`;
}
