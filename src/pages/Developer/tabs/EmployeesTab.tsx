import React from 'react';
import { MdAddCircle, MdBadge, MdEdit, MdDelete } from 'react-icons/md';

interface EmployeesTabProps {
  employees: any[];
  setActiveTab: (tab: string) => void;
  handleOpenEditModal: (emp: any) => void;
  handleDeleteEmployee: (emp: any) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  setActiveTab,
  handleOpenEditModal,
  handleDeleteEmployee
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-default overflow-hidden transition-colors duration-200">
      <div className="p-6 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white">Active Company Employee Accounts</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage individual employee permissions, roles, and allowed pages.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('create')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <MdAddCircle /> Add New Employee User
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-meta-4/30 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider border-b border-stroke dark:border-strokedark">
              <th className="p-4">Employee Name</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Login Email</th>
              <th className="p-4">Permitted Modules</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold mb-3">
                      <MdBadge />
                    </div>
                    <h4 className="text-sm font-bold text-black dark:text-white mb-1">No Active Employee Accounts</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      All previous user accounts have been cleared. You can add new employee accounts with custom roles anytime.
                    </p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <MdAddCircle /> Add New Employee User
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition">
                  <td className="p-4 font-bold text-black dark:text-white flex items-center gap-2">
                    <MdBadge className="text-emerald-600 text-base shrink-0" />
                    <span>{emp.name}</span>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-1 rounded-md text-[11px] font-bold">
                      {emp.role || 'Staff'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-gray-600 dark:text-gray-400">
                    {emp.email || '—'}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 dark:bg-meta-4 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-mono border border-stroke dark:border-strokedark font-bold">
                      {emp.allowed_modules?.length || 0} pages allowed
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp)}
                        className="inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                        title="Delete employee account"
                      >
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
