import React from 'react';
import { FiPlus, FiX, FiChevronDown } from 'react-icons/fi';

interface InvoiceHeaderProps {
  values: any;
  errors: any;
  hasAttempted: boolean;
  currentPrefix: string;
  rawSuffix: string;
  isSalesman: boolean;
  matchedSalesman: string;
  currentSalesmanName: string;
  salesmenList: any[];
  getSalesmanPrefix: (name: string, list: any[]) => string;
  editData: any;
  customersList: any[];
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (open: boolean) => void;
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
  highlightedCustomerIndex: number;
  setHighlightedCustomerIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedRecordedCustomer: string;
  setSelectedRecordedCustomer: (name: string) => void;
  setCustomerModalType: (type: 'walkin' | 'recorded') => void;
  setCustomerSoldMap: (map: any) => void;
  fetchCustomerPastSales: (customerName: string) => Promise<void>;
  handleOpenQuickCustomerModal: (query: string, setFieldValue: any) => void;
  warehousesList: string[];
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  values,
  errors,
  hasAttempted,
  currentPrefix,
  rawSuffix,
  isSalesman,
  matchedSalesman,
  currentSalesmanName,
  salesmenList,
  getSalesmanPrefix,
  editData,
  customersList,
  isCustomerDropdownOpen,
  setIsCustomerDropdownOpen,
  customerSearchQuery,
  setCustomerSearchQuery,
  highlightedCustomerIndex,
  setHighlightedCustomerIndex,
  selectedRecordedCustomer,
  setSelectedRecordedCustomer,
  setCustomerModalType,
  setCustomerSoldMap,
  fetchCustomerPastSales,
  handleOpenQuickCustomerModal,
  warehousesList,
  handleChange,
  setFieldValue,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50 dark:bg-meta-4/5 p-4 rounded-sm border border-stroke dark:border-strokedark">
        <div className="md:col-span-5">
          <label className="block font-bold text-gray-500 mb-1">Invoice Number #: *</label>
          <div className={`flex items-center rounded border overflow-hidden bg-white dark:bg-boxdark ${hasAttempted && errors.invoiceNo ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus-within:border-primary'}`}>
            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs sm:text-sm border-r border-stroke dark:border-strokedark select-none whitespace-nowrap shrink-0 flex items-center justify-center">
              {currentPrefix || <span className="text-gray-400 font-normal text-xs">Prefix-</span>}
            </span>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              name="invoiceNo" 
              placeholder={currentPrefix ? "e.g. 001 or 26388" : "Select salesman first"} 
              value={rawSuffix} 
              onKeyDown={(e) => {
                if (
                  !/[\d]/.test(e.key) &&
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '');
                if (currentPrefix) {
                  setFieldValue('invoiceNo', `${currentPrefix}${digitsOnly}`);
                } else {
                  setFieldValue('invoiceNo', digitsOnly);
                }
              }} 
              className="w-full min-w-0 p-2 text-sm bg-transparent font-bold outline-none text-black dark:text-white placeholder:font-normal placeholder:text-xs placeholder:text-gray-400 font-mono" 
            />
          </div>
          {hasAttempted && errors.invoiceNo && <p className="text-red-500 text-xs font-bold mt-1">{String(errors.invoiceNo)}</p>}
        </div>

