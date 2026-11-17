import React from 'react';

interface PurchaseChallanSectionProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  uniqueManualPurchaseWarehouses: string[];
  getWarehouseDispatchStatus: (wh: string, items: any[], tileItems: any[], editData: any, targetWarehouse: string, productList: any[]) => any;
  editData: any;
  productList: any[];
}

export const PurchaseChallanSection: React.FC<PurchaseChallanSectionProps> = ({
  values,
  setFieldValue,
  uniqueManualPurchaseWarehouses,
  getWarehouseDispatchStatus,
  editData,
  productList,
}) => {
  if (uniqueManualPurchaseWarehouses.length === 0) return null;

  return (
    <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/[0.02] dark:bg-purple-500/[0.05] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-sm">
            📦
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              Inward Receiving Slip / Gate Pass # (Per Location)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Enter supplier delivery challan or physical receiving slip number for each required receiving warehouse
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Manual Slip Required
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {uniqueManualPurchaseWarehouses.map((wh: string) => {
          const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const whStatus = getWarehouseDispatchStatus(
            wh,
            values.items,
            values.tileItems,
            editData,
            values.targetWarehouse,
            productList
          );
          return (
            <div
              key={wh}
              className="p-3 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <label
                  className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 block truncate"
                  title={wh}
                >
                  🏢 Location: <span className="text-purple-600 dark:text-purple-400 font-bold">{wh}</span>
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
              <div className="flex items-center rounded-md border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20 overflow-hidden focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition">
                <span className="px-2.5 py-1.5 text-xs font-black tracking-wide text-purple-600 dark:text-purple-400 bg-purple-500/10 border-r border-stroke dark:border-strokedark select-none whitespace-nowrap">
                  {safePrefix}-
                </span>
                <input
                  type="text"
                  placeholder="Challan / Slip # (e.g. 001)"
                  value={values.gatePasses?.[wh] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFieldValue('gatePasses', {
                      ...(values.gatePasses || {}),
                      [wh]: val,
                    });
                  }}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold text-black dark:text-white outline-none"
                />
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 block">
                Required physical inward slip for this location
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseChallanSection;
