import React from 'react';
import {
  MdClose,
  MdInfoOutline,
  MdCode,
  MdContentCopy,
} from 'react-icons/md';
import toast from 'react-hot-toast';

interface AuditLogDetailsModalProps {
  selectedLogModal: any;
  setSelectedLogModal: (log: any) => void;
  showRawJsonModal: boolean;
  setShowRawJsonModal: React.Dispatch<React.SetStateAction<boolean>>;
  getEmployeeInfo: (id: string) => any;
  formatActivityEvent: (log: any) => any;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({
  selectedLogModal,
  setSelectedLogModal,
  showRawJsonModal,
  setShowRawJsonModal,
  getEmployeeInfo,
  formatActivityEvent,
}) => {
  if (!selectedLogModal) return null;

  const emp = getEmployeeInfo(selectedLogModal.performed_by);
  const activity = formatActivityEvent(selectedLogModal);
  const details = selectedLogModal.details || {};
  const isDetailsObject = typeof details === 'object' && details !== null && !Array.isArray(details);

  return (
    <div className="fixed inset-0 bg-black/60 z-99999 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-boxdark w-full max-w-2xl rounded-3xl border border-stroke dark:border-strokedark p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark pb-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-2xl flex items-center justify-center shrink-0">
              {activity.icon}
            </span>
            <div>
              <h4 className="text-base font-bold text-black dark:text-white">
                {activity.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recorded on {new Date(selectedLogModal.created_at).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedLogModal(null)}
            className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* 1. Employee Performer */}
          <div className="bg-gray-50 dark:bg-meta-4/20 p-3.5 rounded-2xl border border-stroke dark:border-strokedark space-y-1.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">
              Performed By
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${emp.avatarBg}`}>
                {emp.initials}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-black dark:text-white truncate">
                  {emp.name}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
                  {emp.role}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Action Type */}
          <div className="bg-gray-50 dark:bg-meta-4/20 p-3.5 rounded-2xl border border-stroke dark:border-strokedark space-y-1.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">
              Action Event
            </span>
            <div className="pt-0.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${activity.badgeClass}`}>
                <span>{activity.icon}</span>
                <span>{activity.actionLabel}</span>
              </span>
            </div>
          </div>

          {/* 3. Business Department */}
          <div className="bg-gray-50 dark:bg-meta-4/20 p-3.5 rounded-2xl border border-stroke dark:border-strokedark space-y-1.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">
              Business Area
            </span>
            <div className="font-bold text-black dark:text-white pt-1 truncate">
              {activity.category}
            </div>
          </div>
        </div>

        {/* User-Friendly Activity Breakdown */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <MdInfoOutline className="text-emerald-600 text-sm" /> Activity Information & Summary
            </h5>
            <button
              type="button"
              onClick={() => setShowRawJsonModal(prev => !prev)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <MdCode /> {showRawJsonModal ? 'Hide Technical Data' : 'View Technical Data'}
            </button>
          </div>

          {/* Friendly Field Cards */}
          {isDetailsObject && Object.keys(details).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(details).map(([key, val]) => {
                const friendlyKey = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());

                if (Array.isArray(val)) {
                  return (
                    <div
                      key={key}
                      className="sm:col-span-2 bg-gray-50 dark:bg-meta-4/20 p-3 rounded-xl border border-stroke dark:border-strokedark"
                    >
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                        {friendlyKey} ({val.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {val.map((item: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-block bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-black dark:text-white px-2.5 py-1 rounded-lg text-xs font-medium shadow-2xs"
                          >
                            {String(item)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }

                let displayVal = String(val);
                if (typeof val === 'number') {
                  if (key.toLowerCase().includes('quantity') || key.toLowerCase().includes('qty')) {
                    displayVal = `${val.toLocaleString()} Units`;
                  } else if (key.toLowerCase().includes('count')) {
                    displayVal = `${val.toLocaleString()}`;
                  } else if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('total')) {
                    displayVal = `Rs. ${val.toLocaleString()}`;
                  } else {
                    displayVal = val.toLocaleString();
                  }
                } else if (typeof val === 'object' && val !== null) {
                  displayVal = JSON.stringify(val);
                }

                return (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-meta-4/20 p-3 rounded-xl border border-stroke dark:border-strokedark"
                  >
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      {friendlyKey}
                    </span>
                    <span className="text-xs font-semibold text-black dark:text-white mt-0.5 block break-words">
                      {displayVal || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark text-xs text-gray-700 dark:text-gray-300">
              {String(details || 'No additional details recorded for this activity.')}
            </div>
          )}

          {/* Collapsible Technical JSON (Hidden by default for non-technical users) */}
          {showRawJsonModal && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-gray-400">Raw Technical Payload (JSON)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLogModal.details, null, 2));
                    toast.success('Log payload copied to clipboard');
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MdContentCopy className="text-xs" /> Copy JSON
                </button>
              </div>
              <pre className="bg-gray-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono border border-gray-800 leading-relaxed overflow-x-auto max-h-48">
                {JSON.stringify(selectedLogModal.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stroke dark:border-strokedark flex justify-end">
          <button
            onClick={() => setSelectedLogModal(null)}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-meta-4/80 text-black dark:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
