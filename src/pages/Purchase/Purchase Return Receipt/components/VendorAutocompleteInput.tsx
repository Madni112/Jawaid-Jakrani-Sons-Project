import React from 'react';
import { MdPerson, MdSearch, MdClear } from 'react-icons/md';

interface VendorAutocompleteInputProps {
  isEditMode: boolean;
  vendorContainerRef: React.RefObject<HTMLDivElement>;
  vendorSearchQuery: string;
  setVendorSearchQuery: (q: string) => void;
  isVendorDropdownOpen: boolean;
  setIsVendorDropdownOpen: (open: boolean) => void;
  highlightedVendorIndex: number;
  setHighlightedVendorIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedVendor: string;
  filteredVendors: any[];
  handleSelectVendor: (vendor: any) => void;
  handleClearVendor: () => void;
}

export const VendorAutocompleteInput: React.FC<VendorAutocompleteInputProps> = ({
  isEditMode,
  vendorContainerRef,
  vendorSearchQuery,
  setVendorSearchQuery,
  isVendorDropdownOpen,
  setIsVendorDropdownOpen,
  highlightedVendorIndex,
  setHighlightedVendorIndex,
  selectedVendor,
  filteredVendors,
  handleSelectVendor,
  handleClearVendor,
}) => {
  return (
    <div className="relative" ref={vendorContainerRef}>
      <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1 flex items-center gap-1.5">
        <MdPerson size={15} className="text-emerald-600" /> Target Wholesale Vendor: *
      </label>

      <div className="relative">
        <input
          type="text"
          disabled={isEditMode}
          value={vendorSearchQuery}
          onFocus={() => setIsVendorDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedVendorIndex((prev) => Math.min(prev + 1, filteredVendors.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedVendorIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filteredVendors[highlightedVendorIndex]) {
                handleSelectVendor(filteredVendors[highlightedVendorIndex]);
              }
            } else if (e.key === 'Escape') {
              setIsVendorDropdownOpen(false);
            }
          }}
          onChange={(e) => {
            setVendorSearchQuery(e.target.value);
            setIsVendorDropdownOpen(true);
            setHighlightedVendorIndex(0);
            if (!e.target.value) {
              handleClearVendor();
            }
          }}
          placeholder="Type to search wholesale vendor name, contact or phone..."
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedVendor && !isEditMode && (
            <button
              type="button"
              onClick={handleClearVendor}
              className="text-slate-400 hover:text-rose-500 cursor-pointer"
            >
              <MdClear size={16} />
            </button>
          )}
          <MdSearch className="text-slate-400" size={18} />
        </div>
      </div>

      {/* Vendor Dropdown */}
      {isVendorDropdownOpen && !isEditMode && (
        <div className="absolute left-0 top-full mt-1.5 z-[9999] w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
          {filteredVendors.length > 0 ? (
            filteredVendors.map((vendor, vIdx) => (
              <div
                key={vendor.id}
                onMouseEnter={() => setHighlightedVendorIndex(vIdx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectVendor(vendor);
                }}
                className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
                  highlightedVendorIndex === vIdx || selectedVendor === vendor.vendor_name
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">{vendor.vendor_name}</span>
                  {(vendor.contact_name || vendor.contact_person || vendor.cell_no || vendor.phone) && (
                    <span className="text-[10px] text-slate-400">
                      {vendor.contact_name || vendor.contact_person}{' '}
                      {vendor.cell_no || vendor.phone ? `• ${vendor.cell_no || vendor.phone}` : ''}
                    </span>
                  )}
                </div>
                {vendor.city && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-medium">
                    {vendor.city}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">No matching wholesale vendors found</div>
          )}
        </div>
      )}
    </div>
  );
};
