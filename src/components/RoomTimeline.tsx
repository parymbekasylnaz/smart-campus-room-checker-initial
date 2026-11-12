import { Building2, Clock, MapPin, Users, Monitor } from 'lucide-react';
import { Room } from '@/types';
import { minutesToLabel } from '@/lib/timeUtils';

interface RoomTimelineProps {
  room: Room;
  bookings: { startTime: number; endTime: number; bookedBy: string }[];
  requestStart?: number;
  requestEnd?: number;
}

export function RoomTimeline({ room, bookings, requestStart, requestEnd }: RoomTimelineProps) {
  const DAY_START = 0;
  const DAY_END = 1440;
  const totalMinutes = DAY_END - DAY_START;
  const roomBookings = bookings.filter((b) => b.startTime !== undefined);

  const pct = (min: number) => ((min - DAY_START) / totalMinutes) * 100;

  // Hour markers at 0, 4, 8, 12, 16, 20, 24
  const hourMarks = [0, 4, 8, 12, 16, 20, 24].map((h) => h * 60);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-800">{room.name}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {room.building}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {room.capacity}
          </span>
          {room.blocked && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
              Blocked
            </span>
          )}
        </div>
      </div>

      {/* Equipment badges */}
      {room.equipment.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {room.equipment.map((item) => (
            <span key={item} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              <Monitor className="h-2.5 w-2.5" />
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Timeline bar */}
      <div className="relative h-10 w-full overflow-hidden rounded-md bg-slate-100">
        {/* Hour gridlines */}
        {hourMarks.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 border-l border-slate-200"
            style={{ left: `${pct(m)}%` }}
          />
        ))}

        {/* Existing bookings */}
        {roomBookings.map((b, i) => (
          <div
            key={i}
            className="absolute top-1 bottom-1 rounded-sm bg-slate-300"
            style={{
              left: `${pct(b.startTime)}%`,
              width: `${pct(b.endTime) - pct(b.startTime)}%`,
            }}
            title={`${minutesToLabel(b.startTime)}–${minutesToLabel(b.endTime)} (${b.bookedBy})`}
          >
            <span className="hidden px-1 text-[10px] leading-8 text-slate-600 sm:block">
              {minutesToLabel(b.startTime)}
            </span>
          </div>
        ))}

        {/* Requested slot overlay */}
        {requestStart !== undefined && requestEnd !== undefined && requestStart < requestEnd && (
          <div
            className="absolute top-0 bottom-0 border-2 border-blue-500 bg-blue-400/30"
            style={{
              left: `${pct(requestStart)}%`,
              width: `${pct(requestEnd) - pct(requestStart)}%`,
            }}
            title={`Requested: ${minutesToLabel(requestStart)}–${minutesToLabel(requestEnd)}`}
          />
        )}
      </div>

      {/* Hour labels */}
      <div className="relative mt-1 h-4 w-full text-[10px] text-slate-400">
        {hourMarks.map((m) => (
          <span
            key={m}
            className="absolute -translate-x-1/2"
            style={{ left: `${pct(m)}%` }}
          >
            {minutesToLabel(m)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RoomTimelineList({
  rooms,
  bookings,
  requestStart,
  requestEnd,
}: {
  rooms: Room[];
  bookings: { startTime: number; endTime: number; bookedBy: string; roomId: string }[];
  requestStart?: number;
  requestEnd?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-600">
        <Clock className="h-4 w-4" /> Room Overview
      </div>
      {rooms.map((room) => (
        <RoomTimeline
          key={room.id}
          room={room}
          bookings={bookings.filter((b) => b.roomId === room.id)}
          requestStart={requestStart}
          requestEnd={requestEnd}
        />
      ))}
    </div>
  );
}
