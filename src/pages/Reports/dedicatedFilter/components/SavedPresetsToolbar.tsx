import React from 'react';
import { MdBookmark, MdBookmarkAdd, MdClose } from 'react-icons/md';
import { FilterPreset } from '../types/dedicatedFilterTypes';

interface SavedPresetsToolbarProps {
  savedPresets: FilterPreset[];
  activePresetId: string | null;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string, e: React.MouseEvent) => void;
  onOpenSaveModal: () => void;
}

export const SavedPresetsToolbar: React.FC<SavedPresetsToolbarProps> = ({
  savedPresets,
  activePresetId,
  onApplyPreset,
  onDeletePreset,
  onOpenSaveModal
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-xs mr-1">
          <MdBookmark size={16} className="text-emerald-600" />
          <span>Saved Presets:</span>
        </div>

        {savedPresets.length === 0 ? (
          <span className="text-[11px] text-slate-400 italic">No saved presets yet for this report.</span>
        ) : (
          savedPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                activePresetId === preset.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
              }`}
            >
              <span>{preset.name}</span>
              <button
                type="button"
                onClick={(e) => onDeletePreset(preset.id, e)}
                className={`opacity-60 group-hover:opacity-100 hover:text-rose-500 transition p-0.5 rounded ${
                  activePresetId === preset.id ? 'hover:bg-emerald-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Delete Preset"
              >
                <MdClose size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onOpenSaveModal}
        className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer self-start sm:self-auto shrink-0"
      >
        <MdBookmarkAdd size={15} />
        <span>Save Current Filter Preset</span>
      </button>
    </div>
  );
};

export default SavedPresetsToolbar;
