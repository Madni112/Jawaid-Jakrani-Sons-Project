import React from 'react';
import { MdPerson, MdClear } from 'react-icons/md';

interface ReturnReceiptCustomerSelectProps {
  customerContainerRef: React.RefObject<HTMLDivElement | null>;
  customerSearchQuery: string;
  setCustomerSearchQuery: (val: string) => void;
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (val: boolean) => void;
  highlightedCustomerIndex: number;
  setHighlightedCustomerIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredCustomers: any[];
  selectedCustomer: string;
  isEditMode: boolean;
  handleSelectCustomer: (cust: any) => void;
  handleClearCustomer: () => void;
}

export const ReturnReceiptCustomerSelect: React.FC<ReturnReceiptCustomerSelectProps> = ({
  customerContainerRef,
  customerSearchQuery,
  setCustomerSearchQuery,
  isCustomerDropdownOpen,
  setIsCustomerDropdownOpen,
  highlightedCustomerIndex,
  setHighlightedCustomerIndex,
  filteredCustomers,
  selectedCustomer,
  isEditMode,
  handleSelectCustomer,
  handleClearCustomer,
}) => {
  return (
    <div className="relative" ref={customerContainerRef as any}>
      <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1 flex items-center gap-1.5">
        <MdPerson size={15} className="text-emerald-600" /> Target Customer Account: *
      </label>

      <div className="relative">
        <input
          type="text"
          disabled={isEditMode}
          value={customerSearchQuery}
          onFocus={() => setIsCustomerDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedCustomerIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedCustomerIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filteredCustomers[highlightedCustomerIndex]) {
                handleSelectCustomer(filteredCustomers[highlightedCustomerIndex]);
              }
            } else if (e.key === 'Escape') {
              setIsCustomerDropdownOpen(false);
            }
          }}
          onChange={(e) => {
            setCustomerSearchQuery(e.target.value);
            setIsCustomerDropdownOpen(true);
            setHighlightedCustomerIndex(0);
            if (!e.target.value) {
              handleClearCustomer();
            }
          }}
          placeholder="Type to search customer name, contact or phone..."
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedCustomer && !isEditMode && (
            <button
              type="button"
              onClick={handleClearCustomer}
              className="text-slate-400 hover:text-rose-500 cursor-pointer"
            >
              <MdClear size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Customer Autocomplete Dropdown */}
      {isCustomerDropdownOpen && !isEditMode && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((cust, cIdx) => (
              <div
                key={cust.id || cIdx}
                onMouseEnter={() => setHighlightedCustomerIndex(cIdx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectCustomer(cust);
                }}
                className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
                  highlightedCustomerIndex === cIdx || selectedCustomer === (cust.customer_name || cust.name)
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">{cust.customer_name || cust.name}</span>
                  {(cust.contact_name || cust.contact_person || cust.cell_no || cust.phone) && (
                    <span className="text-[10px] text-slate-400">
                      {cust.contact_name || cust.contact_person} {cust.cell_no || cust.phone ? `• ${cust.cell_no || cust.phone}` : ''}
                    </span>
                  )}
                </div>
                {cust.city && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-medium">
                    {cust.city}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              No matching customer accounts found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
