import React from 'react';
import { MdSearch, MdClear, MdKeyboardArrowDown } from 'react-icons/md';

interface ReturnHeaderProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  touched: any;
  isEditMode: boolean;
  defaultReturnNo: string;
  vendorSearchQuery: string;
  setVendorSearchQuery: (val: string) => void;
  filteredVendors: any[];
  isVendorDropdownOpen: boolean;
  setIsVendorDropdownOpen: (val: boolean) => void;
  highlightedVendorIndex: number;
  setHighlightedVendorIndex: React.Dispatch<React.SetStateAction<number>>;
  vendorContainerRef: React.RefObject<HTMLDivElement | null>;
  poSearchQuery: string;
  setPoSearchQuery: (val: string) => void;
  filteredPurchases: any[];
  isPoDropdownOpen: boolean;
  setIsPoDropdownOpen: (val: boolean) => void;
  highlightedPoIndex: number;
  setHighlightedPoIndex: React.Dispatch<React.SetStateAction<number>>;
  poContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedPoNo: string;
  setSelectedPoNo: (val: string) => void;
  setSelectedPoObj: (val: any) => void;
  parsePurchaseItemsForReturn: (purchaseObj: any, defaultWarehouse?: string) => { standardList: any[]; tileList: any[] };
  locations: any[];
}

