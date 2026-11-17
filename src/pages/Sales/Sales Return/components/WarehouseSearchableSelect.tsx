import React, { useState, useRef, useEffect } from 'react';
import { DropdownPortal } from './DropdownPortal';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        (!portalRef.current || !portalRef.current.contains(target))
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const query = (isOpen ? search : '').toLowerCase().trim();
  const filtered = locations.filter((loc) => !query || (loc.name || '').toLowerCase().includes(query) || (loc.code || '').toLowerCase().includes(query));

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={isOpen ? search : value || ''}
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
            setHighlightedIndex(0);
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setSearch('');
            }
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
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
              setIsOpen(false);
              setSearch('');
            }
          }}
          placeholder={value || 'Search warehouse...'}
          className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded p-1.5 pr-6 outline-none text-xs text-black dark:text-white focus:border-primary shadow-xs truncate"
        />
        <span
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) {
              setSearch('');
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 cursor-pointer select-none"
        >
          ▼
        </span>
      </div>

      <DropdownPortal isOpen={isOpen} anchorEl={inputRef.current} minWidth={340} maxWidth={460}>
        <div
          ref={portalRef}
          className="w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin"
        >
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
                  className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                    isHighlighted || isSelected
                      ? 'bg-primary/10 border-l-4 border-primary text-black dark:text-white font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="truncate pr-2 font-bold">{loc.name}</div>
                  <div className="shrink-0 text-right">
                    {selectedProductName ? (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-primary text-white'
                            : stock.hasStock
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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
            <div className="p-3 text-center text-xs text-slate-400 italic">No warehouse found</div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default WarehouseSearchableSelect;
