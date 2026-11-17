import { isoDay } from '../../../../utils/dateRange';
import { EmployeeLoan } from '../../../../services/hr.service';

export const money = (n: number) => Math.round(Number(n || 0)).toLocaleString();

export const calcEndMonth = (startMonthStr?: string, monthsCount: number = 1): string => {
  if (!startMonthStr) return '';
  const count = Math.max(1, Number(monthsCount) || 1);
  const [yearStr, monthStr] = startMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return startMonthStr;
  const d = new Date(year, month - 1 + (count - 1), 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const blank = (months: string[]): Partial<EmployeeLoan> => ({
  employeeId: 0,
  kind: 'Advance',
  purpose: '',
  sanctionedOn: isoDay(),
  amount: 0,
  installments: 1,
  installmentAmount: 0,
  startMonth: months[0] ?? isoDay().slice(0, 7),
  paidOutOf: 'Cash',
  accountId: null,
  cashAmount: 0,
  bankId: null,
  bankAmount: 0,
  chequeNo: '',
  remarks: '',
  status: 'Active'
});

export const STATUS_TONE: Record<string, string> = {
  Active: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  Closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  Cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
};
