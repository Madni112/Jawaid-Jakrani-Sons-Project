import React, { useState, useEffect, useRef, useMemo } from 'react';

interface UomComboboxProps {
  value: string;
  onChange: (val: string) => void;
  activeUoms: string[];
}

export const UomCombobox: React.FC<UomComboboxProps> = ({
  value,
  onChange,
  activeUoms
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return activeUoms;
    const q = search.toLowerCase().trim();
    return activeUoms.filter(u => u.toLowerCase().includes(q));
  }, [activeUoms, search]);

  return (
    <div ref={ref} className="relative w-24 mx-auto">
      <div
        onClick={() => {
          setIsOpen(prev => !prev);
          setSearch('');
        }}
        className="w-full text-center text-xs font-bold font-mono px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white hover:border-primary flex items-center justify-between cursor-pointer shadow-2xs select-none"
      >
        <span className="truncate flex-1">{value || 'PCS'}</span>
        <span className="text-[10px] text-gray-400 ml-1">▼</span>
      </div>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-[99999] w-36 max-h-48 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-2xl p-1 divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
          <div className="p-1 pb-1.5">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search UOM..."
              className="w-full text-[11px] font-mono px-2 py-1 rounded border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 outline-hidden focus:border-primary"
            />
          </div>
          <div className="max-h-36 overflow-y-auto divide-y divide-stroke dark:divide-strokedark">
            {filtered.map(u => (
              <div
                key={u}
                onMouseDown={e => {
                  e.preventDefault();
                  onChange(u);
                  setIsOpen(false);
                }}
                className={`p-1.5 cursor-pointer text-xs font-mono font-bold flex items-center justify-between transition ${
                  value === u ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-meta-4/30'
                }`}
              >
                <span>{u}</span>
                {value === u && <span className="text-[10px] text-primary">✓</span>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-2 text-center text-[11px] text-gray-400 italic">No UOM found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default UomCombobox;
