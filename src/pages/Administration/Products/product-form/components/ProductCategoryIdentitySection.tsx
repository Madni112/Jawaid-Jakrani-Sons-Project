import React from 'react';
import {
  MdLayers,
  MdClose,
  MdCheck,
  MdEdit,
  MdDelete,
  MdFormatColorFill
} from 'react-icons/md';
import SearchableDropdown from '../../../../../components/SearchableDropdown';
import SearchableColorDropdown from '../../../../../components/SearchableColorDropdown';
import { ProductFormValues, UomItem } from '../utils/productFormHelpers';

interface ProductCategoryIdentitySectionProps {
  values: ProductFormValues;
  errors: any;
  touched: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any) => void;
  categories: any[];
  isTileCategory: boolean;
  fetchTilePrintsFromDb: (parentCatName?: string) => Promise<void>;
  tilePrints: { id?: number | string; name: string; category_id?: number | null }[];
  isPrintDropdownOpen: boolean;
  setIsPrintDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedPrintIndex: number;
  setHighlightedPrintIndex: React.Dispatch<React.SetStateAction<number>>;
  editingPrintName: string | null;
  editPrintInput: string;
  setEditPrintInput: React.Dispatch<React.SetStateAction<string>>;
  handleStartEditPrint: (e: React.MouseEvent, pName: string) => void;
  handleSaveEditPrint: (
    e: React.MouseEvent | React.KeyboardEvent,
    oldItem: { id?: number | string; name: string },
    setFieldValue?: (f: string, v: any) => void
  ) => Promise<void>;
  handleCancelEditPrint: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleStartDeletePrint: (e: React.MouseEvent, item: { id?: number | string; name: string }) => void;
  handleAddPrint: (
    newPrintName: string,
    setFieldValue?: (f: string, v: any) => void,
    parentCatName?: string
  ) => Promise<void>;
  surfaceFinishes: any[];
  isBinDropdownOpen: boolean;
  setIsBinDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedBinIndex: number;
  setHighlightedBinIndex: React.Dispatch<React.SetStateAction<number>>;
  activeUomList: string[];
  groupedUoms: { [key: string]: UomItem[] };
  isUomDropdownOpen: boolean;
  setIsUomDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedUomIndex: number;
  setHighlightedUomIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const ProductCategoryIdentitySection: React.FC<ProductCategoryIdentitySectionProps> = ({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  categories,
  isTileCategory,
  fetchTilePrintsFromDb,
  tilePrints,
  isPrintDropdownOpen,
  setIsPrintDropdownOpen,
  highlightedPrintIndex,
  setHighlightedPrintIndex,
  editingPrintName,
  editPrintInput,
  setEditPrintInput,
  handleStartEditPrint,
  handleSaveEditPrint,
  handleCancelEditPrint,
  handleStartDeletePrint,
  handleAddPrint,
  surfaceFinishes,
  isBinDropdownOpen,
  setIsBinDropdownOpen,
  highlightedBinIndex,
  setHighlightedBinIndex,
  activeUomList,
  groupedUoms,
  isUomDropdownOpen,
  setIsUomDropdownOpen,
  highlightedUomIndex,
  setHighlightedUomIndex
}) => {
  return (
    <div className="bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
          <MdLayers className="text-emerald-600 text-lg" />
          <span>Product Category & Identity</span>
        </div>
        {isTileCategory && (
          <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-wider">
            Tile Mode Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Parent Category (Top Level) */}
        <div>
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            Parent Category
          </label>
          <SearchableDropdown
            value={values.subSubCategory}
            onChange={(val) => {
              setFieldValue('subSubCategory', val);
              setFieldValue('subCategory', '');
              setFieldValue('category', '');
              fetchTilePrintsFromDb(val);
            }}
            options={categories.filter((c) => c.parent_id === null).map((cat) => cat.name)}
            placeholder="Parent Category"
            allowAll={false}
          />
        </div>

        {/* 1.1 Sub Category (Middle Level) */}
        <div>
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            Sub Category
          </label>
          <SearchableDropdown
            value={values.subCategory}
            onChange={(val) => {
              setFieldValue('subCategory', val);
              setFieldValue('category', '');
            }}
            options={(() => {
              const parent = categories.find(
                (c) =>
                  c.parent_id === null &&
                  c.name?.trim().toLowerCase() === String(values.subSubCategory || '').trim().toLowerCase()
              );
              if (!parent) return [];
              return categories.filter((c) => c.parent_id === parent.id).map((cat) => cat.name);
            })()}
            placeholder="Sub Category"
            allowAll={false}
            disabled={!values.subSubCategory}
          />
        </div>

        {/* 1.2 Category (Bottom Level) */}
        <div>
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            Category <span className="text-rose-500">*</span>
          </label>
          <SearchableDropdown
            value={values.category}
            onChange={(val) => setFieldValue('category', val)}
            options={(() => {
              const parent = categories.find(
                (c) =>
                  c.parent_id === null &&
                  c.name?.trim().toLowerCase() === String(values.subSubCategory || '').trim().toLowerCase()
              );
              if (!parent) return [];
              const sub = categories.find(
                (c) =>
                  c.parent_id === parent.id &&
                  c.name?.trim().toLowerCase() === String(values.subCategory || '').trim().toLowerCase()
              );
              if (!sub) return [];
              return categories.filter((c) => c.parent_id === sub.id).map((cat) => cat.name);
            })()}
            placeholder="Category"
            allowAll={false}
            disabled={!values.subCategory}
            className={touched.category && errors.category ? 'border border-rose-500 rounded-lg' : ''}
          />
          {touched.category && errors.category && (
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.category as string}</p>
          )}
        </div>

        {/* 1.25 Print Dropdown (Shown when Parent Category includes 'tile') */}
        {isTileCategory && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-slate-800 dark:text-slate-100">
                Print
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                name="tilePrint"
                autoComplete="off"
                onChange={(e) => {
                  handleChange(e);
                  setIsPrintDropdownOpen(true);
                  setHighlightedPrintIndex(0);
                }}
                onFocus={() => {
                  setIsPrintDropdownOpen(true);
                  setHighlightedPrintIndex(0);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!editingPrintName) {
                      setIsPrintDropdownOpen(false);
                    }
                  }, 250);
                }}
                onKeyDown={(e) => {
                  const filteredPrints = tilePrints.filter((p) =>
                    p.name.toLowerCase().includes(String(values.tilePrint || '').toLowerCase().trim())
                  );
                  const showAddPrint = !!(
                    String(values.tilePrint || '').trim() &&
                    !tilePrints.some(
                      (p) => p.name.toLowerCase() === String(values.tilePrint || '').trim().toLowerCase()
                    )
                  );
                  const totalOptions = filteredPrints.length + (showAddPrint ? 1 : 0);

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (totalOptions > 0) {
                      setHighlightedPrintIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (totalOptions > 0) {
                      setHighlightedPrintIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
                    }
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (showAddPrint && highlightedPrintIndex === filteredPrints.length) {
                      handleAddPrint(
                        String(values.tilePrint || '').trim(),
                        setFieldValue,
                        values.subSubCategory
                      );
                      setIsPrintDropdownOpen(false);
                    } else if (filteredPrints.length > 0) {
                      setFieldValue(
                        'tilePrint',
                        (filteredPrints[highlightedPrintIndex] || filteredPrints[0]).name
                      );
                      setIsPrintDropdownOpen(false);
                    } else if (values.tilePrint && values.tilePrint.trim()) {
                      handleAddPrint(values.tilePrint.trim(), setFieldValue, values.subSubCategory);
                      setIsPrintDropdownOpen(false);
                    }
                  } else if (e.key === 'Tab' || e.key === 'Escape') {
                    setIsPrintDropdownOpen(false);
                  }
                }}
                value={values.tilePrint}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 pr-8 bg-white dark:bg-slate-800 outline-none focus:border-emerald-600 text-xs font-semibold text-slate-900 dark:text-white"
                placeholder="Search or enter print..."
              />

              {values.tilePrint && (
                <button
                  type="button"
                  title="Clear Print"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFieldValue('tilePrint', '');
                    setIsPrintDropdownOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <MdClose className="text-sm" />
                </button>
              )}

              {isPrintDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[200px] max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                  {(() => {
                    const filteredPrints = tilePrints.filter((p) =>
                      p.name.toLowerCase().includes(String(values.tilePrint || '').toLowerCase().trim())
                    );
                    const showAddPrint = !!(
                      String(values.tilePrint || '').trim() &&
                      !tilePrints.some(
                        (p) => p.name.toLowerCase() === String(values.tilePrint || '').trim().toLowerCase()
                      )
                    );

                    return (
                      <>
                        {filteredPrints.length > 0
                          ? filteredPrints.map((pItem, idx) => {
                              const isHighlighted = idx === highlightedPrintIndex;
                              const isEditing = editingPrintName === pItem.name;

                              if (isEditing) {
                                return (
                                  <div
                                    key={pItem.name}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="p-2 bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-emerald-500 flex items-center gap-1.5"
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editPrintInput}
                                      onChange={(e) => setEditPrintInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter') {
                                          handleSaveEditPrint(e, pItem, setFieldValue);
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditPrint(e);
                                        }
                                      }}
                                      className="flex-1 min-w-0 px-2 py-1 text-xs font-semibold rounded-lg border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                                    />
                                    <button
                                      type="button"
                                      title="Save"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(e) => handleSaveEditPrint(e, pItem, setFieldValue)}
                                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition shrink-0"
                                    >
                                      <MdCheck className="text-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Cancel"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(e) => handleCancelEditPrint(e)}
                                      className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer transition shrink-0"
                                    >
                                      <MdClose className="text-sm" />
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={pItem.name}
                                  onMouseEnter={() => setHighlightedPrintIndex(idx)}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setFieldValue('tilePrint', pItem.name);
                                    setIsPrintDropdownOpen(false);
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
                                    {values.tilePrint === pItem.name && (
                                      <span className="text-[10px] text-emerald-600 font-semibold mr-1">
                                        Selected
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      title="Edit Print"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onClick={(e) => handleStartEditPrint(e, pItem.name)}
                                      className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                                    >
                                      <MdEdit className="text-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Delete Print"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onClick={(e) => handleStartDeletePrint(e, pItem)}
                                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                    >
                                      <MdDelete className="text-sm" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          : null}

                        {showAddPrint && (
                          <div
                            onMouseEnter={() => setHighlightedPrintIndex(filteredPrints.length)}
                            className={`p-3 text-center text-xs font-semibold cursor-pointer border-t border-slate-100 dark:border-slate-800 transition ${
                              highlightedPrintIndex === filteredPrints.length
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (values.tilePrint && values.tilePrint.trim()) {
                                handleAddPrint(values.tilePrint.trim(), setFieldValue, values.subSubCategory);
                                setIsPrintDropdownOpen(false);
                              }
                            }}
                          >
                            + Add "{values.tilePrint || 'New Print'}"
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1.25 Color / Shade Dropdown (Searchable + Addable with DB Persistence) */}
        <div>
          <SearchableColorDropdown
            value={values.color || ''}
            onChange={(val) => setFieldValue('color', val)}
            placeholder="Search or add color/shade..."
          />
        </div>

        {/* 4. Brand */}
        <div>
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            Brand
          </label>
          <div className="relative">
            <input
              type="text"
              name="finishType"
              autoComplete="off"
              onChange={(e) => {
                handleChange(e);
                setIsBinDropdownOpen(true);
                setHighlightedBinIndex(0);
              }}
              onFocus={() => {
                setIsBinDropdownOpen(true);
                setHighlightedBinIndex(0);
              }}
              onBlur={() => {
                setTimeout(() => setIsBinDropdownOpen(false), 200);
              }}
              onKeyDown={(e) => {
                const availableBins = surfaceFinishes.map((f: any) => f.name);
                const filteredBins = availableBins.filter((b) =>
                  b.toLowerCase().includes(String(values.finishType || '').toLowerCase())
                );

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedBinIndex((prev) => (prev < filteredBins.length - 1 ? prev + 1 : 0));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedBinIndex((prev) => (prev > 0 ? prev - 1 : filteredBins.length - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredBins.length > 0) {
                    setFieldValue('finishType', filteredBins[highlightedBinIndex] || filteredBins[0]);
                    setIsBinDropdownOpen(false);
                  }
                } else if (e.key === 'Tab' || e.key === 'Escape') {
                  setIsBinDropdownOpen(false);
                }
              }}
              value={values.finishType}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 outline-none focus:border-emerald-600 text-xs font-semibold text-slate-900 dark:text-white"
              placeholder="Search or enter brand..."
            />
            {isBinDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[200px] max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {(() => {
                  const availableBins = surfaceFinishes.map((f: any) => f.name);
                  const filteredBins = availableBins.filter((b) =>
                    b.toLowerCase().includes(String(values.finishType || '').toLowerCase())
                  );

                  return filteredBins.length > 0 ? (
                    filteredBins.map((bin, idx) => {
                      const isHighlighted = idx === highlightedBinIndex;
                      return (
                        <div
                          key={bin}
                          onMouseEnter={() => setHighlightedBinIndex(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFieldValue('finishType', bin);
                            setIsBinDropdownOpen(false);
                          }}
                          className={`p-3 cursor-pointer transition text-xs font-bold flex items-center ${
                            isHighlighted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {bin}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Press Enter to add "{values.finishType}"
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 5. UOM */}
        <div>
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            {isTileCategory ? 'Inventory UOM (e.g. BOX)' : 'UOM *'}
          </label>
          <div className="relative">
            <input
              type="text"
              name="uom"
              autoComplete="off"
              onChange={(e) => {
                handleChange(e);
                setIsUomDropdownOpen(true);
                setHighlightedUomIndex(0);
              }}
              onFocus={() => {
                setIsUomDropdownOpen(true);
                setHighlightedUomIndex(0);
              }}
              onBlur={() => {
                setTimeout(() => setIsUomDropdownOpen(false), 200);
              }}
              onKeyDown={(e) => {
                let availableUoms: string[] = activeUomList.length > 0 ? [...activeUomList] : [];
                if (availableUoms.length === 0) {
                  Object.keys(groupedUoms).forEach((cat) => {
                    groupedUoms[cat].forEach((u) => availableUoms.push(u.short_code));
                  });
                }
                if (availableUoms.length === 0) {
                  availableUoms = ['PCS'];
                }
                availableUoms = Array.from(
                  new Set(availableUoms.map((u) => String(u).trim().toUpperCase()))
                ).filter(Boolean);
                const filteredUoms = availableUoms.filter((u) =>
                  u.toLowerCase().includes(String(values.uom || '').toLowerCase())
                );

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedUomIndex((prev) => (prev < filteredUoms.length - 1 ? prev + 1 : 0));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedUomIndex((prev) => (prev > 0 ? prev - 1 : filteredUoms.length - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredUoms.length > 0) {
                    setFieldValue('uom', filteredUoms[highlightedUomIndex] || filteredUoms[0]);
                    setIsUomDropdownOpen(false);
                  }
                } else if (e.key === 'Tab' || e.key === 'Escape') {
                  setIsUomDropdownOpen(false);
                }
              }}
              value={values.uom}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 outline-none focus:border-emerald-600 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              placeholder="Search or enter UOM..."
            />
            {isUomDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[200px] max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {(() => {
                  let availableUoms: string[] = activeUomList.length > 0 ? [...activeUomList] : [];
                  if (availableUoms.length === 0) {
                    Object.keys(groupedUoms).forEach((cat) => {
                      groupedUoms[cat].forEach((u) => {
                        if (u && u.short_code) availableUoms.push(u.short_code);
                      });
                    });
                  }
                  if (availableUoms.length === 0) {
                    availableUoms = ['PCS'];
                  }
                  availableUoms = Array.from(
                    new Set(availableUoms.map((u) => String(u).trim().toUpperCase()))
                  ).filter(Boolean);
                  const filteredUoms = availableUoms.filter((u) =>
                    u.toLowerCase().includes(String(values.uom || '').toLowerCase())
                  );

                  return filteredUoms.length > 0 ? (
                    filteredUoms.map((uom, idx) => {
                      const isHighlighted = idx === highlightedUomIndex;
                      return (
                        <div
                          key={uom}
                          onMouseEnter={() => setHighlightedUomIndex(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFieldValue('uom', uom);
                            setIsUomDropdownOpen(false);
                          }}
                          className={`p-3 cursor-pointer transition text-xs font-bold flex items-center ${
                            isHighlighted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {uom}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Press Enter to add "{values.uom}"
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 6. Code */}
        <div>
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            Code
          </label>
          <input
            type="text"
            name="itemSrNo"
            onChange={handleChange}
            value={values.itemSrNo}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 outline-none focus:border-emerald-600 text-xs text-slate-800 dark:text-white font-mono"
            placeholder="Enter Code"
          />
        </div>

        {/* 7. Description */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
          <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
            Description *
          </label>
          <input
            type="text"
            name="productName"
            onChange={handleChange}
            value={values.productName}
            className={`w-full rounded-xl border p-2.5 bg-white dark:bg-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 dark:text-white ${
              touched.productName && errors.productName
                ? 'border-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder={
              isTileCategory
                ? 'e.g. Master Tiles Calacatta White 60x60 (Glazed Polished)'
                : 'Enter Description'
            }
          />
          {touched.productName && errors.productName && (
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.productName as string}</p>
          )}
        </div>
      </div>
    </div>
  );
};
