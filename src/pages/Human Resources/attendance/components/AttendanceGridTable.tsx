import React from 'react';
import { Eye } from 'lucide-react';
import Spinner from '../../../../ui/Spinner';
import { CELL, dayCount, monthNamed, dowOf, isFriday } from '../utils/attendanceHelpers';
import type {
  EmployeeAttendanceRow,
  EmployeePatch,
  AttendanceTally,
  HrMark,
  ApprovedLeaveMeta
} from '../types/attendanceTypes';

interface AttendanceGridTableProps {
  loading: boolean;
  month: string;
  total: number;
  dayNos: number[];
  visible: EmployeeAttendanceRow[];
  paginatedRows: EmployeeAttendanceRow[];
  editable: boolean;
  isDayFuture: (day: number) => boolean;
  patchOf: (row: EmployeeAttendanceRow) => EmployeePatch;
  tallyOf: (row: EmployeeAttendanceRow) => AttendanceTally;
  onCellClick: (row: EmployeeAttendanceRow, day: number, approvedMeta?: ApprovedLeaveMeta, isLocked?: boolean) => void;
  onCellContextMenu: (
    e: React.MouseEvent,
    row: EmployeeAttendanceRow,
    day: number,
    approvedMeta?: ApprovedLeaveMeta,
    isFuture?: boolean,
    fri?: boolean
  ) => void;
  onOvertimeChange: (row: EmployeeAttendanceRow, hours: number) => void;
  onLateChange: (row: EmployeeAttendanceRow, days: number) => void;
  onNoteChange: (row: EmployeeAttendanceRow, note: string) => void;
  onViewTimesheet: (row: EmployeeAttendanceRow) => void;
  shown: {
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    holiday: number;
    unpaid: number;
    overtime: number;
    late: number;
  };
}

