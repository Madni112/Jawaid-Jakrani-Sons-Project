import React, { useState, useEffect, useRef } from 'react';
import { MdSearch, MdClose, MdKeyboardArrowDown, MdEdit, MdDelete, MdCheck, MdAdd } from 'react-icons/md';

export interface COAOptionItem {
  name: string;
  isDefault?: boolean;
  category_name?: string;
  sub_category_name?: string;
}

interface COASearchableSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: COAOptionItem[] | string[];
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  typeName: string; // 'Category' | 'Sub-Category' | 'Control'
  onAdd?: (name: string) => Promise<boolean | void>;
  onEdit?: (oldName: string, newName: string) => Promise<boolean | void>;
  onDelete?: (name: string) => void;
}

export const COASearchableSelect: React.FC<COASearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = false,
  typeName,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inline edit state
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Inline add state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addInputVal, setAddInputVal] = useState('');
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to string list
  const normalizedOptions: string[] = Array.from(
    new Set(
      (options || []).map((opt) => (typeof opt === 'string' ? opt : opt.name)).filter(Boolean)
    )
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setEditingItem(null);
        setIsAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setEditingItem(null);
      setIsAddingNew(false);
    }
  }, [isOpen]);

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const exactMatchExists = normalizedOptions.some(
    (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleStartEdit = (e: React.MouseEvent, optName: string) => {
    e.stopPropagation();
    setEditingItem(optName);
    setEditInputVal(optName);
  };

  const handleSaveEdit = async (e: React.MouseEvent, oldName: string) => {
    e.stopPropagation();
    const cleanNew = editInputVal.trim();
    if (!cleanNew || cleanNew === oldName) {
      setEditingItem(null);
      return;
    }
    if (onEdit) {
      try {
        setIsSavingEdit(true);
        await onEdit(oldName, cleanNew);
        if (value === oldName) {
          onChange(cleanNew);
        }
        setEditingItem(null);
      } finally {
        setIsSavingEdit(false);
      }
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(null);
    setEditInputVal('');
  };

  const handleDelete = (e: React.MouseEvent, optName: string) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(optName);
    }
  };

  const handleSaveAdd = async (nameToAdd?: string) => {
    const cleanVal = (nameToAdd || addInputVal).trim();
    if (!cleanVal) return;
    if (onAdd) {
      try {
        setIsSavingAdd(true);
        await onAdd(cleanVal);
        onChange(cleanVal);
        setIsAddingNew(false);
        setAddInputVal('');
        setSearchQuery('');
        setIsOpen(false);
      } finally {
        setIsSavingAdd(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 text-xs">
      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full h-10 px-3 rounded border flex items-center justify-between cursor-pointer transition select-none bg-white dark:bg-boxdark ${
          error
            ? 'border-red-500'
            : isOpen
            ? 'border-primary ring-1 ring-primary/20'
            : 'border-stroke dark:border-strokedark'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : 'hover:border-primary/80'}`}
      >
        <span className={`truncate font-semibold ${value ? 'text-black dark:text-white font-bold' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <MdKeyboardArrowDown
          size={18}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-xl overflow-hidden animate-fade-in text-xs max-h-80 flex flex-col">
          {/* Search Box Header */}
          <div className="p-2 border-b border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20 flex items-center gap-2">
            <MdSearch size={16} className="text-gray-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${typeName}...`}
              className="w-full bg-transparent outline-none text-xs text-black dark:text-white placeholder-gray-400 font-medium"
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-black dark:hover:text-white p-0.5"
              >
                <MdClose size={14} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-52 divide-y divide-stroke/30 dark:divide-strokedark/30">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-gray-400 italic">
                No matching {typeName} found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                const isCurrentlyEditing = editingItem === opt;

                if (isCurrentlyEditing) {
                  return (
                    <div
                      key={opt}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-amber-50/60 dark:bg-amber-950/20 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editInputVal}
                        onChange={(e) => setEditInputVal(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white dark:bg-boxdark border border-amber-400 rounded outline-none text-xs font-bold text-black dark:text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(e as any, opt);
                          if (e.key === 'Escape') handleCancelEdit(e as any);
                        }}
                      />
                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={(e) => handleSaveEdit(e, opt)}
                        className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        title="Save Changes"
                      >
                        <MdCheck size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition"
                        title="Cancel"
                      >
                        <MdClose size={14} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 flex items-center justify-between group cursor-pointer transition ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20'
                        : 'text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, opt)}
                          className="p-1 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                          title={`Edit ${typeName}`}
                        >
                          <MdEdit size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, opt)}
                          className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title={`Delete ${typeName}`}
                        >
                          <MdDelete size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Option Footer */}
          {onAdd && (
            <div className="p-2 border-t border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20">
              {isAddingNew ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={addInputVal}
                    onChange={(e) => setAddInputVal(e.target.value)}
                    placeholder={`New ${typeName} name...`}
                    className="flex-1 px-2.5 py-1.5 rounded border border-primary bg-white dark:bg-boxdark text-xs text-black dark:text-white outline-none font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveAdd();
                      if (e.key === 'Escape') setIsAddingNew(false);
                    }}
                  />
                  <button
                    type="button"
                    disabled={isSavingAdd || !addInputVal.trim()}
                    onClick={() => handleSaveAdd()}
                    className="px-2.5 py-1.5 rounded bg-primary text-white font-bold hover:bg-opacity-90 transition disabled:opacity-50 text-[11px]"
                  >
                    {isSavingAdd ? '...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setAddInputVal('');
                    }}
                    className="p-1.5 rounded text-gray-500 hover:text-black dark:hover:text-white transition"
                  >
                    <MdClose size={15} />
                  </button>
                </div>
              ) : searchQuery && !exactMatchExists ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveAdd(searchQuery.trim());
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition cursor-pointer"
                >
                  <MdAdd size={16} /> Add "{searchQuery.trim()}" as new {typeName}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingNew(true);
                    setAddInputVal(searchQuery.trim());
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition cursor-pointer"
                >
                  <MdAdd size={16} /> + Add New {typeName}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default COASearchableSelect;
