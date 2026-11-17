import { toast } from 'react-hot-toast';
import React from 'react';
import { MdReceipt, MdPerson, MdSearch, MdKeyboardArrowDown } from 'react-icons/md';

interface SalesReturnHeaderProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  touched: any;
  defaultReturnNo: string;
  formatMoney: (val: number) => string;
  netCashRefundDisbursed: number;
  customerContainerRef: React.RefObject<HTMLDivElement>;
  invContainerRef: React.RefObject<HTMLDivElement>;
  isEditMode: boolean;
  filteredCustomers: any[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (q: string) => void;
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (open: boolean) => void;
  highlightedCustomerIndex: number;
  setHighlightedCustomerIndex: React.Dispatch<React.SetStateAction<number>>;
  locations: any[];
  selectedInvNo: string;
  setSelectedInvNo: (invNo: string) => void;
  invSearchQuery: string;
  setInvSearchQuery: (q: string) => void;
  isInvDropdownOpen: boolean;
  setIsInvDropdownOpen: (open: boolean) => void;
  highlightedInvIndex: number;
  setHighlightedInvIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredInvoices: any[];
  setSelectedInvObj: (obj: any) => void;
  selectedInvObj: any;
  isExchangeReturn: boolean;
  exchangeInvoiceTotal: number;
  calculatedGrossTotal: number;
}

