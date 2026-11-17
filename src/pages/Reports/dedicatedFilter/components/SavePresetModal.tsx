import React from 'react';
import { MdBookmarkAdd, MdClose } from 'react-icons/md';

interface SavePresetModalProps {
  isOpen: boolean;
  presetName: string;
  onPresetNameChange: (val: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  presetName,
  onPresetNameChange,
  onSave,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MdBookmarkAdd size={18} className="text-emerald-600" />
            <span>Save Filter Preset</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <MdClose size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Name this filter combination for 1-click loading whenever you open this report.
        </p>
        <input
          type="text"
          placeholder="e.g. Lahore Cash Sales - Q3"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
          autoFocus
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm"
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePresetModal;
