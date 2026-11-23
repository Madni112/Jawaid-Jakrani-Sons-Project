import React, { useState } from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import { GRNFormValues, VendorItem, LocationItem } from '../types/grnTypes';

interface GRNHeaderSectionProps {
  values: GRNFormValues;
  errors: FormikErrors<GRNFormValues>;
  touched: FormikTouched<GRNFormValues>;
  setFieldValue: (field: string, value: any) => void;
  handleChange: React.ChangeEventHandler<any>;
  vendors: VendorItem[];
  locations: LocationItem[];
  workflowSettings?: any;
}

export const GRNHeaderSection: React.FC<GRNHeaderSectionProps> = ({
  values,
  errors,
  touched,
  setFieldValue,
  handleChange,
  vendors,
  locations,
  workflowSettings,
}) => {
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState(0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">GRN #: *</label>
          <input
            type="text"
            name="grnNo"
            value={values.grnNo}
            readOnly
            className={`w-full border rounded p-2 bg-gray-50 dark:bg-meta-4 text-gray-500 font-bold font-mono outline-none cursor-not-allowed ${
              touched.grnNo && errors.grnNo ? 'border-red-500' : 'border-stroke dark:border-strokedark'
            }`}
          />
        </div>

        <div className="md:col-span-2 relative vendor-search-container">
          <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Vendor Profile: *</label>
          <input
            type="text"
            name="vendorName"
            value={values.vendorName}
            autoComplete="new-password"
            onChange={(e) => {
              setFieldValue('vendorName', e.target.value);
              setIsVendorDropdownOpen(true);
              setHighlightedVendorIndex(0);
            }}
            onFocus={() => {
              setIsVendorDropdownOpen(true);
              setHighlightedVendorIndex(0);
            }}
            onKeyDown={(e) => {
              const filtered = (vendors || []).filter(v =>
                (v?.vendor_name || '').toLowerCase().includes(String(values.vendorName || '').toLowerCase())
              );
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedVendorIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedVendorIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
              } else if (e.key === 'Enter' && filtered.length > 0) {
                e.preventDefault();
                setFieldValue('vendorName', filtered[highlightedVendorIndex]?.vendor_name || filtered[0].vendor_name);
                setIsVendorDropdownOpen(false);
              } else if (e.key === 'Tab' || e.key === 'Escape') {
                setIsVendorDropdownOpen(false);
              }
            }}
            placeholder="Search Supply Vendor..."
            className={`w-full rounded border p-2 bg-transparent dark:bg-boxdark outline-none font-bold focus:border-primary ${
              touched.vendorName && errors.vendorName ? 'border-red-500' : 'border-stroke dark:border-strokedark'
            }`}
          />
          {isVendorDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-[99999] w-full max-h-64 overflow-y-auto bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-xl divide-y divide-stroke dark:divide-strokedark rounded-lg">
              {(() => {
                const filtered = (vendors || []).filter(v =>
                  (v?.vendor_name || '').toLowerCase().includes(String(values.vendorName || '').toLowerCase())
                );
                return filtered.length > 0 ? (
                  filtered.map((v, vIdx) => (
                    <div
                      key={v.vendor_name}
                      onMouseEnter={() => setHighlightedVendorIndex(vIdx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFieldValue('vendorName', v.vendor_name);
                        setIsVendorDropdownOpen(false);
                      }}
                      className={`p-2.5 cursor-pointer text-xs font-semibold ${
                        highlightedVendorIndex === vIdx
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-gray-100 dark:hover:bg-meta-4/30'
                      }`}
                    >
                      {v.vendor_name}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center italic text-gray-400">No vendors found</div>
                );
              })()}
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Receipt Date: *</label>
          <input
            type="date"
            name="receiptDate"
            value={values.receiptDate}
            onChange={handleChange}
            className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none font-bold focus:border-primary"
          />
        </div>
      </div>

      {/* TOP TOGGLE BUTTON FOR TILES */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const next = !values.showTileSection;
            setFieldValue('showTileSection', next);
            if (next && (!values.tileItems || values.tileItems.length === 0)) {
              setFieldValue('tileItems', [
                {
                  id: `tile-0-${Date.now()}`,
                  itemName: '',
                  skuCode: '',
                  warehouseName: '',
                  boxQty: 1,
                  loosePcs: 0,
                  totalSqm: 1.44,
                  costPricePerBox: 0,
                  costPricePerSqm: 0,
                  costPricePerPiece: 0,
                  totalAmount: 0,
                  piecesPerBox: 4,
                  sqmPerBox: 1.44
                }
              ]);
            }
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-xs flex items-center gap-1.5 border cursor-pointer ${
            values.showTileSection
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-200 border-stroke dark:border-strokedark hover:border-primary'
          }`}
        >
          {values.showTileSection ? '✓ Tiles Enabled' : '+ Receive Tiles'}
        </button>
      </div>
    </>
  );
};
