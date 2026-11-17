import { isoDay } from '../../../../utils/dateRange';
import { PayrollLine } from '../../../../services/hr.service';

export const money = (n: number) => Math.round(Number(n || 0)).toLocaleString();

export const thisMonth = () => isoDay().slice(0, 7);

export const dayFig = (n: number) => String(Math.round(Number(n || 0) * 10) / 10);

export const addUp = (lines: PayrollLine[], f: (l: PayrollLine) => number) =>
  lines.reduce((s, l) => s + f(l), 0);

export const SHEET_TONE: Record<string, string> = {
  Draft: 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-strokedark',
  Approved: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40',
  Paid: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
};

export const itemsOf = (
  lines: PayrollLine[],
  kind: 'earnings' | 'extraEarnings' | 'deductions' | 'extraDeductions'
) => {
  const map: Record<string, number> = {};
  lines.forEach((l) =>
    l[kind].forEach((i) => {
      map[i.name] = (map[i.name] || 0) + i.amount;
    })
  );
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

// Clean Isolated Printing Utility with Self-Contained CSS
export const printIsolatedElement = (
  elementId: string,
  orientation: 'landscape' | 'portrait' = 'landscape',
  title = 'Salary Sheet'
) => {
  const elem = document.getElementById(elementId);
  if (!elem) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4 ${orientation};
            margin: 10mm 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 4px;
            width: 100%;
          }
          .print-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .print-header h1 {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .print-header h2 {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            color: #222;
            margin-bottom: 8px;
          }
          .meta-grid {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 600;
            color: #333;
            padding: 0 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px 8px;
            vertical-align: middle;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold;
            text-align: center;
          }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: monospace; font-weight: bold; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .bg-gray { background-color: #f3f4f6 !important; }
          .footer-signatures {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 55px;
            padding-top: 10px;
          }
          .signature-box {
            text-align: center;
            width: 220px;
          }
          .sign-line {
            border-top: 1.5px solid #000;
            padding-top: 4px;
            font-size: 11.5px;
            font-weight: bold;
            color: #000;
          }
          .sign-title {
            font-size: 10px;
            color: #444;
            font-weight: 500;
            margin-top: 1px;
          }
          .sign-stamp {
            height: 45px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            font-size: 10px;
            font-style: italic;
            color: #888;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
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
