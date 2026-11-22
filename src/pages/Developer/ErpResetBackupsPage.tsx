import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuDatabase,
  LuDownload,
  LuFileSpreadsheet,
  LuFileText,
  LuArrowLeft,
  LuShieldAlert,
  LuClock,
  LuUser,
  LuCheckCircle2,
  LuRefreshCw,
  LuLayers,
  LuTrash2
} from 'react-icons/lu';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { fetchResetBackups, downloadBackupAsExcel, ResetBackupMetadata } from '../../utils/erpResetManager';

const ErpResetBackupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [backups, setBackups] = useState<ResetBackupMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBackup, setSelectedBackup] = useState<ResetBackupMetadata | null>(null);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await fetchResetBackups();
      setBackups(data);
      if (data.length > 0 && !selectedBackup) {
        setSelectedBackup(data[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load reset archives: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleDownloadJson = (b: ResetBackupMetadata) => {
    try {
      const jsonStr = JSON.stringify(
        {
          backupId: b.id,
          timestamp: b.timestamp,
          performedBy: b.performedBy,
          sourcePortal: b.sourcePortal,
          summary: b.summary,
          data: b.archive,
        },
        null,
        2
      );
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      saveAs(blob, `ALM_BACKUP_${b.id}.json`);
      toast.success('JSON backup downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to download JSON: ' + err.message);
    }
  };

  const handleDownloadExcel = (b: ResetBackupMetadata) => {
    downloadBackupAsExcel(b);
    toast.success('Excel workbook downloaded successfully!');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/dev/master')}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Back to Developer Console"
          >
            <LuArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                ERP Factory Reset Archives & Safety Vault
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every data wipe on Jawaid Jakwani & Sons generates an immutable snapshot stored here for developer recovery.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadBackups}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <LuRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
          <span>Refresh Vault</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Archives List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <LuDatabase className="text-primary" />
              <span>Snapshot Records ({backups.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading reset archives...</div>
          ) : backups.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-xl">
                <LuCheckCircle2 />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Vault is Clean</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No factory reset has been triggered yet. When a reset is executed, complete pre-wipe snapshots will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {backups.map((b) => {
                const isSelected = selectedBackup?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBackup(b)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                        {b.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold">
                        WIPED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <LuClock size={12} />
                      <span>{new Date(b.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <LuUser size={12} />
                      <span className="truncate">{b.performedBy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-2">
          {selectedBackup ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Card Header with Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                    Archive Snapshot Detail
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {selectedBackup.id}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Captured on <strong>{new Date(selectedBackup.timestamp).toLocaleString()}</strong> by{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedBackup.performedBy}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDownloadJson(selectedBackup)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LuFileText size={14} />
                    <span>Download JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadExcel(selectedBackup)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LuFileSpreadsheet size={14} />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <LuLayers size={14} />
                  <span>Wiped Inventory & Financial Metrics</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Sales Invoices</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.salesInvoices ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Supplier Purchases</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.supplierPurchases ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Opening Stocks</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.openingStocks ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Delivery Challans</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.deliveryChallans ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Sales Returns</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.salesReturns ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Financial Vouchers</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.financialVouchers ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Products Zeroed</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.productsZeroed ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Customer Balances</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedBackup.summary.customersZeroed ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contained Archive Tables List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Archived Database Tables in this Snapshot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedBackup.archive || {}).map(([tableName, rows]) => (
                    <div
                      key={tableName}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{tableName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
                        {Array.isArray(rows) ? rows.length : 0} rows
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400 shadow-sm">
              Select an archive snapshot from the left to view metrics and download files.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErpResetBackupsPage;

