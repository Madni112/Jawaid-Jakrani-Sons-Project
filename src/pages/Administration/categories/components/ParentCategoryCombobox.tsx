import React, { useState } from 'react';
import { MdClose, MdCheck, MdEdit, MdDelete } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { InventoryCategory, DeletingCategoryItem } from '../types/categoryTypes';
import { createParentCategory, updateCategoryName } from '../services/categoryService';

interface ParentCategoryComboboxProps {
  parentCategories: InventoryCategory[];
  selectedParentId: string | number;
  parentInput: string;
  tenantId?: string | null;
  deletingCategoryItem: DeletingCategoryItem | null;
  onSelectParent: (id: string | number, name: string) => void;
  onClearParent: () => void;
  onParentInputChange: (val: string) => void;
  onRequestDelete: (item: DeletingCategoryItem) => void;
  onReload: () => Promise<void>;
}

export const ParentCategoryCombobox: React.FC<ParentCategoryComboboxProps> = ({
  parentCategories,
  selectedParentId,
  parentInput,
  tenantId,
  deletingCategoryItem,
  onSelectParent,
  onClearParent,
  onParentInputChange,
  onRequestDelete,
  onReload
}) => {
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [highlightedParentIndex, setHighlightedParentIndex] = useState(0);
  const [editingParentId, setEditingParentId] = useState<string | number | null>(null);
  const [editParentInput, setEditParentInput] = useState('');

  const handleAddParentInline = async (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) {
      toast.error('Parent category name cannot be empty');
      return;
    }

    const isDuplicate = parentCategories.some(
      (c) => c.name?.toLowerCase() === clean.toLowerCase()
    );
    if (isDuplicate) {
      toast.error('Parent category already exists');
      return;
    }

    try {
      const data = await createParentCategory(clean, tenantId);
      toast.success(`Parent Category "${clean}" created!`);
      await onReload();
      if (data) {
        onSelectParent(data.id, data.name);
      }
      setIsParentDropdownOpen(false);
    } catch (err: any) {
      toast.error('Failed to create parent: ' + err.message);
    }
  };

  const handleSaveEditParent = async (
    e: React.MouseEvent | React.KeyboardEvent,
    cat: InventoryCategory
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = editParentInput.trim();
    if (!clean) {
      toast.error('Name cannot be empty');
      return;
    }
    if (
      clean.toLowerCase() !== cat.name.toLowerCase() &&
      parentCategories.some((c) => c.name?.toLowerCase() === clean.toLowerCase())
    ) {
      toast.error('Parent category with this name already exists');
      return;
    }

    try {
      await updateCategoryName(cat.id, clean);
      toast.success(`Parent Category updated to "${clean}"`);
      await onReload();
      if (selectedParentId.toString() === cat.id.toString()) {
        onParentInputChange(clean);
      }
      setEditingParentId(null);
      setEditParentInput('');
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  return (
    <div>
      <label className="block text-gray-500 mb-1.5 text-xs font-bold">
        Parent Category (e.g. Cotton, Silk, Lawn, Wool)
      </label>
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={parentInput}
          onChange={(e) => {
            onParentInputChange(e.target.value);
            setIsParentDropdownOpen(true);
            setHighlightedParentIndex(0);
            const match = parentCategories.find(
              (c) => c.name?.toLowerCase() === e.target.value.toLowerCase().trim()
            );
            if (match) {
              onSelectParent(match.id, match.name);
            } else if (selectedParentId) {
              onClearParent();
            }
          }}
          onFocus={() => {
            setIsParentDropdownOpen(true);
            setHighlightedParentIndex(0);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!editingParentId && !deletingCategoryItem) {
                setIsParentDropdownOpen(false);
                const curr = parentCategories.find(
                  (c) => c.id.toString() === selectedParentId.toString()
                );
                onParentInputChange(curr ? curr.name : '');
              }
            }, 250);
          }}
          onKeyDown={(e) => {
            const filteredParents = parentCategories.filter((c) =>
              (c.name || '').toLowerCase().includes(parentInput.toLowerCase().trim())
            );
            const showAddOption = !!(
              parentInput.trim() &&
              !parentCategories.some(
                (c) => c.name?.toLowerCase() === parentInput.trim().toLowerCase()
              )
            );
            const totalOptions = filteredParents.length + (showAddOption ? 1 : 0);

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (totalOptions > 0) {
                setHighlightedParentIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
              }
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (totalOptions > 0) {
                setHighlightedParentIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
              }
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (showAddOption && highlightedParentIndex === filteredParents.length) {
                handleAddParentInline(parentInput.trim());
              } else if (filteredParents.length > 0) {
                const selected = filteredParents[highlightedParentIndex] || filteredParents[0];
                onSelectParent(selected.id, selected.name);
                setIsParentDropdownOpen(false);
              } else if (parentInput && parentInput.trim()) {
                handleAddParentInline(parentInput.trim());
              }
            } else if (e.key === 'Tab' || e.key === 'Escape') {
              setIsParentDropdownOpen(false);
            }
          }}
          className="w-full border border-stroke rounded-lg p-2.5 pr-8 bg-transparent dark:border-strokedark outline-none focus:border-emerald-600 text-black dark:text-white font-semibold text-xs h-[42px]"
          placeholder="Search or enter parent category..."
        />

        {/* Clear (x) button when a value is selected */}
        {selectedParentId && (
          <button
            type="button"
            title="Clear Parent Category"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearParent();
              setIsParentDropdownOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <MdClose className="text-sm" />
          </button>
        )}

        {isParentDropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[200px] max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {(() => {
              const filteredParents = parentCategories.filter((c) =>
                (c.name || '').toLowerCase().includes(parentInput.toLowerCase().trim())
              );

              return (
                <>
                  {filteredParents.length > 0
                    ? filteredParents.map((pItem, idx) => {
                        const isHighlighted = idx === highlightedParentIndex;
                        const isEditing = editingParentId === pItem.id;

                        if (isEditing) {
                          return (
                            <div
                              key={pItem.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="p-2 bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-emerald-500 flex items-center gap-1.5"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={editParentInput}
                                onChange={(e) => setEditParentInput(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    handleSaveEditParent(e, pItem);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingParentId(null);
                                    setEditParentInput('');
                                  }
                                }}
                                className="flex-1 min-w-0 px-2 py-1 text-xs font-semibold rounded-lg border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                title="Save"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => handleSaveEditParent(e, pItem)}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition shrink-0"
                              >
                                <MdCheck className="text-sm" />
                              </button>
                              <button
                                type="button"
                                title="Cancel"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditingParentId(null);
                                  setEditParentInput('');
                                }}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer transition shrink-0"
                              >
                                <MdClose className="text-sm" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={pItem.id}
                            onMouseEnter={() => setHighlightedParentIndex(idx)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onSelectParent(pItem.id, pItem.name);
                              setIsParentDropdownOpen(false);
                            }}
                            className={`p-2.5 px-3 cursor-pointer transition text-xs font-bold flex items-center justify-between group ${
                              isHighlighted
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span className="truncate mr-2">{pItem.name}</span>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {selectedParentId.toString() === pItem.id.toString() && (
                                <span className="text-[10px] text-emerald-600 font-semibold mr-1">
                                  Selected
                                </span>
                              )}
                              <button
                                type="button"
                                title="Edit Parent Category"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingParentId(pItem.id);
                                  setEditParentInput(pItem.name);
                                }}
                                className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                              >
                                <MdEdit className="text-sm" />
                              </button>
                              <button
                                type="button"
                                title="Delete Parent Category"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsParentDropdownOpen(false);
                                  onRequestDelete({ id: pItem.id, name: pItem.name, type: 'Parent' });
                                }}
                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                              >
                                <MdDelete className="text-sm" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    : null}

                  {parentInput.trim() &&
                    !parentCategories.some(
                      (c) => c.name?.toLowerCase() === parentInput.trim().toLowerCase()
                    ) && (
                      <div
                        onMouseEnter={() => setHighlightedParentIndex(filteredParents.length)}
                        className={`p-3 text-center text-xs font-semibold cursor-pointer border-t border-slate-100 dark:border-slate-800 transition ${
                          highlightedParentIndex === filteredParents.length
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddParentInline(parentInput.trim());
                        }}
                      >
                        + Add "{parentInput.trim()}"
                      </div>
                    )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
