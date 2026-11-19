import React, { useState } from 'react';
import { LuShieldAlert, LuTrash2, LuCheckCircle2, LuRefreshCw } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { executeErpFactoryReset } from '../../../utils/erpResetManager';
import { triggerFeedbackSound } from '../../../utils/audioFeedback';

interface FactoryResetTabProps {
  userEmail?: string | null;
  systemConfig?: any;
  isRTL?: boolean;
}

export const FactoryResetTab: React.FC<FactoryResetTabProps> = ({
  userEmail,
  systemConfig,
  isRTL = false,
}) => {
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);
  const [resetEnteredPassword, setResetEnteredPassword] = useState('');
  const [resetConfirmPhrase, setResetConfirmPhrase] = useState('');
  const [resetWipeMaster, setResetWipeMaster] = useState(false);
  const [isResettingErp, setIsResettingErp] = useState(false);
  const [resetStepStatus, setResetStepStatus] = useState<string>('');

  const handleExecuteFactoryReset = async () => {
    const requiredPw = (systemConfig?.alm_reset_password || 'ALM-RESET-MASTER-2026').trim();
    if (resetEnteredPassword.trim() !== requiredPw) {
      toast.error('Invalid Developer Master Password. Please check /dev/master.');
      triggerFeedbackSound('error', userEmail);
      return;
    }

    if (resetConfirmPhrase.trim().toUpperCase() !== 'CONFIRM RESET') {
      toast.error('Please type "CONFIRM RESET" exactly to proceed.');
      return;
    }

    try {
      setIsResettingErp(true);
      setResetStepStatus('Initiating safe ERP Factory Reset...');
      const res = await executeErpFactoryReset(userEmail || 'Super Admin', resetWipeMaster);
      if (res.success) {
        toast.success(res.message, { duration: 6000 });
        triggerFeedbackSound('success', userEmail);
        setShowFactoryResetModal(false);
        setResetEnteredPassword('');
        setResetConfirmPhrase('');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(res.message || 'Factory reset failed.');
        triggerFeedbackSound('error', userEmail);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Factory reset error.');
      triggerFeedbackSound('error', userEmail);
    } finally {
      setIsResettingErp(false);
      setResetStepStatus('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-300 dark:border-red-900/60 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shrink-0">
              <LuShieldAlert />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-red-700 dark:text-red-400">
                  {isRTL ? 'فیکٹری ری سیٹ اور لین دین مٹائیں' : 'Factory Reset ERP & Wipe Transactions'}
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                  ALM Portal Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL 
                  ? 'تمام لین دین (سیلز، خریداریاں، چالان، واؤچرز، اوپننگ اسٹاک) مٹائیں اور تمام فزیکل اسٹاک اور لیجر بیلنس کو 0 پر ری سیٹ کریں۔'
                  : 'Wipes all transactional data (sales, purchases, challans, vouchers, opening stock) and sets all physical stock and ledger balances to 0.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setResetEnteredPassword('');
              setResetConfirmPhrase('');
              setResetWipeMaster(false);
              setShowFactoryResetModal(true);
            }}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer shrink-0"
          >
            <LuTrash2 size={16} />
            <span>{isRTL ? 'ری سیٹ ماڈل کھولیں' : 'Launch Factory Reset Modal'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-1">
            <span className="font-bold text-xs text-red-800 dark:text-red-300 block">
              1. Developer Password Required
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Cannot be executed accidentally. Must provide the Master Authorization Password managed in <code>/dev/master</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 block">
              2. Automatic Dual-Backup
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Instant browser download of JSON file + permanent immutable snapshot uploaded to <code>/dev/master/reset-backups</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
              3. Preserves Item Registry
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Product names, categories, and customers are safely preserved by default so you don't have to re-enter catalog setups.
            </p>
          </div>
        </div>
      </div>

      {/* FACTORY RESET CONFIRMATION MODAL */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl border-2 border-red-400 dark:border-red-800 w-full max-w-xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shrink-0">
                <LuShieldAlert />
              </div>
              <div>
                <h3 className="font-black text-lg text-red-600 dark:text-red-400">
                  {isRTL ? 'فیکٹری ری سیٹ کی تصدیق کریں' : 'Authorize ERP Factory Reset'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRTL 
                    ? 'یہ عمل Zohaib Ali and Company کے لیے تمام انوینٹری، سیلز، خریداریاں اور لیجر بیلنس مکمل صفر کر دے گا۔'
                    : 'This action will completely zero out all inventory, sales, purchases, and ledger balances for Zohaib Ali and Company.'}
                </p>
              </div>
            </div>

            {/* Safety Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <LuCheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <strong>Automatic Safety Backup Guarantee:</strong> A full Excel & JSON snapshot will automatically be generated, downloaded to your computer, and vaulted in <code>/dev/master/reset-backups</code>.
              </div>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  1. Enter Developer Master Authorization Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={resetEnteredPassword}
                  onChange={(e) => setResetEnteredPassword(e.target.value)}
                  placeholder="Given by developer in /dev/master"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-red-500 focus:outline-hidden font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Managed in /dev/master under Apex Security.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  2. Type <span className="text-red-600 font-mono font-black">CONFIRM RESET</span> to confirm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resetConfirmPhrase}
                  onChange={(e) => setResetConfirmPhrase(e.target.value)}
                  placeholder="Type CONFIRM RESET exactly"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-red-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-2 border-t border-stroke dark:border-strokedark">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetWipeMaster}
                    onChange={(e) => setResetWipeMaster(e.target.checked)}
                    className="rounded border-stroke text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Also wipe product & customer master catalog (Blank slate mode)
                  </span>
                </label>
              </div>

              {resetStepStatus && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <LuRefreshCw className="animate-spin" size={14} />
                  <span>{resetStepStatus}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-stroke dark:border-strokedark flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isResettingErp}
                onClick={() => setShowFactoryResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isResettingErp ||
                  !resetEnteredPassword ||
                  resetConfirmPhrase.trim().toUpperCase() !== 'CONFIRM RESET'
                }
                onClick={handleExecuteFactoryReset}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LuTrash2 size={14} />
                <span>{isResettingErp ? 'Backing Up & Resetting...' : 'Execute Factory Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
