import React from 'react';
import { MdNotes, MdCalendarToday } from 'react-icons/md';

interface CustomerNotesTabProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
}

export const CustomerNotesTab: React.FC<CustomerNotesTabProps> = ({ values, handleChange }) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-6 space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 border-b border-stroke dark:border-strokedark pb-3">
        <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
          <MdNotes size={18} />
        </span>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            5. Follow-up &amp; Relationship Notes
          </h4>
          <p className="text-[11px] text-slate-500">Scheduled reminders and customer-specific preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <MdCalendarToday size={14} className="text-amber-600" />
            <span>Next Follow-up Date</span>
          </label>
          <input
            type="date"
            name="followUpDate"
            onChange={handleChange}
            value={values.followUpDate || ''}
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Internal CRM Notes &amp; Payment Terms
          </label>
          <input
            type="text"
            name="notes"
            onChange={handleChange}
            value={values.notes || ''}
            placeholder="e.g. Standard credit limit 15 days, preferred delivery by truck"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
};
