import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MdFormatColorFill,
  MdClose,
  MdAdd,
  MdCheck,
  MdDeleteOutline,
  MdKeyboardArrowDown
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import {
  fetchProductColors,
  saveNewProductColor,
  deleteProductColor,
  getSwatchColor,
  DEFAULT_PRODUCT_COLORS
} from '../utils/colorService';

interface SearchableColorDropdownProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  showLabel?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchableColorDropdown: React.FC<SearchableColorDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search or add color/shade...',
  label = 'Color / Shade',
  showLabel = true,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [colors, setColors] = useState<string[]>(DEFAULT_PRODUCT_COLORS);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load colors on mount & keep in sync with cloud events
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const list = await fetchProductColors();
        if (isMounted && list.length > 0) {
          setColors(list);
        }
      } catch (e) {
        console.warn('Failed to load colors:', e);
      }
    };
    load();

    const handleSync = (e: any) => {
      if (e.detail?.colors && Array.isArray(e.detail.colors)) {
        setColors(e.detail.colors);
      } else {
        load();
      }
    };

    window.addEventListener('zac_colors_updated', handleSync);
    window.addEventListener('erp_system_permissions_updated', load);

    return () => {
      isMounted = false;
      window.removeEventListener('zac_colors_updated', handleSync);
      window.removeEventListener('erp_system_permissions_updated', load);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered options based on search query
  const filteredColors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter((c) => c.toLowerCase().includes(q));
  }, [colors, query]);

  // Check if query is a new color not in list
  const showAddOption = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return !colors.some((c) => c.toLowerCase() === q.toLowerCase());
  }, [colors, query]);

  const totalOptions = filteredColors.length + (showAddOption ? 1 : 0);

  // Reset highlight index when query or open state changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  // Keep highlighted item visible on scroll
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectColor = (selected: string) => {
    onChange(selected);
    setQuery('');
    setIsOpen(false);
  };

  const handleAddNewColor = async (colorToAdd?: string) => {
    const name = (colorToAdd || query).trim();
    if (!name) return;
    setIsSaving(true);
    try {
      const res = await saveNewProductColor(name);
      if (res.success) {
        setColors(res.colors);
        onChange(name);
        setQuery('');
        setIsOpen(false);
        toast.success(`Color "${name}" saved to database!`);
      } else {
        toast.error(res.error || 'Failed to save color to database');
      }
    } catch (err: any) {
      toast.error('Error saving color: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteColor = async (e: React.MouseEvent, colorToDelete: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete color "${colorToDelete}" from database?`)) return;

    try {
      const res = await deleteProductColor(colorToDelete);
      if (res.success) {
        setColors(res.colors);
        if (value.toLowerCase() === colorToDelete.toLowerCase()) {
          onChange('');
        }
        toast.success(`Color "${colorToDelete}" removed`);
      }
    } catch (err: any) {
      toast.error('Failed to remove color: ' + err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalOptions > 0) {
        setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalOptions > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showAddOption && highlightedIndex === filteredColors.length) {
        handleAddNewColor();
      } else if (filteredColors[highlightedIndex]) {
        handleSelectColor(filteredColors[highlightedIndex]);
      } else if (query.trim()) {
        handleAddNewColor();
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
            <MdFormatColorFill className="text-emerald-600 text-sm" />
            <span>
              {label} {required && <span className="text-rose-500">*</span>}
            </span>
          </label>
          <span className="text-[10px] text-slate-400 font-normal">
            {required ? 'Required' : 'Searchable & Addable'}
          </span>
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Left Color Swatch Indicator (if value selected) */}
        {value && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm shrink-0"
              style={{ backgroundColor: getSwatchColor(value) }}
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? query : value}
          placeholder={isOpen ? 'Type to filter or add new...' : placeholder}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery(value || '');
          }}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 outline-none transition text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 ${
            value ? 'pl-9 pr-16' : 'pr-12'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
        />

        {/* Right action icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              title="Clear Color"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => {
                onChange('');
                setQuery('');
              }}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <MdClose className="text-xs" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                if (!isOpen) setQuery(value || '');
              }
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <MdKeyboardArrowDown
              className={`text-sm transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[220px] max-h-[260px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
        >
          {filteredColors.length > 0 ? (
            filteredColors.map((colorName, idx) => {
              const isSelected = value.toLowerCase() === colorName.toLowerCase();
              const isHighlighted = idx === highlightedIndex;
              const swatch = getSwatchColor(colorName);

              return (
                <div
                  key={colorName}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectColor(colorName);
                  }}
                  className={`p-2.5 px-3 cursor-pointer transition text-xs font-semibold flex items-center justify-between group ${
                    isHighlighted
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm shrink-0"
                      style={{ backgroundColor: swatch }}
                    />
                    <span className="truncate">{colorName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                        <MdCheck className="text-xs" />
                        Selected
                      </span>
                    )}

                    {/* Allow deleting custom colors (except standard ones) */}
                    {!DEFAULT_PRODUCT_COLORS.slice(0, 10).some(
                      (d) => d.toLowerCase() === colorName.toLowerCase()
                    ) && (
                      <button
                        type="button"
                        title={`Delete ${colorName}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => handleDeleteColor(e, colorName)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                      >
                        <MdDeleteOutline className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              No matching colors found
            </div>
          )}

          {/* Add New Color Option */}
          {showAddOption && (
            <div
              onMouseEnter={() => setHighlightedIndex(filteredColors.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddNewColor();
              }}
              className={`p-3 text-xs font-bold cursor-pointer border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 transition ${
                highlightedIndex === filteredColors.length
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <MdAdd className="text-sm" />
                </div>
                <span>
                  + Add <span className="underline">"{query.trim()}"</span> to Database
                </span>
              </div>
              <span className="text-[10px] font-normal uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                {isSaving ? 'Saving...' : 'Press Enter'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableColorDropdown;
