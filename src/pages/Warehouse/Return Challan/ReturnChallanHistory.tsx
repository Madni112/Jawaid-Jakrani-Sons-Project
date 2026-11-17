import React, { useEffect, useState } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdVisibility } from 'react-icons/md';
import { FiPrinter } from 'react-icons/fi';
import { printReturnChallanSlip } from './utils/printReturnChallanSlip';

const ReturnChallanHistory = ({ onView }: { onView: (id: string) => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_returns')
        .select('*')
        .or('inward_status.in.("Received","Rejected"),received_items.not.is.null')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const completed = (data || []).filter((h: any) => {
        if (h.inward_status === 'Received' || h.inward_status === 'Rejected') return true;
        if (Array.isArray(h.received_items) && h.received_items.length > 0) {
          return !h.received_items.some((r: any) => Number(r.holdQty || 0) > 0);
        }
        return false;
      });
      setHistory(completed);
    } catch (err: any) {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="max-w-full overflow-x-auto text-black dark:text-white pb-4">
      <table className="w-full table-auto border-collapse text-left">
        <thead>
          <tr className="bg-slate-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-700 dark:text-white">
            <th className="py-3 px-4">Return Note #</th>
            <th className="py-3 px-4">Original Inv #</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Customer Name</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-gray-500 italic font-bold">No processed return receipts found.</td></tr>
          ) : (
            history.map((h) => (
              <tr key={h.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/20 font-semibold text-xs">
                <td className="py-3 px-4 font-mono font-bold text-primary">
                  {h.return_no || `SR-${String(h.id).padStart(4, '0')}`}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  {h.invoice_no || h.metadata?.linkedInvoiceNo || '—'}
                </td>
                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {h.return_date || (h.created_at ? h.created_at.split('T')[0] : '—')}
                </td>
                <td className="py-3 px-4 font-bold">{h.customer_name}</td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <span className={`inline-flex rounded-md py-0.5 px-2.5 text-[9px] font-black uppercase tracking-wide border ${
                    h.inward_status === 'Received'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : h.inward_status === 'Rejected'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {h.inward_status || 'Received'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(h.id)}
                      title="View QC Verification Details"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer shadow-xs"
                    >
                      <MdVisibility size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => printReturnChallanSlip(h)}
                      title="Print Customer Return QC Inward Slip"
                      className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer shadow-xs"
                    >
                      <FiPrinter size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReturnChallanHistory;
