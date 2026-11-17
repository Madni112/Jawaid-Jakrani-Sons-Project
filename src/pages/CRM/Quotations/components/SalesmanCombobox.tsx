import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MdClose } from 'react-icons/md';

interface SalesmanComboboxProps {
  salesmen: { id: string | number; name: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SalesmanCombobox: React.FC<SalesmanComboboxProps> = ({
  salesmen = [],
  value = '',
  onChange,
  placeholder = 'Search or select salesman...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const valid = salesmen.filter(s => s && s.name && s.name.trim().length > 0);
    if (!query.trim()) return valid;
    const q = query.toLowerCase().trim();
    return valid.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [salesmen, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filtered.length - 1)));
    } else if (e.key === 'Enter') {
      if (isOpen && filtered[highlightedIndex]) {
        e.preventDefault();
        setQuery(filtered[highlightedIndex].name);
        onChange(filtered[highlightedIndex].name);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10.5 text-xs font-semibold px-3 py-2.5 pr-8 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:ring-1 focus:ring-[var(--color-primary,#800020)] outline-hidden shadow-2xs transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <MdClose size={15} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-99999 w-full max-h-56 overflow-y-auto rounded-xl border border-[var(--color-primary,#800020)]/30 dark:border-[var(--color-primary,#800020)]/50 bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
          {filtered.length > 0 ? (
            filtered.map((s, idx) => {
              const isHighlighted = highlightedIndex === idx;
              return (
                <div
                  key={s.id || s.name}
                  onMouseDown={e => {
                    e.preventDefault();
                    setQuery(s.name);
                    onChange(s.name);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-2.5 cursor-pointer text-xs font-semibold flex items-center justify-between transition ${
                    isHighlighted
                      ? 'bg-[var(--color-primary,#800020)]/10 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold'
                      : value === s.name
                      ? 'bg-gray-100 dark:bg-meta-4/40 font-bold text-black dark:text-white'
                      : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <span>{s.name}</span>
                  {value === s.name && <span className="text-[10px] text-[var(--color-primary,#800020)] dark:text-rose-300">✓</span>}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 italic">No salesmen found</div>
          )}
        </div>
      )}
    </div>
  );
};
export default SalesmanCombobox;
