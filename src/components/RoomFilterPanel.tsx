import { Users, Filter } from 'lucide-react';
import { RoomFilterCriteria } from '@/lib/roomFilter';

interface RoomFilterPanelProps {
  criteria: RoomFilterCriteria;
  availableEquipment: string[];
  onChange: (criteria: RoomFilterCriteria) => void;
}

export function RoomFilterPanel({ criteria, availableEquipment, onChange }: RoomFilterPanelProps) {
  const toggleEquipment = (item: string) => {
    const isSelected = criteria.requiredEquipment.includes(item);
    onChange({
      ...criteria,
      requiredEquipment: isSelected
        ? criteria.requiredEquipment.filter((e) => e !== item)
        : [...criteria.requiredEquipment, item],
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-700">Filter Rooms</h2>
      </div>

      {/* F1: Capacity filter */}
      <div className="mb-4">
        <label htmlFor="attendees" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          Required Attendees
        </label>
        <input
          id="attendees"
          type="number"
          min={0}
          value={criteria.requestedAttendees || ''}
          onChange={(e) => onChange({ ...criteria, requestedAttendees: Math.max(0, parseInt(e.target.value, 10) || 0) })}
          placeholder="0 = no filter"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="mt-1 text-xs text-slate-400">Only rooms with capacity ≥ this number will be shown</p>
      </div>

      {/* F2: Equipment filter */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Required Equipment</p>
        {availableEquipment.length === 0 ? (
          <p className="text-xs text-slate-400">No equipment options available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableEquipment.map((item) => {
              const isSelected = criteria.requiredEquipment.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquipment(item)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-1.5 text-xs text-slate-400">Only rooms with all selected equipment will be shown</p>
      </div>
    </div>
  );
}
