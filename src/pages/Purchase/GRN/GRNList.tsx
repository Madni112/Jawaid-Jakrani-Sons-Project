import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import Spinner from '../../../ui/Spinner';
import { MdInventory, MdEvent, MdBusiness, MdDelete, MdEdit, MdSearch, MdVisibility } from 'react-icons/md';
import { useModal } from '../../../Context/Modal';
import VerifyInward from '../Inward Challan/VerifyInward';
import ReceiveGrnModal from './ReceiveGrnModal';
import { MdShoppingCart, MdAddCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../../../components/Modals/ConfirmDeleteModal';

const GRNList = () => {
    const navigate = useNavigate();
    const { showModal, hideModal } = useModal();
    const [grns, setGrns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [workflowFilter, setWorkflowFilter] = useState<'ALL' | 'AUTOMATIC' | 'MANUAL'>('ALL');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTargetGrn, setDeleteTargetGrn] = useState<any | null>(null);

    const handleDeleteClick = (grn: any) => {
        if (grn.status === 'Billed') {
            toast.error('Cannot delete this GRN! It has already been converted into a Purchase Bill.');
            return;
        }

        const anyReceived = (grn.grn_items || []).some(
            (i: any) => Number(i.accepted_qty || 0) > 0 || Number(i.rejected_qty || 0) > 0
        );

        if (anyReceived) {
            toast.error('Cannot delete this GRN! Items have already been received/inspected into stock. Please raise a Purchase Return instead to adjust inventory.');
            return;
        }

        setDeleteTargetGrn(grn);
    };

    const executeDeleteGrn = async () => {
        if (!deleteTargetGrn) return;
        const id = deleteTargetGrn.id;
        
        try {
            setDeletingId(id);
            
            // Delete child items first for clean cascade
            await supabase.from('grn_items').delete().eq('grn_id', id);
            const { error } = await supabase.from('grn_receipts').delete().eq('id', id);
            if (error) throw error;
            
            toast.success('Pending GRN deleted successfully.');
            setGrns(prev => prev.filter(g => g.id !== id));
            setDeleteTargetGrn(null);
        } catch (err: any) {
            toast.error('Failed to delete GRN: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredGrns = (grns || []).filter(g => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (
            (g.grn_no || '').toLowerCase().includes(query) ||
            (g.vendor_name || '').toLowerCase().includes(query) ||
            (g.receipt_date || '').toLowerCase().includes(query) ||
            (g.status || '').toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;

        const isAuto = String(g.remarks || '').includes('[AUTOMATIC]');
        if (workflowFilter === 'AUTOMATIC' && !isAuto) return false;
        if (workflowFilter === 'MANUAL' && isAuto) return false;

        return true;
    });

    const totalEntries = filteredGrns.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedGrns = filteredGrns.slice(startIndex, startIndex + entriesPerPage);

    const fetchGRNs = async () => {
        try {
            setLoading(true);
            const [ receiptsRes, itemsRes ] = await Promise.all([
                fetchAllPages(supabase.from('grn_receipts').select('*').order('created_at', { ascending: false })),
                fetchAllPages(supabase.from('grn_items').select('*'))
            ]);

            if (receiptsRes.error) throw receiptsRes.error;

            const itemsByGrn: Record<string, any[]> = {};
            (itemsRes.data || []).forEach((it: any) => {
                const gId = String(it.grn_id || '');
                if (!itemsByGrn[gId]) itemsByGrn[gId] = [];
                itemsByGrn[gId].push(it);
            });

            const combined = (receiptsRes.data || []).map((g: any) => ({
                ...g,
                grn_items: itemsByGrn[String(g.id)] || []
            }));

            setGrns(combined);
        } catch (err: any) {
            console.error('Failed to fetch GRNs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGRNs();
    }, []);

    return (
        <div className="mx-auto max-w-7xl pb-12">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                        <MdInventory className="text-primary" size={24} />
                        Goods Receipt Notes (GRN)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Manage physical inventory receipts from vendors</p>
                </div>
                <button
                    onClick={() => showModal(<ReceiveGrnModal onClose={() => { hideModal(); fetchGRNs(); }} />, "Receive Goods (GRN)", undefined, "max-w-2xl")}
                    className="mt-4 sm:mt-0 px-4 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-700 flex items-center gap-2 text-sm"
                >
                    <MdAddCircle size={18} />
                    + Receive GRN
                </button>
            </div>

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
                <div className="p-4 border-b border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Show</span>
                        <select 
                            className="border border-stroke dark:border-strokedark bg-transparent rounded p-1 outline-none text-sm font-bold text-black dark:text-white"
                            value={entriesPerPage}
                            onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm font-medium text-gray-500">entries</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Workflow Filter Pills */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-meta-4 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => { setWorkflowFilter('ALL'); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                    workflowFilter === 'ALL'
                                        ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                                        : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                All ({grns.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setWorkflowFilter('AUTOMATIC'); setCurrentPage(1); }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                    workflowFilter === 'AUTOMATIC'
                                        ? 'bg-white dark:bg-boxdark text-emerald-600 shadow-xs'
                                        : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                <span>⚡ Automatic</span>
                                <span className="text-[10px] opacity-75">
                                    ({(grns || []).filter(g => String(g.remarks || '').includes('[AUTOMATIC]')).length})
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setWorkflowFilter('MANUAL'); setCurrentPage(1); }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                    workflowFilter === 'MANUAL'
                                        ? 'bg-white dark:bg-boxdark text-indigo-600 shadow-xs'
                                        : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                <span>📋 Manual</span>
                                <span className="text-[10px] opacity-75">
                                    ({(grns || []).filter(g => !String(g.remarks || '').includes('[AUTOMATIC]')).length})
                                </span>
                            </button>
                        </div>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <MdSearch size={18} />
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search GRNs..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-4 py-2 border border-stroke dark:border-strokedark rounded bg-gray-50 dark:bg-meta-4/20 outline-none focus:border-primary text-sm min-w-[220px] text-black dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                                <th className="py-3 px-4 w-12 text-center">S#</th>
                                <th className="py-3 px-4 w-40">GRN No</th>
                                <th className="py-3 px-4">Vendor Profile</th>
                                <th className="py-3 px-4 text-center">Receipt Date</th>
                                <th className="py-3 px-4 text-center">Items Count</th>
                                <th className="py-3 px-4 text-center">Workflow</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-12"><Spinner /></td></tr>
                            ) : paginatedGrns.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-10 text-sm text-gray-500 italic">No GRNs found.</td></tr>
                            ) : (
                                paginatedGrns.map((grn, idx) => (
                                    <tr key={grn.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-black dark:text-white text-xs">
                                        <td className="py-3 px-4 text-center text-gray-400">{idx + 1}</td>
                                        <td className="py-3 px-4 font-bold font-mono text-primary">
                                            <div>{grn.grn_no}</div>
                                            {(() => {
                                                const rem = String(grn.remarks || '');
                                                const jsonMatch = rem.match(/\[GatePasses:\s*(\{.*?\})\]/s);
                                                if (jsonMatch) {
                                                    try {
                                                        const parsed = JSON.parse(jsonMatch[1]);
                                                        const entries = Object.entries(parsed).filter(([_, v]) => Boolean(v));
                                                        if (entries.length === 1) {
                                                            return (
                                                                <div className="text-[10px] font-normal text-purple-600 dark:text-purple-400 font-sans tracking-tight">
                                                                    GP: {String(entries[0][1])}
                                                                </div>
                                                            );
                                                        } else if (entries.length > 1) {
                                                            return (
                                                                <div 
                                                                    className="text-[10px] font-normal text-purple-600 dark:text-purple-400 font-sans tracking-tight cursor-help"
                                                                    title={entries.map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                                                >
                                                                    GPs ({entries.length}): {entries.map(([_, v]) => v).join(', ')}
                                                                </div>
                                                            );
                                                        }
                                                    } catch (e) {}
                                                }
                                                const gpMatch = rem.match(/\[Gate Pass:\s*([^\]]+)\]/i);
                                                return gpMatch ? (
                                                    <div className="text-[10px] font-normal text-purple-600 dark:text-purple-400 font-sans tracking-tight">
                                                        GP: {gpMatch[1]}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                            <span className="flex items-center gap-1"><MdBusiness className="text-gray-400" />{grn.vendor_name}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-500">
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px]"><MdEvent />{grn.receipt_date}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono">
                                            {grn.grn_items?.length || 0}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {String(grn.remarks || '').includes('[AUTOMATIC]') ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs">
                                                    ⚡ Automatic
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 shadow-2xs">
                                                    📋 Manual Inward
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-0.5 border text-[10px] rounded-full font-bold uppercase tracking-wide whitespace-nowrap ${grn.status === 'Billed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                                                }`}>
                                                {grn.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        showModal(
                                                            <VerifyInward 
                                                                inwardId={grn.id} 
                                                                readonly={true}
                                                                onCancel={() => hideModal()} 
                                                            />,
                                                            "View GRN Details",
                                                            undefined,
                                                            "max-w-5xl"
                                                        );
                                                    }}
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 transition"
                                                    title="View QC Details"
                                                >
                                                    <MdVisibility size={16} />
                                                </button>
                                                {grn.status !== 'Billed' && (
                                                    <button 
                                                        onClick={() => navigate('/Purchase/Purchases/Add', { 
                                                            state: { 
                                                                importGrnId: grn.id,
                                                                importGrn: grn
                                                            } 
                                                        })}
                                                        className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 transition"
                                                        title="Make Purchase Bill (Enter Prices)"
                                                    >
                                                        <MdShoppingCart size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => navigate(`/Purchase/GRN/Edit/${grn.id}`)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition"
                                                    title="Edit"
                                                >
                                                    <MdEdit size={16} />
                                                </button>
                                                {(() => {
                                                    const isBilled = grn.status === 'Billed';
                                                    const hasReceived = (grn.grn_items || []).some(
                                                        (i: any) => Number(i.accepted_qty || 0) > 0 || Number(i.rejected_qty || 0) > 0
                                                    );
                                                    const isLocked = isBilled || hasReceived;
                                                    return (
                                                        <button 
                                                            onClick={() => handleDeleteClick(grn)}
                                                            disabled={deletingId === grn.id}
                                                            className={`p-1.5 rounded transition ${
                                                                isLocked
                                                                    ? 'bg-slate-100 text-slate-400 dark:bg-meta-4/20 dark:text-slate-500 hover:bg-slate-200 cursor-not-allowed'
                                                                    : 'bg-red-50 text-red-600 rounded hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 cursor-pointer'
                                                            } disabled:opacity-50`}
                                                            title={
                                                                isBilled 
                                                                    ? "Locked: GRN is already Billed" 
                                                                    : hasReceived 
                                                                        ? "Locked: Items already received into stock (Cannot Delete)" 
                                                                        : "Delete Pending GRN"
                                                            }
                                                        >
                                                            <MdDelete size={16} />
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-stroke dark:border-strokedark flex items-center justify-between text-sm text-gray-500">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="flex gap-1">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-3 py-1 border border-stroke dark:border-strokedark rounded hover:bg-gray-50 dark:hover:bg-meta-4/20 disabled:opacity-50 text-black dark:text-white"
                        >
                            Prev
                        </button>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-3 py-1 border border-stroke dark:border-strokedark rounded hover:bg-gray-50 dark:hover:bg-meta-4/20 disabled:opacity-50 text-black dark:text-white"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={!!deleteTargetGrn}
                title="Delete Goods Receipt Note?"
                itemType="GRN"
                itemName={deleteTargetGrn?.grn_no}
                subtitle="Are you sure you want to remove this receiving consignment?"
                details={[
                    { label: "Vendor", value: deleteTargetGrn?.vendor_name || 'N/A' },
                    { label: "Receipt Date", value: deleteTargetGrn?.receipt_date || 'N/A' },
                    { label: "Items Count", value: String(deleteTargetGrn?.grn_items?.length || 0) },
                    { label: "Current Status", value: deleteTargetGrn?.status || 'N/A' },
                ]}
                warning="This will safely delete this unreceived GRN and its inward items registry."
                confirmButtonText="Confirm Delete"
                isDeleting={deletingId === deleteTargetGrn?.id}
                onConfirm={executeDeleteGrn}
                onCancel={() => setDeleteTargetGrn(null)}
            />
        </div>
    );
};

export default GRNList;
