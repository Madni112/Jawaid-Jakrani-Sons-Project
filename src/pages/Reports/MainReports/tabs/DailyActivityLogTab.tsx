import React, { useState, useMemo } from 'react';
import {
  MdSearch,
  MdShoppingCart,
  MdLocalShipping,
  MdReceipt,
  MdAccountBalanceWallet,
  MdAssignmentReturn,
  MdArrowUpward,
  MdArrowDownward,
  MdFilterList,
  MdExpandMore,
  MdExpandLess,
  MdAccessTime,
  MdViewAgenda,
  MdFormatListBulleted,
  MdUnfoldMore,
  MdUnfoldLess,
  MdMoney,
  MdTrendingUp
} from 'react-icons/md';

export type HierarchyGroupKey =
  | 'sales'
  | 'purchases'
  | 'customer_receipts'
  | 'vendor_payments'
  | 'stock_movements'
  | 'expenses';

export interface DailyActivityRow {
  id: string;
  index: number;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "02:45 PM"
  timestamp: number;
  category: 'sales' | 'challan' | 'purchase' | 'voucher' | 'return';
  hierarchyGroup: HierarchyGroupKey;
  type: string;
  typeBadgeColor: string;
  refNo: string;
  partyName: string;
  partyType: 'Customer' | 'Supplier' | 'Account' | 'Internal';
  details: string;
  itemsList?: Array<{ name: string; qty?: number; rate?: number; amount?: number; uom?: string }>;
  warehouse?: string;
  amount: number;
  status: string;
  statusColor: string;
  operator?: string;
}

interface DailyActivityLogTabProps {
  isGeneratingPdf: boolean;
  dateMode: 'single' | 'range';
  activityRows: DailyActivityRow[];
  summary: {
    totalEvents: number;
    totalSales: number;
    totalInflow: number;
    totalOutflow: number;
    totalReturns: number;
  };
  handleSort: (field: string) => void;
  renderSortIcon: (field: string) => React.ReactNode;
}

interface GroupMeta {
  key: HierarchyGroupKey;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  headerBg: string;
  badgeBg: string;
  description: string;
}

const HIERARCHY_GROUPS: GroupMeta[] = [
  {
    key: 'sales',
    title: '1. Sales & Customer Returns',
    icon: MdShoppingCart,
    accentColor: 'text-emerald-700 dark:text-emerald-400',
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-600 text-white',
    description: 'Invoiced customer sales and credit note sales returns'
  },
  {
    key: 'purchases',
    title: '2. Purchases & Vendor Returns',
    icon: MdReceipt,
    accentColor: 'text-purple-700 dark:text-purple-400',
    headerBg: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-600 text-white',
    description: 'Procurement bills and debit note supplier returns'
  },
  {
    key: 'customer_receipts',
    title: '3. Received from Customers (Receipts)',
    icon: MdTrendingUp,
    accentColor: 'text-teal-700 dark:text-teal-400',
    headerBg: 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-600 text-white',
    description: 'Cash Receipts (CRV) and Bank Collections (BRV)'
  },
  {
    key: 'vendor_payments',
    title: '4. Paid to Vendors (Payments)',
    icon: MdAccountBalanceWallet,
    accentColor: 'text-indigo-700 dark:text-indigo-400',
    headerBg: 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-600 text-white',
    description: 'Vendor disbursements (VPV, CPV, BPV)'
  },
  {
    key: 'stock_movements',
    title: '5. Stock Movements (In / Out)',
    icon: MdLocalShipping,
    accentColor: 'text-blue-700 dark:text-blue-400',
    headerBg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-600 text-white',
    description: 'Delivery Challans (Dispatches) and inward stock notes'
  },
  {
    key: 'expenses',
    title: '6. Operational Expenses',
    icon: MdMoney,
    accentColor: 'text-rose-700 dark:text-rose-400',
    headerBg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-600 text-white',
    description: 'Petty cash, utility bills and administrative operational expenses'
  }
];