        <div className="md:col-span-3">
          <label className="block font-bold text-gray-500 mb-1">Billing Date: *</label>
          <input 
            type="date" 
            name="saleDate" 
            value={values.saleDate} 
            onChange={handleChange}
            min={editData ? undefined : new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full rounded border p-2 text-sm bg-transparent font-bold outline-none text-black dark:text-white ${hasAttempted && errors.saleDate ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'}`} 
          />
        </div>

        <div className="md:col-span-4">
          <label className="block font-bold text-gray-500 mb-1">
            Assigned Salesman: * {isSalesman && <span className="text-[11px] text-emerald-600 font-semibold">(Locked)</span>}
          </label>
          {isSalesman ? (
            <div className="relative">
              <input
                type="text"
                name="salesman"
                value={values.salesman || matchedSalesman || currentSalesmanName}
                readOnly
                className="w-full rounded border p-2 text-sm bg-gray-100 dark:bg-slate-800 font-bold outline-none text-slate-800 dark:text-slate-100 border-stroke dark:border-strokedark cursor-not-allowed select-none"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                🔒 Logged In
              </div>
            </div>
          ) : (
            <select
              name="salesman"
              value={values.salesman}
              onChange={(e) => {
                const selectedSm = e.target.value;
                setFieldValue('salesman', selectedSm);
                const newPrefix = getSalesmanPrefix(selectedSm, salesmenList);
                if (rawSuffix) {
                  setFieldValue('invoiceNo', newPrefix ? `${newPrefix}${rawSuffix}` : rawSuffix);
                } else {
                  setFieldValue('invoiceNo', newPrefix ? `${newPrefix}` : '');
                }
              }}
              className={`w-full rounded border p-2 text-sm bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white ${hasAttempted && errors.salesman ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'}`}
            >
              <option value="">-- Select Officer --</option>
              {salesmenList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} {s.invoice_name ? `(${s.invoice_name})` : ''}
                </option>
              ))}
            </select>
          )}
          {hasAttempted && errors.salesman && (
            <p className="text-red-500 text-xs font-bold mt-1">{String(errors.salesman)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-meta-4/5 p-4 rounded-sm border border-stroke dark:border-strokedark">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-gray-500">
              Customer Account / Profile:
            </label>
            <button
              type="button"
              onClick={() => handleOpenQuickCustomerModal(customerSearchQuery, setFieldValue)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded"
              title="Quickly add new customer without leaving invoice"
            >
              <FiPlus className="text-xs" /> New Customer
            </button>
          </div>

          <div className="relative customer-combobox-container">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search customer by name, code, phone or select Walk-in..."
                value={
                  isCustomerDropdownOpen
                    ? customerSearchQuery
                    : (values.customerName || selectedRecordedCustomer || 'Walk-in Customer (Counter)')
                }
                onFocus={() => {
                  setIsCustomerDropdownOpen(true);
                  setCustomerSearchQuery('');
                  setHighlightedCustomerIndex(0);
                }}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setIsCustomerDropdownOpen(true);
                  setHighlightedCustomerIndex(0);
                }}
                onKeyDown={(e) => {
                  if (!isCustomerDropdownOpen) {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      setIsCustomerDropdownOpen(true);
                      e.preventDefault();
                    }
                    return;
                  }

                  const filtered = [
                    { id: 'walkin', customerName: 'Walk-in Customer (Counter)', isWalkin: true },
                    ...customersList.filter((c: any) => {
                      const q = customerSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      const name = String(c.customerName || c.name || '').toLowerCase();
                      const code = String(c.customer_code || c.customerCode || c.coa_code || '').toLowerCase();
                      const phone = String(c.primaryPhone || c.phone || '').toLowerCase();
                      return name.includes(q) || code.includes(q) || phone.includes(q);
                    })
                  ];

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedCustomerIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedCustomerIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered[highlightedCustomerIndex]) {
                      const item = filtered[highlightedCustomerIndex];
                      if (item.isWalkin) {
                        setFieldValue('customerName', '');
                        setSelectedRecordedCustomer('');
                        setCustomerModalType('walkin');
                        setCustomerSoldMap({});
                      } else {
                        setFieldValue('customerName', item.customerName);
                        setSelectedRecordedCustomer(item.customerName);
                        setCustomerModalType('recorded');
                        fetchCustomerPastSales(item.customerName);
                        if (item.address && !values.shippingAddress) {
                          setFieldValue('shippingAddress', item.address);
                        }
                      }
                      setIsCustomerDropdownOpen(false);
                      setCustomerSearchQuery('');
                    } else if (customerSearchQuery.trim()) {
                      handleOpenQuickCustomerModal(customerSearchQuery.trim(), setFieldValue);
                    }
                  } else if (e.key === 'Escape') {
                    setIsCustomerDropdownOpen(false);
                  }
                }}
                className="w-full rounded border border-stroke dark:border-strokedark p-2 pr-16 text-sm bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white focus:border-primary shadow-sm"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {(values.customerName || selectedRecordedCustomer) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue('customerName', '');
                      setSelectedRecordedCustomer('');
                      setCustomerModalType('walkin');
                      setCustomerSoldMap({});
                      setCustomerSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs p-1"
                    title="Reset to Walk-in"
                  >
                    <FiX />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="text-gray-400 hover:text-primary text-xs p-1"
                >
                  <FiChevronDown className={`transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isCustomerDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-2xl z-50 py-1">
                {/* Walkin Option */}
                <div
                  onClick={() => {
                    setFieldValue('customerName', '');
                    setSelectedRecordedCustomer('');
                    setCustomerModalType('walkin');
                    setCustomerSoldMap({});
                    setIsCustomerDropdownOpen(false);
                    setCustomerSearchQuery('');
                  }}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between border-b border-stroke/50 dark:border-strokedark/50 ${
                    highlightedCustomerIndex === 0
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-meta-4'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Walk-in Customer (Counter)</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-meta-4 text-slate-500 px-1.5 py-0.5 rounded font-mono">Counter</span>
                </div>

                {/* Filtered Customer List */}
                {customersList
                  .filter((c: any) => {
                    const q = customerSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    const name = String(c.customerName || c.name || '').toLowerCase();
                    const code = String(c.customer_code || c.customerCode || c.coa_code || '').toLowerCase();
                    const phone = String(c.primaryPhone || c.phone || '').toLowerCase();
                    return name.includes(q) || code.includes(q) || phone.includes(q);
                  })
                  .slice(0, 50)
                  .map((c: any, index: number) => {
                    const isSelected = values.customerName === c.customerName;
                    const isHighlighted = highlightedCustomerIndex === index + 1;
                    return (
                      <div
                        key={c.id || index}
                        onClick={() => {
                          setFieldValue('customerName', c.customerName);
                          setSelectedRecordedCustomer(c.customerName);
                          setCustomerModalType('recorded');
                          fetchCustomerPastSales(c.customerName);
                          if (c.address && !values.shippingAddress) {
                            setFieldValue('shippingAddress', c.address);
                          }
                          setIsCustomerDropdownOpen(false);
                          setCustomerSearchQuery('');
                        }}
                        className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-primary/10 font-bold text-primary border-l-4 border-primary'
                            : isHighlighted
                            ? 'bg-slate-100 dark:bg-meta-4 text-black dark:text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-meta-4'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{c.customerName}</span>
                          <span className="text-[10px] text-gray-400">
                            {[c.customer_code, c.primaryPhone].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                        {c.balance !== undefined && (
                          <span className={`text-[10px] font-mono font-bold ${Number(c.balance) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            Bal: {Number(c.balance).toLocaleString()}
                          </span>
                        )}
                      </div>
                    );
                  })}

                {/* Quick Add Option */}
                <div
                  onClick={() => handleOpenQuickCustomerModal(customerSearchQuery, setFieldValue)}
                  className="px-3 py-2 text-xs cursor-pointer flex items-center gap-2 border-t border-stroke dark:border-strokedark text-primary hover:bg-primary/10 font-bold"
                >
                  <FiPlus className="text-sm" />
                  <span>
                    {customerSearchQuery.trim()
                      ? `Add "${customerSearchQuery.trim()}" as New Customer`
                      : 'Add New Customer Profile'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-1">Shipping Address (Optional):</label>
          <textarea 
            name="shippingAddress" 
            placeholder="Enter full shipping address if applicable..." 
            value={values.shippingAddress} 
            onChange={handleChange} 
            rows={2}
            className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white focus:border-primary dark:border-strokedark" 
          />
        </div>
      </div>

      {/* 🌟 TAX & DISCOUNT TOGGLE BAR: CLEAN & UNCLUTTERED DEFAULT UI */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark rounded-sm">
        <div className="flex flex-wrap items-center gap-6">
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

          {/* Overall Bill Discount Toggle */}
          <div
            onClick={() => {
              const isChecked = !values.showOverallDiscount;
              setFieldValue('showOverallDiscount', isChecked);
              if (!isChecked) setFieldValue('overallDiscount', 0);
            }}
            className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
              values.showOverallDiscount
                ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            Overall Discount
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

          {/* Return / Exchange Toggle Pill */}
          <div
            onClick={() => {
              const isChecked = !values.showReturnSection;
              setFieldValue('showReturnSection', isChecked);
              const defaultReturnWh = values.dispatchWarehouse || warehousesList.find((w: string) => /fateh/i.test(w) || /a[-_ ]?39/i.test(w)) || warehousesList[0] || '';
              if (!isChecked) {
                setFieldValue('returnItems', []);
              } else if ((values.returnItems || []).length === 0) {
                setFieldValue('returnItems', [{
                  itemName: '',
                  skuCode: '',
                  warehouse: defaultReturnWh,
                  qty: 1,
                  rp: 0,
                  amount: 0
                }]);
              }
            }}
            className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
              values.showReturnSection
                ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800'
                : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            Return
          </div>

          {/* Tile Products Toggle Pill */}
          <div
            onClick={() => {
              const isChecked = !values.showTileSection;
              setFieldValue('showTileSection', isChecked);
              const defaultWh = values.dispatchWarehouse || warehousesList[0] || '';
              if (!isChecked) {
                setFieldValue('tileItems', []);
              } else if ((values.tileItems || []).length === 0) {
                setFieldValue('tileItems', [{
                  id: Date.now(),
                  itemName: '',
                  skuCode: '',
                  warehouse: defaultWh,
                  availableQty: 0,
                  boxQty: 1,
                  loosePcs: 0,
                  piecesPerBox: 4,
                  sqmPerBox: 1.44,
                  pricePerBox: 0,
                  pricePerSqm: 0,
                  pricePerPiece: 0,
                  totalAmount: 0,
                  totalSqm: 1.44,
                  isTileItem: true
                }]);
              }
            }}
            className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
              values.showTileSection
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-primary dark:border-primary shadow-xs'
                : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            Tile
          </div>

          {/* Return Tile Products Toggle Pill */}
          <div
            onClick={() => {
              const isChecked = !values.showTileReturnSection;
              setFieldValue('showTileReturnSection', isChecked);
              const defaultReturnWh = values.dispatchWarehouse || warehousesList.find((w: string) => /fateh/i.test(w) || /a[-_ ]?39/i.test(w)) || warehousesList[0] || '';
              if (!isChecked) {
                setFieldValue('tileReturnItems', []);
              } else if ((values.tileReturnItems || []).length === 0) {
                setFieldValue('tileReturnItems', [{
                  id: Date.now(),
                  itemName: '',
                  skuCode: '',
                  warehouse: defaultReturnWh,
                  availableQty: 0,
                  boxQty: 1,
                  loosePcs: 0,
                  piecesPerBox: 4,
                  sqmPerBox: 1.44,
                  pricePerBox: 0,
                  pricePerSqm: 0,
                  pricePerPiece: 0,
                  totalAmount: 0,
                  totalSqm: 1.44,
                  isTileItem: true
                }]);
              }
            }}
            className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
              values.showTileReturnSection
                ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-600 dark:border-rose-600 shadow-xs'
                : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            Return Tile
          </div>
        </div>

        {values.applyFbrTax && (
          <div className="w-full sm:w-auto">
            <select
              name="taxScenario"
              value={values.taxScenario}
              onChange={handleChange}
              className="w-full sm:w-auto text-xs font-bold bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 outline-none text-black dark:text-white"
            >
              <option value="Goods at Standard Rate to Registered Buyers">Standard Rate to Registered Buyers (18% GST)</option>
              <option value="Goods at Standard Rate to Unregistered Buyers">Standard Rate to Unregistered Buyers (18% GST + 4% F.Tax)</option>
              <option value="Reduced Rate Sale">Custom / Reduced Rate Sale</option>
              <option value="Sale of 3rd Schedule Goods">3rd Schedule Goods (18% Retail GST)</option>
              <option value="Goods Sold that are Listed in SRO 297(1)/2023">SRO 297(1)/2023 (25% GST)</option>
              <option value="Exempt Goods Sale">Exempt Goods Sale (0% Tax)</option>
              <option value="Zero Rated Sale">Zero Rated Sale (0% Tax)</option>
            </select>
          </div>
        )}
      </div>
    </>
  );
};

export default InvoiceHeader;
