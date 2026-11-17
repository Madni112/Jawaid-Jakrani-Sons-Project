import { isoDay } from '../../../../utils/dateRange';
export { isoDay };
export { monthNamed } from '../../../../services/hr.service';
import {
  HrMark,
  LeaveApplication,
  LeaveBalanceRow,
  LeaveType
} from '../../../../services/hr.service';

export const TABS = ['Applications', 'Balances'];

export const DAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const CELL: Record<
  HrMark,
  { short: string; label: string; cls: string; pillCls: string; printCls: string }
> = {
  Present: {
    short: 'P',
    label: 'Present',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
    pillCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    printCls: 'bg-emerald-50 text-emerald-800 font-bold'
  },
  Absent: {
    short: 'A',
    label: 'Absent',
    cls: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
    pillCls: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    printCls: 'bg-rose-50 text-rose-800 font-bold'
  },
  'Half Day': {
    short: '½',
    label: 'Half Day',
    cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
    pillCls: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    printCls: 'bg-amber-50 text-amber-800'
  },
  Leave: {
    short: 'L',
    label: 'Leave',
    cls: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700',
    pillCls: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    printCls: 'bg-blue-50 text-blue-800'
  },
  Off: {
    short: 'O',
    label: 'Off Day',
    cls: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    pillCls: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    printCls: 'bg-slate-100 text-slate-700'
  },
  Holiday: {
    short: 'H',
    label: 'Holiday (Friday)',
    cls: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
    pillCls: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    printCls: 'bg-purple-50 text-purple-800 font-bold'
  },
  'On Duty': {
    short: 'D',
    label: 'On Duty',
    cls: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700',
    pillCls: 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    printCls: 'bg-cyan-50 text-cyan-800'
  }
};

export const daysInMonth = (month?: string) => {
  if (!month) return 30;
  const [y, m] = String(month).split('-').map(Number);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
};

export const dowFullOf = (month: string, day: number) => {
  if (!month) return 'Sunday';
  const d = new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00Z`);
  if (isNaN(d.getTime())) return 'Sunday';
  return DAY_FULL[d.getUTCDay()];
};

export const isFriday = (month: string, day: number) => {
  if (!month) return false;
  const d = new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00Z`);
  return d.getUTCDay() === 5;
};

export const isDateFriday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  return !isNaN(d.getTime()) && d.getDay() === 5;
};

export const printIsolatedElement = (
  elementId: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  title: string = 'Document'
) => {
  const elem = document.getElementById(elementId);
  if (!elem) return;

  const existingIframe = document.getElementById('zac-leave-att-print-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'zac-leave-att-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        ${styles}
        <style>
          @page {
            size: A4 ${orientation};
            margin: ${orientation === 'portrait' ? '6mm 8mm' : '4mm 6mm'};
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, button {
            display: none !important;
          }
        </style>
      </head>
      <body class="p-2 bg-white text-black">
        ${elem.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 1000);
  }, 250);
};

export const blankApp = (): Partial<LeaveApplication> => ({
  employeeId: 0,
  leaveTypeId: 1,
  leaveTypeName: 'Casual Leave',
  customType: '',
  from: isoDay(),
  to: isoDay(),
  days: 1,
  halfDay: false,
  reason: ''
});

export const blankType = (): Partial<LeaveType> => ({
  name: '',
  code: '',
  daysPerYear: 10,
  carryForward: 0,
  paid: true,
  requiresProof: false,
  isActive: true,
  description: ''
});

export const STATUS_TONE: Record<string, string> = {
  Applied: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  Approved: 'bg-teal-50 text-[#25a195] dark:bg-teal-950/40 dark:text-teal-300',
  Rejected: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  Cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
};

export const days = (n: number) => String(Math.round(Number(n || 0) * 10) / 10);

export const addDaysIso = (fromStr: string, numDays: number) => {
  if (!fromStr) return '';
  const d = new Date(`${fromStr}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const span = Math.max(0, Math.ceil(numDays) - 1);
  d.setDate(d.getDate() + span);
  return d.toISOString().split('T')[0];
};

export const diffDaysIso = (fromStr: string, toStr: string, isHalf = false) => {
  if (isHalf) return 0.5;
  if (!fromStr || !toStr) return 1;
  const a = new Date(`${fromStr}T00:00:00`);
  const b = new Date(`${toStr}T00:00:00`);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 1;
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 1;
};

export type Balance = {
  employeeId: number;
  code: string;
  name: string;
  designation: string;
  department?: string;
  rows: LeaveBalanceRow[];
};
