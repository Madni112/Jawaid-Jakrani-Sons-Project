import React, { useState } from 'react';
import { MdClose, MdCheck, MdEdit, MdDelete } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { InventoryCategory, DeletingCategoryItem } from '../types/categoryTypes';
import { createSubCategory, updateCategoryName } from '../services/categoryService';

interface SubCategoryComboboxProps {
  subCategories: InventoryCategory[];
  selectedParentId: string | number;
  selectedSubId: string | number;
  subInput: string;
  tenantId?: string | null;
  deletingCategoryItem: DeletingCategoryItem | null;
  onSelectSub: (id: string | number, name: string) => void;
  onClearSub: () => void;
  onSubInputChange: (val: string) => void;
  onRequestDelete: (item: DeletingCategoryItem) => void;
  onReload: () => Promise<void>;
}

export const SubCategoryCombobox: React.FC<SubCategoryComboboxProps> = ({
  subCategories,
  selectedParentId,
  selectedSubId,
  subInput,
  tenantId,
  deletingCategoryItem,
  onSelectSub,
  onClearSub,
  onSubInputChange,
  onRequestDelete,
  onReload
}) => {
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const [highlightedSubIndex, setHighlightedSubIndex] = useState(0);
  const [editingSubId, setEditingSubId] = useState<string | number | null>(null);
  const [editSubInput, setEditSubInput] = useState('');

  const handleAddSubInline = async (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) {
      toast.error('Sub category name cannot be empty');
      return;
    }
    if (!selectedParentId) {
      toast.error('Please select a Parent Category first');
      return;
    }

    const isDuplicate = subCategories.some(
      (c) => c.name?.toLowerCase() === clean.toLowerCase()
    );
    if (isDuplicate) {
      toast.error('Sub category already exists under this parent');
      return;
    }

    try {
      const data = await createSubCategory(clean, selectedParentId, tenantId);
      toast.success(`Sub Category "${clean}" created!`);
      await onReload();
      if (data) {
        onSelectSub(data.id, data.name);
      }
      setIsSubDropdownOpen(false);
    } catch (err: any) {
      toast.error('Failed to create sub category: ' + err.message);
    }
  };

  const handleSaveEditSub = async (
    e: React.MouseEvent | React.KeyboardEvent,
    cat: InventoryCategory
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = editSubInput.trim();
    if (!clean) {
      toast.error('Name cannot be empty');
      return;
    }
    if (
      clean.toLowerCase() !== cat.name.toLowerCase() &&
      subCategories.some((c) => c.name?.toLowerCase() === clean.toLowerCase())
    ) {
      toast.error('Sub category with this name already exists under this parent');
      return;
    }

    try {
      await updateCategoryName(cat.id, clean);
      toast.success(`Sub Category updated to "${clean}"`);
      await onReload();
      if (selectedSubId.toString() === cat.id.toString()) {
        onSubInputChange(clean);
      }
      setEditingSubId(null);
      setEditSubInput('');
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  return (
    <div>
      <label className="block text-gray-500 mb-1.5 text-xs font-bold">
        Sub Category
      </label>
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          disabled={!selectedParentId}
          value={subInput}
          onChange={(e) => {
            onSubInputChange(e.target.value);
            setIsSubDropdownOpen(true);
            setHighlightedSubIndex(0);
            const match = subCategories.find(
              (c) => c.name?.toLowerCase() === e.target.value.toLowerCase().trim()
            );
            if (match) {
              onSelectSub(match.id, match.name);
            } else if (selectedSubId) {
              onClearSub();
            }
          }}
          onFocus={() => {
            if (selectedParentId) {
              setIsSubDropdownOpen(true);
              setHighlightedSubIndex(0);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!editingSubId && !deletingCategoryItem) {
                setIsSubDropdownOpen(false);
                const curr = subCategories.find(
                  (c) => c.id.toString() === selectedSubId.toString()
                );
                onSubInputChange(curr ? curr.name : '');
              }
            }, 250);
          }}
          onKeyDown={(e) => {
            const filteredSubs = subCategories.filter((c) =>
              (c.name || '').toLowerCase().includes(subInput.toLowerCase().trim())
            );
            const showAddOption = !!(
              subInput.trim() &&
              !subCategories.some(
                (c) => c.name?.toLowerCase() === subInput.trim().toLowerCase()
              )
            );
            const totalOptions = filteredSubs.length + (showAddOption ? 1 : 0);

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (totalOptions > 0) {
                setHighlightedSubIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
              }
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (totalOptions > 0) {
                setHighlightedSubIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
              }
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (showAddOption && highlightedSubIndex === filteredSubs.length) {
                handleAddSubInline(subInput.trim());
              } else if (filteredSubs.length > 0) {
                const selected = filteredSubs[highlightedSubIndex] || filteredSubs[0];
                onSelectSub(selected.id, selected.name);
                setIsSubDropdownOpen(false);
              } else if (subInput && subInput.trim()) {
                handleAddSubInline(subInput.trim());
              }
            } else if (e.key === 'Tab' || e.key === 'Escape') {
              setIsSubDropdownOpen(false);
            }
          }}
          className="w-full border border-stroke rounded-lg p-2.5 pr-8 bg-transparent dark:border-strokedark outline-none focus:border-emerald-600 text-black dark:text-white font-semibold text-xs h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={
            !selectedParentId
              ? 'Select Parent Category first...'
              : 'Search or enter sub category...'
          }
        />

        {/* Clear (x) button when a value is selected */}
        {selectedSubId && (
          <button
            type="button"
            title="Clear Sub Category"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearSub();
              setIsSubDropdownOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <MdClose className="text-sm" />
          </button>
        )}

        {isSubDropdownOpen && selectedParentId && (
          <div className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[200px] max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {(() => {
              const filteredSubs = subCategories.filter((c) =>
                (c.name || '').toLowerCase().includes(subInput.toLowerCase().trim())
              );

              return (
                <>
                  {filteredSubs.length > 0
                    ? filteredSubs.map((sItem, idx) => {
                        const isHighlighted = idx === highlightedSubIndex;
                        const isEditing = editingSubId === sItem.id;

                        if (isEditing) {
                          return (
                            <div
                              key={sItem.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="p-2 bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-emerald-500 flex items-center gap-1.5"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={editSubInput}
                                onChange={(e) => setEditSubInput(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    handleSaveEditSub(e, sItem);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingSubId(null);
                                    setEditSubInput('');
                                  }
                                }}
                                className="flex-1 min-w-0 px-2 py-1 text-xs font-semibold rounded-lg border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                title="Save"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => handleSaveEditSub(e, sItem)}
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
                                  setEditingSubId(null);
                                  setEditSubInput('');
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
                            key={sItem.id}
                            onMouseEnter={() => setHighlightedSubIndex(idx)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onSelectSub(sItem.id, sItem.name);
                              setIsSubDropdownOpen(false);
                            }}
                            className={`p-2.5 px-3 cursor-pointer transition text-xs font-bold flex items-center justify-between group ${
                              isHighlighted
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span className="truncate mr-2">{sItem.name}</span>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {selectedSubId.toString() === sItem.id.toString() && (
                                <span className="text-[10px] text-emerald-600 font-semibold mr-1">
                                  Selected
                                </span>
                              )}
                              <button
                                type="button"
                                title="Edit Sub Category"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingSubId(sItem.id);
                                  setEditSubInput(sItem.name);
                                }}
                                className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                              >
                                <MdEdit className="text-sm" />
                              </button>
                              <button
                                type="button"
                                title="Delete Sub Category"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsSubDropdownOpen(false);
                                  onRequestDelete({ id: sItem.id, name: sItem.name, type: 'Sub' });
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

                  {subInput.trim() &&
                    !subCategories.some(
                      (c) => c.name?.toLowerCase() === subInput.trim().toLowerCase()
                    ) && (
                      <div
                        onMouseEnter={() => setHighlightedSubIndex(filteredSubs.length)}
                        className={`p-3 text-center text-xs font-semibold cursor-pointer border-t border-slate-100 dark:border-slate-800 transition ${
                          highlightedSubIndex === filteredSubs.length
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddSubInline(subInput.trim());
                        }}
                      >
                        + Add "{subInput.trim()}"
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
