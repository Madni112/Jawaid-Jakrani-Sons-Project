import React from 'react';
import { MdUnfoldMore, MdUnfoldLess } from 'react-icons/md';

interface TrialBalanceTableProps {
    filteredRows: any[];
    activeViewMode: 'summary' | 'detailed';
    toggleAllCustomerDetails: () => void;
    expandedCustomerIds: Set<any>;
}

export const TrialBalanceTable: React.FC<TrialBalanceTableProps> = ({
    filteredRows,
    activeViewMode,
    toggleAllCustomerDetails,
    expandedCustomerIds
}) => {
    const totalDebitSum = filteredRows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
    const totalCreditSum = filteredRows.reduce((sum, r) => sum + Number(r.credit || 0), 0);
    const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 1;

    const accountGroups = [
        { 
            key: 'ASSETS', 
            label: '1000 • ASSETS & RESOURCE RESERVES', 
            match: (c: string, code: string) => c.includes('ASSET') || code.startsWith('1') 
        },
        { 
            key: 'LIABILITIES', 
            label: '2000 • LIABILITIES & EXTERNAL OBLIGATIONS', 
            match: (c: string, code: string) => c.includes('LIABILIT') || code.startsWith('2') 
        },
        { 
            key: 'EQUITY', 
            label: '3000 • EQUITY & RETAINED EARNINGS', 
            match: (c: string, code: string) => c.includes('EQUITY') || code.startsWith('3') 
        },
        { 
            key: 'REVENUE', 
            label: '4000 • REVENUE & OPERATING SALES INFLOWS', 
            match: (c: string, code: string) => c.includes('REVENUE') || code.startsWith('4') 
        },
        { 
            key: 'EXPENSES', 
            label: '5000 • EXPENSES & OPERATIONAL OUTFLOWS', 
            match: (c: string, code: string) => c.includes('EXPENSE') || code.startsWith('5') 
        },
    ];

    let overallIndex = 0;

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center mb-2 print-hidden-element print:hidden">
                <button
                    type="button"
                    onClick={toggleAllCustomerDetails}
                    className="text-[10.5px] font-bold px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                    {activeViewMode === 'detailed' ? (
                        <><MdUnfoldLess size={14} className="text-slate-600" /> Collapse All Details</>
                    ) : (
                        <><MdUnfoldMore size={14} className="text-emerald-700" /> Expand All Details</>
                    )}
                </button>
            </div>

            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead className="bg-gray-100 border-b-2 border-black font-black uppercase text-black font-mono text-[10px]">
                    <tr>
                        <th className="p-1.5 border border-black text-center w-12">S#</th>
                        <th className="p-1.5 border border-black text-center w-24">Account Code</th>
                        <th className="p-1.5 border border-black">Account Head / Sub-Ledger Description</th>
                        <th className="p-1.5 border border-black text-center w-40">Reference / Classification</th>
                        <th className="p-1.5 border border-black text-right w-40">Debit Balance (PKR)</th>
                        <th className="p-1.5 border border-black text-right w-40">Credit Balance (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    {accountGroups.map((grp) => {
                        const groupRows = filteredRows.filter(r => grp.match(String(r.category || '').toUpperCase(), String(r.code || '')));
                        if (groupRows.length === 0) return null;

                        const groupDebit = groupRows.reduce((s, r) => s + Number(r.debit || 0), 0);
                        const groupCredit = groupRows.reduce((s, r) => s + Number(r.credit || 0), 0);

                        return (
                            <React.Fragment key={grp.key}>
                                {/* 🏛️ Head Category Header Banner */}
                                <tr className="bg-slate-800 text-white font-black font-mono text-xs border-y-2 border-black tracking-wider uppercase">
                                    <td colSpan={6} className="p-2 pl-3 bg-slate-800 text-white">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold tracking-wider">{grp.label}</span>
                                            <span className="text-[10px] text-slate-300 font-sans font-normal">
                                                {groupRows.length} Account Head(s)
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Account Sub-Headers and Itemized Details */}
                                {groupRows.map((row) => {
                                    overallIndex += 1;
                                    const isExpanded = activeViewMode === 'detailed' || expandedCustomerIds.has(row.id || row.code);
                                    const hasDetails = row.details && row.details.length > 0;

                                    return (
                                        <React.Fragment key={row.code || row.id}>
                                            {/* Account Sub Header Row */}
                                            <tr className={`border-b border-black font-semibold font-mono text-xs ${isExpanded ? 'bg-slate-100/90 font-bold' : 'bg-white hover:bg-slate-50'}`}>
                                                <td className="p-1.5 border border-black text-center text-gray-500 font-bold">{overallIndex}</td>
                                                <td className="p-1.5 border border-black text-center font-bold text-primary">{row.code}</td>
                                                <td className="p-1.5 border border-black font-sans uppercase font-bold text-slate-900" colSpan={2}>
                                                    {row.title}
                                                </td>
                                                <td className="p-1.5 border border-black text-right font-black text-slate-900">
                                                    {row.debit > 0 ? `Rs. ${Number(row.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                                </td>
                                                <td className="p-1.5 border border-black text-right font-black text-slate-900">
                                                    {row.credit > 0 ? `Rs. ${Number(row.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                                </td>
                                            </tr>

                                            {/* Itemized Sub-Ledger Details (when expanded / detailed view) */}
                                            {isExpanded && hasDetails && row.details.map((dt: any, dIdx: number) => (
                                                <tr key={dIdx} className="bg-slate-50/70 border-b border-slate-200 hover:bg-slate-100/80 font-mono text-[11px]">
                                                    <td className="p-1.5 border border-black text-center text-gray-400 text-[10px]">{overallIndex}.{dIdx + 1}</td>
                                                    <td className="p-1.5 border border-black text-center text-slate-400 text-[10px]">{row.code}</td>
                                                    <td className="p-1.5 border border-black font-sans text-slate-800 font-medium pl-6">
                                                        <span className="text-slate-400 mr-2 font-mono">↳</span>
                                                        <span>{dt.name}</span>
                                                    </td>
                                                    <td className="p-1.5 border border-black text-center text-slate-500 text-[10px] font-sans">
                                                        {dt.ref || '-'}
                                                    </td>
                                                    <td className="p-1.5 border border-black text-right text-slate-700 font-semibold text-[11px]">
                                                        {dt.debit > 0 ? `Rs. ${Number(dt.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                    <td className="p-1.5 border border-black text-right text-slate-700 font-semibold text-[11px]">
                                                        {dt.credit > 0 ? `Rs. ${Number(dt.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Category Subtotal Row */}
                                <tr className="bg-slate-100 border-b-2 border-black font-bold font-mono text-xs text-slate-900">
                                    <td colSpan={4} className="p-2 border border-black text-right uppercase tracking-wider">
                                        Subtotal — {grp.label.includes('•') ? grp.label.split('•')[1] : grp.label}:
                                    </td>
                                    <td className="p-2 border border-black text-right font-black text-slate-900">
                                        Rs. {groupDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2 border border-black text-right font-black text-slate-900">
                                        Rs. {groupCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-black font-black font-mono text-xs">
                        <td colSpan={4} className="p-2 border border-black text-right uppercase tracking-wider text-black">
                            Aggregated Trial Balance Audit Sum (All {filteredRows.length} Records):
                        </td>
                        <td className="p-2 border border-black text-right text-black font-black underline decoration-double text-sm">
                            Rs. {totalDebitSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 border border-black text-right pr-3 text-black font-black underline decoration-double text-sm">
                            Rs. {totalCreditSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={6} className={`p-2 border border-black text-center font-black uppercase text-xs ${isBalanced ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            Trial Balance Verification: {isBalanced ? 'STATEMENT EQUATION BALANCED (DEBIT = CREDIT) ✅' : 'DISCREPANCY DETECTED IN DOUBLE ENTRY LEDGER ⚠️'}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
