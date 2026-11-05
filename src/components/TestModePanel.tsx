import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { TestConfig, Booking } from '@/types';
import { minutesToLabel } from '@/lib/timeUtils';

interface TestModePanelProps {
  config: TestConfig;
  onChange: (config: TestConfig) => void;
  onReset: () => void;
}

export function TestModePanel({ config, onChange, onReset }: TestModePanelProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleEnabled = () => onChange({ ...config, enabled: !config.enabled });

  const updateCurrentTime = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (match) {
      const mins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      onChange({ ...config, currentTimeInMinutes: mins });
    }
  };

  const updateBooking = (id: string, field: keyof Booking, value: string) => {
    const numVal = field === 'bookedBy' ? value : parseInt(value, 10);
    onChange({
      ...config,
      bookings: config.bookings.map((b) =>
        b.id === id ? { ...b, [field]: numVal } : b
      ),
    });
  };

  const toggleRoomBlocked = (roomId: string) => {
    onChange({
      ...config,
      rooms: config.rooms.map((r) =>
        r.id === roomId
          ? { ...r, blocked: !r.blocked, blockedReason: !r.blocked ? 'Toggled in test mode' : undefined }
          : r
      ),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FlaskConical className="h-4 w-4 text-slate-500" />
          Test Mode
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              config.enabled
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {config.enabled ? 'ON' : 'OFF'}
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-4 space-y-4">
          <p className="text-xs text-slate-500">
            Test mode lets you supply a fixed "current time" and booking data for deterministic
            testing. When enabled, the current time and data below are used instead of the real
            clock.
          </p>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={toggleEnabled}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300"
            />
            Enable test mode
          </label>

          {config.enabled && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Current Time (minutes from midnight: {config.currentTimeInMinutes} = {minutesToLabel(config.currentTimeInMinutes)})
                </label>
                <input
                  type="time"
                  value={minutesToLabel(config.currentTimeInMinutes)}
                  onChange={(e) => updateCurrentTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">Bookings</p>
                <div className="space-y-2">
                  {config.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs sm:grid-cols-5"
                    >
                      <span className="flex items-center font-mono text-slate-500">{b.id}</span>
                      <input
                        type="number"
                        value={b.startTime}
                        onChange={(e) => updateBooking(b.id, 'startTime', e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 outline-none focus:border-blue-400"
                        aria-label="Start time"
                      />
                      <input
                        type="number"
                        value={b.endTime}
                        onChange={(e) => updateBooking(b.id, 'endTime', e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 outline-none focus:border-blue-400"
                        aria-label="End time"
                      />
                      <input
                        type="text"
                        value={b.bookedBy}
                        onChange={(e) => updateBooking(b.id, 'bookedBy', e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 outline-none focus:border-blue-400 sm:col-span-2"
                        aria-label="Booked by"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">Room Block Status</p>
                <div className="flex flex-wrap gap-2">
                  {config.rooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => toggleRoomBlocked(r.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        r.blocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {r.name}: {r.blocked ? 'Blocked' : 'Open'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to defaults
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
