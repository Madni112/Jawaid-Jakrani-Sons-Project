import React from 'react';
import { MdInventory2 } from 'react-icons/md';
import SearchableProductSelect from '../../../../components/SearchableProductSelect';
import { SearchableDropdown } from '../../../../components/SearchableDropdown';
import SearchableUomDropdown from '../../../../components/SearchableUomDropdown';

interface BOMProductOutputTabProps {
  isRTL: boolean;
  catalogProducts: any[];
  finishedProductName: string;
  onSelectFinishedProduct: (name: string, selectedProd?: any) => void;
  finishedProductCode: string;
  setFinishedProductCode: (code: string) => void;
  uom: string;
  setUom: (uom: string) => void;
  allUomsList: any[];
  availableUoms: string[];
  allCategories: any[];
  subSubCategory: string;
  setSubSubCategory: (val: string) => void;
  subCategory: string;
  setSubCategory: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  // Loose Selling Configuration for Finished Product
  allowLoose: boolean;
  setAllowLoose: (val: boolean) => void;
  looseUom: string;
  setLooseUom: (val: string) => void;
  looseRatio: number | string;
  setLooseRatio: (val: number | string) => void;
  multiLooseUnits: Array<{
    uom: string;
    ratio: number | string;
    costPrice?: number | string;
    salePrice?: number | string;
  }>;
  setMultiLooseUnits: (val: any) => void;
}

