import { useState, useEffect } from 'react';
import { Search, CalendarClock, ArrowRight, Monitor } from 'lucide-react';
import { Room } from '@/types';
import { minutesToLabel } from '@/lib/timeUtils';

export interface FormPreset {
  roomId: string;
  startTime: number;
  endTime: number;
}

interface AvailabilityFormProps {
  rooms: Room[];
  onCheck: (roomId: string, start: number, end: number) => void;
  onRoomChange?: (roomId: string) => void;
  defaultRoomId?: string;
  preset?: FormPreset | null;
  disabled?: boolean;
}

function toTimeStr(minutes: number): string {
  return minutesToLabel(minutes);
}

export function AvailabilityForm({ rooms, onCheck, onRoomChange, defaultRoomId, preset, disabled }: AvailabilityFormProps) {
  const [roomId, setRoomId] = useState(defaultRoomId ?? rooms[0]?.id ?? '');
  const [startStr, setStartStr] = useState('11:00');
  const [endStr, setEndStr] = useState('12:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!preset) return;
    setRoomId(preset.roomId);
    setStartStr(toTimeStr(preset.startTime));
    setEndStr(toTimeStr(preset.endTime));
    setError(null);
  }, [preset]);

  // Keep selected room in sync when the filtered rooms list changes (F5)
  useEffect(() => {
    if (rooms.length > 0 && !rooms.some((r) => r.id === roomId)) {
      setRoomId(rooms[0].id);
    }
  }, [rooms, roomId]);

  const parseTime = (s: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };

  const handleRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoomId(e.target.value);
    setError(null);
    onRoomChange?.(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    const start = parseTime(startStr);
    const end = parseTime(endStr);
    if (start === null || end === null) {
      setError('Please enter valid times in HH:MM format (e.g. 14:30).');
      return;
    }
    setError(null);
    onCheck(roomId, start, end);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="room" className="mb-1.5 block text-sm font-medium text-slate-700">
          Select Room
        </label>
        <select
          id="room"
          value={roomId}
          onChange={handleRoomSelect}
          disabled={disabled}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.building} (cap. {r.capacity}){r.blocked ? ' [Blocked]' : ''}
            </option>
          ))}
        </select>
        {roomId && (() => {
          const room = rooms.find((r) => r.id === roomId);
          if (!room || room.equipment.length === 0) return null;
          return (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {room.equipment.map((item) => (
                <span key={item} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <Monitor className="h-2.5 w-2.5" />
                  {item}
                </span>
              ))}
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start" className="mb-1.5 block text-sm font-medium text-slate-700">
            Start Time
          </label>
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="start"
              type="time"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{minutesToLabel(0)}–{minutesToLabel(1440)} allowed</p>
        </div>
        <div>
          <label htmlFor="end" className="mb-1.5 block text-sm font-medium text-slate-700">
            End Time
          </label>
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="end"
              type="time"
              value={endStr}
              onChange={(e) => setEndStr(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Max 120 min duration</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search className="h-4 w-4" />
        Check Availability
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
