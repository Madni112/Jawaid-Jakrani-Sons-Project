import React, { useState, useEffect } from 'react';
import { LuPlus, LuKey } from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { posService, PosTerminalCounter, PosCashierUser } from '../../service/posService';
import { TerminalSummaryStats } from './terminals/components/TerminalSummaryStats';
import { TerminalCard } from './terminals/components/TerminalCard';
import { TerminalModal } from './terminals/components/TerminalModal';
import { ChangeManagerPasswordModal } from './terminals/components/ChangeManagerPasswordModal';
import { ViewCashierPinsModal } from './terminals/components/ViewCashierPinsModal';

export const POSTerminalsManager: React.FC = () => {
  const [terminals, setTerminals] = useState<PosTerminalCounter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<PosTerminalCounter | null>(null);

  // Form State for Counter
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [requireDiscount, setRequireDiscount] = useState(true);
  const [requireRefund, setRequireRefund] = useState(true);
  const [active, setActive] = useState(true);
  const [cashiers, setCashiers] = useState<PosCashierUser[]>([]);

  // Change Password Modal State
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Secure View PINs Modal State
  const [viewingPinsTerminal, setViewingPinsTerminal] = useState<PosTerminalCounter | null>(null);

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
    setRequireDiscount(term.require_manager_for_discount ?? true);
    setRequireRefund(term.require_manager_for_refund ?? true);
    setActive(term.active ?? true);
    setCashiers(term.assigned_cashiers && term.assigned_cashiers.length > 0 ? [...term.assigned_cashiers] : []);
    setIsModalOpen(true);
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
      manager_override_password: posService.getGlobalManagerPassword(),
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
            Configure store checkout counters with dedicated direct links (e.g.{' '}
            <span className="font-mono text-primary font-bold">/pos1</span>), assign staff PINs, and manage the unified
            store Manager Override password.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsChangePassModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LuKey size={15} className="text-amber-500" />
            <span>Change Manager Password</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <LuPlus size={16} />
            <span>+ Add New POS Counter</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <TerminalSummaryStats
        terminals={terminals}
        totalCashiers={totalCashiers}
        onChangePasswordClick={() => setIsChangePassModalOpen(true)}
      />

      {/* Terminals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {terminals.map((term) => (
          <TerminalCard
            key={term.id}
            term={term}
            copiedSlug={copiedSlug}
            onCopyLink={handleCopyLink}
            onViewPins={(t) => setViewingPinsTerminal(t)}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        ))}

        {/* Add Another Counter Action Card */}
        <div
          onClick={openCreateModal}
          className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/60 bg-white/50 dark:bg-[#111622]/40 hover:bg-primary/5 p-6 transition cursor-pointer flex flex-col items-center justify-center text-center min-h-[300px] group shadow-2xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition flex items-center justify-center text-xl mb-3 shadow-xs">
            <LuPlus size={22} />
          </div>
          <h4 className="font-black text-sm text-slate-900 dark:text-white">
            Add Another POS Counter
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
            Configure an additional checkout register, tablet station, or department counter.
          </p>
          <span className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition">
            + New Counter
          </span>
        </div>
      </div>

      {/* Modal 1: Create / Edit POS Terminal & Cashiers */}
      {isModalOpen && (
        <TerminalModal
          editingTerminal={editingTerminal}
          name={name}
          slug={slug}
          location={location}
          requireDiscount={requireDiscount}
          requireRefund={requireRefund}
          active={active}
          cashiers={cashiers}
          onNameChange={setName}
          onSlugChange={setSlug}
          onLocationChange={setLocation}
          onRequireDiscountChange={setRequireDiscount}
          onRequireRefundChange={setRequireRefund}
          onActiveChange={setActive}
          onCashiersChange={setCashiers}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Modal 2: Change Unified Manager Override Password */}
      {isChangePassModalOpen && (
        <ChangeManagerPasswordModal onClose={() => setIsChangePassModalOpen(false)} />
      )}

      {/* Modal 3: View Cashier Security PINs */}
      {viewingPinsTerminal && (
        <ViewCashierPinsModal
          terminal={viewingPinsTerminal}
          onClose={() => setViewingPinsTerminal(null)}
        />
      )}
    </div>
  );
};

export default POSTerminalsManager;
