import React from 'react';
import { LuExternalLink, LuCopy, LuCheck, LuShieldCheck, LuKey, LuPencil, LuTrash2 } from 'react-icons/lu';
import { PosTerminalCounter } from '../../../../service/posService';

interface TerminalCardProps {
  term: PosTerminalCounter;
  copiedSlug: string | null;
  onCopyLink: (slug: string) => void;
  onViewPins: (term: PosTerminalCounter) => void;
  onEdit: (term: PosTerminalCounter) => void;
  onDelete: (id: string, name: string) => void;
}

export const TerminalCard: React.FC<TerminalCardProps> = ({
  term,
  copiedSlug,
  onCopyLink,
  onViewPins,
  onEdit,
  onDelete
}) => {
  const launchUrl = `${window.location.origin}/${term.slug}`;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
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
            onClick={() => onCopyLink(term.slug)}
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

        {/* Secure Manager Override Protection Badge */}
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]">
            <LuShieldCheck size={14} />
            <span>Manager Override: Protected</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Discounts & Refunds
          </span>
        </div>

        {/* Assigned Cashiers List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Cashiers ({term.assigned_cashiers?.length || 0})
            </span>
            {term.assigned_cashiers && term.assigned_cashiers.length > 0 && (
              <button
                type="button"
                onClick={() => onViewPins(term)}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                title="View secret cashier PINs in a secure popup"
              >
                <LuKey size={12} />
                <span>View PINs</span>
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
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
                  <span className="capitalize font-semibold text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60">
                    {cashier.role || 'Cashier'}
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
          onClick={() => onEdit(term)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="Edit Counter"
        >
          <LuPencil size={15} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(term.id, term.name)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition cursor-pointer"
          title="Delete Counter"
        >
          <LuTrash2 size={15} />
        </button>
      </div>
    </div>
  );
};