export const DailyActivityLogTab: React.FC<DailyActivityLogTabProps> = ({
  isGeneratingPdf,
  dateMode,
  activityRows,
  handleSort,
  renderSortIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');
  const [expandAllBreakdown, setExpandAllBreakdown] = useState<boolean>(false);
  const [individualExpandedMap, setIndividualExpandedMap] = useState<Record<string, boolean>>({});

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return activityRows;
    const q = searchTerm.toLowerCase().trim();
    return activityRows.filter(r => {
      const matchRef = (r.refNo || '').toLowerCase().includes(q);
      const matchParty = (r.partyName || '').toLowerCase().includes(q);
      const matchDetails = (r.details || '').toLowerCase().includes(q);
      const matchType = (r.type || '').toLowerCase().includes(q);
      const matchWh = (r.warehouse || '').toLowerCase().includes(q);
      const matchItems = (r.itemsList || []).some(it => (it.name || '').toLowerCase().includes(q));
      return matchRef || matchParty || matchDetails || matchType || matchWh || matchItems;
    });
  }, [activityRows, searchTerm]);

  // Grouped rows for hierarchy view
  const groupedData = useMemo(() => {
    const map: Record<HierarchyGroupKey, DailyActivityRow[]> = {
      sales: [],
      purchases: [],
      customer_receipts: [],
      vendor_payments: [],
      stock_movements: [],
      expenses: []
    };

    filteredRows.forEach(r => {
      const grp = r.hierarchyGroup || 'sales';
      if (map[grp]) {
        map[grp].push(r);
      } else {
        map.sales.push(r);
      }
    });

    return map;
  }, [filteredRows]);

  const toggleIndividualExpand = (id: string) => {
    setIndividualExpandedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isRowExpanded = (id: string) => {
    if (expandAllBreakdown) {
      return individualExpandedMap[id] !== false; // expanded unless explicitly closed
    }
    return Boolean(individualExpandedMap[id]);
  };

  const thPadding = isGeneratingPdf ? 'py-1.5 px-2 text-[9px]' : 'py-2.5 px-3 text-xs';
  const cellPadding = isGeneratingPdf ? 'py-1 px-1.5 text-[9px]' : 'py-2 px-3 text-xs';

  // Helper to render an activity table for any list of rows
  const renderActivityTable = (rows: DailyActivityRow[], showFooter: boolean = true) => {
    return (
      <div className={`overflow-x-auto ${isGeneratingPdf ? 'overflow-visible w-full' : ''} print:overflow-visible`}>
        <table className={`w-full text-left border-collapse ${isGeneratingPdf ? 'text-[9px]' : 'text-xs'} print:text-[9px]`}>
          <thead className="print:table-header-group">
            <tr className="border-b-2 border-slate-900 dark:border-strokedark bg-slate-50/75 dark:bg-slate-800/60 font-bold text-slate-800 dark:text-slate-200 print:bg-slate-100 print:text-black">
              <th className={`${thPadding} text-center w-10 whitespace-nowrap`}>S#</th>

              {/* Date: Only shown in Range Mode */}
              {dateMode === 'range' && (
                <th
                  onClick={() => handleSort('date')}
                  className={`${thPadding} cursor-pointer group hover:text-primary transition whitespace-nowrap w-24`}
                >
                  <div className="flex items-center gap-0.5">
                    <span>Date</span>
                    {renderSortIcon('date')}
                  </div>
                </th>
              )}

              {/* Time */}
              <th
                onClick={() => handleSort('time')}
                className={`${thPadding} cursor-pointer group hover:text-primary transition whitespace-nowrap w-20`}
              >
                <div className="flex items-center gap-0.5">
                  <MdAccessTime size={12} className="text-slate-400 group-hover:text-primary" />
                  <span>Time</span>
                  {renderSortIcon('time')}
                </div>
              </th>

              {/* Event Type */}
              <th
                onClick={() => handleSort('type')}
                className={`${thPadding} cursor-pointer group hover:text-primary transition whitespace-nowrap w-32`}
              >
                <div className="flex items-center gap-0.5">
                  <span>Event Type</span>
                  {renderSortIcon('type')}
                </div>
              </th>

              {/* Ref / Doc # */}
              <th
                onClick={() => handleSort('refNo')}
                className={`${thPadding} cursor-pointer group hover:text-primary transition whitespace-nowrap w-28`}
              >
                <div className="flex items-center gap-0.5">
                  <span>Ref / Doc #</span>
                  {renderSortIcon('refNo')}
                </div>
              </th>

              {/* Party / Account */}
              <th
                onClick={() => handleSort('partyName')}
                className={`${thPadding} cursor-pointer group hover:text-primary transition whitespace-nowrap min-w-[140px]`}
              >
                <div className="flex items-center gap-0.5">
                  <span>Party / Account</span>
                  {renderSortIcon('partyName')}
                </div>
              </th>

              {/* Details & Items */}
              <th className={`${thPadding} min-w-[190px]`}>
                <span>Narrative & Activity Details</span>
              </th>

              {/* Warehouse */}
              <th className={`${thPadding} whitespace-nowrap w-24`}>
                <span>Warehouse</span>
              </th>

              {/* Value (PKR) */}
              <th
                onClick={() => handleSort('amount')}
                className={`${thPadding} text-right cursor-pointer group hover:text-primary transition whitespace-nowrap w-28`}
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Value (PKR)</span>
                  {renderSortIcon('amount')}
                </div>
              </th>

              {/* Status */}
              <th className={`${thPadding} text-center whitespace-nowrap w-20`}>
                <span>Status</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stroke dark:divide-strokedark text-slate-700 dark:text-slate-300">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={dateMode === 'range' ? 10 : 9}
                  className="py-6 text-center text-slate-400 dark:text-slate-500 font-medium text-xs"
                >
                  No transactions recorded in this section.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const expanded = isRowExpanded(r.id);
                const hasSubItems = r.itemsList && r.itemsList.length > 0;

                return (
                  <React.Fragment key={r.id || idx}>
                    <tr className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition group">
                      {/* S# */}
                      <td className={`${cellPadding} text-center font-mono font-medium text-slate-400`}>
                        {idx + 1}
                      </td>

                      {/* Date (Range only) */}
                      {dateMode === 'range' && (
                        <td className={`${cellPadding} font-mono whitespace-nowrap font-medium text-slate-600 dark:text-slate-300`}>
                          {r.date}
                        </td>
                      )}

                      {/* Time */}
                      <td className={`${cellPadding} font-mono whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200`}>
                        {r.time || '12:00 PM'}
                      </td>

                      {/* Event Type Badge */}
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                            isGeneratingPdf ? 'text-slate-900 border-none font-bold' : `border ${r.typeBadgeColor}`
                          }`}
                        >
                          {!isGeneratingPdf && (
                            <>
                              {r.category === 'sales' && <MdShoppingCart size={11} />}
                              {r.category === 'challan' && <MdLocalShipping size={11} />}
                              {r.category === 'purchase' && <MdReceipt size={11} />}
                              {r.category === 'voucher' && <MdAccountBalanceWallet size={11} />}
                              {r.category === 'return' && <MdAssignmentReturn size={11} />}
                            </>
                          )}
                          <span>{r.type}</span>
                        </span>
                      </td>

                      {/* Ref / Doc # */}
                      <td className={`${cellPadding} font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap`}>
                        {r.refNo}
                      </td>

                      {/* Party / Account */}
                      <td className={cellPadding}>
                        <div
                          className={`font-semibold text-slate-800 dark:text-slate-100 truncate ${
                            isGeneratingPdf ? 'max-w-[120px]' : 'max-w-[180px]'
                          }`}
                          title={r.partyName}
                        >
                          {r.partyName}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase font-medium">
                          {r.partyType}
                        </div>
                      </td>

                      {/* Details & Items */}
                      <td className={cellPadding}>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-slate-600 dark:text-slate-300 ${
                              isGeneratingPdf ? 'line-clamp-2 max-w-[180px]' : 'line-clamp-1'
                            }`}
                            title={r.details}
                          >
                            {r.details || '—'}
                          </span>
                          {hasSubItems && !isGeneratingPdf && (
                            <button
                              type="button"
                              onClick={() => toggleIndividualExpand(r.id)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 print:hidden cursor-pointer whitespace-nowrap transition"
                            >
                              <span>{r.itemsList!.length} items</span>
                              {expanded ? <MdExpandLess size={12} /> : <MdExpandMore size={12} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Warehouse */}
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        {r.warehouse ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {r.warehouse}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Value (PKR) */}
                      <td className={`${cellPadding} text-right font-mono font-bold whitespace-nowrap`}>
                        {Number(r.amount) > 0 ? (
                          <span className="text-slate-900 dark:text-white">
                            Rs. {Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className={`${cellPadding} text-center whitespace-nowrap`}>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            isGeneratingPdf ? 'text-slate-800 font-bold' : r.statusColor
                          }`}
                        >
                          {r.status || 'Active'}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Sub-Items Drawer */}
                    {expanded && hasSubItems && (
                      <tr className="bg-slate-50/90 dark:bg-slate-800/80">
                        <td colSpan={dateMode === 'range' ? 10 : 9} className="p-3 pl-8 pr-4">
                          <div className="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark p-3 shadow-2xs">
                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Itemized Breakdown ({r.refNo})</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {r.itemsList!.length} line item(s)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {r.itemsList!.map((it, itIdx) => (
                                <div
                                  key={itIdx}
                                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-stroke dark:border-strokedark flex items-center justify-between text-xs"
                                >
                                  <div className="truncate pr-2">
                                    <div className="font-bold text-slate-900 dark:text-white truncate" title={it.name}>
                                      {it.name || 'Product'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      Qty: {Number(it.qty || 0).toLocaleString()} {it.uom || 'units'}
                                      {it.rate ? ` @ Rs. ${Number(it.rate).toLocaleString()}` : ''}
                                    </div>
                                  </div>
                                  {Number(it.amount || 0) > 0 && (
                                    <div className="font-mono font-bold text-xs text-primary whitespace-nowrap">
                                      Rs. {Number(it.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Subtotal Row */}
          {showFooter && rows.length > 0 && (
            <tfoot className="border-t-2 border-slate-900 dark:border-strokedark bg-slate-100/90 dark:bg-slate-800 font-bold text-slate-900 dark:text-white print:bg-slate-100">
              <tr>
                <td
                  colSpan={dateMode === 'range' ? 7 : 6}
                  className={`${thPadding} text-right uppercase tracking-wider font-extrabold`}
                >
                  Subtotal ({rows.length} entries):
                </td>
                <td className={`${thPadding} text-center text-slate-500 font-mono`}>
                  {rows.length} events
                </td>
                <td className={`${thPadding} text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap`}>
                  Rs. {rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── TOOLBAR: VIEW SWITCHER, BREAKDOWN TOGGLE PILL & SEARCH (Hidden in PDF/Print) ── */}
      {!isGeneratingPdf && (
        <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          {/* Left: View Mode Segmented Switch + Breakdown Master Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={() => setViewMode('hierarchical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'hierarchical'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-2xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <MdViewAgenda size={14} />
                <span>Hierarchical View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-2xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <MdFormatListBulleted size={14} />
                <span>Flat Timeline</span>
              </button>
            </div>

            {/* Master Breakdown View Toggle Pill */}
            <button
              type="button"
              onClick={() => {
                setExpandAllBreakdown(prev => !prev);
                setIndividualExpandedMap({}); // reset individual overrides
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                expandAllBreakdown
                  ? 'bg-primary text-white border-primary shadow-sm font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-stroke dark:border-strokedark hover:bg-slate-100'
              }`}
            >
              {expandAllBreakdown ? <MdUnfoldLess size={15} /> : <MdUnfoldMore size={15} />}
              <span>{expandAllBreakdown ? 'Collapse Breakdown' : 'Breakdown View'}</span>
            </button>
          </div>

          {/* Right: Search Input */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search party, ref #, items..."
              className="w-full h-[34px] pl-9 pr-3 rounded-xl border border-stroke dark:border-strokedark bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            />
          </div>
        </div>
      )}

      {/* ── VIEW 1: HIERARCHICAL / STRUCTURED GROUP VIEW ── */}
      {viewMode === 'hierarchical' ? (
        <div className="space-y-5">
          {HIERARCHY_GROUPS.map((grp) => {
            const rows = groupedData[grp.key] || [];
            const Icon = grp.icon;
            const subtotal = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

            // Hide empty sections during PDF generation to keep PDF clean
            if (isGeneratingPdf && rows.length === 0) return null;

            return (
              <div
                key={grp.key}
                className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none"
              >
                {/* Section Header Ribbon */}
                <div className={`p-3.5 px-4 flex items-center justify-between border-b ${grp.headerBg}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${grp.badgeBg}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-wider ${grp.accentColor}`}>
                        {grp.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">{grp.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Entries: </span>
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-white">
                        {rows.length}
                      </span>
                    </div>
                    {subtotal > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Subtotal: </span>
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Items Table */}
                {renderActivityTable(rows, true)}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VIEW 2: FLAT TIMELINE VIEW ── */
        <div
          className={`bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs ${
            isGeneratingPdf ? 'overflow-visible border-none shadow-none rounded-none w-full' : 'overflow-hidden'
          } print:border-none print:shadow-none print:rounded-none print:overflow-visible`}
        >
          {renderActivityTable(filteredRows, true)}
        </div>
      )}
    </div>
  );
};
