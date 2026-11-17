import React from 'react';

interface PurchaseReportFilterConstraintsProps {
  rType: string;
  filters: any;
  reportRowsCount: number;
}

export const PurchaseReportFilterConstraints: React.FC<PurchaseReportFilterConstraintsProps> = ({
  rType,
  filters,
  reportRowsCount
}) => {
  if (rType !== 'purchase-query') return null;

  return (
    <div className="bg-slate-50 border border-slate-300 rounded p-3 font-mono text-[10.5px] print:border-black space-y-1.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          🔍 APPLIED QUERY CONSTRAINTS &amp; SELECTION CRITERIA:
        </span>
        <span className="text-[9.5px] text-slate-500 font-bold">
          {reportRowsCount} Matching Consignment(s) Found
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-slate-700">
        <span className="bg-white px-2 py-0.5 rounded border border-slate-300">
          <b>Vendor:</b>{' '}
          {filters.supplier?.length > 0 && !filters.supplier.includes('All')
            ? Array.isArray(filters.supplier)
              ? filters.supplier.join(', ')
              : filters.supplier
            : filters.vendor?.length > 0 && !filters.vendor.includes('All')
            ? Array.isArray(filters.vendor)
              ? filters.vendor.join(', ')
              : filters.vendor
            : 'All Vendors'}
        </span>
        <span className="bg-white px-2 py-0.5 rounded border border-slate-300">
          <b>Warehouse:</b>{' '}
          {filters.location?.length > 0 && !filters.location.includes('All')
            ? Array.isArray(filters.location)
              ? filters.location.join(', ')
              : filters.location
            : 'All Facilities'}
        </span>
        {filters.parentCategory &&
          filters.parentCategory.length > 0 &&
          !filters.parentCategory.includes('All') && (
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold">
              <b>Category:</b>{' '}
              {Array.isArray(filters.parentCategory)
                ? filters.parentCategory.join(', ')
                : filters.parentCategory}
            </span>
          )}
        {filters.subCategory &&
          filters.subCategory.length > 0 &&
          !filters.subCategory.includes('All') && (
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold">
              <b>Sub-Category:</b>{' '}
              {Array.isArray(filters.subCategory)
                ? filters.subCategory.join(', ')
                : filters.subCategory}
            </span>
          )}
        {filters.product &&
          filters.product.length > 0 &&
          !filters.product.includes('All') && (
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold">
              <b>Queried Product:</b>{' '}
              {Array.isArray(filters.product) ? filters.product.join(', ') : filters.product}
            </span>
          )}
        {(filters.brand || filters.bin) &&
          ((filters.brand?.length > 0 && !filters.brand.includes('All')) ||
            (filters.bin?.length > 0 && !filters.bin.includes('All'))) && (
            <span className="bg-blue-50 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold">
              <b>Brand:</b>{' '}
              {Array.isArray(filters.brand || filters.bin)
                ? (filters.brand || filters.bin).join(', ')
                : filters.brand || filters.bin}
            </span>
          )}
        {(filters.purchaseType || filters.saleType) &&
          filters.purchaseType !== 'All' &&
          filters.saleType !== 'All' && (
            <span className="bg-purple-50 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold">
              <b>Payment Term:</b> {filters.purchaseType || filters.saleType}
            </span>
          )}
      </div>
    </div>
  );
};

export default PurchaseReportFilterConstraints;
