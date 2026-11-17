import React from 'react';
import { Calendar, Eye, Printer, X } from 'lucide-react';
import { getBrandConfig } from '../../../../utils/brand';
import {
  CELL,
  monthNamed,
  isoDay,
  dayCount,
  isFriday,
  dowFullOf,
  printIsolatedElement
} from '../utils/attendanceHelpers';
import type {
  EmployeeAttendanceRow,
  EmployeePatch,
  AttendanceTally,
  HrMark
} from '../types/attendanceTypes';

interface EmployeeTimesheetModalProps {
  employee: EmployeeAttendanceRow;
  month: string;
  totalDays: number;
  dayNos: number[];
  patch: EmployeePatch;
  tally: AttendanceTally;
  finalDays: (row: EmployeeAttendanceRow) => Record<string, string>;
  isDayFuture: (day: number) => boolean;
  onClose: () => void;
}

export const EmployeeTimesheetModal: React.FC<EmployeeTimesheetModalProps> = ({
  employee: emp,
  month,
  totalDays: total,
  dayNos,
  patch: p,
  tally: t,
  finalDays,
  isDayFuture,
  onClose
}) => {
  const empInitials = (emp.name || 'E')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const curMonthStr = isoDay().slice(0, 7);
  const todayDayNum = Number(isoDay().split('-')[2]);
  const isCurrentMonth = month === curMonthStr;
  const isFutureMonth = month > curMonthStr;
  const maxDisplayDay = isCurrentMonth ? Math.min(total, todayDayNum) : isFutureMonth ? 0 : total;
  const modalDayNos = Array.from({ length: maxDisplayDay }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-5xl rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── MODAL HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/20">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-white font-bold flex items-center justify-center shadow-md text-base">
              {empInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-black dark:text-white text-lg">
                  {emp.name}
                </h3>
                {emp.code && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {emp.code}
                  </span>
                )}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-meta-4 text-gray-700 dark:text-gray-300">
                  {emp.designation || 'Staff'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <span>{emp.department || 'Operations'}</span>
                <span>·</span>
                <span className="font-semibold text-black dark:text-white flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {isCurrentMonth
                    ? `${monthNamed(month)} (Day 1 – ${maxDisplayDay} of ${total})`
                    : isFutureMonth
                    ? `${monthNamed(month)} (Future Month)`
                    : `${monthNamed(month)} (${total} Days Total)`}
                </span>
              </p>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() =>
                printIsolatedElement(
                  'printable-employee-timesheet',
                  'portrait',
                  `${emp.name} Timesheet - ${monthNamed(month)}`
                )
              }
              className="px-4 py-2 rounded-xl bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Timesheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-200 dark:hover:bg-meta-4 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── MODAL SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Sleek KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Present (P)
              </span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5 block">
                {t.counts.Present || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                Absent (A)
              </span>
              <span className="text-xl font-black text-rose-900 dark:text-rose-200 mt-0.5 block">
                {t.counts.Absent || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Half Day (½)
              </span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5 block">
                {t.counts['Half Day'] || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                Leaves (L)
              </span>
              <span className="text-xl font-black text-blue-900 dark:text-blue-200 mt-0.5 block">
                {t.counts.Leave || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/70 dark:border-purple-900/50 dark:bg-purple-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                Holidays / Fri
              </span>
              <span className="text-xl font-black text-purple-900 dark:text-purple-200 mt-0.5 block">
                {t.counts.Holiday || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                Salary Deduct
              </span>
              <span className="text-xl font-black text-red-900 dark:text-red-200 mt-0.5 block">
                {dayCount(t.unpaid)} Days
              </span>
            </div>

            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/30 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                Overtime
              </span>
              <span className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-0.5 block">
                {p.overtimeHours || 0} hrs
              </span>
            </div>
          </div>

          {/* 2. Interactive Month Attendance Timeline Log Table */}
          <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden bg-white dark:bg-boxdark shadow-xs">
            <div className="p-3.5 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Day-by-Day Attendance Log ({monthNamed(month)})
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Fridays automatically set as Weekly Off
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-100/70 dark:bg-meta-4/30 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold w-20">Day #</th>
                    <th className="py-2.5 px-4 font-bold w-36">Weekday</th>
                    <th className="py-2.5 px-4 font-bold w-40 text-center">Status</th>
                    <th className="py-2.5 px-4 font-bold">Shift Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {modalDayNos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                        No attendance recorded yet — this month has not started.
                      </td>
                    </tr>
                  ) : (
                    modalDayNos.map((d) => {
                      const dMap = finalDays(emp);
                      const mark = dMap[String(d)] ?? '';
                      const fri = isFriday(month, d);
                      const approvedMeta = emp.approvedLeaveDays?.[String(d)];

                      return (
                        <tr
                          key={d}
                          className={`transition hover:bg-primary/5 dark:hover:bg-meta-4/40 ${
                            fri ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''
                          }`}
                        >
                          <td className="py-2 px-4 font-mono font-bold text-black dark:text-white">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-meta-4 text-gray-800 dark:text-gray-200 text-xs">
                              {d}
                            </span>
                          </td>
                          <td
                            className={`py-2 px-4 font-medium ${
                              fri ? 'font-bold text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {dowFullOf(month, d)}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {mark ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs ${
                                  CELL[mark as HrMark]?.cls || ''
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                <span>{mark}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-850">
                                Unmarked
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-gray-600 dark:text-gray-300">
                            {fri ? (
                              <span className="text-purple-600 dark:text-purple-400 font-medium">
                                Weekly Holiday
                              </span>
                            ) : approvedMeta ? (
                              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                                Approved Leave ({approvedMeta.leaveType} — #{approvedMeta.number})
                              </span>
                            ) : mark === 'Present' ? (
                              <span className="text-gray-500 dark:text-gray-400">Normal Working Shift</span>
                            ) : (
                              p.note || <span className="text-gray-400 italic">No notes</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="p-4 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Ready to print official physical copy for employee records or payroll audit.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white text-xs font-bold hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() =>
                printIsolatedElement(
                  'printable-employee-timesheet',
                  'portrait',
                  `${emp.name} Timesheet - ${monthNamed(month)}`
                )
              }
              className="px-4 py-2 rounded-xl bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Sheet</span>
            </button>
          </div>
        </div>

        {/* ── HIDDEN OFFSCREEN PRINT TEMPLATE (Extracted cleanly when Print is clicked) ── */}
        <div id="printable-employee-timesheet" className="hidden">
          <div className="text-center pb-2 border-b-2 border-black mb-2">
            <h1 className="text-xl font-black uppercase tracking-wider text-black">
              {getBrandConfig().fullName}
            </h1>
            <h2 className="text-xs font-bold uppercase text-gray-700 tracking-wide mt-0.5">
              INDIVIDUAL EMPLOYEE MONTHLY ATTENDANCE SHEET
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-semibold mt-2 text-left bg-gray-50 p-2 border border-gray-300">
              <div>
                <span className="text-gray-500 block text-[9px]">Employee Name:</span>
                <span className="font-bold">{emp.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px]">Employee ID / Code:</span>
                <span className="font-bold font-mono">{emp.code || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px]">Department &amp; Role:</span>
                <span className="font-bold">
                  {emp.department || 'Operations'} · {emp.designation || 'Staff'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px]">Month / Period:</span>
                <span className="font-bold">{monthNamed(month)} ({total} Days)</span>
              </div>
            </div>
          </div>

          {/* Summary Metrics Chips */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px]">
            <div className="p-1 border border-emerald-300 bg-emerald-50 rounded">
              <span className="block text-[8.5px] text-emerald-800 font-bold">Present (P)</span>
              <span className="text-sm font-black text-emerald-900">{t.counts.Present || 0}</span>
            </div>
            <div className="p-1 border border-rose-300 bg-rose-50 rounded">
              <span className="block text-[8.5px] text-rose-800 font-bold">Absent (A)</span>
              <span className="text-sm font-black text-rose-900">{t.counts.Absent || 0}</span>
            </div>
            <div className="p-1 border border-amber-300 bg-amber-50 rounded">
              <span className="block text-[8.5px] text-amber-800 font-bold">Half Day (½)</span>
              <span className="text-sm font-black text-amber-900">{t.counts['Half Day'] || 0}</span>
            </div>
            <div className="p-1 border border-blue-300 bg-blue-50 rounded">
              <span className="block text-[8.5px] text-blue-800 font-bold">Leaves (L)</span>
              <span className="text-sm font-black text-blue-900">{t.counts.Leave || 0}</span>
            </div>
            <div className="p-1 border border-purple-300 bg-purple-50 rounded">
              <span className="block text-[8.5px] text-purple-800 font-bold">Holidays / Fri</span>
              <span className="text-sm font-black text-purple-900">{t.counts.Holiday || 0}</span>
            </div>
            <div className="p-1 border border-red-300 bg-red-50 rounded">
              <span className="block text-[8.5px] text-red-800 font-bold">Deduct Days</span>
              <span className="text-sm font-black text-red-900">{dayCount(t.unpaid)}</span>
            </div>
            <div className="p-1 border border-gray-300 bg-gray-50 rounded">
              <span className="block text-[8.5px] text-gray-800 font-bold">OT Hours</span>
              <span className="text-sm font-black text-gray-900">{p.overtimeHours || 0}</span>
            </div>
          </div>

          {/* Day by Day Log Table */}
          <table className="w-full text-[10px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-black text-center">
                <th className="border border-black py-0.5 px-1.5 w-12 text-left">Day #</th>
                <th className="border border-black py-0.5 px-1.5 w-24 text-left">Day of Week</th>
                <th className="border border-black py-0.5 px-1.5 w-24">Status</th>
                <th className="border border-black py-0.5 px-1.5 text-left">Remarks / Details</th>
              </tr>
            </thead>
            <tbody>
              {dayNos.map((d) => {
                const dMap = finalDays(emp);
                const mark = dMap[String(d)] ?? '';
                const fri = isFriday(month, d);
                const isFuture = isDayFuture(d);
                const approvedMeta = emp.approvedLeaveDays?.[String(d)];

                return (
                  <tr key={d} className={`border-b border-black/40 ${fri ? 'bg-purple-50/40' : ''}`}>
                    <td className="border border-black py-0.5 px-1.5 font-mono font-bold">{d}</td>
                    <td className={`border border-black py-0.5 px-1.5 ${fri ? 'font-bold text-purple-900' : ''}`}>
                      {dowFullOf(month, d)}
                    </td>
                    <td className="border border-black py-0.5 px-1.5 text-center">
                      {mark ? (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${CELL[mark as HrMark]?.printCls || ''}`}>
                          {mark}
                        </span>
                      ) : isFuture ? (
                        <span className="text-gray-400 text-[9px]">Future Date</span>
                      ) : (
                        <span className="text-gray-400 text-[9px]">Unmarked</span>
                      )}
                    </td>
                    <td className="border border-black py-0.5 px-1.5 text-gray-700">
                      {fri
                        ? 'Weekly Holiday'
                        : approvedMeta
                        ? `Approved Leave (${approvedMeta.leaveType} #${approvedMeta.number})`
                        : mark === 'Present'
                        ? 'Normal Shift'
                        : p.note || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Signature Footer */}
          <div className="flex justify-between items-end mt-14 pt-4 text-[11px] font-bold text-gray-800">
            <div className="text-center">
              <div className="h-10 flex items-end justify-center mb-1 text-[9px] text-gray-400 font-normal italic">
                (Signature)
              </div>
              <div className="w-44 border-t-2 border-black pt-1.5 font-bold text-black">Employee Signature</div>
              <div className="text-[9.5px] text-gray-600 font-medium mt-0.5">{emp.name}</div>
            </div>
            <div className="text-center">
              <div className="h-10 flex items-end justify-center mb-1 text-[9px] text-gray-400 font-normal italic">
                (Sign / Stamp)
              </div>
              <div className="w-44 border-t-2 border-black pt-1.5 font-bold text-black">HR Department</div>
              <div className="text-[9.5px] text-gray-600 font-medium mt-0.5">Verified &amp; Recorded</div>
            </div>
            <div className="text-center">
              <div className="h-10 flex items-end justify-center mb-1 text-[9px] text-gray-400 font-normal italic">
                (Sign / Stamp)
              </div>
              <div className="w-44 border-t-2 border-black pt-1.5 font-bold text-black">Managing Director</div>
              <div className="text-[9.5px] text-gray-600 font-medium mt-0.5">{getBrandConfig().name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
