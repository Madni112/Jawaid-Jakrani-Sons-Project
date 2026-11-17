import React from 'react';
import {
  MdVpnKey,
  MdClose,
} from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface AssignLoginModalProps {
  salesmanToAssignLogin: any;
  setSalesmanToAssignLogin: (salesman: any) => void;
  assignLoginEmail: string;
  setAssignLoginEmail: (val: string) => void;
  assignLoginPassword: string;
  setAssignLoginPassword: (val: string) => void;
  assignLoginRole: string;
  setAssignLoginRole: (val: string) => void;
  rolePresets: Record<string, { name: string; modules: string[] }>;
  handleSaveSalesmanLogin: (e: React.FormEvent) => void;
  isAssigningLogin: boolean;
}

export const AssignLoginModal: React.FC<AssignLoginModalProps> = ({
  salesmanToAssignLogin,
  setSalesmanToAssignLogin,
  assignLoginEmail,
  setAssignLoginEmail,
  assignLoginPassword,
  setAssignLoginPassword,
  assignLoginRole,
  setAssignLoginRole,
  rolePresets,
  handleSaveSalesmanLogin,
  isAssigningLogin,
}) => {
  if (!salesmanToAssignLogin) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
              <MdVpnKey />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <span>Assign Login Credentials</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Generate an official ERP login and role for <strong className="text-black dark:text-white">{salesmanToAssignLogin.name}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSalesmanToAssignLogin(null)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveSalesmanLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Salesman Name
            </label>
            <input
              type="text"
              value={salesmanToAssignLogin.name}
              disabled
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4/50 text-gray-700 dark:text-gray-300 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Login Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={assignLoginEmail}
              onChange={e => setAssignLoginEmail(e.target.value)}
              placeholder="e.g. salesman@nhtenterprise.com"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={assignLoginPassword}
              onChange={e => setAssignLoginPassword(e.target.value)}
              placeholder="Create a secure password (min 6 chars)"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Assigned ERP Role
            </label>
            <select
              value={assignLoginRole}
              onChange={e => setAssignLoginRole(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-blue-500 focus:outline-hidden cursor-pointer"
            >
              {Object.keys(rolePresets).map(roleKey => (
                <option key={roleKey} value={roleKey}>
                  {rolePresets[roleKey].name} ({rolePresets[roleKey].modules.length} modules)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Default: <strong>Salesman</strong> (Includes Quotations, Invoices, Delivery Challans, Customers & Ledger).
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={() => setSalesmanToAssignLogin(null)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-meta-4/80 text-black dark:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigningLogin}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isAssigningLogin ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdVpnKey />}
              <span>Create & Link Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
