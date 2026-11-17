import React from 'react';
import { MdPrecisionManufacturing, MdLayers, MdAdd, MdDelete } from 'react-icons/md';
import SearchableProductSelect from '../../../../components/SearchableProductSelect';
import SearchableUomDropdown from '../../../../components/SearchableUomDropdown';
import { BomItem } from '../types/bomTypes';

interface BOMRawMaterialsTabProps {
  isRTL: boolean;
  uom: string;
  batchQuantity: number;
  setBatchQuantity: (qty: number) => void;
  items: BomItem[];
  catalogProducts: any[];
  allUomsList: any[];
  availableUoms: string[];
  rawMaterialCost: number;
  onAddItemRow: () => void;
  onRemoveItemRow: (idx: number) => void;
  onUpdateItem: (idx: number, field: keyof BomItem, val: any) => void;
}

export const BOMRawMaterialsTab: React.FC<BOMRawMaterialsTabProps> = ({
  isRTL,
  uom,
  batchQuantity,
  setBatchQuantity,
  items,
  catalogProducts,
  allUomsList,
  availableUoms,
  rawMaterialCost,
  onAddItemRow,
  onRemoveItemRow,
  onUpdateItem
}) => {
  return (
    <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark space-y-4">
      {/* Batch Production Target Card */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary text-white shadow-xs">
            <MdPrecisionManufacturing className="text-xl" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black dark:text-white block">
              {isRTL ? 'بیچ پیداواری مقدار (Batch Production Quantity) *' : 'Batch Production Quantity *'}
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {isRTL
                ? `یہ نسخہ نیچے دیے گئے تمام خام مال سے تیار ہونے والی کل مقدار (${uom}) کو ظاہر کرتا ہے۔`
                : `Total output produced by this recipe run. Raw materials below formulate this exact batch size.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="number"
            min="0.001"
            step="any"
            required
            value={batchQuantity}
            onChange={e => setBatchQuantity(parseFloat(e.target.value) || 0)}
            className="w-36 rounded-xl border-2 border-primary/40 bg-white py-2 px-3 text-sm font-mono font-bold text-primary dark:bg-meta-4 outline-none focus:border-primary shadow-xs text-center"
            placeholder="1"
          />
          <span className="font-bold text-xs bg-white dark:bg-meta-4 border border-stroke dark:border-strokedark px-3 py-2 rounded-xl text-black dark:text-white uppercase font-mono">
            {uom}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stroke pb-3 dark:border-strokedark">
        <div className="flex items-center gap-2">
          <MdLayers className="text-xl text-primary" />
          <div>
            <h2 className="text-base font-semibold text-black dark:text-white">
              {isRTL ? 'خام مال اور اجزائے ترکیبی (Raw Materials & Ingredients)' : '2. Raw Materials & Components'}
            </h2>
            <p className="text-xs text-gray-500">
              {isRTL
                ? 'اس بیچ کی تیاری کے لیے درکار تمام خام اشیاء اور ان کا ضیاع درج کریں'
                : 'List all raw materials, inputs, quantities, wastage allowances & unit costs for this batch'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddItemRow}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
        >
          <MdAdd className="text-base" />
          <span>{isRTL ? '+ نیا خام مال شامل کریں' : '+ Add Material Item'}</span>
        </button>
      </div>

      <div className="overflow-x-auto min-h-[300px] pb-32">
        <table className="w-full min-w-[1040px] table-fixed text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 uppercase font-semibold">
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[280px]`}>
                {isRTL ? 'خام مال / جزو *' : 'Material / Component Name *'}
              </th>
              <th className="p-2.5 text-center w-[110px]">
                {isRTL ? 'مقدار *' : 'Quantity *'}
              </th>
              <th className="p-2.5 text-center w-[100px]">
                {isRTL ? 'اکائی (UOM)' : 'UOM'}
              </th>
              <th className="p-2.5 text-center w-[130px]">
                {isRTL ? 'فی یونٹ ریٹ' : 'Unit Cost'}
              </th>
              <th className="p-2.5 text-center w-[90px]">
                {isRTL ? 'ضیاع %' : 'Waste %'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-left' : 'text-right'} w-[140px]`}>
                {isRTL ? 'کل لاگت' : 'Total Cost'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[140px]`}>
                {isRTL ? 'نوٹ' : 'Note'}
              </th>
              <th className="p-2.5 text-center w-[50px]">
                {isRTL ? 'حذف' : 'Del'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {items.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-meta-4/20 relative z-10 focus-within:z-30 hover:z-20">
                <td className="p-2 w-[280px] relative">
                  <SearchableProductSelect
                    products={catalogProducts}
                    value={row.item_name}
                    onChange={(name, selectedProd) => {
                      onUpdateItem(idx, 'item_name', name);
                      if (selectedProd) {
                        if (selectedProd.purchase_price) {
                          onUpdateItem(idx, 'unit_cost', Number(selectedProd.purchase_price));
                        }
                        if (selectedProd.item_sr_no) {
                          onUpdateItem(idx, 'item_code', selectedProd.item_sr_no);
                        }
                        if (selectedProd.uom) {
                          onUpdateItem(idx, 'uom', selectedProd.uom);
                        }
                        if (selectedProd.id) {
                          onUpdateItem(idx, 'item_id', String(selectedProd.id));
                        }
                      }
                    }}
                    placeholder={
                      isRTL
                        ? 'خام مال تلاش کریں یا نیا نام لکھیں...'
                        : 'Search or type raw material...'
                    }
                    allowCustom={true}
                    priceType="purchase"
                    isRTL={isRTL}
                  />
                </td>

                <td className="p-2 w-[110px]">
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    value={row.quantity}
                    onChange={e =>
                      onUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium"
                  />
                </td>

                <td className="p-2 w-[100px] relative">
                  <SearchableUomDropdown
                    value={row.uom}
                    onChange={val => onUpdateItem(idx, 'uom', val)}
                    uoms={allUomsList.length > 0 ? allUomsList : availableUoms}
                    compact={true}
                    isRTL={isRTL}
                  />
                </td>

                <td className="p-2 w-[130px]">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.unit_cost}
                    onChange={e =>
                      onUpdateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium"
                  />
                </td>

                <td className="p-2 w-[90px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={row.wastage_percentage}
                    onChange={e =>
                      onUpdateItem(idx, 'wastage_percentage', parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium"
                    placeholder="0"
                  />
                </td>

                <td
                  className={`p-2 w-[140px] font-mono font-bold text-black dark:text-white ${
                    isRTL ? 'text-left' : 'text-right'
                  }`}
                >
                  PKR {row.total_cost.toLocaleString()}
                </td>

                <td className="p-2 w-[140px]">
                  <input
                    type="text"
                    placeholder={isRTL ? 'نوٹ...' : 'scrap, color...'}
                    value={row.notes || ''}
                    onChange={e => onUpdateItem(idx, 'notes', e.target.value)}
                    className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 outline-none focus:border-primary dark:border-strokedark"
                  />
                </td>

                <td className="p-2 w-[50px] text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItemRow(idx)}
                    className="p-1 text-gray-400 hover:text-danger rounded hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer"
                    title={isRTL ? 'حذف کریں' : 'Remove row'}
                  >
                    <MdDelete className="text-base" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-stroke dark:border-strokedark">
        <button
          type="button"
          onClick={onAddItemRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stroke px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary dark:border-strokedark dark:text-gray-300 cursor-pointer"
        >
          <MdAdd className="text-base" />
          <span>{isRTL ? '+ نئی قطار شامل کریں' : '+ Add Another Item'}</span>
        </button>

        <div className="text-xs font-semibold text-black dark:text-white">
          {isRTL ? 'خام مال کا میزان:' : 'Total Raw Materials:'}{' '}
          <span className="font-mono text-primary text-sm mr-1 ml-1 font-bold">
            PKR {rawMaterialCost.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BOMRawMaterialsTab;
