import React from 'react';
import {
  MdHistory,
  MdSearch,
  MdClose,
  MdRefresh,
  MdFilterList,
  MdPeople,
  MdVisibility,
} from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface AuditLogsTabProps {
  logs: any[];
  filteredLogs: any[];
  paginatedLogs: any[];
  logsLoading: boolean;
  logSearch: string;
  setLogSearch: (val: string) => void;
  logFilterAction: string;
  setLogFilterAction: (val: string) => void;
  logFilterEmployee: string;
  setLogFilterEmployee: (val: string) => void;
  logPage: number;
  setLogPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  totalPages: number;
  employeeFilterOptions: { key: string; label: string }[];
  fetchAuditLogs: () => void;
  getEmployeeInfo: (id: string) => any;
  formatActivityEvent: (log: any) => any;
  setSelectedLogModal: (log: any) => void;
  setShowRawJsonModal: (val: boolean) => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({
  logs,
  filteredLogs,
  paginatedLogs,
  logsLoading,
  logSearch,
  setLogSearch,
  logFilterAction,
  setLogFilterAction,
  logFilterEmployee,
  setLogFilterEmployee,
  logPage,
  setLogPage,
  pageSize,
  totalPages,
  employeeFilterOptions,
  fetchAuditLogs,
  getEmployeeInfo,
  formatActivityEvent,
  setSelectedLogModal,
  setShowRawJsonModal,
}) => {
  return (
    <div className="space-y-6">
      {/* LOGS HEADER & FILTERS BAR */}
      <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-lg">
              <MdHistory />
            </span>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Live System Activity & Audit Logs
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time forensic logs tracking user logins, sales operations, stock dispatches, and data changes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Bar */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              placeholder="Search logs (user, table, action)..."
              value={logSearch}
              onChange={(e) => {
                setLogSearch(e.target.value);
                setLogPage(1);
              }}
              className="pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark rounded-xl text-black dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none w-56 sm:w-64"
            />
            {logSearch && (
              <button
                onClick={() => { setLogSearch(''); setLogPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <MdClose className="text-xs" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAuditLogs()}
            disabled={logsLoading}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reload Logs"
          >
            <MdRefresh className={logsLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ACTION & EMPLOYEE FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Action Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1 pl-1">
            <MdFilterList /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Activities', count: logs.length },
            { id: 'INSERT', label: 'Created', count: logs.filter(l => l.action_type === 'INSERT').length },
            { id: 'UPDATE', label: 'Modified', count: logs.filter(l => l.action_type === 'UPDATE').length },
            { id: 'DELETE', label: 'Deleted', count: logs.filter(l => l.action_type === 'DELETE').length },
            { id: 'AUTH', label: 'Logins & Logouts', count: logs.filter(l => l.action_type === 'LOGIN' || l.action_type === 'LOGOUT').length },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => {
                setLogFilterAction(filter.id);
                setLogPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                logFilterAction === filter.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-boxdark text-gray-600 dark:text-gray-300 border-stroke dark:border-strokedark hover:border-emerald-500'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                logFilterAction === filter.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-meta-4 text-gray-500 dark:text-gray-400'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Employee Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">
            <MdPeople className="text-emerald-600" /> Filter by Employee:
          </span>
          <select
            value={logFilterEmployee}
            onChange={e => {
              setLogFilterEmployee(e.target.value);
              setLogPage(1);
            }}
            className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-black dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Employees & System ({logs.length})</option>
            {employeeFilterOptions.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          {logFilterEmployee !== 'ALL' && (
            <button
              onClick={() => { setLogFilterEmployee('ALL'); setLogPage(1); }}
              className="text-[11px] text-emerald-600 hover:underline font-bold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* LOGS TABLE CARD */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs overflow-hidden">
        {logsLoading && logs.length === 0 ? (
          <div className="p-12 text-center">
            <Spinner />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading audit log stream...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center mx-auto text-gray-400 text-xl">
              <MdHistory />
            </div>
            <h4 className="text-sm font-bold text-black dark:text-white">No activity logs found</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {logSearch || logFilterAction !== 'ALL' || logFilterEmployee !== 'ALL'
                ? 'No logs matched your current filter criteria. Try changing filters or clearing search.'
                : 'Audit logs will record here automatically when employees perform sales, inventory, or auth actions.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/20 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4 whitespace-nowrap">Date & Time</th>
                  <th className="py-3.5 px-4">Employee / Performer</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Activity Description</th>
                  <th className="py-3.5 px-4">Summary Details</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark text-xs">
                {paginatedLogs.map((log: any) => {
                  const emp = getEmployeeInfo(log.performed_by);
                  const activity = formatActivityEvent(log);

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-meta-4/10 transition">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-black dark:text-white">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Employee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${emp.avatarBg}`}>
                            {emp.initials}
                          </div>
                          <div>
                            <div className="font-bold text-black dark:text-white leading-tight">
                              {emp.name}
                            </div>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded-md font-semibold mt-0.5 border ${emp.badgeColor}`}>
                              {emp.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${activity.badgeClass}`}>
                          <span>{activity.icon}</span>
                          <span>{activity.actionLabel}</span>
                        </span>
                      </td>

                      {/* Activity Event Title & Category */}
                      <td className="py-3.5 px-4 font-medium text-black dark:text-white max-w-xs">
                        <div className="font-semibold text-xs leading-snug">
                          {activity.title}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {activity.category}
                        </div>
                      </td>

                      {/* Details Summary */}
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-sm">
                        <div className="line-clamp-2 text-xs">
                          {activity.summary || '—'}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLogModal(log);
                            setShowRawJsonModal(false);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-gray-700 dark:text-gray-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <MdVisibility className="text-emerald-600 dark:text-emerald-400 text-sm" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {filteredLogs.length > pageSize && (
          <div className="border-t border-stroke dark:border-strokedark p-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              Showing <strong className="text-black dark:text-white">{(logPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-black dark:text-white">
                {Math.min(logPage * pageSize, filteredLogs.length)}
              </strong>{' '}
              of <strong className="text-black dark:text-white">{filteredLogs.length}</strong> entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                disabled={logPage === 1}
                className="px-3 py-1.5 rounded-lg border border-stroke dark:border-strokedark disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-meta-4 transition cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-black dark:text-white">
                {logPage} / {totalPages}
              </span>
              <button
                onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                disabled={logPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-stroke dark:border-strokedark disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-meta-4 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
