import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MdSearch, MdKeyboardArrowDown, MdCheck, MdClose } from 'react-icons/md';

export interface SearchableOption {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  swatchColor?: string;
}

export interface SearchableSelectProps {
  label?: string;
  options: (string | SearchableOption)[];
  value: string | string[];
  onChange: (val: any) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options into SearchableOption format
  const normalizedOptions: SearchableOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { id: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Selected array representation for multi-select
  const selectedArray = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value && value !== 'All') return [value];
    return [];
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return normalizedOptions;
    const q = query.toLowerCase().trim();
    return normalizedOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subLabel && o.subLabel.toLowerCase().includes(q)) ||
        o.id.toLowerCase().includes(q)
    );
  }, [normalizedOptions, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const isOptionSelected = (id: string) => {
    if (multiple) {
      if (id === 'All') {
        return selectedArray.length === 0 || selectedArray.includes('All');
      }
      return selectedArray.includes(id);
    }
    return value === id;
  };

  const handleSelect = (id: string) => {
    if (multiple) {
      if (id === 'All') {
        onChange([]);
        return;
      }
      const isAlready = selectedArray.includes(id);
      let next: string[];
      if (isAlready) {
        next = selectedArray.filter((v) => v !== id);
      } else {
        next = [...selectedArray.filter((v) => v !== 'All'), id];
      }
      onChange(next);
    } else {
      onChange(id);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSelectAllFiltered = () => {
    if (!multiple) return;
    const allFilteredIds = filtered.map((f) => f.id).filter((id) => id !== 'All');
    const combined = new Set([...selectedArray, ...allFilteredIds]);
    onChange(Array.from(combined));
  };

  const handleClearAll = () => {
    if (multiple) {
      onChange([]);
    } else {
      onChange('All');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filtered[highlightedIndex];
      if (chosen) handleSelect(chosen.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  };

  // Determine label for trigger button
  const triggerDisplay = useMemo(() => {
    if (multiple) {
      if (selectedArray.length === 0 || (selectedArray.length === 1 && selectedArray[0] === 'All')) {
        return <span className="text-slate-400">{placeholder}</span>;
      }
      if (selectedArray.length === 1) {
        const found = normalizedOptions.find((o) => o.id === selectedArray[0]);
        return (
          <div className="flex items-center gap-1.5 truncate">
            {found?.swatchColor && (
              <span
                className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                style={{ backgroundColor: found.swatchColor }}
              />
            )}
            <span className="truncate">{found ? found.label : selectedArray[0]}</span>
          </div>
        );
      }
      // Multiple items selected
      const firstOpt = normalizedOptions.find((o) => o.id === selectedArray[0]);
      return (
        <div className="flex items-center gap-1.5 truncate">
          <span className="px-1.5 py-0.5 rounded-md bg-primary text-white text-[10px] font-black shrink-0">
            {selectedArray.length} Selected
          </span>
          <span className="truncate text-slate-700 dark:text-slate-200">
            {firstOpt ? firstOpt.label : selectedArray[0]}
            {selectedArray.length > 1 ? ` +${selectedArray.length - 1} more` : ''}
          </span>
        </div>
      );
    }

    // Single select display
    const selectedOption = normalizedOptions.find((o) => o.id === value);
    if (!selectedOption) {
      return <span className="text-slate-400">{placeholder}</span>;
    }
    return (
      <div className="flex items-center gap-2 truncate">
        {selectedOption.swatchColor && (
          <span
            className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
            style={{ backgroundColor: selectedOption.swatchColor }}
          />
        )}
        {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
        <span className="truncate">{selectedOption.label}</span>
      </div>
    );
  }, [multiple, selectedArray, value, normalizedOptions, placeholder]);

  return (
    <div
      className={`relative ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        className={`w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold min-h-[38px] flex items-center justify-between gap-2 transition outline-none select-none ${
          disabled
            ? 'cursor-not-allowed bg-gray-100 dark:bg-meta-4/40'
            : 'cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20'
        }`}
      >
        <div className="truncate flex-1 min-w-0">{triggerDisplay}</div>

        <div className="flex items-center gap-1 shrink-0">
          {multiple && selectedArray.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition"
              title="Clear selection"
            >
              <MdClose size={13} />
            </button>
          )}
          <MdKeyboardArrowDown
            size={18}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full mt-1.5 z-[999999] w-full min-w-[260px] bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-xl shadow-2xl p-2 space-y-1.5">
          {/* Search Box */}
          <div className="relative">
            <MdSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <MdClose size={14} />
              </button>
            )}
          </div>

          {/* Multi-select Action Bar */}
          {multiple && (
            <div className="flex items-center justify-between px-1 py-1 text-[11px] border-b border-stroke dark:border-strokedark text-gray-500">
              <span className="font-semibold text-primary">
                {selectedArray.length} of {normalizedOptions.length - (normalizedOptions.some(o => o.id === 'All') ? 1 : 0)} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="font-bold text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* List Options */}
          <div ref={listRef} className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 italic">
                No matching options found
              </div>
            ) : (
              <>
                {filtered.slice(0, 100).map((opt, idx) => {
                  const isSelected = isOptionSelected(opt.id);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-bold'
                          : isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {multiple && opt.id !== 'All' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded text-primary border-gray-300 accent-primary pointer-events-none shrink-0"
                          />
                        )}
                        {opt.swatchColor && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                            style={{ backgroundColor: opt.swatchColor }}
                          />
                        )}
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <div className="truncate">
                          <div className="truncate">{opt.label}</div>
                          {opt.subLabel && (
                            <div className="text-[10px] text-slate-400">{opt.subLabel}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && !multiple && <MdCheck size={16} className="text-primary shrink-0" />}
                    </div>
                  );
                })}
                {filtered.length > 100 && (
                  <div className="py-1 px-2 text-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded">
                    Showing top 100 of {filtered.length} matches — type in search to narrow down
                  </div>
                )}
              </>
            )}
          </div>

          {/* Close button for multi-select */}
          {multiple && (
            <div className="pt-1 border-t border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-1 text-center bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition"
              >
                Apply Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
