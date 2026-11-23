import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiMapPin, FiCheck } from 'react-icons/fi';

interface WarehouseSearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  locations: any[];
  selectedProductName?: string;
  getWarehouseStock: (productName: string, warehouseName: string) => { text: string; hasStock: boolean; qty: number };
  isTile?: boolean;
}

export const WarehouseSearchableSelect: React.FC<WarehouseSearchableSelectProps> = ({
  value,
  onChange,
  locations,
  selectedProductName,
  getWarehouseStock,
  isTile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const query = search.toLowerCase().trim();
  const filtered = locations.filter((loc) => !query || (loc.name || '').toLowerCase().includes(query));

  // Current selected location details
  const currentLocation = locations.find((l) => l.name === value) || (value ? { name: value } : null);

  return (
    <div ref={ref} className="relative w-full min-w-[210px]">
      {/* Trigger Button - Clean, professional pill styled like modern ERP inputs */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-boxdark text-black dark:text-white shadow-sm'
            : 'border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:border-primary/50 text-slate-800 dark:text-slate-200'
        }`}
        title={currentLocation ? currentLocation.name : 'Select Warehouse'}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <FiMapPin className="text-primary text-xs shrink-0" />
          <span className="truncate">
            {currentLocation ? (
              <span className="font-bold">{currentLocation.name}</span>
            ) : (
              <span className="text-slate-400 font-normal">Select Warehouse...</span>
            )}
          </span>
        </div>
        <FiChevronDown
          className={`text-slate-400 text-xs shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-[999999] w-full min-w-[290px] max-w-[340px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl p-1.5 space-y-1 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box with icon */}
          <div className="relative mb-1">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              ref={searchInputRef}
              type="text"
              autoComplete="off"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filtered[highlightedIndex]) {
                    onChange(filtered[highlightedIndex].name);
                    setIsOpen(false);
                    setSearch('');
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsOpen(false);
                  setSearch('');
                }
              }}
              placeholder="Search warehouse..."
              className="w-full bg-slate-50 dark:bg-meta-4/40 border border-slate-200 dark:border-strokedark rounded-lg pl-7 pr-3 py-1.5 text-xs text-black dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white dark:focus:bg-boxdark transition"
            />
          </div>

          {/* Warehouse Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
            {filtered.length > 0 ? (
              filtered.map((loc, lIdx) => {
                const stock = getWarehouseStock(selectedProductName || '', loc.name);
                const isSelected = value === loc.name;
                const isHighlighted = highlightedIndex === lIdx;

                return (
                  <div
                    key={loc.id || lIdx}
                    onMouseEnter={() => setHighlightedIndex(lIdx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(loc.name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-2.5 py-2 rounded-lg cursor-pointer text-xs flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isSelected ? (
                        <FiCheck className="text-primary text-xs shrink-0" />
                      ) : (
                        <FiMapPin className="text-slate-400 text-xs shrink-0" />
                      )}
                      <span className="truncate font-semibold">{loc.name}</span>
                    </div>

                    <div className="shrink-0 text-right">
                      {selectedProductName ? (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                            isSelected
                              ? 'bg-primary text-white shadow-xs'
                              : stock.hasStock
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        >
                          Stock: {stock.text}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No item chosen</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 italic">No matching warehouse found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseSearchableSelect;
