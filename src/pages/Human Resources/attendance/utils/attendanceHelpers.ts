import { HrMark, monthNamed } from '../../../../services/hr.service';
import { isoDay } from '../../../../utils/dateRange';

export { monthNamed, isoDay };

export const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The order a cell walks through when clicked
export const CYCLE: (HrMark | '')[] = [
  '',
  'Present',
  'Absent',
  'Half Day',
  'Leave',
  'Off',
  'Holiday',
  'On Duty'
];

export const CELL: Record<HrMark, { short: string; label: string; cls: string; printCls: string }> = {
  Present: {
    short: 'P',
    label: 'Present',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
    printCls: 'bg-emerald-50 text-emerald-800 font-bold'
  },
  Absent: {
    short: 'A',
    label: 'Absent',
    cls: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
    printCls: 'bg-rose-50 text-rose-800 font-bold'
  },
  'Half Day': {
    short: '½',
    label: 'Half Day',
    cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
    printCls: 'bg-amber-50 text-amber-800'
  },
  Leave: {
    short: 'L',
    label: 'Leave',
    cls: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700',
    printCls: 'bg-blue-50 text-blue-800'
  },
  Off: {
    short: 'O',
    label: 'Off Day',
    cls: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    printCls: 'bg-slate-100 text-slate-700'
  },
  Holiday: {
    short: 'H',
    label: 'Holiday (Friday)',
    cls: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
    printCls: 'bg-purple-50 text-purple-800 font-bold'
  },
  'On Duty': {
    short: 'D',
    label: 'On Duty',
    cls: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700',
    printCls: 'bg-cyan-50 text-cyan-800'
  }
};

export const daysIn = (month?: string): number => {
  if (!month) return 30;
  const [y, m] = String(month).split('-').map(Number);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
};

export const dowOf = (month: string, day: number): string => {
  if (!month) return 'S';
  const d = new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00Z`);
  if (isNaN(d.getTime())) return 'S';
  return DAY_LETTER[d.getUTCDay()];
};

export const dowFullOf = (month: string, day: number): string => {
  if (!month) return 'Sunday';
  const d = new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00Z`);
  if (isNaN(d.getTime())) return 'Sunday';
  return DAY_FULL[d.getUTCDay()];
};

export const isFriday = (month: string, day: number): boolean => {
  if (!month) return false;
  const d = new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00Z`);
  return d.getUTCDay() === 5; // Friday
};

export const dayCount = (n: number): string =>
  String(Math.round(Number(n || 0) * 10) / 10);

export const printIsolatedElement = (
  elementId: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  title: string = 'Document'
) => {
  const elem = document.getElementById(elementId);
  if (!elem) return;

  const existingIframe = document.getElementById('jjs-print-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'jjs-print-frame';
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
