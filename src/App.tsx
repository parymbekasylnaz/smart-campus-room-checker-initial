import { useState, useCallback, useMemo } from 'react';
import { DoorOpen, Clock, ShieldCheck, SearchX } from 'lucide-react';
import { AvailabilityForm, FormPreset } from '@/components/AvailabilityForm';
import { ResultPanel } from '@/components/ResultPanel';
import { RoomTimelineList } from '@/components/RoomTimeline';
import { TestModePanel } from '@/components/TestModePanel';
import { TestCasesPanel } from '@/components/TestCasesPanel';
import { RoomFilterPanel } from '@/components/RoomFilterPanel';
import { checkAvailability } from '@/lib/checkAvailability';
import { getCurrentMinutesFromMidnight, minutesToLabel } from '@/lib/timeUtils';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS, DEFAULT_TEST_CONFIG } from '@/lib/sampleData';
import { filterRooms, getAvailableEquipment, RoomFilterCriteria } from '@/lib/roomFilter';
import { TestCase } from '@/lib/testCases';
import { AvailabilityResult, TestConfig } from '@/types';

function App() {
  const [testConfig, setTestConfig] = useState<TestConfig>(DEFAULT_TEST_CONFIG);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [requestStart, setRequestStart] = useState(660);
  const [requestEnd, setRequestEnd] = useState(720);
  const [checkedRoomId, setCheckedRoomId] = useState<string>(SAMPLE_ROOMS[0].id);
  const [preset, setPreset] = useState<FormPreset | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<RoomFilterCriteria>({
    requestedAttendees: 0,
    requiredEquipment: [],
  });

  const activeRooms = testConfig.enabled ? testConfig.rooms : SAMPLE_ROOMS;
  const activeBookings = testConfig.enabled ? testConfig.bookings : SAMPLE_BOOKINGS;
  const currentTime = testConfig.enabled ? testConfig.currentTimeInMinutes : getCurrentMinutesFromMidnight();

  // Apply capacity + equipment filters (F1, F2)
  const filteredRooms = useMemo(
    () => filterRooms(activeRooms, filterCriteria),
    [activeRooms, filterCriteria]
  );

  const availableEquipment = useMemo(
    () => getAvailableEquipment(activeRooms),
    [activeRooms]
  );

  const hasFilteredRooms = filteredRooms.length > 0;

  const handleCheck = useCallback(
    (roomId: string, start: number, end: number) => {
      setResult(checkAvailability({ roomId, startTime: start, endTime: end }, activeRooms, activeBookings, currentTime));
      setRequestStart(start);
      setRequestEnd(end);
      setCheckedRoomId(roomId);
    },
    [activeRooms, activeBookings, currentTime]
  );

  // F5: clear result when user selects a different room
  const handleRoomChange = useCallback((roomId: string) => {
    if (roomId !== checkedRoomId) {
      setResult(null);
      setActiveCaseId(null);
      setPreset(null);
    }
    setCheckedRoomId(roomId);
  }, [checkedRoomId]);

  // F5: when filters change and the selected room is no longer in the list, clear result
  const effectiveRoomId = filteredRooms.some((r) => r.id === checkedRoomId)
    ? checkedRoomId
    : filteredRooms[0]?.id ?? '';

  const handleReset = () => {
    setTestConfig(DEFAULT_TEST_CONFIG);
    setResult(null);
    setPreset(null);
    setActiveCaseId(null);
    setFilterCriteria({ requestedAttendees: 0, requiredEquipment: [] });
    setCheckedRoomId(SAMPLE_ROOMS[0].id);
  };

  const handleLoadCase = useCallback((tc: TestCase) => {
    setPreset({ roomId: tc.roomId, startTime: tc.startTime, endTime: tc.endTime });
    setActiveCaseId(tc.id);
    setResult(checkAvailability(
      { roomId: tc.roomId, startTime: tc.startTime, endTime: tc.endTime },
      testConfig.enabled ? testConfig.rooms : SAMPLE_ROOMS,
      testConfig.enabled ? testConfig.bookings : SAMPLE_BOOKINGS,
      testConfig.enabled ? testConfig.currentTimeInMinutes : getCurrentMinutesFromMidnight()
    ));
    setRequestStart(tc.startTime);
    setRequestEnd(tc.endTime);
    setCheckedRoomId(tc.roomId);
  }, [testConfig]);

  const checkedRoom = activeRooms.find((r) => r.id === checkedRoomId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 sm:text-lg">
                Smart Campus Room Availability Checker
              </h1>
              <p className="text-xs text-slate-500">
                Read-only checks — no bookings are created or modified.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 sm:flex">
            <Clock className="h-3.5 w-3.5" />
            Current: {minutesToLabel(currentTime)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left column: filters, form, test mode */}
          <div className="space-y-4 lg:col-span-2">
            <RoomFilterPanel
              criteria={filterCriteria}
              availableEquipment={availableEquipment}
              onChange={setFilterCriteria}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Check a Room</h2>
              {hasFilteredRooms ? (
                <AvailabilityForm
                  rooms={filteredRooms}
                  onCheck={handleCheck}
                  onRoomChange={handleRoomChange}
                  defaultRoomId={effectiveRoomId}
                  preset={preset}
                />
              ) : (
                // F4: Empty state — no rooms match the active filters
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <SearchX className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No rooms match your filters</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Adjust the capacity or equipment filters above to see available rooms.
                  </p>
                  <button
                    onClick={() => setFilterCriteria({ requestedAttendees: 0, requiredEquipment: [] })}
                    className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            <TestCasesPanel onLoadCase={handleLoadCase} activeCaseId={activeCaseId} />

            <TestModePanel config={testConfig} onChange={setTestConfig} onReset={handleReset} />

            <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This tool only <strong>checks</strong> availability. No booking is saved,
                confirmed, or sent to any backend. Existing booking data is never modified.
              </p>
            </div>
          </div>

          {/* Right column: result + timelines */}
          <div className="space-y-4 lg:col-span-3">
            {hasFilteredRooms && (
              <ResultPanel
                result={result}
                requestStart={requestStart}
                requestEnd={requestEnd}
                roomName={checkedRoom?.name ?? '—'}
              />
            )}

            <RoomTimelineList
              rooms={hasFilteredRooms ? filteredRooms : activeRooms}
              bookings={activeBookings}
              requestStart={result && hasFilteredRooms ? requestStart : undefined}
              requestEnd={result && hasFilteredRooms ? requestEnd : undefined}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Fictional sample data · AC1–AC6 compliant · No backend or persistence
        </footer>
      </main>
    </div>
  );
}

export default App;
