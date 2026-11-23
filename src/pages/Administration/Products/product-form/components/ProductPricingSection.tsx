import React, { useEffect, useRef } from 'react';
import { MdAttachMoney } from 'react-icons/md';
import { FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { saveCustomLocalUom, deleteCustomLocalUom } from '../../../../../service/uomService';
import { ProductFormValues, blockInvalidChar, LooseTier } from '../utils/productFormHelpers';
import SearchableUomDropdown from '../../../../../components/SearchableUomDropdown';

interface ProductPricingSectionProps {
  values: ProductFormValues;
  errors: any;
  touched: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any) => void;
  isTileCategory: boolean;
  profit: number;
  profitMarginPercent: string;
  purchasePerPiece: string;
  purchasePerSqm: string;
  salePerPiece: string;
  salePerSqm: string;
  activeUomList: string[];
  setActiveUomList: React.Dispatch<React.SetStateAction<string[]>>;
  isLooseUomDropdownOpen: boolean;
  setIsLooseUomDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedLooseUomIndex: number;
  setHighlightedLooseUomIndex: React.Dispatch<React.SetStateAction<number>>;
  editingUomItem: { id?: string | number; short_code: string; full_name?: string } | null;
  setEditingUomItem: React.Dispatch<
    React.SetStateAction<{ id?: string | number; short_code: string; full_name?: string } | null>
  >;
  editUomInput: string;
  setEditUomInput: React.Dispatch<React.SetStateAction<string>>;
}

