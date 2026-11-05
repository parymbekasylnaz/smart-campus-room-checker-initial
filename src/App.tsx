import { useState, useCallback } from 'react';
import { DoorOpen, Clock, ShieldCheck } from 'lucide-react';
import { AvailabilityForm, FormPreset } from '@/components/AvailabilityForm';
import { ResultPanel } from '@/components/ResultPanel';
import { RoomTimelineList } from '@/components/RoomTimeline';
import { TestModePanel } from '@/components/TestModePanel';
import { TestCasesPanel } from '@/components/TestCasesPanel';
import { checkAvailability } from '@/lib/checkAvailability';
import { getCurrentMinutesFromMidnight, minutesToLabel } from '@/lib/timeUtils';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS, DEFAULT_TEST_CONFIG } from '@/lib/sampleData';
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

  const activeRooms = testConfig.enabled ? testConfig.rooms : SAMPLE_ROOMS;
  const activeBookings = testConfig.enabled ? testConfig.bookings : SAMPLE_BOOKINGS;
  const currentTime = testConfig.enabled ? testConfig.currentTimeInMinutes : getCurrentMinutesFromMidnight();

  const handleCheck = useCallback(
    (roomId: string, start: number, end: number) => {
      setResult(checkAvailability({ roomId, startTime: start, endTime: end }, activeRooms, activeBookings, currentTime));
      setRequestStart(start);
      setRequestEnd(end);
      setCheckedRoomId(roomId);
    },
    [activeRooms, activeBookings, currentTime]
  );

  const handleReset = () => {
    setTestConfig(DEFAULT_TEST_CONFIG);
    setResult(null);
    setPreset(null);
    setActiveCaseId(null);
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
          {/* Left column: form + test mode */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Check a Room</h2>
              <AvailabilityForm rooms={activeRooms} onCheck={handleCheck} defaultRoomId={checkedRoomId} preset={preset} />
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
            <ResultPanel
              result={result}
              requestStart={requestStart}
              requestEnd={requestEnd}
              roomName={checkedRoom?.name ?? '—'}
            />

            <RoomTimelineList
              rooms={activeRooms}
              bookings={activeBookings}
              requestStart={result ? requestStart : undefined}
              requestEnd={result ? requestEnd : undefined}
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
