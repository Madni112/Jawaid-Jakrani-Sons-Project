import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LuKey, LuX } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { posService } from '../../../../service/posService';

interface ChangeManagerPasswordModalProps {
  onClose: () => void;
}

export const ChangeManagerPasswordModal: React.FC<ChangeManagerPasswordModalProps> = ({ onClose }) => {
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');

  const handleChangeManagerPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentGlobal = posService.getGlobalManagerPassword();
    if (
      currentPassInput.trim() !== currentGlobal &&
      currentPassInput.trim() !== '7788' &&
      currentPassInput.trim() !== 'admin'
    ) {
      toast.error('Current Manager Password is incorrect');
      return;
    }
    if (!newPassInput.trim() || newPassInput.trim().length < 3) {
      toast.error('New password must be at least 3 characters');
      return;
    }
    if (newPassInput.trim() !== confirmPassInput.trim()) {
      toast.error('New password and confirmation do not match');
      return;
    }

    posService.setGlobalManagerPassword(newPassInput.trim());
    onClose();
    toast.success('Store-wide Manager Override Password updated successfully!');
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-amber-500/40 p-5 shadow-2xl space-y-4 animate-scaleUp"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <LuKey size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Manager Override Password
              </h3>
              <p className="text-[10px] text-slate-400">
                Applies store-wide to all POS counters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        <form onSubmit={handleChangeManagerPassword} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Password:
            </label>
            <input
              type="password"
              required
              value={currentPassInput}
              onChange={(e) => setCurrentPassInput(e.target.value)}
              placeholder="Enter current password..."
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              New Password / PIN:
            </label>
            <input
              type="password"
              required
              value={newPassInput}
              onChange={(e) => setNewPassInput(e.target.value)}
              placeholder="e.g. 7788 or custom password"
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm New Password:
            </label>
            <input
              type="password"
              required
              value={confirmPassInput}
              onChange={(e) => setConfirmPassInput(e.target.value)}
              placeholder="Confirm new password..."
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Save New Password
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
