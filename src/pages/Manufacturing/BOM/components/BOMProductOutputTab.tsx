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
  setCategory
}) => {
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