export const AttendanceGridTable: React.FC<AttendanceGridTableProps> = ({
  loading,
  month,
  total,
  dayNos,
  visible,
  paginatedRows,
  editable,
  isDayFuture,
  patchOf,
  tallyOf,
  onCellClick,
  onCellContextMenu,
  onOvertimeChange,
  onLateChange,
  onNoteChange,
  onViewTimesheet,
  shown
}) => {
  return (
    <div className="rounded-lg border border-stroke bg-white shadow-xs dark:border-strokedark dark:bg-boxdark overflow-hidden">
      <div className="overflow-x-auto max-h-[68vh] app-scroll">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-20 bg-gray-2 dark:bg-meta-4 text-black dark:text-white font-bold select-none border-b border-stroke dark:border-strokedark">
            <tr>
              {/* Fixed Sticky Left Employee Column */}
              <th className="sticky left-0 z-30 bg-gray-2 dark:bg-meta-4 min-w-[200px] py-3 px-3 text-left border-r border-stroke dark:border-strokedark shadow-xs">
                Employee
              </th>

              {/* Days 1..N */}
              {dayNos.map((d) => {
                const fri = isFriday(month, d);
                const isFuture = isDayFuture(d);
                return (
                  <th
                    key={d}
                    className={`p-0 min-w-[28px] text-center border-r border-stroke/60 dark:border-strokedark/60 ${
                      fri
                        ? 'bg-purple-100/60 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
                        : isFuture
                        ? 'opacity-60 bg-gray-100/40 dark:bg-meta-4/20'
                        : ''
                    }`}
                  >
                    <div className="py-1">
                      <span className="block text-xs font-bold">{d}</span>
                      <span
                        className={`block text-[9px] font-semibold uppercase ${
                          fri
                            ? 'text-purple-700 dark:text-purple-400 font-black'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {dowOf(month, d)}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Summary Columns */}
              <th className="min-w-[42px] py-2 px-1 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-r border-stroke dark:border-strokedark">
                P
              </th>
              <th className="min-w-[42px] py-2 px-1 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-r border-stroke dark:border-strokedark">
                A
              </th>
              <th className="min-w-[42px] py-2 px-1 text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-r border-stroke dark:border-strokedark">
                ½
              </th>
              <th className="min-w-[42px] py-2 px-1 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-r border-stroke dark:border-strokedark">
                L
              </th>
              <th className="min-w-[42px] py-2 px-1 text-center bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-r border-stroke dark:border-strokedark">
                H
              </th>
              <th className="min-w-[55px] py-2 px-1 text-center bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-r border-stroke dark:border-strokedark font-black">
                Deduct
              </th>
              <th className="min-w-[55px] py-2 px-1 text-center border-r border-stroke dark:border-strokedark">
                OT Hrs
              </th>
              <th className="min-w-[50px] py-2 px-1 text-center border-r border-stroke dark:border-strokedark">
                Late
              </th>
              <th className="min-w-[120px] py-2 px-2 text-left border-r border-stroke dark:border-strokedark">
                Note
              </th>
              <th className="min-w-[70px] py-2 px-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={total + 11} className="py-16 text-center">
                  <Spinner />
                  <p className="text-xs text-gray-500 mt-2">Loading attendance records...</p>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={total + 11} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No employees found matching the search criteria.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const p = patchOf(r);
                const t = tallyOf(r);

                return (
                  <tr
                    key={r.employeeId}
                    className="border-b border-stroke/70 dark:border-strokedark/70 hover:bg-slate-50/70 dark:hover:bg-meta-4/20 transition-colors"
                  >
                    {/* Sticky Left Employee Profile */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-boxdark py-2.5 px-3 text-left border-r border-stroke dark:border-strokedark shadow-2xs">
                      <span className="font-bold text-black dark:text-white block text-xs">{r.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                        {r.code && (
                          <span className="font-mono font-semibold text-purple-700 dark:text-purple-300">
                            {r.code}
                          </span>
                        )}
                        <span>·</span>
                        <span>{r.designation || r.department || 'Staff'}</span>
                      </div>
                    </td>

                    {/* Day Marks 1..N */}
                    {dayNos.map((d) => {
                      const fri = isFriday(month, d);
                      const approvedMeta = r.approvedLeaveDays?.[String(d)];
                      const mark = fri
                        ? 'Holiday'
                        : approvedMeta
                        ? approvedMeta.halfDay
                          ? 'Half Day'
                          : 'Leave'
                        : ((p.days[String(d)] ?? r.days[String(d)] ?? '') as HrMark | '');
                      const isFuture = isDayFuture(d);
                      const isLocked = (!editable && !approvedMeta) || isFuture || fri;

                      return (
                        <td
                          key={d}
                          className={`p-0.5 text-center border-r border-stroke/40 dark:border-strokedark/40 ${
                            fri
                              ? 'bg-purple-50/40 dark:bg-purple-950/10'
                              : isFuture
                              ? 'bg-gray-50/40 dark:bg-meta-4/10'
                              : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onCellClick(r, d, approvedMeta, isLocked)}
                            onContextMenu={(e) => onCellContextMenu(e, r, d, approvedMeta, isFuture, fri)}
                            disabled={isLocked && !approvedMeta}
                            title={
                              fri
                                ? `Friday (${d} ${monthNamed(month)}) — Fixed Company Holiday (H)`
                                : isFuture
                                ? `Future date (${d} ${monthNamed(month)}) — Attendance cannot be marked in advance`
                                : approvedMeta
                                ? `${r.name} (${d} ${monthNamed(month)}): Approved ${approvedMeta.leaveType} (${
                                    approvedMeta.halfDay ? 'Half Day' : 'Full Day'
                                  })\nLeave Application #${approvedMeta.number} (Locked — click to view options)`
                                : `${r.name} (${d} ${monthNamed(month)}): ${mark || 'Unmarked'}\nClick to cycle, right-click to pick`
                            }
                            className={`w-[24px] h-[24px] mx-auto rounded flex items-center justify-center text-[10px] font-black transition-all ${
                              fri
                                ? `${CELL.Holiday.cls} shadow-2xs cursor-not-allowed`
                                : mark
                                ? `${CELL[mark]?.cls || ''} shadow-2xs cursor-pointer`
                                : isFuture
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'border border-transparent hover:border-stroke dark:hover:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-300 cursor-pointer'
                            }`}
                          >
                            {fri ? 'H' : mark ? CELL[mark]?.short || '' : isFuture ? '-' : '·'}
                          </button>
                        </td>
                      );
                    })}

                    {/* Summary Counts */}
                    <td className="text-center font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 border-r border-stroke/50 dark:border-strokedark/50">
                      {t.counts.Present || 0}
                    </td>
                    <td
                      className={`text-center font-bold font-mono border-r border-stroke/50 dark:border-strokedark/50 ${
                        t.counts.Absent
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'text-gray-400'
                      }`}
                    >
                      {t.counts.Absent || 0}
                    </td>
                    <td
                      className={`text-center font-bold font-mono border-r border-stroke/50 dark:border-strokedark/50 ${
                        t.counts['Half Day']
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                          : 'text-gray-400'
                      }`}
                    >
                      {t.counts['Half Day'] || 0}
                    </td>
                    <td
                      className={`text-center font-bold font-mono border-r border-stroke/50 dark:border-strokedark/50 ${
                        t.counts.Leave ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                      }`}
                    >
                      {t.counts.Leave || 0}
                    </td>
                    <td className="text-center font-bold font-mono text-purple-700 dark:text-purple-400 border-r border-stroke/50 dark:border-strokedark/50">
                      {t.counts.Holiday || 0}
                    </td>

                    {/* Deduct Days */}
                    <td
                      className={`text-center font-black font-mono border-r border-stroke/50 dark:border-strokedark/50 ${
                        t.unpaid > 0
                          ? 'text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                          : 'text-gray-400'
                      }`}
                    >
                      {dayCount(t.unpaid)}
                    </td>

                    {/* OT Hours Input */}
                    <td className="p-0 border-r border-stroke/50 dark:border-strokedark/50">
                      <input
                        type="number"
                        min={0}
                        value={p.overtimeHours ? String(p.overtimeHours) : ''}
                        placeholder="0"
                        disabled={!editable}
                        onChange={(e) => onOvertimeChange(r, Math.max(0, Number(e.target.value)))}
                        className="w-full h-8 px-1 text-center border-0 bg-transparent font-mono text-black dark:text-white focus:bg-blue-50 dark:focus:bg-meta-4 outline-none"
                      />
                    </td>

                    {/* Late Days Input */}
                    <td className="p-0 border-r border-stroke/50 dark:border-strokedark/50">
                      <input
                        type="number"
                        min={0}
                        value={p.lateDays ? String(p.lateDays) : ''}
                        placeholder="0"
                        disabled={!editable}
                        onChange={(e) => onLateChange(r, Math.max(0, Number(e.target.value)))}
                        className="w-full h-8 px-1 text-center border-0 bg-transparent font-mono text-black dark:text-white focus:bg-blue-50 dark:focus:bg-meta-4 outline-none"
                      />
                    </td>

                    {/* Remarks / Note Input */}
                    <td className="p-0 border-r border-stroke/50 dark:border-strokedark/50">
                      <input
                        type="text"
                        value={p.note}
                        placeholder="Add remark..."
                        disabled={!editable}
                        onChange={(e) => onNoteChange(r, e.target.value)}
                        className="w-full h-8 px-2 border-0 bg-transparent text-black dark:text-white focus:bg-blue-50 dark:focus:bg-meta-4 outline-none text-xs"
                      />
                    </td>

                    {/* Action Column: View Employee Timesheet Modal */}
                    <td className="py-1 px-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onViewTimesheet(r)}
                        className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer flex items-center justify-center mx-auto"
                        title="View & Print Individual Monthly Timesheet"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ── FOOTER SUMMARY ROW ── */}
          {visible.length > 0 && !loading && (
            <tfoot className="sticky bottom-0 z-20 bg-gray-100 dark:bg-meta-4 text-black dark:text-white font-black border-t-2 border-stroke dark:border-strokedark text-xs">
              <tr>
                <td className="sticky left-0 z-30 bg-gray-100 dark:bg-meta-4 py-2.5 px-3 border-r border-stroke dark:border-strokedark">
                  Total ({visible.length} Staff)
                </td>
                <td colSpan={total} className="py-2.5 px-2 text-center text-gray-400 font-normal">
                  {monthNamed(month)} — {total} Days Total
                </td>
                <td className="text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-stroke dark:border-strokedark">
                  {shown.present}
                </td>
                <td className="text-center font-mono font-bold text-rose-700 dark:text-rose-400 border-r border-stroke dark:border-strokedark">
                  {shown.absent}
                </td>
                <td className="text-center font-mono font-bold text-amber-700 dark:text-amber-400 border-r border-stroke dark:border-strokedark">
                  {shown.halfDay}
                </td>
                <td className="text-center font-mono font-bold text-blue-700 dark:text-blue-400 border-r border-stroke dark:border-strokedark">
                  {shown.leave}
                </td>
                <td className="text-center font-mono font-bold text-purple-700 dark:text-purple-400 border-r border-stroke dark:border-strokedark">
                  {shown.holiday}
                </td>
                <td className="text-center font-mono font-black text-red-700 dark:text-red-400 border-r border-stroke dark:border-strokedark">
                  {shown.unpaid}
                </td>
                <td className="text-center font-mono font-bold border-r border-stroke dark:border-strokedark">
                  {shown.overtime}
                </td>
                <td className="text-center font-mono font-bold border-r border-stroke dark:border-strokedark">
                  {shown.late}
                </td>
                <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 font-semibold text-[11px] text-center">
                  ✓ All Saved
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
