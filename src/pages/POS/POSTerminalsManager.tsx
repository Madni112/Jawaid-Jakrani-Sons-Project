import React, { useState, useEffect } from 'react';
import {
  LuPlus,
  LuExternalLink,
  LuLock,
  LuKey,
  LuShieldCheck,
  LuUsers,
  LuTrash2,
  LuPencil,
  LuCopy,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuStore,
  LuSparkles,
  LuX
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { posService, PosTerminalCounter, PosCashierUser } from '../../service/posService';

export const POSTerminalsManager: React.FC = () => {
  const [terminals, setTerminals] = useState<PosTerminalCounter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<PosTerminalCounter | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [managerPassword, setManagerPassword] = useState('7788');
  const [requireDiscount, setRequireDiscount] = useState(true);
  const [requireRefund, setRequireRefund] = useState(true);
  const [active, setActive] = useState(true);
  const [cashiers, setCashiers] = useState<PosCashierUser[]>([]);

  // Show passwords state
  const [showManagerPass, setShowManagerPass] = useState<Record<string, boolean>>({});
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadTerminals = () => {
    setTerminals(posService.getTerminals());
  };

  useEffect(() => {
    loadTerminals();
  }, []);

  const openCreateModal = () => {
    setEditingTerminal(null);
    const nextNum = terminals.length + 1;
    setName(`Register 0${nextNum} (Counter ${nextNum})`);
    setSlug(`pos${nextNum}`);
    setLocation('Main Floor');
    setManagerPassword('7788');
    setRequireDiscount(true);
    setRequireRefund(true);
    setActive(true);
    setCashiers([
      {
        id: `cashier-${Date.now()}`,
        name: 'New Cashier',
        pin_code: '1234',
        password: '',
        role: 'cashier',
        active: true,
        avatar_color: '#3b82f6'
      }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (term: PosTerminalCounter) => {
    setEditingTerminal(term);
    setName(term.name);
    setSlug(term.slug);
    setLocation(term.location || '');
    setManagerPassword(term.manager_override_password || '7788');
    setRequireDiscount(term.require_manager_for_discount ?? true);
    setRequireRefund(term.require_manager_for_refund ?? true);
    setActive(term.active ?? true);
    setCashiers(term.assigned_cashiers && term.assigned_cashiers.length > 0 ? [...term.assigned_cashiers] : []);
    setIsModalOpen(true);
  };

  const handleAddCashierRow = () => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setCashiers((prev) => [
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
    setCashiers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCashier = (id: string) => {
    setCashiers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanSlug) {
      toast.error('Terminal URL slug is required (e.g. pos1)');
      return;
    }
    if (!name.trim()) {
      toast.error('Terminal name is required');
      return;
    }
    if (!managerPassword.trim()) {
      toast.error('Manager Override Password is required');
      return;
    }

    // Check slug collision
    const existing = posService.getTerminalBySlug(cleanSlug);
    if (existing && existing.id !== editingTerminal?.id) {
      toast.error(`A terminal with URL /${cleanSlug} already exists! Choose another name.`);
      return;
    }

    const payload: PosTerminalCounter = {
      id: editingTerminal ? editingTerminal.id : `term-${Date.now()}`,
      name: name.trim(),
      slug: cleanSlug,
      counter_number: editingTerminal?.counter_number || terminals.length + 1,
      location: location.trim(),
      manager_override_password: managerPassword.trim(),
      require_manager_for_discount: requireDiscount,
      require_manager_for_refund: requireRefund,
      assigned_cashiers: cashiers,
      active,
      created_at: editingTerminal ? editingTerminal.created_at : new Date().toISOString()
    };

    posService.saveTerminal(payload);
    loadTerminals();
    setIsModalOpen(false);
    toast.success(editingTerminal ? `Terminal ${payload.name} updated` : `Terminal ${payload.name} created! Available at /${payload.slug}`);
  };

  const handleDelete = (id: string, termName: string) => {
    if (terminals.length <= 1) {
      toast.error('You must keep at least one active POS terminal');
      return;
    }
    if (window.confirm(`Are you sure you want to delete terminal "${termName}"?`)) {
      posService.deleteTerminal(id);
      loadTerminals();
      toast.success(`Terminal "${termName}" removed`);
    }
  };

  const handleCopyLink = (slugName: string) => {
    const fullUrl = `${window.location.origin}/${slugName}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slugName);
    toast.success(`Copied counter link: ${fullUrl}`);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const totalCashiers = terminals.reduce((sum, t) => sum + (t.assigned_cashiers?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <MdPointOfSale size={24} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              POS Terminals & Counter Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create checkout counters with dedicated direct links (e.g. <span className="font-mono text-primary font-bold">/pos1</span>), assign staff PIN credentials, and set Manager Override passwords for discounts & refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          <LuPlus size={16} />
          <span>+ Add New POS Counter</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
            <LuStore />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active POS Counters
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
              {terminals.filter((t) => t.active).length} Counters
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <LuUsers />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Cashiers
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
              {totalCashiers} Staff Members
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <LuShieldCheck />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Manager Override Protection
            </span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              Active on All Counters
            </span>
          </div>
        </div>
      </div>

      {/* Terminals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {terminals.map((term) => {
          const isShowPass = showManagerPass[term.id];
          const launchUrl = `${window.location.origin}/${term.slug}`;

          return (
            <div
              key={term.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Header with status & direct link */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/10 text-primary uppercase">
                      /{term.slug}
                    </span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white mt-1 truncate">
                      {term.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {term.location || 'Store Floor'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                      term.active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                  >
                    {term.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Direct Link Box */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="truncate font-mono text-slate-600 dark:text-slate-300 pr-2">
                    {launchUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(term.slug)}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition shrink-0 cursor-pointer"
                    title="Copy Counter Link"
                  >
                    {copiedSlug === term.slug ? (
                      <LuCheck size={14} className="text-emerald-500" />
                    ) : (
                      <LuCopy size={14} />
                    )}
                  </button>
                </div>

                {/* Manager Password Info */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <LuLock size={12} />
                      <span>Manager Override Password:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setShowManagerPass((prev) => ({
                          ...prev,
                          [term.id]: !prev[term.id]
                        }))
                      }
                      className="text-amber-700 dark:text-amber-400 hover:opacity-80 transition cursor-pointer"
                    >
                      {isShowPass ? <LuEyeOff size={13} /> : <LuEye size={13} />}
                    </button>
                  </div>
                  <div className="font-mono font-black text-sm text-amber-900 dark:text-amber-200">
                    {isShowPass ? term.manager_override_password : '••••••••'}
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                    Required on terminal for: {term.require_manager_for_discount ? 'Discounts' : ''}
                    {term.require_manager_for_discount && term.require_manager_for_refund ? ' & ' : ''}
                    {term.require_manager_for_refund ? 'Refunds' : ''}
                  </div>
                </div>

                {/* Assigned Cashiers List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Assigned Cashiers ({term.assigned_cashiers?.length || 0})
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {term.assigned_cashiers && term.assigned_cashiers.length > 0 ? (
                      term.assigned_cashiers.map((cashier) => (
                        <div
                          key={cashier.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: cashier.avatar_color || '#3b82f6' }}
                            >
                              {cashier.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {cashier.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-400 bg-white dark:bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/60">
                            PIN: {cashier.pin_code}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">No cashiers assigned yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-2">
                <a
                  href={`/${term.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LuExternalLink size={14} />
                  <span>Launch Counter</span>
                </a>

                <button
                  type="button"
                  onClick={() => openEditModal(term)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Edit Counter"
                >
                  <LuPencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(term.id, term.name)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition cursor-pointer"
                  title="Delete Counter"
                >
                  <LuTrash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE / EDIT POS TERMINAL & CASHIERS
         ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <MdPointOfSale size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {editingTerminal ? `Edit ${editingTerminal.name}` : 'Create New POS Counter'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Set counter URL slug, cashier PINs, and manager override password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Basic Counter Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Counter / Terminal Name *:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Register 02 (Lawn Section)"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>URL Path / Slug *:</span>
                    <span className="text-[10px] font-mono text-primary font-bold">
                      /{slug || 'pos'}
                    </span>
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 overflow-hidden px-2">
                    <span className="text-xs text-slate-400 font-mono">/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="pos2"
                      className="w-full px-1.5 py-2 text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Cashiers will open <code className="font-mono text-primary font-bold">{window.location.origin}/{slug || 'pos1'}</code>
                  </span>
                </div>
              </div>

              {/* Location & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Physical Store Location:
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ground Floor, Counter 1"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status:
                  </label>
                  <select
                    value={active ? 'active' : 'inactive'}
                    onChange={(e) => setActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active (Online & Accessible)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Security / Manager Override Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                <div className="flex items-center gap-2">
                  <LuShieldCheck className="text-amber-600 dark:text-amber-400" size={18} />
                  <h4 className="font-black text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    POS Manager Override Authorization
                  </h4>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  When cashiers attempt high-risk actions on this terminal, the system will block them and require this Admin/Manager password.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Manager Override Password *:
                    </label>
                    <input
                      type="text"
                      required
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      placeholder="e.g. 7788"
                      className="w-full px-3 py-2 text-xs font-mono font-black rounded-xl bg-white dark:bg-[#111622] border border-amber-500/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-2 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={requireDiscount}
                        onChange={(e) => setRequireDiscount(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Require Password for Discounts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={requireRefund}
                        onChange={(e) => setRequireRefund(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Require Password for Refunds</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Cashiers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Authorized Cashiers & Quick PINs
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Cashiers can log into this counter by selecting their name and entering their 4-digit PIN.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCashierRow}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <LuPlus size={13} />
                    <span>Add Cashier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {cashiers.map((cashier, idx) => (
                    <div
                      key={cashier.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          required
                          value={cashier.name}
                          onChange={(e) => handleUpdateCashier(cashier.id, 'name', e.target.value)}
                          placeholder="Cashier Name"
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <div className="flex items-center gap-1 bg-white dark:bg-[#111622] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">PIN:</span>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={cashier.pin_code}
                            onChange={(e) => handleUpdateCashier(cashier.id, 'pin_code', e.target.value.replace(/\D/g, ''))}
                            placeholder="1234"
                            className="w-full text-xs font-mono font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <select
                          value={cashier.role}
                          onChange={(e) => handleUpdateCashier(cashier.id, 'role', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="cashier">Cashier</option>
                          <option value="lead_cashier">Lead Cashier</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveCashier(cashier.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Remove cashier"
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  {editingTerminal ? 'Save Changes' : 'Create POS Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default POSTerminalsManager;
