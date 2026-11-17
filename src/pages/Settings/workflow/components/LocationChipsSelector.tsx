import React from 'react';
import { LuWarehouse } from 'react-icons/lu';

export interface LocationItem {
  id: number | string;
  name: string;
  location_type?: string;
}

export type LocationAccentColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'orange';

interface LocationChipsSelectorProps {
  locationsList: LocationItem[];
  selectedLocations: string[];
  onToggleLocation: (locName: string) => void;
  accentColor: LocationAccentColor;
  labelTitle?: string;
  helperNote?: string;
}

export const LocationChipsSelector: React.FC<LocationChipsSelectorProps> = ({
  locationsList,
  selectedLocations,
  onToggleLocation,
  accentColor,
  labelTitle = 'Locations requiring physical booklet slip:',
  helperNote = '* Checked locations enforce manual physical slip entry. Unchecked (and newly added) locations automatically generate sequential numbers without manual typing.'
}) => {
  const colorClasses = {
    blue: {
      active: 'bg-blue-600 text-white border-blue-600 shadow-xs',
      tag: 'bg-blue-700/60 text-blue-100',
      border: 'border-blue-200/60 dark:border-blue-800/60',
      hover: 'hover:border-blue-400'
    },
    emerald: {
      active: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
      tag: 'bg-emerald-700/60 text-emerald-100',
      border: 'border-emerald-200/60 dark:border-emerald-800/60',
      hover: 'hover:border-emerald-400'
    },
    amber: {
      active: 'bg-amber-600 text-white border-amber-600 shadow-xs',
      tag: 'bg-amber-700/60 text-amber-100',
      border: 'border-amber-200/60 dark:border-amber-800/60',
      hover: 'hover:border-amber-400'
    },
    purple: {
      active: 'bg-purple-600 text-white border-purple-600 shadow-xs',
      tag: 'bg-purple-700/60 text-purple-100',
      border: 'border-purple-200/60 dark:border-purple-800/60',
      hover: 'hover:border-purple-400'
    },
    rose: {
      active: 'bg-rose-600 text-white border-rose-600 shadow-xs',
      tag: 'bg-rose-700/60 text-rose-100',
      border: 'border-rose-200/60 dark:border-rose-800/60',
      hover: 'hover:border-rose-400'
    },
    orange: {
      active: 'bg-orange-600 text-white border-orange-600 shadow-xs',
      tag: 'bg-orange-700/60 text-orange-100',
      border: 'border-orange-200/60 dark:border-orange-800/60',
      hover: 'hover:border-orange-400'
    }
  }[accentColor];

  return (
    <div className={`pt-3 border-t ${colorClasses.border} space-y-2 mt-2`}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <LuWarehouse size={13} />
          <span>{labelTitle}</span>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
          {selectedLocations.length} / {locationsList.length} Active
        </span>
      </div>

      {locationsList.length === 0 ? (
        <div className="text-[11px] text-slate-400 italic py-1">Loading available locations...</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {locationsList.map((loc) => {
            const isChecked = selectedLocations.includes(loc.name);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onToggleLocation(loc.name)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isChecked
                    ? colorClasses.active
                    : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 ${colorClasses.hover}`
                }`}
              >
                <span>{isChecked ? '☑' : '☐'}</span>
                <span>{loc.name}</span>
                {loc.location_type && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                      isChecked
                        ? colorClasses.tag
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {loc.location_type}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-tight">
        {helperNote}
      </p>
    </div>
  );
};
