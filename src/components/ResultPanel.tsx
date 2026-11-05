import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { AvailabilityResult } from '@/types';
import { minutesToLabel } from '@/lib/timeUtils';

interface ResultPanelProps {
  result: AvailabilityResult | null;
  requestStart: number;
  requestEnd: number;
  roomName: string;
}

export function ResultPanel({ result, requestStart, requestEnd, roomName }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <Info className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-400">
          Select a room and time range, then click "Check Availability" to see the result.
        </p>
      </div>
    );
  }

  const duration = requestEnd - requestStart;

  return (
    <div
      className={`rounded-xl border p-5 transition ${
        result.available
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {result.available ? (
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
        ) : (
          <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        )}
        <div className="flex-1">
          <h3
            className={`text-lg font-bold ${
              result.available ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {result.available ? 'Available' : 'Unavailable'}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Room <span className="font-semibold">{roomName}</span> ·{' '}
            {minutesToLabel(requestStart)}–{minutesToLabel(requestEnd)} ({duration} min)
          </p>

          {result.reasons.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {result.reasons.map((reason, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 text-sm ${
                    result.available ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}

          {result.available && (
            <p className="mt-3 text-xs text-slate-500">
              No booking is created — this is a read-only availability check.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
