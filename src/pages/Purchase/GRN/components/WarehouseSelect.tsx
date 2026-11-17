import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LocationItem } from '../types/grnTypes';

interface WarehouseSelectProps {
  locations: LocationItem[];
  selectedWarehouse: string;
  onSelect: (whName: string) => void;
  productName?: string;
  getLocationStock: (prodName: string, whName: string) => number;
}

export const WarehouseSelect: React.FC<WarehouseSelectProps> = ({
  locations,
  selectedWarehouse,
  onSelect,
  productName = '',
  getLocationStock,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const query = (isOpen ? search : '').toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!query) return locations || [];
    return (locations || []).filter(l => String(l?.name || '').toLowerCase().includes(query));
  }, [locations, query]);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={isOpen ? search : (selectedWarehouse || '')}
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
            setHighlightedIndex(0);
          }}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex(prev => prev < filtered.length - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex(prev => prev > 0 ? prev - 1 : filtered.length - 1);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered[highlightedIndex]) {
                onSelect(filtered[highlightedIndex].name);
                setIsOpen(false);
                setSearch('');
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
              setSearch('');
            }
          }}
          placeholder="Search warehouse..."
          className="w-full rounded border border-stroke dark:border-strokedark p-2 pr-6 bg-white dark:bg-boxdark font-bold text-xs outline-none focus:border-primary shadow-xs"
        />
        <span
          onClick={() => {
            setIsOpen(prev => !prev);
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

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-[999999] min-w-[260px] w-full max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-xl shadow-2xl divide-y divide-stroke dark:divide-strokedark">
          {filtered.length > 0 ? (
            filtered.map((l, lIdx) => {
              const stock = productName ? getLocationStock(productName, l.name) : 0;
              const isSelected = l.name === selectedWarehouse;
              const isHighlighted = highlightedIndex === lIdx;
              return (
                <div
                  key={l.name || lIdx}
                  onMouseEnter={() => setHighlightedIndex(lIdx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(l.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-2.5 cursor-pointer text-xs flex items-center justify-between transition ${
                    isHighlighted || isSelected
                      ? 'bg-primary/10 border-l-4 border-primary text-black dark:text-white font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold block truncate">{l.name}</span>
                    {l.location_type && (
                      <span className="text-[9px] text-gray-400 uppercase">{l.location_type}</span>
                    )}
                  </div>
                  {productName && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-300 shrink-0">
                      Stock: {stock}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 italic">No warehouses found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarehouseSelect;

