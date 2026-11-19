import React from 'react';
import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';
import SearchableDropdown from '../../../../components/SearchableDropdown';
import { ReportConfig } from '../types/dedicatedFilterTypes';

interface FilterFieldsGridProps {
  activeConfig: ReportConfig;
  criteria: any;
  handleInputChange: (field: string, value: any) => void;
  // Options
  invoiceOptions: string[];
  customerCategoryOptions: string[];
  cityOptions: string[];
  areaOptions: string[];
  customerOptions: string[];
  supplierOptions: string[];
  salesmanOptions: string[];
  transportOptions: string[];
  locationOptions: string[];
  parentCategoryOptions: string[];
  subCategoryOptions: string[];
  subSubCategoryOptions: string[];
  productOptions: string[];
  colorOptions?: string[];
  binOptions: string[];
  uomOptions: string[];
  voucherTypeOptions: string[];
}

export const FilterFieldsGrid: React.FC<FilterFieldsGridProps> = ({
  activeConfig,
  criteria,
  handleInputChange,
  invoiceOptions,
  customerCategoryOptions,
  cityOptions,
  areaOptions,
  customerOptions,
  supplierOptions,
  salesmanOptions,
  transportOptions,
  locationOptions,
  parentCategoryOptions,
  subCategoryOptions,
  subSubCategoryOptions,
  productOptions,
  colorOptions = [],
  binOptions,
  uomOptions,
  voucherTypeOptions
}) => {
  const f = activeConfig.fields;

  return (
    <>
      {/* Invoice Profile Field */}
      {f.includes('invoice') && (
        <div className="md:col-span-2">
          <SearchableDropdown
            label="Select Target Invoice (Optional):"
            placeholder="All Invoices"
            options={invoiceOptions}
            value={criteria.invoiceNo === 'All' ? 'All' : criteria.invoiceNo}
            onChange={(val) => handleInputChange('invoiceNo', val)}
          />
        </div>
      )}

      {/* Customer Category Field */}
      {f.includes('customerCategory') && (
        <div>
          <SearchableMultiSelect
            label="Customer Category:"
            placeholder="All Categories"
            options={customerCategoryOptions}
            value={criteria.customerCategory}
            onChange={(val) => handleInputChange('customerCategory', val)}
          />
        </div>
      )}

      {/* City Field */}
      {f.includes('city') && (
        <div>
          <SearchableMultiSelect
            label="City / Sub Area:"
            placeholder="All Cities"
            options={cityOptions}
            value={criteria.city || []}
            onChange={(val) => {
              handleInputChange('city', val);
              handleInputChange('area', []);
              handleInputChange('customer', []);
            }}
          />
        </div>
      )}

      {/* Area Field */}
      {f.includes('area') && (
        <div>
          <SearchableMultiSelect
            label="Area / Market:"
            placeholder="All Areas"
            options={areaOptions}
            value={criteria.area || []}
            onChange={(val) => {
              handleInputChange('area', val);
              handleInputChange('customer', []);
            }}
          />
        </div>
      )}

      {/* Customer Field */}
      {f.includes('customer') && (
        <div>
          <SearchableMultiSelect
            label="Customer:"
            placeholder="All Customers"
            options={customerOptions}
            value={criteria.customer}
            onChange={(val) => handleInputChange('customer', val)}
          />
        </div>
      )}

      {/* Supplier Field */}
      {f.includes('supplier') && (
        <div>
          <SearchableMultiSelect
            label="Supplier:"
            placeholder="All Suppliers"
            options={supplierOptions}
            value={criteria.supplier}
            onChange={(val) => handleInputChange('supplier', val)}
          />
        </div>
      )}

      {/* Salesman Field */}
      {f.includes('salesman') && (
        <div>
          <SearchableMultiSelect
            label="Salesman:"
            placeholder="All Salesmen"
            options={salesmanOptions}
            value={criteria.salesman}
            onChange={(val) => handleInputChange('salesman', val)}
          />
        </div>
      )}

      {/* Transport / Carrier Fleet Field */}
      {f.includes('transport') && (
        <div>
          <SearchableMultiSelect
            label="Transport / Carrier:"
            placeholder="All Transports"
            options={transportOptions}
            value={criteria.transport}
            onChange={(val) => handleInputChange('transport', val)}
          />
        </div>
      )}

      {/* Location / Warehouse Field */}
      {f.includes('location') && (
        <div>
          <SearchableMultiSelect
            label={activeConfig.categoryName.includes('Purchase') ? 'Receiving Warehouse:' : 'Warehouse / Location:'}
            placeholder="All Facilities"
            options={locationOptions}
            value={criteria.location}
            onChange={(val) => handleInputChange('location', val)}
          />
        </div>
      )}

      {/* Parent Category Field */}
      {f.includes('parentCategory') && (
        <div>
          <SearchableMultiSelect
            label="Parent Category:"
            placeholder="All Categories"
            options={parentCategoryOptions}
            value={criteria.parentCategory}
            onChange={(val) => handleInputChange('parentCategory', val)}
          />
        </div>
      )}

      {/* Sub-Category Field */}
      {f.includes('subCategory') && (
        <div>
          <SearchableMultiSelect
            label="Sub-Category:"
            placeholder="All Sub-Categories"
            options={subCategoryOptions}
            value={criteria.subCategory}
            onChange={(val) => handleInputChange('subCategory', val)}
          />
        </div>
      )}

      {/* Leaf / Sub-Sub Category Field */}
      {f.includes('subSubCategory') && (
        <div>
          <SearchableMultiSelect
            label="Leaf Category:"
            placeholder="All Leaf Categories"
            options={subSubCategoryOptions}
            value={criteria.subSubCategory}
            onChange={(val) => handleInputChange('subSubCategory', val)}
          />
        </div>
      )}

      {/* Product Assets Field */}
      {f.includes('product') && (
        <div>
          <SearchableMultiSelect
            label="Product:"
            placeholder="All Products"
            options={productOptions}
            value={criteria.product}
            onChange={(val) => handleInputChange('product', val)}
          />
        </div>
      )}

      {/* Color / Shade Filter Field */}
      {(f.includes('product') || f.includes('color')) && (
        <div>
          <SearchableMultiSelect
            label="Color / Shade:"
            placeholder="e.g. White, Chrome, Gold, Matte Black..."
            options={colorOptions}
            value={criteria.color || []}
            onChange={(val) => handleInputChange('color', val)}
          />
        </div>
      )}

      {/* Finishing Brand Field */}
      {f.includes('brand') && (
        <div>
          <SearchableMultiSelect
            label="Brand:"
            placeholder="All Brands"
            options={binOptions}
            value={criteria.bin}
            onChange={(val) => handleInputChange('bin', val)}
          />
        </div>
      )}

      {/* UOM Field */}
      {f.includes('uom') && (
        <div>
          <SearchableMultiSelect
            label="UOM:"
            placeholder="All Units"
            options={uomOptions}
            value={criteria.uom}
            onChange={(val) => handleInputChange('uom', val)}
          />
        </div>
      )}

      {/* Sale Type / Payment Term Field */}
      {f.includes('saleType') && (
        <div>
          <label className="block text-slate-500 font-bold mb-1">Payment Term:</label>
          <select
            value={criteria.saleType}
            onChange={(e) => handleInputChange('saleType', e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Payment Terms</option>
            <option value="Cash">Cash Settlement Only</option>
            <option value="Credit">On Credit / Pay Later</option>
          </select>
        </div>
      )}

      {/* Sale Method Field */}
      {f.includes('saleMethod') && (
        <div>
          <label className="block text-slate-500 font-bold mb-1">Sale Method:</label>
          <select
            value={criteria.saleMethod}
            onChange={(e) => handleInputChange('saleMethod', e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Sale Methods</option>
            <option value="Direct">Direct Sale Counter</option>
            <option value="Challan">Via Delivery Challan</option>
          </select>
        </div>
      )}

      {/* Tax Scenario Field */}
      {f.includes('taxScenario') && (
        <div>
          <label className="block text-slate-500 font-bold mb-1">Tax Regime:</label>
          <select
            value={criteria.taxScenario}
            onChange={(e) => handleInputChange('taxScenario', e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Tax Scenarios</option>
            <option value="Registered Buyer (18% Sales Tax)">Registered Buyer (18% Sales Tax)</option>
            <option value="Unregistered Buyer (18% + 4% Further Tax)">Unregistered Buyer (18% + 4% Further Tax)</option>
            <option value="Standard Retail Sale (No Tax)">Standard Retail Sale (No Tax)</option>
          </select>
        </div>
      )}

      {/* Voucher Type Field */}
      {f.includes('voucherType') && (
        <div>
          <SearchableMultiSelect
            label="Voucher Classification:"
            placeholder="All Voucher Classifications"
            options={voucherTypeOptions}
            value={Array.isArray(criteria.voucherType) ? criteria.voucherType : (criteria.voucherType && criteria.voucherType !== 'All' ? [criteria.voucherType] : [])}
            onChange={(val) => handleInputChange('voucherType', val)}
          />
        </div>
      )}
    </>
  );
};

export default FilterFieldsGrid;