export const BOMProductOutputTab: React.FC<BOMProductOutputTabProps> = ({

  isRTL,
  catalogProducts,
  finishedProductName,
  onSelectFinishedProduct,
  finishedProductCode,
  setFinishedProductCode,
  uom,
  setUom,
  allUomsList,
  availableUoms,
  allCategories,
  subSubCategory,
  setSubSubCategory,
  subCategory,
  setSubCategory,
  category,
  setCategory,
  allowLoose,
  setAllowLoose,
  looseUom,
  setLooseUom,
  looseRatio,
  setLooseRatio,
  multiLooseUnits,
  setMultiLooseUnits
}) => {
  // Check if finished product is an existing catalog product
  const existingProduct = catalogProducts.find(
    p => p.product_name?.toLowerCase() === (finishedProductName || '').toLowerCase()
  );
  const isCustomProduct = Boolean(finishedProductName?.trim()) && !existingProduct;
  const existingHasLoose = Boolean(
    existingProduct && (existingProduct.allow_loose_sales || (Array.isArray(existingProduct.multi_loose_units) && existingProduct.multi_loose_units.length > 0))
  );

  return (
    <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark space-y-4">
      <div className="flex items-center gap-2 border-b border-stroke pb-3 dark:border-strokedark">
        <MdInventory2 className="text-xl text-primary" />
        <h2 className="text-base font-semibold text-black dark:text-white">
          {isRTL ? 'تیار شدہ پروڈکٹ کا تعین (Finished Good Output)' : '1. Finished Product Output & Categorization'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product Name (Interactive Combobox: Type new name or choose existing) */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
            {isRTL ? 'تیار پروڈکٹ کا نام *' : 'Finished Product Name *'}
          </label>
          <SearchableProductSelect
            products={catalogProducts}
            value={finishedProductName}
            onChange={(name, selectedProd) => onSelectFinishedProduct(name, selectedProd)}
            placeholder={
              isRTL
                ? 'تیار پروڈکٹ منتخب کریں یا نیا نام لکھیں...'
                : 'Search or type finished product (e.g., Embroidered Lawn Suit, Glazed Floor Tile 60x120)...'
            }
            allowCustom={true}
            priceType="sales"
            isRTL={isRTL}
          />
          <span className="text-[11px] text-gray-400 mt-1 block">
            {isRTL
              ? 'اگر یہ نیا پروڈکٹ ہے تو نسخہ محفوظ کرنے پر یہ خود بخود پروڈکٹ لسٹ میں شامل ہو جائے گا۔'
              : 'If this is a new product, saving this recipe will automatically register it in the Product Catalog.'}
          </span>
        </div>

        {/* Product Code / SKU & Output Unit (UOM) */}
        <div className="sm:col-span-2 sm:grid sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
              {isRTL ? 'پروڈکٹ کوڈ / SKU' : 'Product Code / SKU'}
            </label>
            <input
              type="text"
              placeholder="e.g., ESK-PREM-01"
              value={finishedProductCode}
              onChange={e => setFinishedProductCode(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-xs font-mono outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
              {isRTL ? 'پیداواری اکائی (Output UOM) *' : 'Finished Good Unit (UOM) *'}
            </label>
            <SearchableUomDropdown
              value={uom}
              onChange={val => setUom(val)}
              uoms={allUomsList.length > 0 ? allUomsList : availableUoms}
              placeholder={isRTL ? 'پیداواری اکائی منتخب کریں' : 'Select Output UOM'}
              isRTL={isRTL}
            />
          </div>
        </div>

        {/* FINISHED PRODUCT LOOSE SELLING & SUB-UOM HIERARCHY */}
        {(isCustomProduct || existingHasLoose) && (
          <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-meta-4/30 border border-slate-200 dark:border-strokedark space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stroke dark:border-strokedark pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                  Allow Loose Selling for Finished Good
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Sub-Units &amp; Breaking Drum/Box
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Enable if this manufactured product can also be sold in broken units/liters/pieces.
              </p>
            </div>

            {!isCustomProduct && existingHasLoose ? (
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                ✓ Catalog Loose Configured
              </span>
            ) : (
              <div className="inline-flex items-center p-0.5 bg-slate-200 dark:bg-meta-4 rounded-full border border-stroke dark:border-strokedark">
                <button
                  type="button"
                  onClick={() => setAllowLoose(false)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    !allowLoose
                      ? 'bg-white dark:bg-boxdark text-black dark:text-white shadow-2xs'
                      : 'text-gray-500 hover:text-black dark:text-gray-400'
                  }`}
                >
                  ✕ Full Bulk Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAllowLoose(true);
                    if (!looseUom) {
                      setLooseUom(uom === 'LTR' || uom === 'Liters' ? 'ML' : (uom === 'KG' ? 'GM' : 'PCS'));
                      setLooseRatio(uom === 'LTR' || uom === 'KG' ? 1000 : 12);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                    allowLoose
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-black dark:text-gray-400'
                  }`}
                >
                  ✓ Allow Loose Selling
                </button>
              </div>
            )}
          </div>

          {allowLoose && (
            <div className="space-y-3 pt-1 animate-fadeIn">
              {/* Primary Loose Unit definition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-boxdark rounded-xl border border-emerald-300/60 dark:border-emerald-800/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Loose Sub-UOM (e.g. LTR, ML, PCS):
                  </label>
                  <input
                    type="text"
                    value={looseUom}
                    onChange={e => setLooseUom(e.target.value.toUpperCase())}
                    placeholder="e.g. LTR, ML"
                    className="w-full rounded-lg border border-stroke dark:border-strokedark bg-transparent py-1.5 px-3 font-mono font-bold text-xs uppercase outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Units per 1 {uom || 'Bulk'}:
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={looseRatio === 0 ? '' : looseRatio}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                        setLooseRatio(v);
                      }
                    }}
                    placeholder="e.g. 100 or 1000"
                    className="w-full rounded-lg border border-stroke dark:border-strokedark bg-transparent py-1.5 px-3 font-mono font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  1 {uom || 'Bulk'} = <strong>{looseRatio || 1}</strong> {looseUom || 'Units'}
                </div>
              </div>

              {/* Multi-tier loose units list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Additional Sub-Units (Tier 2, 3...)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Array.isArray(multiLooseUnits) ? [...multiLooseUnits] : [];
                      const lastUnit = cur.length > 0 ? cur[cur.length - 1].uom : (looseUom || 'LTR');
                      const nextUom = lastUnit === 'LTR' ? 'ML' : (lastUnit === 'KG' ? 'GM' : 'PCS');
                      setMultiLooseUnits([...cur, { uom: nextUom, ratio: '' }]);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/30 cursor-pointer"
                  >
                    + Add Next Sub-Unit (e.g. ML, GM, Pcs)
                  </button>
                </div>

                {Array.isArray(multiLooseUnits) && multiLooseUnits.map((tier, tIdx) => {
                  const prevUnit = tIdx === 0 ? (looseUom || uom) : multiLooseUnits[tIdx - 1].uom;
                  return (
                    <div
                      key={tIdx}
                      className="p-2.5 bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono font-bold text-[10px] flex items-center justify-center">
                          {tIdx + 2}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          1 {prevUnit} contains:
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tier.ratio === 0 ? '' : tier.ratio}
                          onChange={e => {
                            const raw = e.target.value;
                            if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                              const updated = [...multiLooseUnits];
                              updated[tIdx] = { ...tier, ratio: raw };
                              setMultiLooseUnits(updated);
                            }
                          }}
                          className="w-20 rounded border border-stroke dark:border-strokedark py-1 px-2 font-mono text-center font-bold outline-none focus:border-primary text-xs"
                          placeholder="1000"
                        />
                        <div className="w-28 relative">
                          <SearchableUomDropdown
                            value={tier.uom}
                            onChange={(val) => {
                              const clean = String(val || '').trim().toUpperCase();
                              const updated = [...multiLooseUnits];
                              updated[tIdx] = { ...tier, uom: clean };
                              setMultiLooseUnits(updated);
                            }}
                            uoms={availableUoms && availableUoms.length > 0 ? availableUoms : ['ML', 'GM', 'PCS', 'LTR', 'KG', 'MTR']}
                            compact={true}
                            placeholder="UOM"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMultiLooseUnits(multiLooseUnits.filter((_, i) => i !== tIdx));
                          }}
                          className="text-gray-400 hover:text-red-500 font-bold px-1"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* 3-LEVEL CASCADING CATEGORIES */}
        <div className="sm:col-span-2 pt-2 border-t border-stroke dark:border-strokedark">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            {isRTL ? 'کیٹیگری کا درجہ بندی (3 سطحی)' : '3-Level Product Categorization'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Level 1: Parent Category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white">
                {isRTL ? 'Parent Category' : 'Parent Category'}
              </label>
              <SearchableDropdown
                value={subSubCategory}
                onChange={(val) => {
                  setSubSubCategory(val);
                  setSubCategory('');
                  setCategory('');
                }}
                options={allCategories.filter(c => c.parent_id === null).map(c => c.name)}
                placeholder={isRTL ? 'Parent Category منتخب کریں' : 'Parent Category'}
                allowAll={false}
              />
            </div>

            {/* Level 2: Sub Category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white">
                {isRTL ? 'Sub Category' : 'Sub Category'}
              </label>
              <SearchableDropdown
                value={subCategory}
                onChange={(val) => {
                  setSubCategory(val);
                  setCategory('');
                }}
                options={(() => {
                  const parent = allCategories.find(c => c.parent_id === null && c.name?.trim().toLowerCase() === String(subSubCategory || '').trim().toLowerCase());
                  if (!parent) return [];
                  return allCategories.filter(c => c.parent_id === parent.id).map(c => c.name);
                })()}
                placeholder={isRTL ? 'Sub Category منتخب کریں' : 'Sub Category'}
                allowAll={false}
                disabled={!subSubCategory}
              />
            </div>

            {/* Level 3: Category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white">
                {isRTL ? 'Category' : 'Category'}
              </label>
              <SearchableDropdown
                value={category}
                onChange={(val) => setCategory(val)}
                options={(() => {
                  const parent = allCategories.find(c => c.parent_id === null && c.name?.trim().toLowerCase() === String(subSubCategory || '').trim().toLowerCase());
                  if (!parent) return [];
                  const sub = allCategories.find(c => c.parent_id === parent.id && c.name?.trim().toLowerCase() === String(subCategory || '').trim().toLowerCase());
                  if (!sub) return [];
                  return allCategories.filter(c => c.parent_id === sub.id).map(c => c.name);
                })()}
                placeholder={isRTL ? 'Category منتخب کریں' : 'Category'}
                allowAll={false}
                disabled={!subCategory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMProductOutputTab;
