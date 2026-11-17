import React from 'react';
import { MdSecurity, MdCheck, MdCloudDone, MdTune, MdInfoOutline, MdVpnKey, MdVisibility, MdLock } from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface PermissionsTabProps {
  systemConfig: any;
  savingConfig: boolean;
  handleSaveSystemConfig: () => void;
  handleToggleBackupGlobal: () => void;
  handleToggleBackupSuperAdmin: () => void;
  handleToggleUserBackupWhitelist: (email: string) => void;
  handleToggleCreditLimitSuperAdmin: () => void;
  handleToggleUserCreditLimitWhitelist: (email: string) => void;
  employees: any[];
  pwSelectedEmail: string;
  setPwSelectedEmail: (email: string) => void;
  pwNew: string;
  setPwNew: (pw: string) => void;
  pwConfirm: string;
  setPwConfirm: (pw: string) => void;
  showPwText: boolean;
  setShowPwText: React.Dispatch<React.SetStateAction<boolean>>;
  pwUpdating: boolean;
  handleUpdateUserPassword: (e: React.FormEvent) => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  systemConfig,
  savingConfig,
  handleSaveSystemConfig,
  handleToggleBackupGlobal,
  handleToggleBackupSuperAdmin,
  handleToggleUserBackupWhitelist,
  handleToggleCreditLimitSuperAdmin,
  handleToggleUserCreditLimitWhitelist,
  employees,
  pwSelectedEmail,
  setPwSelectedEmail,
  pwNew,
  setPwNew,
  pwConfirm,
  setPwConfirm,
  showPwText,
  setShowPwText,
  pwUpdating,
  handleUpdateUserPassword,
}) => {
  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl p-6 shadow-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center text-2xl shrink-0">
            <MdSecurity />
          </div>
          <div>
            <h2 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              System Master Permissions & Security Governance
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Apex Authority
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Configure root permission toggles that govern Super Admins and staff across Data Backup, Credit Limit editing, and user passwords.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSystemConfig}
          disabled={savingConfig}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          {savingConfig ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdCheck />}
          <span>Save Master Policies</span>
        </button>
      </div>

      {/* Grid of permission cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: ERP DATA BACKUP & EXPORT GOVERNANCE */}
        <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MdCloudDone size={20} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-black dark:text-white">ERP Data Backup & Export Authority</h3>
                <p className="text-[11px] text-gray-400">Governs who can download Excel backups from Settings</p>
              </div>
            </div>
          </div>

          {/* Master Global Switch */}
          <div className="p-4 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-black dark:text-white">Global Data Backup & Export Switch</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {systemConfig.allow_backup_global
                  ? '🟢 Data Backup feature is enabled across the ERP'
                  : '🔴 Entire Data Backup is locked system-wide for everyone'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleBackupGlobal}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                systemConfig.allow_backup_global ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  systemConfig.allow_backup_global ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Super Admin Switch */}
          <div className="p-4 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-black dark:text-white">Allow Super Admin to Export Data</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {systemConfig.allow_backup_super_admin
                  ? '✅ Super Admin accounts can download full ERP backups'
                  : '⛔ Super Admin accounts are restricted from exporting data'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleBackupSuperAdmin}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                systemConfig.allow_backup_super_admin ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  systemConfig.allow_backup_super_admin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Additional Whitelisted Users */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Whitelisted Staff Members ({systemConfig.backup_allowed_users?.length || 0}):
              </label>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Grant export permissions to specific staff accounts even if not Super Admin:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
              {employees.map(emp => {
                const isAllowed = (systemConfig.backup_allowed_users || []).some(
                  e => e.toLowerCase() === emp.email.toLowerCase()
                );
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer select-none ${
                      isAllowed
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                        : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={() => handleToggleUserBackupWhitelist(emp.email)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="truncate">{emp.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono truncate">({emp.email})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 shrink-0">
                      {emp.role}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 2: CUSTOMER CREDIT LIMIT AUTHORITY */}
        <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <MdTune size={20} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-black dark:text-white">Customer Credit Limit Edit Authority</h3>
                <p className="text-[11px] text-gray-400">All users can view limits; control who can edit/add limits</p>
              </div>
            </div>
          </div>

          {/* Super Admin Switch */}
          <div className="p-4 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-black dark:text-white">Allow Super Admin to Edit Credit Limits</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {systemConfig.allow_credit_limit_super_admin
                  ? '✅ Super Admin can modify customer credit limits in Settings'
                  : '🔒 Super Admin is restricted to View-Only mode'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleCreditLimitSuperAdmin}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                systemConfig.allow_credit_limit_super_admin ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  systemConfig.allow_credit_limit_super_admin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Additional Whitelisted Users */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Authorized Staff Members ({systemConfig.credit_limit_allowed_users?.length || 0}):
              </label>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Authorize specific staff accounts to modify customer credit limits:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
              {employees.map(emp => {
                const isAllowed = (systemConfig.credit_limit_allowed_users || []).some(
                  e => e.toLowerCase() === emp.email.toLowerCase()
                );
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer select-none ${
                      isAllowed
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold'
                        : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={() => handleToggleUserCreditLimitWhitelist(emp.email)}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="truncate">{emp.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono truncate">({emp.email})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 shrink-0">
                      {emp.role}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <MdInfoOutline className="text-base shrink-0" />
            <span>
              Staff without edit permissions will still see customer balances and credit limits in Settings, but cannot alter limits.
            </span>
          </div>
        </div>

        {/* CARD 3: USER PASSWORD RESET & MANAGEMENT */}
        <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <MdVpnKey size={20} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-black dark:text-white">User Password Reset & Security Tool</h3>
                <p className="text-[11px] text-gray-400">Safely trigger password updates for employee accounts with audit verification</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateUserPassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                Target Employee User <span className="text-red-500">*</span>
              </label>
              <select
                value={pwSelectedEmail}
                onChange={e => setPwSelectedEmail(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-purple-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Choose Employee Account --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.email}>
                    {emp.name} ({emp.email}) - {emp.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPwText ? 'text' : 'password'}
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type={showPwText ? 'text' : 'password'}
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-purple-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPwText(p => !p)}
                  className="px-2.5 rounded-xl border border-stroke dark:border-strokedark text-gray-500 hover:text-black dark:hover:text-white transition cursor-pointer"
                  title={showPwText ? 'Hide password' : 'Show password'}
                >
                  <MdVisibility />
                </button>
              </div>
            </div>

            <div className="md:col-span-3 flex items-center justify-between pt-2 border-t border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400">
                Password updates are logged in the immutable system audit trail for security compliance.
              </span>
              <button
                type="submit"
                disabled={pwUpdating || !pwSelectedEmail}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {pwUpdating ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdLock />}
                <span>Update & Dispatch Password</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
