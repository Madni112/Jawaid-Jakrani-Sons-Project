import React from 'react';
import { MdCheckCircle, MdSecurity, MdBadge, MdLayers } from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface CreateEmployeeTabProps {
  createdResult: any;
  handleCreateEmployee: (e: React.FormEvent) => void;
  newEmployee: any;
  setNewEmployee: React.Dispatch<React.SetStateAction<any>>;
  applyRolePresetToNew: (presetKey: string) => void;
  ROLE_PRESETS: Record<string, any>;
  PermissionTreeEditor: React.ComponentType<any>;
  locations: any[];
  setActiveTab: (tab: string) => void;
  isCreating: boolean;
}

export const CreateEmployeeTab: React.FC<CreateEmployeeTabProps> = ({
  createdResult,
  handleCreateEmployee,
  newEmployee,
  setNewEmployee,
  applyRolePresetToNew,
  ROLE_PRESETS,
  PermissionTreeEditor,
  locations,
  setActiveTab,
  isCreating
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {createdResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 rounded-2xl p-6 shadow-default space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <MdCheckCircle className="text-xl" />
            <span>Employee Account Registered Successfully!</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Employee <strong>{createdResult.name}</strong> can now log into the application with email <code>{createdResult.email}</code> and their designated role <strong>{createdResult.role}</strong>.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-boxdark p-8 rounded-2xl border border-stroke dark:border-strokedark shadow-default transition-colors duration-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stroke dark:border-strokedark">
          <div>
            <h3 className="text-xl font-extrabold text-black dark:text-white">Register New Employee User</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Assign a role (Warehouse Manager, Accountant, Salesman, etc.) and configure accessible pages.
            </p>
          </div>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/20 font-semibold flex items-center gap-1.5">
            <MdSecurity /> AL MUHAMMADI RBAC
          </span>
        </div>

        <form onSubmit={handleCreateEmployee} className="space-y-6">
          
          {/* 1. EMPLOYEE DETAILS */}
          <div className="bg-gray-50 dark:bg-meta-4/20 p-5 rounded-xl border border-stroke dark:border-strokedark space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <MdBadge /> 1. Employee Profile & Login Credentials
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ali Raza (Warehouse Lead)"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full bg-white dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-lg p-2.5 text-black dark:text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Assigned Employee Role *
                </label>
                <select
                  value={newEmployee.role}
                  onChange={e => applyRolePresetToNew(e.target.value)}
                  className="w-full bg-white dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-lg p-2.5 text-black dark:text-white text-xs outline-none focus:border-emerald-500 font-semibold"
                >
                  {Object.keys(ROLE_PRESETS).map(roleKey => (
                    <option key={roleKey} value={roleKey}>
                      {ROLE_PRESETS[roleKey].name}
                    </option>
                  ))}
                </select>
              </div>

              {newEmployee.role === 'Warehouse Manager' && (
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1 text-emerald-600">Assigned Location *</label>
                  <select
                    required
                    value={newEmployee.location_id}
                    onChange={e => setNewEmployee({ ...newEmployee, location_id: e.target.value })}
                    className="w-full bg-white dark:bg-form-input border border-emerald-300 dark:border-emerald-700 rounded-lg p-2.5 text-black dark:text-white text-xs outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="">-- Choose Assigned Location --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.is_primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">Login Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. employee@almuhammadi.com"
                  value={newEmployee.email}
                  onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full bg-white dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-lg p-2.5 text-black dark:text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="8+ Characters"
                  value={newEmployee.password}
                  onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full bg-white dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-lg p-2.5 text-black dark:text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. ROLE PRESETS QUICK-BAR */}
          <div className="bg-gray-50 dark:bg-meta-4/20 p-5 rounded-xl border border-stroke dark:border-strokedark space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <MdLayers /> 2. Fast Role Template Selector
              </h4>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                Selected: <strong className="text-emerald-600">{newEmployee.modules.length} Pages</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => applyRolePresetToNew(key)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    newEmployee.role === key
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 border-stroke dark:border-strokedark hover:border-emerald-500'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. PERMISSION TREE EDITOR */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <MdSecurity /> 3. Fine-Grained Module & Page Permissions
            </h4>
            <PermissionTreeEditor
              selectedIds={newEmployee.modules}
              onChange={(ids: string[]) => setNewEmployee({ ...newEmployee, modules: ids })}
              allowedLocations={newEmployee.allowed_locations}
              onLocationsChange={(locs: string[]) => setNewEmployee({ ...newEmployee, allowed_locations: locs })}
              availableLocations={locations}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className="px-5 py-2.5 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCreating ? <Spinner /> : <MdCheckCircle />} Register Employee Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
