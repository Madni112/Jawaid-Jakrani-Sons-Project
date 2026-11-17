import React from 'react';
import {
  MdLink,
  MdClose,
  MdCheck,
  MdSwapHoriz,
} from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface LinkSalesmanModalProps {
  selectedSalesmanToLink: any;
  setSelectedSalesmanToLink: (salesman: any) => void;
  salesmenList: any[];
  selectedPartnerNames: string[];
  setSelectedPartnerNames: React.Dispatch<React.SetStateAction<string[]>>;
  togglePartnerName: (name: string) => void;
  syncBidirectional: boolean;
  setSyncBidirectional: (val: boolean) => void;
  handleSaveSalesmanLinks: () => void;
  savingLinks: boolean;
}

export const LinkSalesmanModal: React.FC<LinkSalesmanModalProps> = ({
  selectedSalesmanToLink,
  setSelectedSalesmanToLink,
  salesmenList,
  selectedPartnerNames,
  setSelectedPartnerNames,
  togglePartnerName,
  syncBidirectional,
  setSyncBidirectional,
  handleSaveSalesmanLinks,
  savingLinks,
}) => {
  if (!selectedSalesmanToLink) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xl max-w-xl w-full p-6 space-y-5 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MdLink size={20} />
            </span>
            <div>
              <h3 className="font-bold text-base text-black dark:text-white">
                Link Partner Salesmen with: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{selectedSalesmanToLink.name}</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Select the other salesmen who can create invoices on behalf of {selectedSalesmanToLink.name} and share dashboard views.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedSalesmanToLink(null)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Checklist of other salesmen */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2">
            Choose Partner Salesmen (Select Multiple):
          </span>

          {salesmenList
            .filter((s: any) => s.id !== selectedSalesmanToLink.id && s.name !== selectedSalesmanToLink.name)
            .map((candidate: any) => {
              const isChecked = selectedPartnerNames.includes(candidate.name);

              return (
                <label
                  key={candidate.id}
                  onClick={() => togglePartnerName(candidate.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                    isChecked
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-black dark:text-white'
                      : 'bg-gray-50 dark:bg-meta-4/20 border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-xs">{candidate.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        Prefix: <b className="text-emerald-700 dark:text-emerald-300">{candidate.invoice_name || (candidate.invoice_names && candidate.invoice_names[0]) || 'N/A'}-</b> | {candidate.phone || 'No Phone'}
                      </div>
                    </div>
                  </div>

                  {isChecked && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MdCheck /> Linked
                    </span>
                  )}
                </label>
              );
            })}

          {salesmenList.filter((s: any) => s.id !== selectedSalesmanToLink.id).length === 0 && (
            <div className="text-xs text-gray-400 text-center py-6">
              No other salesmen registered to link with.
            </div>
          )}
        </div>

        {/* Sync Bidirectional Option */}
        <div className="p-3.5 bg-slate-50 dark:bg-meta-4/30 rounded-xl border border-stroke dark:border-strokedark">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncBidirectional}
              onChange={e => setSyncBidirectional(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1">
                <MdSwapHoriz className="text-emerald-600 text-sm" /> Automatically Sync Bidirectional Links (Recommended)
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                When enabled, linking {selectedSalesmanToLink.name} with selected partners will also automatically add {selectedSalesmanToLink.name} to each partner's list so they can all see each other.
              </p>
            </div>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={() => setSelectedPartnerNames([])}
            className="text-xs text-red-500 hover:text-red-700 font-bold transition cursor-pointer"
          >
            Clear All Links
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSalesmanToLink(null)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-meta-4/80 text-black dark:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSalesmanLinks}
              disabled={savingLinks}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingLinks ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdCheck />}
              <span>Save Partner Links ({selectedPartnerNames.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
