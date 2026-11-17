import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Printer, X } from 'lucide-react';
import Spinner from '../../../../ui/Spinner';
import {
  daysInMonth,
  isoDay,
  isFriday,
  monthNamed,
  dowFullOf,
  days,
  CELL,
  printIsolatedElement
} from '../utils/leaveUtils';
import { HrMark, HrEmployee, HrLeaveApplication } from '../../../../services/hr.service';
import { getBrandConfig } from '../../../../utils/brand';

interface EmployeeAttendanceHistoryModalProps {
  attModalEmpId: string | null;
  onClose: () => void;
  employees: HrEmployee[];
  draft?: HrLeaveApplication | null;
  attModalRows: any[];
  attModalMonth: string;
  setAttModalMonth: (month: string) => void;
  attModalLoading: boolean;
}

export const EmployeeAttendanceHistoryModal: React.FC<EmployeeAttendanceHistoryModalProps> = ({
  attModalEmpId,
  onClose,
  employees,
  draft,
  attModalRows,
  attModalMonth,
  setAttModalMonth,
  attModalLoading,
}) => {
  if (!attModalEmpId) return null;

  const emp = employees.find(e => e.id === attModalEmpId) || {
    id: attModalEmpId,
    name: draft?.employeeName || 'Staff Member',
    code: draft?.employeeCode || '',
    designationName: draft?.designation || 'Staff',
    departmentName: 'Operations'
  };

  const attRow = (attModalRows || []).find(r => r.employeeId === attModalEmpId);
  const [y, m] = attModalMonth.split('-').map(Number);
  const total = daysInMonth(attModalMonth);
  const todayStr = isoDay();
  const currentMonthStr = todayStr.slice(0, 7);
  const todayDayNum = Number(todayStr.split('-')[2]);

  // Only show elapsed days up to today for current month, full month for past months, and 0 for future months
  let maxDisplayDay = total;
  const isCurrentMonth = attModalMonth === currentMonthStr;
  const isFutureMonth = attModalMonth > currentMonthStr;

  if (isCurrentMonth) {
    maxDisplayDay = Math.min(total, todayDayNum);
  } else if (isFutureMonth) {
    maxDisplayDay = 0;
  }

  const dayNos = Array.from({ length: maxDisplayDay }, (_, i) => i + 1);

  const daysMap: Record<string, HrMark | ''> = {};
  dayNos.forEach((d) => {
    const key = String(d);
    if (isFriday(attModalMonth, d)) {
      daysMap[key] = 'Holiday';
    } else if (attRow?.days?.[key]) {
      daysMap[key] = attRow.days[key] as HrMark;
    } else {
      daysMap[key] = '';
    }
  });

  // Compute Counts for elapsed days only
  let presentCount = 0;
  let absentCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;
  let holidayCount = 0;

  dayNos.forEach((d) => {
    const mark = daysMap[String(d)];
    if (mark === 'Present') presentCount++;
    else if (mark === 'Absent') absentCount++;
    else if (mark === 'Half Day') halfDayCount++;
    else if (mark === 'Leave') leaveCount++;
    else if (mark === 'Holiday' || isFriday(attModalMonth, d)) holidayCount++;
  });

  const salaryDeductDays = absentCount + halfDayCount * 0.5 + (attRow?.unpaidLeave || 0);
  const overtimeHrs = attRow?.overtimeHours || 0;

  const empInitials = (emp.name || 'E')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handlePrevMonth = () => {
    const prevDate = new Date(y, m - 2, 1);
    const prevStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setAttModalMonth(prevStr);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(y, m, 1);
    const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setAttModalMonth(nextStr);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-5xl rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── MODAL HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/20">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-white font-bold flex items-center justify-center shadow-md text-base shrink-0">
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
                  {emp.designationName || (emp as any).designation || emp.departmentName || 'Staff'}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{emp.departmentName || (emp as any).department || 'Operations'}</span>
                <span>·</span>
                <div className="inline-flex items-center gap-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg px-2 py-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 text-gray-500 hover:text-black dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-black dark:text-white flex items-center gap-1 px-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {isCurrentMonth ? `${monthNamed(attModalMonth)} (Day 1 – ${maxDisplayDay} of ${total})` : isFutureMonth ? `${monthNamed(attModalMonth)} (Future Month)` : `${monthNamed(attModalMonth)} (${total} Days Total)`}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 text-gray-500 hover:text-black dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() =>
                printIsolatedElement(
                  'printable-leave-employee-timesheet',
                  'portrait',
                  `${emp.name} Timesheet - ${monthNamed(attModalMonth)}`
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
          {attModalLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner size="w-7 h-7" color="border-primary" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading attendance log for {monthNamed(attModalMonth)}...</span>
            </div>
          ) : (
            <>
              {/* 1. Sleek KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    Present (P)
                  </span>
                  <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5 block">
                    {presentCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                    Absent (A)
                  </span>
                  <span className="text-xl font-black text-rose-900 dark:text-rose-200 mt-0.5 block">
                    {absentCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                    Half Day (½)
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5 block">
                    {halfDayCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                    Leaves (L)
                  </span>
                  <span className="text-xl font-black text-blue-900 dark:text-blue-200 mt-0.5 block">
                    {leaveCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/70 dark:border-purple-900/50 dark:bg-purple-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                    Holidays / Fri
                  </span>
                  <span className="text-xl font-black text-purple-900 dark:text-purple-200 mt-0.5 block">
                    {holidayCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                    Salary Deduct
                  </span>
                  <span className="text-xl font-black text-red-900 dark:text-red-200 mt-0.5 block">
                    {days(salaryDeductDays)} Days
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                    Overtime
                  </span>
                  <span className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-0.5 block">
                    {overtimeHrs} hrs
                  </span>
                </div>
              </div>

              {/* 2. Interactive Month Attendance Timeline Log Table */}
              <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden bg-white dark:bg-boxdark shadow-xs">
                <div className="p-3.5 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/10 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Day-by-Day Attendance Log ({monthNamed(attModalMonth)})
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
                      {dayNos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                            No attendance recorded yet — this month has not started.
                          </td>
                        </tr>
                      ) : (
                        dayNos.map((d) => {
                          const mark = daysMap[String(d)];
                          const fri = isFriday(attModalMonth, d);

                          return (
                            <tr
                              key={d}
                              className={`transition hover:bg-primary/5 dark:hover:bg-meta-4/40 ${fri ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''
                                }`}
                            >
                              <td className="py-2 px-4 font-mono font-bold text-black dark:text-white">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-meta-4 text-gray-800 dark:text-gray-200 text-xs">
                                  {d}
                                </span>
                              </td>
                              <td className={`py-2 px-4 font-medium ${fri ? 'font-bold text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {dowFullOf(attModalMonth, d)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                {mark ? (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs ${CELL[mark].pillCls}`}>
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
                                ) : mark === 'Present' ? (
                                  <span className="text-gray-500 dark:text-gray-400">Normal Working Shift</span>
                                ) : (
                                  attRow?.note || <span className="text-gray-400 italic">No notes</span>
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
            </>
          )}
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
                  'printable-leave-employee-timesheet',
                  'portrait',
                  `${emp.name} Timesheet - ${monthNamed(attModalMonth)}`
                )
              }
              className="px-4 py-2 rounded-xl bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Sheet</span>
            </button>
          </div>
        </div>

        {/* ── HIDDEN OFFSCREEN PRINT TEMPLATE ── */}
        <div id="printable-leave-employee-timesheet" className="hidden">
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
                <span className="text-black font-bold">{emp.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px]">Staff Code:</span>
                <span className="text-black font-bold font-mono">{emp.code || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px]">Designation:</span>
                <span className="text-black font-bold">{emp.designationName || (emp as any).designation || 'Staff'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px]">Month / Period:</span>
                <span className="text-black font-bold font-mono">{monthNamed(attModalMonth)}</span>
              </div>
            </div>
          </div>

          {/* Printable Summary Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] my-3">
            <div className="p-1.5 border border-black bg-emerald-50 font-bold">Present: {presentCount}</div>
            <div className="p-1.5 border border-black bg-rose-50 font-bold">Absent: {absentCount}</div>
            <div className="p-1.5 border border-black bg-amber-50 font-bold">Half Day: {halfDayCount}</div>
            <div className="p-1.5 border border-black bg-blue-50 font-bold">Leaves: {leaveCount}</div>
            <div className="p-1.5 border border-black bg-purple-50 font-bold">Holidays: {holidayCount}</div>
            <div className="p-1.5 border border-black bg-red-100 font-bold">Deduct: {days(salaryDeductDays)}d</div>
            <div className="p-1.5 border border-black bg-indigo-50 font-bold">Overtime: {overtimeHrs}h</div>
          </div>

          <table className="w-full text-[10px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1 w-12 text-center">Day #</th>
                <th className="border border-black p-1 w-24">Weekday</th>
                <th className="border border-black p-1 w-28 text-center">Status</th>
                <th className="border border-black p-1">Shift Notes / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {dayNos.map((d) => {
                const mark = daysMap[String(d)];
                const fri = isFriday(attModalMonth, d);
                return (
                  <tr key={d}>
                    <td className="border border-black p-1 text-center font-bold">{d}</td>
                    <td className={`border border-black p-1 ${fri ? 'font-bold' : ''}`}>{dowFullOf(attModalMonth, d)}</td>
                    <td className={`border border-black p-1 text-center font-bold ${mark ? CELL[mark].printCls : ''}`}>
                      {mark || (fri ? 'Weekly Holiday' : '-')}
                    </td>
                    <td className="border border-black p-1 text-gray-700">
                      {fri ? 'Weekly Holiday (Off)' : mark === 'Present' ? 'Normal Shift' : (attRow?.note || '-')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 pt-4 flex justify-between text-[10px] font-bold">
            <div className="border-t border-black pt-1 w-40 text-center">Employee Signature</div>
            <div className="border-t border-black pt-1 w-40 text-center">HR / Manager Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};
