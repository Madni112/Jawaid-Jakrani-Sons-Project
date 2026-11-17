import React from 'react';
import { MdBadge, MdSecurity, MdTune, MdCheck, MdLayers } from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface EditEmployeeModalProps {
  editingEmployee: any;
  setEditingEmployee: (emp: any) => void;
  editModules: string[];
  setEditModules: React.Dispatch<React.SetStateAction<string[]>>;
  editModalTab: 'details' | 'roles' | 'settings';
  setEditModalTab: React.Dispatch<React.SetStateAction<'details' | 'roles' | 'settings'>>;
  editName: string;
  setEditName: (name: string) => void;
  editAllowedLocations: string[];
  setEditAllowedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  editAllowedSettings: string[];
  setEditAllowedSettings: React.Dispatch<React.SetStateAction<string[]>>;
  ROLE_PRESETS: Record<string, any>;
  applyRolePresetToEdit: (presetKey: string) => void;
  PermissionTreeEditor: React.ComponentType<any>;
  locations: any[];
  SETTINGS_TAB_CONFIG: { id: string; label: string; desc: string; icon: string }[];
  isSavingEdit: boolean;
  handleSaveEmployeePermissions: () => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  editingEmployee,
  setEditingEmployee,
  editModules,
  setEditModules,
  editModalTab,
  setEditModalTab,
  editName,
  setEditName,
  editAllowedLocations,
  setEditAllowedLocations,
  editAllowedSettings,
  setEditAllowedSettings,
  ROLE_PRESETS,
  applyRolePresetToEdit,
  PermissionTreeEditor,
  locations,
  SETTINGS_TAB_CONFIG,
  isSavingEdit,
  handleSaveEmployeePermissions
}) => {
  if (!editingEmployee) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-99999 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-boxdark w-[92vw] max-w-6xl rounded-3xl border border-stroke dark:border-strokedark p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark pb-4">
          <div>
            <h4 className="text-lg font-bold text-black dark:text-white">Edit Employee Role & Permissions</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Employee: <strong className="text-emerald-700 dark:text-emerald-400">{editingEmployee.name}</strong> ({editingEmployee.email})
            </p>
          </div>
          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] px-3 py-1 rounded-md font-mono font-bold border border-emerald-200 dark:border-emerald-800/60">
            {editModules.length} Pages Permitted
          </span>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-stroke dark:border-strokedark pb-2">
          <button
            type="button"
            onClick={() => setEditModalTab('details')}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editModalTab === 'details'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <MdBadge className="text-sm" /> Employee Details
          </button>
          <button
            type="button"
            onClick={() => setEditModalTab('roles')}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editModalTab === 'roles'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <MdSecurity className="text-sm" /> Roles & Permissions ({editModules.length})
          </button>
          <button
            type="button"
            onClick={() => setEditModalTab('settings')}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editModalTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <MdTune className="text-sm" /> Allowed Settings ({editAllowedSettings.length}/{SETTINGS_TAB_CONFIG.length})
          </button>
        </div>

        {/* TAB CONTENT: 1. DETAILS */}
        {editModalTab === 'details' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1">Employee Full Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-transparent dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-xl p-2.5 text-xs text-black dark:text-white outline-none focus:border-emerald-500"
                placeholder="e.g. Muhammad Tariq"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1">Login Email Address:</label>
              <input
                type="text"
                disabled
                value={editingEmployee.email}
                className="w-full bg-gray-100 dark:bg-meta-4/40 border border-stroke dark:border-form-strokedark rounded-xl p-2.5 text-xs text-gray-500 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Login email address is immutable once registered.</span>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 2. ROLES & PERMISSIONS */}
        {editModalTab === 'roles' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* FAST ROLE SELECTOR */}
            <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <MdLayers /> Fast Role Preset Overrides
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => applyRolePresetToEdit(key)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-bold hover:border-emerald-500 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{preset.icon}</span>
                    <span>{key}</span>
                  </button>
                ))}
              </div>
            </div>

            <PermissionTreeEditor
              selectedIds={editModules}
              onChange={(ids: string[]) => setEditModules(ids)}
              allowedLocations={editAllowedLocations}
              onLocationsChange={(locs: string[]) => setEditAllowedLocations(locs)}
              availableLocations={locations}
            />
          </div>
        )}

        {/* TAB CONTENT: 3. ALLOWED SETTINGS */}
        {editModalTab === 'settings' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-2xl border border-stroke dark:border-strokedark">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <MdTune /> Fine-Grained Settings Tab Access Control
                  </h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Select exactly which tabs inside <strong>Settings</strong> this employee is permitted to view & operate.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAllowedSettings(SETTINGS_TAB_CONFIG.map(s => s.id))}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                  >
                    Allow All ({SETTINGS_TAB_CONFIG.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAllowedSettings([])}
                    className="text-[11px] font-bold text-gray-500 hover:text-rose-600 px-2 py-1 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition cursor-pointer"
                  >
                    Hide All
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
              {SETTINGS_TAB_CONFIG.map((setting) => {
                const isChecked = editAllowedSettings.includes(setting.id);
                return (
                  <div
                    key={setting.id}
                    onClick={() => {
                      if (isChecked) {
                        setEditAllowedSettings(prev => prev.filter(id => id !== setting.id));
                      } else {
                        setEditAllowedSettings(prev => [...prev, setting.id]);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70 shadow-xs'
                        : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark opacity-60 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5 truncate">
                          <span>{setting.icon}</span>
                          <span>{setting.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-meta-4 dark:text-gray-400'
                          }`}
                        >
                          {isChecked ? 'Allowed' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                        {setting.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={() => setEditingEmployee(null)}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 border border-stroke dark:border-strokedark rounded-xl hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSavingEdit}
            onClick={handleSaveEmployeePermissions}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSavingEdit ? <Spinner /> : <MdCheck />} Save Role & Permissions
          </button>
        </div>

      </div>
    </div>
  );
};
