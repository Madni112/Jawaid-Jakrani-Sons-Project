import React from 'react';

interface InvoiceChallanSectionProps {
  uniqueManualSaleWarehouses: string[];
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  getWarehouseDispatchStatus: (
    warehouse: string,
    items: any[],
    tileItems: any[],
    editData: any,
    dispatchWarehouse: string,
    productsList: any[]
  ) => any;
  editData: any;
  productsList: any[];
}

export const InvoiceChallanSection: React.FC<InvoiceChallanSectionProps> = ({
  uniqueManualSaleWarehouses,
  values,
  setFieldValue,
  getWarehouseDispatchStatus,
  editData,
  productsList,
}) => {
  if (uniqueManualSaleWarehouses.length === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.05] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
            📋
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              Dispatch Gate Pass / Bilty Number (Per Location)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Enter manual physical booklet gate pass numbers for each required dispatch source
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Manual Gate Pass Required
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {uniqueManualSaleWarehouses.map((wh: string) => {
          const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const whStatus = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.dispatchWarehouse, productsList);
          return (
            <div key={wh} className="p-3 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-xs space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 block truncate" title={wh}>
                  🏢 Dispatch Source: <span className="text-primary font-bold">{wh}</span>
                </label>
                {whStatus.hasExistingSlip && !whStatus.isNewOrIncreased ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Saved Slip
                  </span>
                ) : whStatus.isQtyIncreased ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Qty Increased (+{whStatus.formattedAddedQty || whStatus.addedQty})
                  </span>
                ) : whStatus.isWarehouseNew && editData ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    New Location
                  </span>
                ) : null}
              </div>
              <div className="flex items-center rounded-md border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition">
                <span className="px-2.5 py-1.5 text-xs font-black tracking-wide text-primary bg-primary/10 border-r border-stroke dark:border-strokedark select-none whitespace-nowrap">
                  {safePrefix}-
                </span>
                <input
                  type="text"
                  placeholder="Slip / No. (e.g. 001)"
                  value={values.gatePasses?.[wh] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFieldValue('gatePasses', {
                      ...(values.gatePasses || {}),
                      [wh]: val
                    });
                  }}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold text-black dark:text-white outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvoiceChallanSection;
