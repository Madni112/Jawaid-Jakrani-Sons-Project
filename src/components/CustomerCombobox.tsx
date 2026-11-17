import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MdSearch, MdClose, MdPerson, MdPhone, MdLocationOn, MdPersonAdd } from 'react-icons/md';

export interface CustomerComboboxItem {
  id: string | number;
  name: string;
  phone?: string;
  address?: string;
}

interface CustomerComboboxProps {
  customers: CustomerComboboxItem[];
  value: string;
  onChange: (val: string) => void;
  onSelectCustomer?: (customer: CustomerComboboxItem | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

type ComboboxOption =
  | { type: 'add_new'; name: string }
  | { type: 'customer'; customer: CustomerComboboxItem };

export const CustomerCombobox: React.FC<CustomerComboboxProps> = ({
  customers = [],
  value = '',
  onChange,
  onSelectCustomer,
  placeholder = 'Search or enter customer name...',
  className = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out any invalid / empty customer records from DB
  const validCustomers = useMemo(() => {
    return (customers || []).filter(c => {
      if (!c) return false;
      const cleanName = String(c.name || '').trim();
      return cleanName.length > 0 && cleanName !== '-';
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return validCustomers.slice(0, 50);
    const q = query.toLowerCase().trim();
    return validCustomers
      .filter(c => {
        const name = (c.name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const addr = (c.address || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || addr.includes(q);
      })
      .slice(0, 50);
  }, [validCustomers, query]);

  const hasExactMatch = useMemo(() => {
    if (!query.trim()) return false;
    const q = query.toLowerCase().trim();
    return validCustomers.some(c => (c.name || '').toLowerCase().trim() === q);
  }, [validCustomers, query]);

  // Combined options list for unified keyboard navigation
  const options = useMemo<ComboboxOption[]>(() => {
    const list: ComboboxOption[] = [];
    if (query.trim().length > 0 && !hasExactMatch) {
      list.push({ type: 'add_new', name: query.trim() });
    }
    filteredCustomers.forEach(c => {
      list.push({ type: 'customer', customer: c });
    });
    return list;
  }, [query, hasExactMatch, filteredCustomers]);

  // Reset highlight index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [options.length, query]);

  // Scroll highlighted element into view for smooth keyboard interaction
  useEffect(() => {
    if (isOpen && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (customer: CustomerComboboxItem) => {
    setQuery(customer.name);
    onChange(customer.name);
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    setIsOpen(false);
  };

  const handleAddNew = (nameToAdd: string) => {
    const cleanName = nameToAdd.trim();
    if (!cleanName) return;
    setQuery(cleanName);
    onChange(cleanName);
    if (onSelectCustomer) {
      onSelectCustomer({
        id: `NEW-${Date.now()}`,
        name: cleanName,
        phone: '',
        address: ''
      });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    if (onSelectCustomer) {
      onSelectCustomer(null);
    }
  };

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
      setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, options.length - 1)));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (isOpen && options.length > 0 && options[highlightedIndex]) {
        if (e.key === 'Enter') e.preventDefault();
        const selected = options[highlightedIndex];
        if (selected.type === 'add_new') {
          handleAddNew(selected.name);
        } else {
          handleSelect(selected.customer);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10.5 text-xs font-semibold px-3 py-2.5 pr-8 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:ring-1 focus:ring-[var(--color-primary,#800020)] focus:outline-hidden"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
          >
            <MdClose size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-99999 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-primary,#800020)]/30 dark:border-[var(--color-primary,#800020)]/50 bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10"
        >
          {options.map((opt, idx) => {
            const isHighlighted = highlightedIndex === idx;

            if (opt.type === 'add_new') {
              return (
                <div
                  key="add-new-option"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleAddNew(opt.name);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-2.5 cursor-pointer transition flex items-center justify-between gap-2 text-xs font-bold ${
                    isHighlighted
                      ? 'bg-[var(--color-primary,#800020)]/15 text-[var(--color-primary,#800020)] dark:text-rose-200'
                      : 'bg-[var(--color-primary,#800020)]/5 hover:bg-[var(--color-primary,#800020)]/10 text-[var(--color-primary,#800020)] dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <MdPersonAdd className="shrink-0 text-base" />
                    <span>+ Add &ldquo;{opt.name}&rdquo; as New Customer</span>
                  </div>
                  <span className="text-[10px] bg-[var(--color-primary,#800020)] text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                    ↵ Enter
                  </span>
                </div>
              );
            }

            const customer = opt.customer;
            return (
              <div
                key={customer.id}
                onMouseDown={e => {
                  e.preventDefault();
                  handleSelect(customer);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`p-2.5 cursor-pointer transition flex items-center justify-between gap-2 ${
                  isHighlighted
                    ? 'bg-[var(--color-primary,#800020)]/10 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold'
                    : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold flex items-center gap-1.5 truncate">
                    <MdPerson className="text-[var(--color-primary,#800020)] dark:text-rose-300 shrink-0" />
                    <span>{customer.name}</span>
                  </p>
                  {customer.address && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <MdLocationOn className="shrink-0" />
                      <span>{customer.address}</span>
                    </p>
                  )}
                </div>
                {customer.phone && customer.phone.replace(/[-+\s]/g, '').length > 0 && (
                  <span className="text-[10px] text-[var(--color-primary,#800020)] dark:text-rose-300 font-mono flex items-center gap-1 shrink-0 bg-[var(--color-primary,#800020)]/10 px-2 py-0.5 rounded-full font-bold">
                    <MdPhone size={10} />
                    <span>{customer.phone}</span>
                  </span>
                )}
              </div>
            );
          })}

          {options.length === 0 && !query.trim() && (
            <div className="p-3 text-center text-xs text-gray-400 italic">
              Type a customer name to search or add...
            </div>
          )}

          {options.length === 0 && query.trim() && (
            <div className="p-3 text-center text-xs text-gray-400 italic">
              No matching customers found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerCombobox;
