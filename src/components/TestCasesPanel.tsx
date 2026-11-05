import { FlaskConical, Play } from 'lucide-react';
import { TEST_CASES, TestCase, testCaseSummary } from '@/lib/testCases';
import { minutesToLabel } from '@/lib/timeUtils';

interface TestCasesPanelProps {
  onLoadCase: (tc: TestCase) => void;
  activeCaseId: string | null;
}

export function TestCasesPanel({ onLoadCase, activeCaseId }: TestCasesPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-700">Test the First Prototype</h2>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Load a preset scenario into the form inputs. Uses test-mode current time (10:00) and sample bookings.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TEST_CASES.map((tc) => {
          const isActive = activeCaseId === tc.id;
          return (
            <button
              key={tc.id}
              onClick={() => onLoadCase(tc)}
              className={`group flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                isActive
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Play
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{tc.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      tc.expected === 'Available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tc.expected}
                  </span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {tc.acTag}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {minutesToLabel(tc.startTime)}–{minutesToLabel(tc.endTime)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
