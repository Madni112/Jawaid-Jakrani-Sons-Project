import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MdPointOfSale } from 'react-icons/md';
import { LuX, LuSettings, LuUsers, LuPlus, LuShieldCheck, LuEyeOff, LuEye, LuTrash2 } from 'react-icons/lu';
import { PosTerminalCounter, PosCashierUser } from '../../../../service/posService';

interface TerminalModalProps {
  editingTerminal: PosTerminalCounter | null;
  name: string;
  slug: string;
  location: string;
  requireDiscount: boolean;
  requireRefund: boolean;
  active: boolean;
  cashiers: PosCashierUser[];
  onNameChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onRequireDiscountChange: (val: boolean) => void;
  onRequireRefundChange: (val: boolean) => void;
  onActiveChange: (val: boolean) => void;
  onCashiersChange: React.Dispatch<React.SetStateAction<PosCashierUser[]>>;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  editingTerminal,
  name,
  slug,
  location,
  requireDiscount,
  requireRefund,
  active,
  cashiers,
  onNameChange,
  onSlugChange,
  onLocationChange,
  onRequireDiscountChange,
  onRequireRefundChange,
  onActiveChange,
  onCashiersChange,
  onClose,
  onSave
}) => {
  const [modalTab, setModalTab] = useState<'settings' | 'cashiers'>('settings');
  const [showEditPins, setShowEditPins] = useState<Record<string, boolean>>({});

  const handleAddCashierRow = () => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onCashiersChange((prev) => [
      ...prev,
      {
        id: `cashier-${Date.now()}`,
        name: `Staff Member ${prev.length + 1}`,
        pin_code: String(Math.floor(1000 + Math.random() * 9000)),
        role: 'cashier',
        active: true,
        avatar_color: randomColor
      }
    ]);
  };

  const handleUpdateCashier = (id: string, field: keyof PosCashierUser, value: any) => {
    onCashiersChange((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCashier = (id: string) => {
    onCashiersChange((prev) => prev.filter((c) => c.id !== id));
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[70vw] h-[70vh] rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#111622]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MdPointOfSale size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {editingTerminal ? `Edit ${editingTerminal.name}` : 'Create New POS Counter'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure counter URL slug, override security & cashier PINs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <LuSettings size={13} />
            <span>Counter & Security</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('cashiers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'cashiers'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <LuUsers size={13} />
            <span>Assigned Cashiers</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                modalTab === 'cashiers'
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cashiers.length}
            </span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5">
            {modalTab === 'settings' ? (
              /* TAB 1: COUNTER SETTINGS & SECURITY */
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Counter / Terminal Name *:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g. Register 02 (Lawn Section)"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>URL Slug *:</span>
                      <span className="text-[10px] font-mono text-primary font-bold">
                        /{slug || 'pos'}
                      </span>
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 overflow-hidden px-2.5">
                      <span className="text-xs text-slate-400 font-mono">/</span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) =>
                          onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                        }
                        placeholder="pos2"
                        className="w-full px-1.5 py-2 text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status:
                    </label>
                    <select
                      value={active ? 'active' : 'inactive'}
                      onChange={(e) => onActiveChange(e.target.value === 'active')}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="active">Active (Online & Accessible)</option>
                      <option value="inactive">Inactive (Disabled)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Physical Store Location:
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => onLocationChange(e.target.value)}
                    placeholder="e.g. Ground Floor, Counter 1"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Security / Manager Override Box */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <LuShieldCheck className="text-amber-600 dark:text-amber-400" size={16} />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        Manager Override Protection
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full">
                      Master PIN Active
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Enforces master password approval for cashiers on this terminal:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={requireDiscount}
                        onChange={(e) => onRequireDiscountChange(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Require for Discounts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={requireRefund}
                        onChange={(e) => onRequireRefundChange(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Require for Refunds</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: CASHIERS & QUICK PINS */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Authorized Cashiers & Quick PINs
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Cashiers select their profile & enter their PIN to open a shift.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCashierRow}
                    className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <LuPlus size={13} />
                    <span>Add Cashier</span>
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1">
                  {cashiers.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                      <LuUsers className="mx-auto text-2xl text-slate-400 opacity-60" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        No cashiers assigned yet
                      </p>
                      <button
                        type="button"
                        onClick={handleAddCashierRow}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        + Add First Cashier
                      </button>
                    </div>
                  ) : (
                    cashiers.map((cashier) => (
                      <div
                        key={cashier.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2"
                      >
                        {/* Avatar Badge */}
                        <div
                          className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cashier.avatar_color || '#3b82f6' }}
                        >
                          {(cashier.name || 'C').charAt(0).toUpperCase()}
                        </div>

                        {/* Cashier Name */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            value={cashier.name}
                            onChange={(e) => handleUpdateCashier(cashier.id, 'name', e.target.value)}
                            placeholder="Cashier Name"
                            className="w-full px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        {/* PIN */}
                        <div className="w-28 shrink-0">
                          <div className="flex items-center gap-1 bg-white dark:bg-[#111622] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">PIN:</span>
                            <input
                              type={showEditPins[cashier.id] ? 'text' : 'password'}
                              maxLength={6}
                              required
                              value={cashier.pin_code}
                              onChange={(e) =>
                                handleUpdateCashier(cashier.id, 'pin_code', e.target.value.replace(/\D/g, ''))
                              }
                              placeholder="1234"
                              className="w-full text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowEditPins((prev) => ({
                                  ...prev,
                                  [cashier.id]: !prev[cashier.id]
                                }))
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer shrink-0 p-0.5"
                              title={showEditPins[cashier.id] ? 'Hide PIN' : 'Reveal PIN'}
                            >
                              {showEditPins[cashier.id] ? <LuEyeOff size={13} /> : <LuEye size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="w-28 shrink-0">
                          <select
                            value={cashier.role}
                            onChange={(e) => handleUpdateCashier(cashier.id, 'role', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                          >
                            <option value="cashier">Cashier</option>
                            <option value="lead_cashier">Lead Cashier</option>
                            <option value="supervisor">Supervisor</option>
                          </select>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCashier(cashier.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                          title="Remove cashier"
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111622]/90 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono text-slate-400">
              /{slug || 'pos'} • {cashiers.length} Cashiers
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                {editingTerminal ? 'Save Changes' : 'Create POS Counter'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
