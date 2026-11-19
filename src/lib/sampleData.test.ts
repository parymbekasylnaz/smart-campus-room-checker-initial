import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getActiveDataSource,
  SAMPLE_ROOMS,
  SAMPLE_BOOKINGS,
  DEFAULT_TEST_CONFIG,
} from '@/lib/sampleData';
import { Room, Booking, TestConfig } from '@/types';
import * as timeUtils from '@/lib/timeUtils';

// Custom test-mode config with values distinct from the sample fixtures so the
// assertions can prove the config's values (not the samples) are selected.
const TEST_ROOMS: Room[] = [
  {
    id: 'test-room-1',
    name: 'Test Room 1',
    building: 'Test Building',
    capacity: 10,
    equipment: ['Whiteboard'],
    blocked: false,
  },
];

const TEST_BOOKINGS: Booking[] = [
  { id: 'TB-001', roomId: 'test-room-1', startTime: 100, endTime: 160, bookedBy: 'Tester' },
];

const TEST_CONFIG: TestConfig = {
  enabled: true,
  currentTimeInMinutes: 123,
  bookings: TEST_BOOKINGS,
  rooms: TEST_ROOMS,
};

const DISABLED_CONFIG: TestConfig = { ...TEST_CONFIG, enabled: false };

describe('getActiveDataSource', () => {
  beforeEach(() => {
    vi.spyOn(timeUtils, 'getCurrentMinutesFromMidnight').mockReturnValue(999);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test mode enabled: returns the config rooms, bookings, and current time', () => {
    const source = getActiveDataSource(TEST_CONFIG);
    expect(source.rooms).toBe(TEST_ROOMS);
    expect(source.bookings).toBe(TEST_BOOKINGS);
    expect(source.currentTimeInMinutes).toBe(123);
  });

  it('test mode enabled: does not use the sample fixtures', () => {
    const source = getActiveDataSource(TEST_CONFIG);
    expect(source.rooms).not.toBe(SAMPLE_ROOMS);
    expect(source.bookings).not.toBe(SAMPLE_BOOKINGS);
  });

  it('live/sample mode (disabled): returns the sample fixtures and live clock time', () => {
    const source = getActiveDataSource(DISABLED_CONFIG);
    expect(source.rooms).toBe(SAMPLE_ROOMS);
    expect(source.bookings).toBe(SAMPLE_BOOKINGS);
    expect(source.currentTimeInMinutes).toBe(999); // from mocked live clock
  });

  it('DEFAULT_TEST_CONFIG resolves to sample fixtures with current time 600', () => {
    const source = getActiveDataSource(DEFAULT_TEST_CONFIG);
    expect(source.rooms).toBe(SAMPLE_ROOMS);
    expect(source.bookings).toBe(SAMPLE_BOOKINGS);
    expect(source.currentTimeInMinutes).toBe(600);
  });

  it('does not mutate the sample room fixtures', () => {
    const snapshot = structuredClone(SAMPLE_ROOMS);
    getActiveDataSource(DISABLED_CONFIG);
    expect(SAMPLE_ROOMS).toEqual(snapshot);
  });

  it('does not mutate the sample booking fixtures', () => {
    const snapshot = structuredClone(SAMPLE_BOOKINGS);
    getActiveDataSource(DISABLED_CONFIG);
    expect(SAMPLE_BOOKINGS).toEqual(snapshot);
  });

  it('does not mutate the passed test config', () => {
    const snapshot = structuredClone(TEST_CONFIG);
    getActiveDataSource(TEST_CONFIG);
    expect(TEST_CONFIG).toEqual(snapshot);
    expect(TEST_CONFIG.enabled).toBe(true);
    expect(TEST_CONFIG.currentTimeInMinutes).toBe(123);
  });

  it('toggling enabled switches between config data and sample fixtures', () => {
    const enabled = getActiveDataSource(TEST_CONFIG);
    const disabled = getActiveDataSource(DISABLED_CONFIG);
    expect(enabled.rooms).toBe(TEST_ROOMS);
    expect(enabled.currentTimeInMinutes).toBe(123);
    expect(disabled.rooms).toBe(SAMPLE_ROOMS);
    expect(disabled.currentTimeInMinutes).toBe(999);
  });
});
