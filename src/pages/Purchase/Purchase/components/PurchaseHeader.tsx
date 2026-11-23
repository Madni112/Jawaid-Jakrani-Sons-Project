import React from 'react';

interface PurchaseHeaderProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  hasAttempted: boolean;
  suppliers: any[];
  locations: any[];
  hasTileProducts?: boolean;
  isVendorDropdownOpen: boolean;
  setIsVendorDropdownOpen: (val: boolean) => void;
  highlightedVendorIndex: number;
  setHighlightedVendorIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const PurchaseHeader: React.FC<PurchaseHeaderProps> = ({
  values,
  handleChange,
  setFieldValue,
  errors,
  hasAttempted,
  suppliers,
  locations,
  hasTileProducts = false,
  isVendorDropdownOpen,
  setIsVendorDropdownOpen,
  highlightedVendorIndex,
  setHighlightedVendorIndex,
}) => {
  return (
    <>
      {/* ── TOP 3-COLUMN HEADER BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-meta-4/5 p-4 rounded-sm border border-stroke dark:border-strokedark relative z-10">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-gray-500">Purchase #: *</label>
            {(values.grnNo || values.grnId) && (
              <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                Linked: {values.grnNo || `GRN #${values.grnId}`}
              </span>
            )}
          </div>
          <input
            type="text"
            name="purchaseNo"
            value={values.purchaseNo}
            readOnly
            className="w-full rounded border border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4 cursor-not-allowed p-2 text-sm font-bold font-mono text-gray-600 dark:text-gray-300 outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-500 mb-1">Inbound Purchase Date: *</label>
          <input
            type="date"
            name="purchaseDate"
            value={values.purchaseDate}
            onChange={handleChange}
            className={`w-full rounded border p-2 text-sm bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white ${
              hasAttempted && errors.purchaseDate
                ? 'border-red-500 bg-red-50/10'
                : 'border-stroke dark:border-strokedark focus:border-primary'
            }`}
          />
        </div>

        {/* Searchable Wholesale Vendor */}
        <div className="relative vendor-search-container">
          <label className="block font-bold text-gray-500 mb-1">Wholesale Vendor: *</label>
          {(() => {
            const filteredVendors = suppliers.filter((s) => {
              if (!values.supplierName) return true;
              const q = (values.supplierName || '').toLowerCase().trim();
              const vName = (s.vendor_name || '').toLowerCase();
              const vPhone = (s.phone || '').toLowerCase();
              const vContact = (s.contact_person || '').toLowerCase();
              return vName.includes(q) || vPhone.includes(q) || vContact.includes(q);
            });

            return (
              <div className="relative">
                <input
                  type="text"
                  autoComplete="off"
                  value={values.supplierName}
                  onFocus={() => {
                    setIsVendorDropdownOpen(true);
                    setHighlightedVendorIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setIsVendorDropdownOpen(true);
                      setHighlightedVendorIndex((prev) => (prev < filteredVendors.length - 1 ? prev + 1 : 0));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setIsVendorDropdownOpen(true);
                      setHighlightedVendorIndex((prev) => (prev > 0 ? prev - 1 : filteredVendors.length - 1));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredVendors[highlightedVendorIndex]) {
                        setFieldValue('supplierName', filteredVendors[highlightedVendorIndex].vendor_name);
                        setIsVendorDropdownOpen(false);
                      }
                    } else if (e.key === 'Escape' || e.key === 'Tab') {
                      setIsVendorDropdownOpen(false);
                    }
                  }}
                  onChange={(e) => {
                    setFieldValue('supplierName', e.target.value);
                    setIsVendorDropdownOpen(true);
                    setHighlightedVendorIndex(0);
                  }}
                  placeholder="Type or search vendor name..."
                  className={`w-full rounded border p-2 text-sm bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white ${
                    hasAttempted && errors.supplierName
                      ? 'border-red-500 bg-red-50/10'
                      : 'border-stroke dark:border-strokedark focus:border-primary'
                  }`}
                />

                {isVendorDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 z-[999999] w-full max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVendors.length > 0 ? (
                      filteredVendors.map((vendor, vIdx) => (
                        <div
                          key={vendor.id}
                          onMouseEnter={() => setHighlightedVendorIndex(vIdx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFieldValue('supplierName', vendor.vendor_name);
                            setIsVendorDropdownOpen(false);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFieldValue('supplierName', vendor.vendor_name);
                            setIsVendorDropdownOpen(false);
                          }}
                          className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
                            highlightedVendorIndex === vIdx || values.supplierName === vendor.vendor_name
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold">{vendor.vendor_name}</span>
                            {(vendor.contact_person || vendor.phone) && (
                              <span className="text-[10px] text-slate-400">
                                {vendor.contact_person} {vendor.phone ? `• ${vendor.phone}` : ''}
                              </span>
                            )}
                          </div>
                          {vendor.city && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              {vendor.city}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 italic">No matching vendors found</div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {hasAttempted && errors.supplierName && (
            <p className="text-red-500 text-[10px] font-bold mt-1">{String(errors.supplierName)}</p>
          )}
        </div>
      </div>

      {/* ── TAX, DISCOUNT & TILE TOGGLE BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark rounded-sm relative z-0">
        <div className="flex items-center gap-6">
          {/* Discount Column Toggle */}
          <div
            onClick={() => {
              const isChecked = !values.showDiscount;
              setFieldValue('showDiscount', isChecked);
              if (!isChecked) {
                values.items.forEach((_: any, idx: number) => {
                  setFieldValue(`items.${idx}.discountPer`, 0);
                  setFieldValue(`items.${idx}.discountAmt`, 0);
                });
              }
            }}
            className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
              values.showDiscount
                ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            Discounts
          </div>

          {/* Freight Charges Toggle */}
          <div
            onClick={() => {
              const isChecked = !values.showAdditionalCharges;
              setFieldValue('showAdditionalCharges', isChecked);
              if (!isChecked) setFieldValue('additionalCharges', 0);
            }}
            className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
              values.showAdditionalCharges
                ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            Freight Charges
          </div>

          {/* + Purchase Tiles Toggle (Only shown if catalog has tile products or already has tile items) */}
          {(hasTileProducts || Boolean(values.showTileSection) || (values.tileItems && values.tileItems.length > 0)) && (
            <div
              onClick={() => {
                const nextVal = !values.showTileSection;
                setFieldValue('showTileSection', nextVal);
                if (nextVal && (!values.tileItems || values.tileItems.length === 0)) {
                  setFieldValue('tileItems', [
                    {
                      id: `tile-0-${Date.now()}`,
                      itemName: '',
                      skuCode: '',
                      warehouse: '',
                      boxQty: 1,
                      loosePcs: 0,
                      totalSqm: 0,
                      costPricePerBox: 0,
                      costPricePerPiece: 0,
                      costPricePerSqm: 0,
                      totalAmount: 0,
                      piecesPerBox: 4,
                      sqmPerBox: 1.44,
                    },
                  ]);
                }
              }}
              className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border shadow-xs ${
                values.showTileSection
                  ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700 shadow-slate-900/10'
                  : 'bg-white text-slate-700 border-stroke dark:bg-boxdark dark:text-slate-200 dark:border-strokedark hover:border-primary'
              }`}
            >
              {values.showTileSection ? '✓ Tiles Enabled' : '+ Purchase Tiles'}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PurchaseHeader;
