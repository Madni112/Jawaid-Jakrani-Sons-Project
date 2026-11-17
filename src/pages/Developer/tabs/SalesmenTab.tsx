import React from 'react';
import { MdLink, MdRefresh, MdGroup, MdCheck, MdVpnKey } from 'react-icons/md';
import Spinner from '../../../ui/Spinner';

interface SalesmenTabProps {
  fetchSalesmenData: () => void;
  salesmenLoading: boolean;
  salesmenList: any[];
  handleOpenAssignLoginModal: (sm: any) => void;
  handleOpenLinkModal: (sm: any) => void;
}

export const SalesmenTab: React.FC<SalesmenTabProps> = ({
  fetchSalesmenData,
  salesmenLoading,
  salesmenList,
  handleOpenAssignLoginModal,
  handleOpenLinkModal
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-default overflow-hidden transition-colors duration-200">
      <div className="p-6 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <MdLink className="text-emerald-600 text-xl" />
            <span>Salesmen Multi-Account Linking & Merging Manager</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Merge 2 or more salesmen so they can create invoices on behalf of each other and view each other's sales in their dashboards.
          </p>
        </div>
        <button
          onClick={fetchSalesmenData}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-meta-4 dark:hover:bg-meta-4/80 text-black dark:text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
        >
          <MdRefresh /> Refresh
        </button>
      </div>

      {salesmenLoading ? (
        <div className="p-12 flex justify-center items-center">
          <Spinner color="border-emerald-600" size="w-8 h-8" />
        </div>
      ) : salesmenList.length === 0 ? (
        <div className="p-12 text-center text-xs text-gray-400">
          No salesmen registered in the database yet.
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-meta-4/30 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider border-b border-stroke dark:border-strokedark">
                <th className="p-4">Salesman Name</th>
                <th className="p-4">Invoice Prefix</th>
                <th className="p-4">Phone / Area</th>
                <th className="p-4">Linked Partner Salesmen</th>
                <th className="p-4">Login Account</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {salesmenList.map((sm: any) => {
                const partners: string[] = Array.isArray(sm.linked_salesmen) ? sm.linked_salesmen : [];
                const hasPartners = partners.length > 0;
                const hasLogin = !!(sm.user_id || sm.email);

                return (
                  <tr key={sm.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition">
                    <td className="p-4 font-bold text-black dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs">
                          {sm.name ? sm.name.charAt(0).toUpperCase() : 'S'}
                        </span>
                        <span>{sm.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {sm.invoice_name || (sm.invoice_names && sm.invoice_names[0]) ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                          {sm.invoice_name || sm.invoice_names[0]}-
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      <div>{sm.phone || '—'}</div>
                      <div className="text-[10px] text-gray-400">{sm.area || 'General'}</div>
                    </td>
                    <td className="p-4">
                      {hasPartners ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {partners.map((pName: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1"
                            >
                              <MdGroup className="text-xs" />
                              {pName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">
                          Single / Unlinked
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {hasLogin ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md w-fit">
                            <MdCheck className="text-xs" /> Active Login
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono truncate max-w-[180px]">{sm.email || 'Linked to Auth'}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                          No Login Account
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {!hasLogin && (
                          <button
                            onClick={() => handleOpenAssignLoginModal(sm)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                            title="Create login credentials for this salesman"
                          >
                            <MdVpnKey className="text-sm" />
                            <span>Assign Login</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenLinkModal(sm)}
                          className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                        >
                          <MdLink className="text-sm" />
                          <span>{hasPartners ? `Edit Links (${partners.length})` : 'Link Partners'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