export const ReturnHeader: React.FC<ReturnHeaderProps> = ({
  values,
  handleChange,
  setFieldValue,
  errors,
  touched,
  isEditMode,
  defaultReturnNo,
  vendorSearchQuery,
  setVendorSearchQuery,
  filteredVendors,
  isVendorDropdownOpen,
  setIsVendorDropdownOpen,
  highlightedVendorIndex,
  setHighlightedVendorIndex,
  vendorContainerRef,
  poSearchQuery,
  setPoSearchQuery,
  filteredPurchases,
  isPoDropdownOpen,
  setIsPoDropdownOpen,
  highlightedPoIndex,
  setHighlightedPoIndex,
  poContainerRef,
  selectedPoNo,
  setSelectedPoNo,
  setSelectedPoObj,
  parsePurchaseItemsForReturn,
  locations,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Return Memo ID */}
      <div>
        <label className="block text-gray-500 dark:text-gray-400 font-bold mb-1">
          Return Memo ID #: *
        </label>
        <input
          type="text"
          name="returnNo"
          onChange={handleChange}
          value={values.returnNo}
          placeholder={defaultReturnNo || 'e.g. PRTN-0001'}
          className="w-full rounded border p-2 font-bold font-mono text-primary outline-none focus:border-primary text-xs bg-transparent border-stroke dark:border-strokedark"
        />
      </div>

      {/* Processing Date */}
      <div>
        <label className="block text-gray-500 dark:text-gray-400 font-bold mb-1">
          Processing Return Date: *
        </label>
        <input
          type="date"
          name="returnDate"
          onChange={handleChange}
          value={values.returnDate}
          className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark font-semibold outline-none text-black dark:text-white text-xs focus:border-primary"
        />
      </div>

      {/* Wholesale Vendor (Searchable Autocomplete) */}
      <div className="relative" ref={vendorContainerRef}>
        <label className="block text-gray-500 dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
          <span>Wholesale Vendor: *</span>
        </label>
        <div className="relative">
          <input
            type="text"
            disabled={isEditMode}
            value={vendorSearchQuery}
            onFocus={() => setIsVendorDropdownOpen(true)}
            onBlur={() => setIsVendorDropdownOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedVendorIndex((prev) => Math.min(prev + 1, filteredVendors.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedVendorIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredVendors[highlightedVendorIndex]) {
                  const v = filteredVendors[highlightedVendorIndex];
                  setFieldValue('vendorName', v.vendor_name);
                  setVendorSearchQuery(v.vendor_name);
                  setIsVendorDropdownOpen(false);
                }
              } else if (e.key === 'Escape') {
                setIsVendorDropdownOpen(false);
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              setVendorSearchQuery(val);
              setFieldValue('vendorName', val);
              setIsVendorDropdownOpen(true);
              setHighlightedVendorIndex(0);
            }}
            placeholder="Type to search vendor..."
            className={`w-full rounded border p-2 bg-white dark:bg-boxdark font-bold text-black dark:text-white text-xs outline-none ${
              touched.vendorName && errors.vendorName
                ? 'border-red-500'
                : 'border-stroke dark:border-strokedark focus:border-primary'
            }`}
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {values.vendorName && !isEditMode && (
              <button
                type="button"
                onClick={() => {
                  setFieldValue('vendorName', '');
                  setVendorSearchQuery('');
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <MdClear size={14} />
              </button>
            )}
            <MdSearch className="text-gray-400" size={16} />
          </div>
        </div>

        {/* Vendor Dropdown */}
        {isVendorDropdownOpen && !isEditMode && (
          <div className="absolute left-0 top-full mt-1 z-[99999] w-full max-h-56 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
            {filteredVendors.length > 0 ? (
              filteredVendors.map((v, vIdx) => (
                <div
                  key={v.id}
                  onMouseEnter={() => setHighlightedVendorIndex(vIdx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFieldValue('vendorName', v.vendor_name);
                    setVendorSearchQuery(v.vendor_name);
                    setIsVendorDropdownOpen(false);
                  }}
                  className={`p-2.5 cursor-pointer text-xs flex justify-between items-center ${
                    highlightedVendorIndex === vIdx || values.vendorName === v.vendor_name
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-black dark:text-white'
                  }`}
                >
                  <div>
                    <p className="font-bold">{v.vendor_name}</p>
                    <p className="text-[10px] text-gray-400">
                      {v.contact_name} {v.phone ? `• ${v.phone}` : ''}
                    </p>
                  </div>
                  {v.city && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 font-mono">
                      {v.city}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-gray-400 italic">No matching vendors found</div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Invoice / Bill Reference */}
      <div className="relative" ref={poContainerRef}>
        <label className="block text-gray-500 dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
          <span>Purchase Invoice (Recommended):</span>
        </label>
        <div className="relative">
          <input
            type="text"
            disabled={isEditMode || !values.vendorName}
            value={poSearchQuery}
            onFocus={() => setIsPoDropdownOpen(true)}
            onBlur={() => setIsPoDropdownOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedPoIndex((prev) => Math.min(prev + 1, filteredPurchases.length));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedPoIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredPurchases[highlightedPoIndex]) {
                  const p = filteredPurchases[highlightedPoIndex];
                  const pNo = p.purchase_no || `PUR-${p.id}`;
                  setPoSearchQuery(pNo);
                  setSelectedPoNo(pNo);
                  setSelectedPoObj(p);
                  setFieldValue('purchaseNo', pNo);
                  const { standardList, tileList } = parsePurchaseItemsForReturn(p, values.sourceWarehouse);
                  if (tileList.length > 0) {
                    setFieldValue('showTileSection', true);
                    setFieldValue('tileItems', tileList);
                  } else {
                    setFieldValue('showTileSection', false);
                  }
                  if (standardList.length > 0) {
                    setFieldValue('items', standardList);
                  } else {
                    setFieldValue('items', [
                      {
                        skuCode: '',
                        itemName: '',
                        warehouse: values.sourceWarehouse || locations[0]?.name || 'Central Warehouse A',
                        qty: 0,
                        rate: 0,
                        uom: 'Nos',
                      },
                    ]);
                  }
                }
                setIsPoDropdownOpen(false);
              } else if (e.key === 'Escape') {
                setIsPoDropdownOpen(false);
              }
            }}
            onChange={(e) => {
              setPoSearchQuery(e.target.value);
              setIsPoDropdownOpen(true);
              setHighlightedPoIndex(0);
            }}
            placeholder={values.vendorName ? 'Type to search invoice...' : 'Select Vendor first...'}
            className={`w-full rounded border p-2 font-bold text-xs outline-none transition-colors ${
              isEditMode || !values.vendorName
                ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-75'
                : 'bg-white dark:bg-boxdark text-black dark:text-white border-stroke dark:border-strokedark focus:border-primary'
            }`}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {poSearchQuery && !isEditMode && (
              <button
                type="button"
                onClick={() => {
                  setPoSearchQuery('');
                  setSelectedPoNo('');
                  setSelectedPoObj(null);
                  setFieldValue('purchaseNo', '');
                  setFieldValue('items', [
                    {
                      skuCode: '',
                      itemName: '',
                      warehouse: values.sourceWarehouse || locations[0]?.name || 'Central Warehouse A',
                      qty: 1,
                      rate: 0,
                      uom: 'Nos',
                    },
                  ]);
                  setFieldValue('showTileSection', false);
                  setFieldValue('tileItems', []);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <MdClear size={14} />
              </button>
            )}
            <MdKeyboardArrowDown className="text-gray-400" size={16} />
          </div>
        </div>
        {/* PO Dropdown */}
        {isPoDropdownOpen && !isEditMode && values.vendorName && (
          <div className="absolute left-0 top-full mt-1 z-[99999] w-full max-h-56 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPurchases.length > 0 ? (
              filteredPurchases.map((p, idx) => {
                const pNo = p.purchase_no || `PUR-${p.id}`;
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHighlightedPoIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setPoSearchQuery(pNo);
                      setSelectedPoNo(pNo);
                      setSelectedPoObj(p);
                      setFieldValue('purchaseNo', pNo);
                      const { standardList, tileList } = parsePurchaseItemsForReturn(p, values.sourceWarehouse);
                      if (tileList.length > 0) {
                        setFieldValue('showTileSection', true);
                        setFieldValue('tileItems', tileList);
                      } else {
                        setFieldValue('showTileSection', false);
                      }
                      if (standardList.length > 0) {
                        setFieldValue('items', standardList);
                      } else {
                        setFieldValue('items', [
                          {
                            skuCode: '',
                            itemName: '',
                            warehouse: values.sourceWarehouse || locations[0]?.name || 'Central Warehouse A',
                            qty: 0,
                            rate: 0,
                            uom: 'Nos',
                          },
                        ]);
                      }
                      setIsPoDropdownOpen(false);
                    }}
                    className={`p-2.5 cursor-pointer text-xs flex justify-between items-center ${
                      highlightedPoIndex === idx || selectedPoNo === pNo
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-black dark:text-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{pNo}</p>
                      <p className="text-[10px] text-gray-400">{p.purchase_date || p.created_at?.substring(0, 10)}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 font-mono">
                      Rs. {p.total_amount}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-gray-400 italic">No invoices found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