export const ProductPricingSection: React.FC<ProductPricingSectionProps> = ({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  isTileCategory,
  profit,
  profitMarginPercent,
  purchasePerPiece,
  purchasePerSqm,
  salePerPiece,
  salePerSqm,
  activeUomList,
  setActiveUomList,
  isLooseUomDropdownOpen,
  setIsLooseUomDropdownOpen,
  highlightedLooseUomIndex,
  setHighlightedLooseUomIndex,
  editingUomItem,
  setEditingUomItem,
  editUomInput,
  setEditUomInput
}) => {
  // Synchronize loose purchase and sale prices live whenever purchasePrice, retailPrice, or looseConversionRatio changes
  const prevPricingRef = useRef({
    purchasePrice: values.purchasePrice,
    retailPrice: values.retailPrice,
    ratio: values.looseConversionRatio,
    allowLoose: values.allowLooseSales,
    tiers: values.looseTiers
  });

  useEffect(() => {
    if (!values.allowLooseSales || isTileCategory) return;
    const ratio = Number(values.looseConversionRatio) || 1;
    const pur = Number(values.purchasePrice) || 0;
    const ret = Number(values.retailPrice) || 0;

    const prev = prevPricingRef.current;
    const priceChanged =
      prev.purchasePrice !== values.purchasePrice ||
      prev.retailPrice !== values.retailPrice ||
      prev.ratio !== values.looseConversionRatio ||
      prev.allowLoose !== values.allowLooseSales;

    if (priceChanged) {
      if (ratio > 0) {
        const calcPur = pur > 0 ? Number((pur / ratio).toFixed(2)) : 0;
        const calcRet = ret > 0 ? Number((ret / ratio).toFixed(2)) : 0;
        setFieldValue('loosePurchasePrice', calcPur);
        setFieldValue('looseSalePrice', calcRet);
      }

      // Also recalculate all secondary looseTiers live
      if (Array.isArray(values.looseTiers) && values.looseTiers.length > 0) {
        let runningCost = pur;
        let runningSale = ret;
        let runningMainRatio = ratio > 0 ? ratio : 1;

        const updatedTiers = values.looseTiers.map((tier, idx) => {
          const tRatio = Number(tier.ratio) || 1;
          if (idx === 0) {
            // Tier 1 matches primary loose unit
            return {
              ...tier,
              uom: values.looseUom || tier.uom,
              ratio: values.looseConversionRatio || tier.ratio,
              costPrice: pur > 0 ? Number((pur / runningMainRatio).toFixed(4)) : 0,
              salePrice: ret > 0 ? Number((ret / runningMainRatio).toFixed(4)) : 0
            };
          } else {
            // Subsequent tiers divide by their respective step ratio
            const prevTier = values.looseTiers[idx - 1];
            const prevCost = Number(prevTier?.costPrice) || (pur / runningMainRatio);
            const prevSale = Number(prevTier?.salePrice) || (ret / runningMainRatio);
            return {
              ...tier,
              costPrice: tRatio > 0 ? Number((prevCost / tRatio).toFixed(4)) : 0,
              salePrice: tRatio > 0 ? Number((prevSale / tRatio).toFixed(4)) : 0
            };
          }
        });
        setFieldValue('looseTiers', updatedTiers);
      }

      prevPricingRef.current = {
        purchasePrice: values.purchasePrice,
        retailPrice: values.retailPrice,
        ratio: values.looseConversionRatio,
        allowLoose: values.allowLooseSales,
        tiers: values.looseTiers
      };
    }
  }, [
    values.purchasePrice,
    values.retailPrice,
    values.looseConversionRatio,
    values.allowLooseSales,
    isTileCategory,
    setFieldValue
  ]);
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <MdAttachMoney className="text-emerald-600 text-xl" />
          <span>{isTileCategory ? 'Tile Box Pricing & Rate Breakdown' : 'Product Pricing & Margin'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">Calculated Margin:</span>
          <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            +{profitMarginPercent}% (Rs. {profit.toFixed(2)}/{isTileCategory ? 'box' : (values.uom || 'unit')})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Purchase Price Input */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            {isTileCategory ? 'Purchase Price (Per Box) *' : 'Purchase Price *'}
          </label>
          <input
            type="number"
            step="any"
            required
            name="purchasePrice"
            onKeyDown={blockInvalidChar}
            value={values.purchasePrice}
            onChange={handleChange}
            placeholder="0.00"
            className={`w-full rounded-xl border p-3 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-emerald-600 text-sm font-mono font-bold text-slate-900 dark:text-white ${
              touched.purchasePrice && errors.purchasePrice
                ? 'border-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {isTileCategory && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mt-2 font-mono">
              <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-600">
                ≈ Rs. {purchasePerPiece} <span className="text-[10px] text-slate-500 font-normal">/ tile (pc)</span>
              </span>
              <span className="text-slate-500">≈ Rs. {purchasePerSqm} / sq.m</span>
            </div>
          )}
        </div>

        {/* Sale Price Input */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            {isTileCategory ? 'Sale Price (Per Box) *' : 'Sale Price (Retail Rate) *'}
          </label>
          <input
            type="number"
            step="any"
            required
            name="retailPrice"
            onKeyDown={blockInvalidChar}
            value={values.retailPrice}
            onChange={handleChange}
            placeholder="0.00"
            className={`w-full rounded-xl border p-3 bg-emerald-50/20 dark:bg-emerald-950/20 outline-none focus:border-emerald-600 text-sm font-mono font-black text-emerald-700 dark:text-emerald-300 ${
              touched.retailPrice && errors.retailPrice
                ? 'border-rose-500'
                : 'border-emerald-500/50 dark:border-emerald-500/50'
            }`}
          />
          {isTileCategory && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mt-2 font-mono">
              <span className="bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/60 dark:border-emerald-700/60">
                ≈ Rs. {salePerPiece} <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">/ tile (loose pc)</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ≈ Rs. {salePerSqm} / sq.m
              </span>
            </div>
          )}
        </div>

        {/* Service Charges Input - only for service items */}
        {values.itemType === 'service' && (
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              Service Charges *
            </label>
            <input
              type="number"
              step="any"
              name="serviceCharges"
              onKeyDown={blockInvalidChar}
              value={values.serviceCharges}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full rounded-xl border p-3 bg-indigo-50/20 dark:bg-indigo-950/20 outline-none focus:border-indigo-500 text-sm font-mono font-black text-indigo-700 dark:text-indigo-300 border-indigo-400/50 dark:border-indigo-500/50"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Rate charged to the customer for this service.
            </p>
          </div>
        )}

        {/* Minimum Stock Alert Input (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
            <span>Minimum Stock Alert</span>
            <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            name="minStockAlert"
            onKeyDown={blockInvalidChar}
            value={values.minStockAlert}
            onChange={handleChange}
            placeholder={isTileCategory ? 'e.g. 20 (Boxes)' : 'e.g. 10 (Units)'}
            className={`w-full rounded-xl border p-3 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-amber-500 text-sm font-mono font-bold text-slate-900 dark:text-white ${
              touched.minStockAlert && errors.minStockAlert
                ? 'border-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Turns stock count <span className="text-rose-500 font-bold">RED</span> when remaining
            inventory hits or drops below this quantity.
          </p>
        </div>
      </div>

      {/* Loose Selling configuration (Standard products only; Tiles have native loose calculation) */}
      {!isTileCategory && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Allow Loose Selling
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Breaking Box / Open Cartons
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Enable if customers can purchase individual pieces/units without buying a complete
                sealed box.
              </p>
            </div>

            {/* Pill Selector */}
            <div className="inline-flex items-center p-1 bg-slate-200/80 dark:bg-slate-900/80 rounded-full border border-slate-300/80 dark:border-slate-700 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setFieldValue('allowLooseSales', false);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !values.allowLooseSales
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                ✕ Box Only
              </button>
              <button
                type="button"
                onClick={() => {
                  setFieldValue('allowLooseSales', true);
                  const ratio = Number(values.looseConversionRatio) || 1;
                  const purP = Number(values.purchasePrice) || 0;
                  const retP = Number(values.retailPrice) || 0;
                  if (ratio > 0) {
                    setFieldValue('loosePurchasePrice', Number((purP / ratio).toFixed(2)));
                    setFieldValue('looseSalePrice', Number((retP / ratio).toFixed(2)));
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5 ${
                  values.allowLooseSales
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>✓ Allow Loose</span>
              </button>
            </div>
          </div>

          {/* Loose Selling Dynamic Pricing Inputs */}
          {values.allowLooseSales && (
            <>
              <div className="mt-3.5 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              {/* 1. Loose Unit Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                  <span>Loose Unit (Sub-UOM) *</span>
                  <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                    e.g. GM, PCS, ML
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={values.looseUom}
                    onClick={() => setIsLooseUomDropdownOpen(true)}
                    onChange={(e) => {
                      setFieldValue('looseUom', e.target.value.toUpperCase());
                      setIsLooseUomDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      let availableUoms: string[] =
                        activeUomList.length > 0
                          ? [...activeUomList]
                          : ['PCS', 'GM', 'ML', 'MTR', 'KG', 'LBS'];
                      const filtered = availableUoms.filter((u) =>
                        u.toLowerCase().includes(String(values.looseUom || '').toLowerCase())
                      );
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedLooseUomIndex((prev) =>
                          prev < filtered.length - 1 ? prev + 1 : 0
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedLooseUomIndex((prev) =>
                          prev > 0 ? prev - 1 : filtered.length - 1
                        );
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filtered.length > 0) {
                          setFieldValue(
                            'looseUom',
                            filtered[highlightedLooseUomIndex] || filtered[0]
                          );
                          setIsLooseUomDropdownOpen(false);
                        } else if (values.looseUom?.trim()) {
                          const newCode = values.looseUom.trim().toUpperCase();
                          saveCustomLocalUom({
                            id: `custom-${Date.now()}`,
                            short_code: newCode,
                            full_name: newCode,
                            category: 'Count & Units',
                            is_active: true
                          });
                          setActiveUomList((prev) => [...prev, newCode]);
                          toast.success(`Unit "${newCode}" added globally!`);
                          setIsLooseUomDropdownOpen(false);
                        }
                      } else if (e.key === 'Tab' || e.key === 'Escape') {
                        setIsLooseUomDropdownOpen(false);
                      }
                    }}
                    placeholder="Select or enter Loose UOM..."
                    className="w-full rounded-xl border border-emerald-400/60 dark:border-emerald-700 p-2.5 bg-white dark:bg-slate-900 outline-none focus:border-emerald-600 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300"
                  />
                  <button
                    type="button"
                    onClick={() => setIsLooseUomDropdownOpen((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ▼
                  </button>
                </div>

                {/* Searchable Dropdown Popup */}
                {isLooseUomDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-[99999] w-full min-w-[240px] max-h-[240px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                    {(() => {
                      let availableUoms: string[] =
                        activeUomList.length > 0 ? [...activeUomList] : [];
                      if (availableUoms.length === 0) {
                        availableUoms = ['PCS', 'GM', 'ML', 'MTR', 'KG', 'NOS', 'EACH', 'LBS'];
                      }
                      availableUoms = Array.from(
                        new Set(availableUoms.map((u) => String(u).trim().toUpperCase()))
                      ).filter(Boolean);
                      const filtered = availableUoms.filter((u) =>
                        u.toLowerCase().includes(String(values.looseUom || '').toLowerCase())
                      );

                      return filtered.length > 0 ? (
                        filtered.map((unitCode, idx) => {
                          const isHighlighted = idx === highlightedLooseUomIndex;
                          const isEditing = editingUomItem?.short_code === unitCode;
                          return (
                            <div
                              key={unitCode}
                              onMouseEnter={() => setHighlightedLooseUomIndex(idx)}
                              className={`px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer ${
                                isHighlighted
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {isEditing ? (
                                <div
                                  className="flex items-center gap-1.5 w-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="text"
                                    value={editUomInput}
                                    onChange={(e) => setEditUomInput(e.target.value.toUpperCase())}
                                    className="w-24 px-1.5 py-0.5 rounded border border-emerald-400 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const clean = editUomInput.trim().toUpperCase();
                                      if (!clean) return;
                                      saveCustomLocalUom({
                                        id: editingUomItem.id || `custom-${Date.now()}`,
                                        short_code: clean,
                                        full_name: clean,
                                        category: 'Count & Units',
                                        is_active: true
                                      });
                                      setActiveUomList((prev) =>
                                        prev.map((u) => (u === unitCode ? clean : u))
                                      );
                                      if (values.looseUom === unitCode) {
                                        setFieldValue('looseUom', clean);
                                      }
                                      setEditingUomItem(null);
                                      toast.success(`Unit updated to "${clean}"`);
                                    }}
                                    className="p-1 text-emerald-600 hover:text-emerald-700 text-xs font-bold"
                                    title="Save"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingUomItem(null);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span
                                    onClick={() => {
                                      setFieldValue('looseUom', unitCode);
                                      setIsLooseUomDropdownOpen(false);
                                    }}
                                    className="font-mono font-black tracking-wide flex-1"
                                  >
                                    {unitCode}
                                  </span>
                                  <div
                                    className="flex items-center gap-1 opacity-60 hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingUomItem({ short_code: unitCode });
                                        setEditUomInput(unitCode);
                                      }}
                                      className="p-1 text-slate-500 hover:text-indigo-600 text-[11px]"
                                      title="Edit Unit"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteCustomLocalUom(unitCode);
                                        setActiveUomList((prev) =>
                                          prev.filter((u) => u !== unitCode)
                                        );
                                        if (values.looseUom === unitCode) {
                                          setFieldValue('looseUom', 'PCS');
                                        }
                                        toast.success(`Unit "${unitCode}" removed`);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 text-[11px]"
                                      title="Delete Unit"
                                    >
                                      <FiTrash2 size={12} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          onClick={() => {
                            const clean = values.looseUom.trim().toUpperCase();
                            if (clean) {
                              saveCustomLocalUom({
                                id: `custom-${Date.now()}`,
                                short_code: clean,
                                full_name: clean,
                                category: 'Count & Units',
                                is_active: true
                              });
                              setActiveUomList((prev) => [...prev, clean]);
                              setFieldValue('looseUom', clean);
                              toast.success(`Unit "${clean}" created globally!`);
                            }
                            setIsLooseUomDropdownOpen(false);
                          }}
                          className="p-3 text-center text-xs text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          + Add "{values.looseUom}" as new unit
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 2. Units Per Bulk (Conversion Ratio) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                  <span>Units per {values.uom || 'Bulk'} *</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. 1000 for Kg</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="looseConversionRatio"
                  onKeyDown={blockInvalidChar}
                  value={values.looseConversionRatio}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    setFieldValue('looseConversionRatio', rawVal);
                    if (rawVal === '') return;
                    const ratio = parseFloat(rawVal) || 0;
                    const purP = Number(values.purchasePrice) || 0;
                    const retP = Number(values.retailPrice) || 0;
                    if (purP > 0 && ratio > 0) {
                      setFieldValue('loosePurchasePrice', Number((purP / ratio).toFixed(2)));
                    }
                    if (retP > 0 && ratio > 0) {
                      setFieldValue('looseSalePrice', Number((retP / ratio).toFixed(2)));
                    }
                  }}
                  placeholder="e.g. 1000 or 12"
                  className="w-full rounded-xl border border-emerald-400/60 dark:border-emerald-700 p-2.5 bg-white dark:bg-slate-900 outline-none focus:border-emerald-600 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  1 {values.uom || 'Bulk'} ={' '}
                  <strong>{values.looseConversionRatio || 1}</strong>{' '}
                  {values.looseUom || 'Units'}
                </p>
              </div>

              {/* 3. Loose Purchase Cost (PKR) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                  <span>Cost per {values.looseUom || 'Loose Unit'} (PKR)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Auto / Override</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="any"
                    name="loosePurchasePrice"
                    onKeyDown={blockInvalidChar}
                    value={values.loosePurchasePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 outline-none focus:border-emerald-600 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Calculated cost:{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    Rs.{' '}
                    {(
                      (Number(values.purchasePrice) || 0) /
                      (Number(values.looseConversionRatio) || 1)
                    ).toFixed(2)}
                  </span>{' '}
                  / {values.looseUom || 'unit'}
                </p>
              </div>

              {/* 4. Loose Sale Price (PKR) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                  <span>Price per {values.looseUom || 'Loose Unit'} (PKR) *</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Retail</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="any"
                    name="looseSalePrice"
                    onKeyDown={blockInvalidChar}
                    value={values.looseSalePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-emerald-400/60 dark:border-emerald-700 pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 outline-none focus:border-emerald-600 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Calculated:{' '}
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    Rs.{' '}
                    {(
                      (Number(values.retailPrice) || 0) /
                      (Number(values.looseConversionRatio) || 1)
                    ).toFixed(2)}
                  </span>{' '}
                  / {values.looseUom || 'unit'}
                </p>
              </div>
            </div>

            {/* MULTI-TIER CASCADING SUB-UNITS (e.g. Drum -> LTR -> ML -> etc) */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Cascading Sub-Units Chain (Multi-Tier Loose)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentTiers: LooseTier[] = Array.isArray(values.looseTiers)
                      ? [...values.looseTiers]
                      : [];
                    
                    // Previous unit to chain from
                    const lastUnit = currentTiers.length > 0 
                      ? currentTiers[currentTiers.length - 1].uom 
                      : (values.looseUom || 'LTR');

                    const defaultNextUom = (lastUnit === 'LTR' || lastUnit === 'Liters') ? 'ML' : (lastUnit === 'KG' ? 'GM' : 'PCS');
                    const defaultRatio = (defaultNextUom === 'ML' || defaultNextUom === 'GM') ? 1000 : 0;

                    // Calculate live cost & sale for this new tier
                    const lastCost = currentTiers.length > 0 
                      ? Number(currentTiers[currentTiers.length - 1].costPrice || 0) 
                      : (Number(values.loosePurchasePrice) || 0);
                    const lastSale = currentTiers.length > 0 
                      ? Number(currentTiers[currentTiers.length - 1].salePrice || 0) 
                      : (Number(values.looseSalePrice) || 0);

                    const newCost = defaultRatio > 0 ? Number((lastCost / defaultRatio).toFixed(4)) : 0;
                    const newSale = defaultRatio > 0 ? Number((lastSale / defaultRatio).toFixed(4)) : 0;

                    const newTier: LooseTier = {
                      id: `tier-${Date.now()}`,
                      uom: defaultNextUom,
                      ratio: '',
                      costPrice: 0,
                      salePrice: 0
                    };

                    setFieldValue('looseTiers', [...currentTiers, newTier]);
                    toast.success(`Sub-tier "+ ${defaultNextUom}" added!`);
                  }}
                  className="px-3 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30 cursor-pointer flex items-center gap-1 transition"
                >
                  <span>+ Add Next Sub-Unit (e.g. ML, GM, Pcs)</span>
                </button>
              </div>

              {/* Tiers List */}
              {Array.isArray(values.looseTiers) && values.looseTiers.length > 0 ? (
                <div className="space-y-2.5 pb-24">
                  {values.looseTiers.map((tier, idx) => {
                    const prevUnitName = idx === 0 
                      ? (values.looseUom || values.uom || 'Bulk') 
                      : values.looseTiers[idx - 1].uom;

                    return (
                      <div
                        key={tier.id || idx}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center border border-emerald-300/40">
                            {idx + 2}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            1 {prevUnitName} contains:
                          </span>
                        </div>

                        {/* Ratio Input & Unit Select */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tier.ratio === 0 ? '' : tier.ratio}
                            onChange={(e) => {
                              const rawVal = e.target.value;
                              const updated = [...values.looseTiers];
                              if (rawVal === '') {
                                updated[idx] = { ...tier, ratio: '' };
                                setFieldValue('looseTiers', updated);
                                return;
                              }
                              const r = parseFloat(rawVal) || 0;
                              const prevCost = idx === 0 
                                ? (Number(values.loosePurchasePrice) || (Number(values.purchasePrice) / (Number(values.looseConversionRatio) || 1)))
                                : Number(updated[idx - 1].costPrice || 0);
                              const prevSale = idx === 0 
                                ? (Number(values.looseSalePrice) || (Number(values.retailPrice) / (Number(values.looseConversionRatio) || 1)))
                                : Number(updated[idx - 1].salePrice || 0);

                              updated[idx] = {
                                ...tier,
                                ratio: rawVal,
                                costPrice: r > 0 ? Number((prevCost / r).toFixed(4)) : 0,
                                salePrice: r > 0 ? Number((prevSale / r).toFixed(4)) : 0
                              };
                              setFieldValue('looseTiers', updated);
                            }}
                            className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 font-mono text-center font-bold text-xs outline-none focus:border-emerald-600 dark:bg-slate-900"
                            placeholder="1000"
                          />
                          <div className="w-28 relative">
                            <SearchableUomDropdown
                              value={tier.uom}
                              onChange={(val) => {
                                const clean = String(val || '').trim().toUpperCase();
                                const updated = [...values.looseTiers];
                                updated[idx] = { ...tier, uom: clean };
                                setFieldValue('looseTiers', updated);
                              }}
                              uoms={activeUomList.length > 0 ? activeUomList : ['ML', 'GM', 'PCS', 'LTR', 'KG', 'MTR']}
                              compact={true}
                              placeholder="UOM"
                            />
                          </div>
                        </div>

                        {/* Editable Cost & Sale Rates for this tier */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-500 font-sans font-semibold">Cost:</span>
                            <span className="text-[10px] text-slate-400">Rs.</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={tier.costPrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  const updated = [...values.looseTiers];
                                  updated[idx] = { ...tier, costPrice: val };
                                  setFieldValue('looseTiers', updated);
                                }
                              }}
                              placeholder="0.00"
                              className="w-16 rounded border border-slate-200 dark:border-slate-700 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-primary"
                              title="Override Cost Price for this tier"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-bold">Sale:</span>
                            <span className="text-[10px] text-emerald-600">Rs.</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={tier.salePrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  const updated = [...values.looseTiers];
                                  updated[idx] = { ...tier, salePrice: val };
                                  setFieldValue('looseTiers', updated);
                                }
                              }}
                              placeholder="0.00"
                              className="w-16 rounded border border-emerald-400 dark:border-emerald-700 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 outline-none focus:border-emerald-600"
                              title="Override Retail Sale Rate for this tier"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = values.looseTiers.filter((_, i) => i !== idx);
                              setFieldValue('looseTiers', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                            title="Remove this sub-unit"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No additional sub-units added yet. Click "+ Add Next Sub-Unit" above to chain more (e.g. 1 LTR = 1,000 ML).
                </p>
              )}
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
