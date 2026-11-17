import React from 'react';
import { getBrandConfig } from '../../../../utils/brand';
import {
  CELL,
  monthNamed,
  dayCount,
  isFriday,
  dowOf
} from '../utils/attendanceHelpers';
import type {
  EmployeeAttendanceRow,
  EmployeePatch,
  AttendanceTally,
  HrMark
} from '../types/attendanceTypes';

interface PrintableAttendanceRegisterProps {
  month: string;
  total: number;
  dayNos: number[];
  visible: EmployeeAttendanceRow[];
  patchOf: (row: EmployeeAttendanceRow) => EmployeePatch;
  tallyOf: (row: EmployeeAttendanceRow) => AttendanceTally;
  finalDays: (row: EmployeeAttendanceRow) => Record<string, string>;
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

export const PrintableAttendanceRegister: React.FC<PrintableAttendanceRegisterProps> = ({
  month,
  total,
  dayNos,
  visible,
  patchOf,
  tallyOf,
  finalDays,
  shown
}) => {
  return (
    <div id="printable-attendance-register" className="hidden">
      <div className="text-center pb-3 border-b-2 border-black mb-3">
        <h1 className="text-xl font-black uppercase tracking-wider text-black">
          {getBrandConfig().fullName}
        </h1>
        <h2 className="text-xs font-bold uppercase text-gray-700 tracking-wide mt-0.5">
          MONTHLY ATTENDANCE REGISTER &amp; DEDUCT-DAYS SHEET
        </h2>
        <div className="flex justify-between items-center text-[11px] font-bold mt-2 text-gray-600">
          <span>Period: {monthNamed(month)}</span>
          <span>Total Calendar Days: {total} Days</span>
          <span>Total Staff: {visible.length}</span>
          <span>Weekly Off: Friday</span>
        </div>
      </div>

      <table className="w-full text-[9px] border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100 font-bold border-b border-black text-center">
            <th className="border border-black py-0.5 px-1 text-left w-28">Employee Name</th>
            {dayNos.map((d) => (
              <th
                key={d}
                className={`border border-black p-0 w-4.5 ${
                  isFriday(month, d) ? 'bg-purple-100 font-black text-purple-900' : ''
                }`}
              >
                <div>{d}</div>
                <div className="text-[7.5px] font-normal">{dowOf(month, d)}</div>
              </th>
            ))}
            <th className="border border-black px-0.5 w-5 bg-emerald-50">P</th>
            <th className="border border-black px-0.5 w-5 bg-rose-50">A</th>
            <th className="border border-black px-0.5 w-5 bg-amber-50">½</th>
            <th className="border border-black px-0.5 w-5 bg-blue-50">L</th>
            <th className="border border-black px-0.5 w-5 bg-purple-50">H</th>
            <th className="border border-black px-0.5 w-7 bg-red-50 font-black">Deduct</th>
            <th className="border border-black px-0.5 w-6">OT</th>
            <th className="border border-black px-0.5 w-16 text-left">Signature</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const p = patchOf(r);
            const t = tallyOf(r);
            const rDays = finalDays(r);
            return (
              <tr key={r.employeeId} className="border-b border-black">
                <td className="border border-black py-0.5 px-1 text-left font-semibold">
                  <div>{r.name}</div>
                  <div className="text-[7.5px] text-gray-600 font-normal">{r.designation || r.code}</div>
                </td>
                {dayNos.map((d) => {
                  const mark = (rDays[String(d)] ?? '') as HrMark | '';
                  return (
                    <td
                      key={d}
                      className={`border border-black p-0 text-center font-bold ${
                        isFriday(month, d) ? 'bg-purple-50 text-purple-900' : ''
                      }`}
                    >
                      {mark ? CELL[mark]?.short || '' : ''}
                    </td>
                  );
                })}
                <td className="border border-black text-center font-bold">{t.counts.Present || 0}</td>
                <td className="border border-black text-center font-bold text-rose-700">
                  {t.counts.Absent || 0}
                </td>
                <td className="border border-black text-center font-bold">{t.counts['Half Day'] || 0}</td>
                <td className="border border-black text-center font-bold">{t.counts.Leave || 0}</td>
                <td className="border border-black text-center font-bold text-purple-800">{t.counts.Holiday || 0}</td>
                <td className="border border-black text-center font-black text-red-700">{dayCount(t.unpaid)}</td>
                <td className="border border-black text-center">{p.overtimeHours || 0}</td>
                <td className="border border-black text-center text-gray-300">__________</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-black border-t-2 border-black text-center">
            <td className="border border-black py-0.5 px-1 text-left">Total</td>
            <td colSpan={total} className="border border-black text-center text-gray-500 font-normal">
              Monthly Summary
            </td>
            <td className="border border-black text-center">{shown.present}</td>
            <td className="border border-black text-center">{shown.absent}</td>
            <td className="border border-black text-center">{shown.halfDay}</td>
            <td className="border border-black text-center">{shown.leave}</td>
            <td className="border border-black text-center text-purple-800">{shown.holiday}</td>
            <td className="border border-black text-center font-black text-red-700">{shown.unpaid}</td>
            <td className="border border-black text-center">{shown.overtime}</td>
            <td className="border border-black"></td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures Footer */}
      <div className="flex justify-between items-end mt-20 pt-6 text-[11px] font-bold text-gray-800">
        <div className="text-center">
          <div className="h-12 flex items-end justify-center mb-1 text-[10px] text-gray-400 font-normal italic">
            (Sign / Stamp)
          </div>
          <div className="w-48 border-t-2 border-black pt-1.5 font-bold text-black">Prepared By</div>
          <div className="text-[9.5px] text-gray-600 font-medium mt-0.5">HR Department</div>
        </div>
        <div className="text-center">
          <div className="h-12 flex items-end justify-center mb-1 text-[10px] text-gray-400 font-normal italic">
            (Sign / Stamp)
          </div>
          <div className="w-48 border-t-2 border-black pt-1.5 font-bold text-black">Checked By</div>
          <div className="text-[9.5px] text-gray-600 font-medium mt-0.5">Accounts Manager</div>
        </div>
        <div className="text-center">
          <div className="h-12 flex items-end justify-center mb-1 text-[10px] text-gray-400 font-normal italic">
            (Sign / Stamp)
          </div>
          <div className="w-48 border-t-2 border-black pt-1.5 font-bold text-black">Approved By</div>
          <div className="text-[9.5px] text-gray-600 font-medium mt-0.5">Managing Director</div>
        </div>
      </div>
    </div>
  );
};