export const SalesReturnHeader: React.FC<SalesReturnHeaderProps> = ({
  values,
  handleChange,
  setFieldValue,
  errors,
  touched,
  defaultReturnNo,
  formatMoney,
  netCashRefundDisbursed,
  customerContainerRef,
  invContainerRef,
  isEditMode,
  filteredCustomers,
  customerSearchQuery,
  setCustomerSearchQuery,
  isCustomerDropdownOpen,
  setIsCustomerDropdownOpen,
  highlightedCustomerIndex,
  setHighlightedCustomerIndex,
  locations,
  selectedInvNo,
  setSelectedInvNo,
  invSearchQuery,
  setInvSearchQuery,
  isInvDropdownOpen,
  setIsInvDropdownOpen,
  highlightedInvIndex,
  setHighlightedInvIndex,
  filteredInvoices,
  setSelectedInvObj,
  selectedInvObj,
  isExchangeReturn,
  exchangeInvoiceTotal,
  calculatedGrossTotal,
}) => {
  return (
    <>
                {/* ── TOP FORM HEADER GRID (3 COLUMNS) ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Return Memo ID Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px]">
                        Return Memo ID Code #: *
                      </label>
                      {defaultReturnNo && values.returnNo !== defaultReturnNo && (
                        <button
                          type="button"
                          onClick={() => setFieldValue('returnNo', defaultReturnNo)}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                          title="Reset to auto-suggested number"
                        >
                          Auto: {defaultReturnNo}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="returnNo"
                        placeholder="e.g. RTN-0001 or custom #"
                        value={values.returnNo}
                        onChange={handleChange}
                        className={`w-full border rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800 font-mono font-black text-emerald-800 dark:text-emerald-300 outline-none text-xs ${
                          touched.returnNo && errors.returnNo
                            ? 'border-red-500 bg-red-50/10'
                            : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded font-sans uppercase font-bold pointer-events-none">
                        {values.returnNo === defaultReturnNo ? 'Auto' : 'Manual'}
                      </span>
                    </div>
                    {touched.returnNo && errors.returnNo && (
                      <div className="text-[10px] text-red-500 font-semibold mt-1">
                        {errors.returnNo as string}
                      </div>
                    )}
                  </div>

                  {/* Return Date */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                      Processing Return Date: *
                    </label>
                    <input
                      type="date"
                      name="returnDate"
                      onChange={handleChange}
                      value={values.returnDate}
                      className={`w-full border rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800 font-bold outline-none text-slate-900 dark:text-white text-xs ${
                        touched.returnDate && errors.returnDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Target Customer Autocomplete */}
                  <div className="relative" ref={customerContainerRef}>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1 flex items-center gap-1.5">
                      <MdPerson size={15} className="text-emerald-600" /> Target Customer Account: *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isEditMode}
                        value={customerSearchQuery || values.customerName}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedCustomerIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedCustomerIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredCustomers[highlightedCustomerIndex]) {
                              const c = filteredCustomers[highlightedCustomerIndex];
                              setFieldValue('customerName', c.customer_name);
                              setCustomerSearchQuery(c.customer_name);
                              setSelectedInvNo('');
                              setInvSearchQuery('-- General Return (All Invoices FIFO) --');
                              setSelectedInvObj(null);
                              setIsCustomerDropdownOpen(false);
                            }
                          } else if (e.key === 'Escape') {
                            setIsCustomerDropdownOpen(false);
                          }
                        }}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setFieldValue('customerName', e.target.value);
                          setIsCustomerDropdownOpen(true);
                          setHighlightedCustomerIndex(0);
                        }}
                        placeholder="Search customer name or phone..."
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600"
                      />
                      <MdSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>

                    {isCustomerDropdownOpen && !isEditMode && (
                      <div className="absolute left-0 top-full mt-1 z-[9999] w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((cust, cIdx) => (
                            <div
                              key={cust.id}
                              onMouseEnter={() => setHighlightedCustomerIndex(cIdx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFieldValue('customerName', cust.customer_name);
                                setCustomerSearchQuery(cust.customer_name);
                                setSelectedInvNo('');
                                setInvSearchQuery('-- General Return (All Invoices FIFO) --');
                                setSelectedInvObj(null);
                                setFieldValue('invoiceNo', '');
                                setFieldValue('items', [{
                                  skuCode: '',
                                  itemName: '',
                                  warehouse: locations[0]?.name || 'Main Warehouse',
                                  qty: 1,
                                  rate: 0,
                                  uom: 'Nos'
                                }]);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                highlightedCustomerIndex === cIdx || values.customerName === cust.customer_name
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold">{cust.customer_name}</span>
                                {cust.phone && <span className="text-[10px] text-slate-400">{cust.phone}</span>}
                              </div>
                              {cust.city && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{cust.city}</span>}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-slate-400 italic">No customers found</div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* ── ROW 2: SPECIFIC SALES INVOICE PICKER (OPTIONAL) ── */}
                {values.customerName && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 relative" ref={invContainerRef}>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MdReceipt size={15} className="text-emerald-600" /> Search / Select Specific Customer Invoice (Optional):
                      </span>
                      {selectedInvNo && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvNo('');
                            setInvSearchQuery('-- General Return (All Invoices FIFO) --');
                            setSelectedInvObj(null);
                            setFieldValue('invoiceNo', '');
                            setFieldValue('paymentTerm', 'On Credit');
                            setFieldValue('items', [{
                              skuCode: '',
                              itemName: '',
                              warehouse: locations[0]?.name || 'Main Warehouse',
                              qty: 1,
                              rate: 0,
                              uom: 'Nos'
                            }]);
                          }}
                          className="text-[10px] text-emerald-600 hover:underline font-bold"
                        >
                          Clear Selection (Return Across All Customer Invoices via FIFO)
                        </button>
                      )}
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={invSearchQuery}
                        onFocus={() => setIsInvDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedInvIndex(prev => Math.min(prev + 1, filteredInvoices.length));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedInvIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (highlightedInvIndex === 0) {
                              setSelectedInvNo('');
                              setInvSearchQuery('-- General Return (All Invoices FIFO) --');
                              setSelectedInvObj(null);
                              setFieldValue('invoiceNo', '');
                              setFieldValue('paymentTerm', 'On Credit');
                              setFieldValue('items', [{
                                skuCode: '',
                                itemName: '',
                                warehouse: locations[0]?.name || 'Main Warehouse',
                                qty: 1,
                                rate: 0,
                                uom: 'Nos'
                              }]);
                              setIsInvDropdownOpen(false);
                            } else if (filteredInvoices[highlightedInvIndex - 1]) {
                              const inv = filteredInvoices[highlightedInvIndex - 1];
                              const formattedInv = inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`;
                              setSelectedInvNo(formattedInv);
                              setInvSearchQuery(formattedInv);
                              setSelectedInvObj(inv);
                              setFieldValue('invoiceNo', formattedInv);

                              if (values.paymentTerm === 'On Credit') {
                                setFieldValue('paymentTerm', 'By Cash');
                              }

                              // Auto-populate all line items from the selected invoice
                              const rawItems = Array.isArray(inv.items) ? inv.items : [];
                              if (rawItems.length > 0) {
                                const populated = rawItems.map((pi: any) => ({
                                  skuCode: pi.skuCode || pi.sku || '',
                                  itemName: pi.itemName || pi.product_name || '',
                                  warehouse: pi.warehouse || inv.dispatch_warehouse || locations[0]?.name || 'Main Warehouse',
                                  qty: Number(pi.qty || pi.quantity || 1),
                                  originalQty: Number(pi.qty || pi.quantity || 1),
                                  discountPer: Number(pi.discountPer || 0),
                                  discountAmt: Number(pi.discountAmt || 0),
                                  rate: Number(pi.rp ?? pi.rate ?? pi.sale_price ?? pi.price ?? 0),
                                  uom: pi.uom || 'Nos'
                                }));
                                setFieldValue('items', populated);
                                toast.success(`Loaded ${populated.length} items from ${formattedInv}! You can now adjust quantities, prices, or remove rows.`);
                              }

                              setIsInvDropdownOpen(false);
                            }
                          } else if (e.key === 'Escape') {
                            setIsInvDropdownOpen(false);
                          }
                        }}
                        onChange={(e) => {
                          setInvSearchQuery(e.target.value);
                          setIsInvDropdownOpen(true);
                          setHighlightedInvIndex(0);
                        }}
                        placeholder="Search invoice # (e.g. INV-0003), date, or warehouse..."
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600"
                      />
                      <MdKeyboardArrowDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>

                    {isInvDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 z-[9999] w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
                        <div
                          onMouseEnter={() => setHighlightedInvIndex(0)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedInvNo('');
                            setInvSearchQuery('-- General Return (All Invoices FIFO) --');
                            setSelectedInvObj(null);
                            setFieldValue('invoiceNo', '');
                            setFieldValue('paymentTerm', 'On Credit');
                            setFieldValue('items', [{
                              skuCode: '',
                              itemName: '',
                              warehouse: locations[0]?.name || 'Main Warehouse',
                              qty: 1,
                              rate: 0,
                              uom: 'Nos'
                            }]);
                            setIsInvDropdownOpen(false);
                          }}
                          className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                            highlightedInvIndex === 0 || !selectedInvNo
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">-- General Return (All Invoices FIFO) --</span>
                            <span className="text-[10px] text-slate-400">Deduct items automatically starting from oldest customer invoice</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold">FIFO</span>
                        </div>

                        {filteredInvoices.map((inv, iIdx) => {
                          const formattedInv = inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`;
                          return (
                            <div
                              key={inv.id}
                              onMouseEnter={() => setHighlightedInvIndex(iIdx + 1)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedInvNo(formattedInv);
                                setInvSearchQuery(formattedInv);
                                setSelectedInvObj(inv);
                                setFieldValue('invoiceNo', formattedInv);

                                // Auto-populate all line items from the selected invoice
                                const rawItems = Array.isArray(inv.items) ? inv.items : [];
                                if (rawItems.length > 0) {
                                  const populated = rawItems.map((pi: any) => ({
                                    skuCode: pi.skuCode || pi.sku || '',
                                    itemName: pi.itemName || pi.product_name || '',
                                    warehouse: pi.warehouse || inv.dispatch_warehouse || locations[0]?.name || 'Main Warehouse',
                                    qty: Number(pi.qty || pi.quantity || 1),
                                    originalQty: Number(pi.qty || pi.quantity || 1),
                                    discountPer: Number(pi.discountPer || 0),
                                    discountAmt: Number(pi.discountAmt || 0),
                                    rate: Number(pi.rp ?? pi.rate ?? pi.sale_price ?? pi.price ?? 0),
                                    uom: pi.uom || 'Nos'
                                  }));
                                  setFieldValue('items', populated);
                                  toast.success(`Loaded ${populated.length} items from ${formattedInv}! You can now adjust quantities, prices, or remove rows.`);
                                }

                                setIsInvDropdownOpen(false);
                              }}
                              className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                highlightedInvIndex === (iIdx + 1) || selectedInvNo === formattedInv
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">{formattedInv}</span>
                                <span className="text-[10px] text-slate-400">{inv.invoice_date || 'N/A'} • {inv.dispatch_warehouse || 'Main Warehouse'}</span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-slate-900 dark:text-white font-bold text-xs">Rs. {formatMoney(inv.total_amount)}</span>
                                <span className="text-[10px] text-slate-400 block">Items: {inv.items?.length || 0}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── EXCHANGED ITEMS GIVEN ON INVOICE (SHOWN FOR EXCHANGE RETURNS) ── */}
                {isExchangeReturn && selectedInvObj && (
                  <div className="rounded-2xl border border-teal-200 dark:border-teal-800/80 bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-slate-50/50 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900/40 p-4.5 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/70 dark:border-teal-800/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔄</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-200">
                              Exchanged Items Taken on Invoice #{selectedInvNo || selectedInvObj.invoice_no}
                            </h4>
                            <span className="bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              New Items Taken in Exchange
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Customer received these new goods in exchange against the returned goods below
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Invoice Item Value</span>
                        <span className="font-mono font-black text-sm text-teal-700 dark:text-teal-300">
                          Rs. {formatMoney(exchangeInvoiceTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Exchanged items table */}
                    <div className="overflow-x-auto rounded-xl border border-teal-200/60 dark:border-teal-800/60 bg-white dark:bg-slate-900 shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-teal-50/60 dark:bg-teal-950/60 text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 border-b border-teal-100 dark:border-teal-800">
                            <th className="p-2.5 w-10 text-center">S#</th>
                            <th className="p-2.5 w-32">SKU Code</th>
                            <th className="p-2.5">Item Description</th>
                            <th className="p-2.5 w-32 text-center">Qty Exchanged</th>
                            <th className="p-2.5 w-28 text-right">Sale Price (PKR)</th>
                            <th className="p-2.5 w-32 text-right">Amount (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-100/70 dark:divide-teal-800/50 font-mono text-[11px]">
                          {(Array.isArray(selectedInvObj.items) ? selectedInvObj.items : []).map((it: any, iIdx: number) => {
                            const rowAmt = Number(it.netTotal || it.amount || it.totalAmount || 0);
                            const rowRate = Number(it.rp || it.rate || it.pricePerBox || (it.qty ? rowAmt / it.qty : 0));
                            return (
                              <tr key={iIdx} className="hover:bg-teal-50/30 dark:hover:bg-teal-950/20">
                                <td className="p-2.5 text-center text-slate-400">{iIdx + 1}</td>
                                <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{it.skuCode || it.sku || '-'}</td>
                                <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-white">{it.itemName || it.product_name}</td>
                                <td className="p-2.5 text-center font-bold text-teal-700 dark:text-teal-400">
                                  {it.boxQty !== undefined ? `${it.boxQty} Box` : it.qty} {it.loosePcs ? `+ ${it.loosePcs} Pcs` : ''} {it.uom ? `(${it.uom})` : ''}
                                </td>
                                <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">Rs. {formatMoney(rowRate)}</td>
                                <td className="p-2.5 text-right font-black text-slate-900 dark:text-white">Rs. {formatMoney(rowAmt)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Interactive Exchange Math Summary */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-200/80 dark:border-teal-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-semibold">1. Returned Items:</span>
                        <strong className="font-mono font-bold text-slate-900 dark:text-white">Rs. {formatMoney(calculatedGrossTotal)}</strong>
                      </div>
                      <span className="text-slate-400 font-bold">−</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-semibold">2. Exchange Taken:</span>
                        <strong className="font-mono font-bold text-purple-700 dark:text-purple-400">Rs. {formatMoney(exchangeInvoiceTotal)}</strong>
                      </div>
                      <span className="text-slate-400 font-bold">=</span>
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-800 dark:text-emerald-300 font-bold">Net Cash Refund to Customer:</span>
                        <strong className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          Rs. {formatMoney(netCashRefundDisbursed)} (Cash Paid)
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
    </>
  );
};

export default SalesReturnHeader;
