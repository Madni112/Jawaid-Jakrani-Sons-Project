import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import {
  AttendanceRow,
  getAttendance,
  HrMark,
  monthNamed,
  putAttendance
} from '../../services/hr.service';
import { useHub } from '../Setup/useHub';
import { isoDay } from '../../utils/dateRange';
import { toast } from 'react-hot-toast';

import {
  CYCLE,
  daysIn,
  isFriday,
  printIsolatedElement
} from './attendance/utils/attendanceHelpers';
import type {
  EmployeePatch,
  ApprovedLeaveMeta,
  QuickMarkMenuState,
  LockedLeaveModalState
} from './attendance/types/attendanceTypes';

import { AttendanceHeader } from './attendance/components/AttendanceHeader';
import { AttendanceStatsStrip } from './attendance/components/AttendanceStatsStrip';
import { AttendanceToolbar } from './attendance/components/AttendanceToolbar';
import { AttendanceGridTable } from './attendance/components/AttendanceGridTable';
import { AttendancePagination } from './attendance/components/AttendancePagination';
import { AttendanceQuickMarkPopover } from './attendance/components/AttendanceQuickMarkPopover';
import { ApprovedLeaveLockedModal } from './attendance/modals/ApprovedLeaveLockedModal';
import { EmployeeTimesheetModal } from './attendance/modals/EmployeeTimesheetModal';
import { PrintableAttendanceRegister } from './attendance/components/PrintableAttendanceRegister';

export const AttendanceSheetPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const [month, setMonth] = useState(() => isoDay().slice(0, 7));
  const hub = useHub(() => getAttendance(tenantSlug, branchId, month), [tenantSlug, branchId, month]);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [patches, setPatches] = useState<Record<number, EmployeePatch>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [employeeCardModal, setEmployeeCardModal] = useState<AttendanceRow | null>(null);
  const [lockedLeaveModal, setLockedLeaveModal] = useState<LockedLeaveModalState | null>(null);

  const todayStr = isoDay(); // YYYY-MM-DD

  // Quick mark popover on cell right click
  const [quickMarkMenu, setQuickMarkMenu] = useState<QuickMarkMenuState | null>(null);

  const editable = can('hr-attendance:edit');
  const rows = hub.value?.data ?? [];
  const total = hub.value ? daysIn(hub.value.month) : daysIn(month);
  const dayNos = Array.from({ length: total }, (_, i) => i + 1);

  const finalDays = (r: AttendanceRow) => {
    const p = patches[r.employeeId];
    const base = p ? { ...r.days, ...p.days } : r.days;
    const out: Record<string, HrMark> = {};
    dayNos.forEach((d) => {
      const key = String(d);
      if (isFriday(month, d)) {
        out[key] = 'Holiday';
      } else if (r.approvedLeaveDays && r.approvedLeaveDays[key]) {
        out[key] = r.approvedLeaveDays[key].halfDay ? 'Half Day' : 'Leave';
      } else if (base[key]) {
        out[key] = base[key] as HrMark;
      }
    });
    return out;
  };

  const tallyOf = (r: AttendanceRow) => {
    const d = finalDays(r);
    const counts: Record<string, number> = {};
    Object.values(d).forEach((m) => {
      counts[m] = (counts[m] || 0) + 1;
    });
    const unpaid = (counts.Absent || 0) + (counts['Half Day'] || 0) * 0.5 + (r.unpaidLeave || 0);
    return { counts, marked: Object.keys(d).length, unpaid };
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) => !q || `${r.code} ${r.name} ${r.department} ${r.designation}`.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalStaff = visible.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalStaff / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return visible;
    const start = (currentPage - 1) * pageSize;
    return visible.slice(start, start + pageSize);
  }, [visible, currentPage, pageSize]);

  const shown = useMemo(() => {
    const t = visible.map(tallyOf);
    return {
      marked: t.reduce((s, x) => s + x.marked, 0),
      present: t.reduce((s, x) => s + (x.counts.Present || 0), 0),
      absent: t.reduce((s, x) => s + (x.counts.Absent || 0), 0),
      halfDay: t.reduce((s, x) => s + (x.counts['Half Day'] || 0), 0),
      leave: t.reduce((s, x) => s + (x.counts.Leave || 0), 0),
      off: t.reduce((s, x) => s + (x.counts.Off || 0), 0),
      holiday: t.reduce((s, x) => s + (x.counts.Holiday || 0), 0),
      unpaid: t.reduce((s, x) => s + x.unpaid, 0),
      overtime: visible.reduce(
        (s, r) => s + (patches[r.employeeId]?.overtimeHours ?? r.overtimeHours ?? 0),
        0
      ),
      late: visible.reduce(
        (s, r) => s + (patches[r.employeeId]?.lateDays ?? r.lateDays ?? 0),
        0
      )
    };
  }, [visible, patches]);

  const patchOf = (r: AttendanceRow): EmployeePatch =>
    patches[r.employeeId] ?? {
      days: {},
      overtimeHours: r.overtimeHours || 0,
      lateDays: r.lateDays || 0,
      note: r.note || ''
    };

  // Instant Auto-Save Helper
  const persistPatch = async (empId: number, updatedPatch: EmployeePatch) => {
    setAutoSaveStatus('saving');
    try {
      const r = rows.find((x) => x.employeeId === empId);
      const mergedDays: Record<string, HrMark> = {};
      if (r) {
        dayNos.forEach((d) => {
          const key = String(d);
          if (isFriday(month, d)) {
            mergedDays[key] = 'Holiday';
          } else if (r.approvedLeaveDays && r.approvedLeaveDays[key]) {
            mergedDays[key] = r.approvedLeaveDays[key].halfDay ? 'Half Day' : 'Leave';
          } else {
            const m = updatedPatch.days[key] ?? r.days[key];
            if (m) mergedDays[key] = m as HrMark;
          }
        });
      }
      await putAttendance(tenantSlug, branchId, month, [
        {
          employeeId: empId,
          days: mergedDays,
          overtimeHours: updatedPatch.overtimeHours,
          lateDays: updatedPatch.lateDays,
          note: updatedPatch.note
        }
      ]);
      setAutoSaveStatus('saved');
    } catch (_) {
      setAutoSaveStatus('saved');
    }
  };

  const isDayFuture = (day: number) => {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    return dateStr > todayStr;
  };

  const setCell = (r: AttendanceRow, day: number) => {
    if (!editable) return;
    if (isFriday(month, day)) {
      toast.error(`Friday is a fixed company holiday (H).`);
      return;
    }
    if (isDayFuture(day)) {
      toast.error(`Cannot mark attendance for future date (${day} ${monthNamed(month)}).`);
      return;
    }

    const approvedMeta = r.approvedLeaveDays?.[String(day)];
    if (approvedMeta) {
      setLockedLeaveModal({ row: r, day, meta: approvedMeta });
      return;
    }

    const cur = patches[r.employeeId] ?? patchOf(r);
    const key = String(day);
    const currentMark = cur.days[key] ?? r.days[key] ?? '';
    const nextIndex = (CYCLE.indexOf(currentMark as any) + 1) % CYCLE.length;
    const next = CYCLE[nextIndex];
    const newPatch: EmployeePatch = { ...cur, days: { ...cur.days, [key]: next } };

    setPatches((p) => ({ ...p, [r.employeeId]: newPatch }));
    persistPatch(r.employeeId, newPatch);
  };

  const setCellDirect = (empId: number, day: number, mark: HrMark | '') => {
    if (!editable) return;
    if (isFriday(month, day)) {
      toast.error(`Friday is a fixed company holiday (H).`);
      return;
    }
    if (isDayFuture(day)) {
      toast.error(`Cannot mark attendance for future date (${day} ${monthNamed(month)}).`);
      return;
    }
    const r = rows.find((x) => x.employeeId === empId);
    if (!r) return;

    const approvedMeta = r.approvedLeaveDays?.[String(day)];
    if (approvedMeta) {
      setLockedLeaveModal({ row: r, day, meta: approvedMeta });
      setQuickMarkMenu(null);
      return;
    }

    const cur = patches[empId] ?? patchOf(r);
    const newPatch: EmployeePatch = { ...cur, days: { ...cur.days, [String(day)]: mark } };
    setPatches((p) => ({ ...p, [empId]: newPatch }));
    persistPatch(empId, newPatch);
    setQuickMarkMenu(null);
  };

  const handlePrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setMonth(prevMonthStr);
    setPatches({});
    setPage(1);
  };

  const handleNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setMonth(nextMonthStr);
    setPatches({});
    setPage(1);
  };

  const handlePrint = () => {
    printIsolatedElement(
      'printable-attendance-register',
      'landscape',
      `Attendance Register - ${monthNamed(month)}`
    );
  };

  return (
    <div className="space-y-5">
      {/* ── TOP HEADER CARD ── */}
      <div className="rounded-lg border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <AttendanceHeader
          autoSaveStatus={autoSaveStatus}
          onPrint={handlePrint}
        />

        <AttendanceStatsStrip
          totalStaff={totalStaff}
          shown={shown}
        />

        <AttendanceToolbar
          month={month}
          setMonth={setMonth}
          totalDays={total}
          search={search}
          setSearch={setSearch}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onResetPage={() => setPage(1)}
        />
      </div>

      {/* ── MAIN ATTENDANCE SHEET GRID ── */}
      <AttendanceGridTable
        loading={hub.loading}
        month={month}
        total={total}
        dayNos={dayNos}
        visible={visible}
        paginatedRows={paginatedRows}
        editable={editable}
        isDayFuture={isDayFuture}
        patchOf={patchOf}
        tallyOf={tallyOf}
        onCellClick={(r, d, approvedMeta, isLocked) => {
          if (approvedMeta) {
            setLockedLeaveModal({ row: r, day: d, meta: approvedMeta });
          } else if (!isLocked) {
            setCell(r, d);
          }
        }}
        onCellContextMenu={(e, r, d, approvedMeta, isFuture, fri) => {
          e.preventDefault();
          if (approvedMeta) {
            setLockedLeaveModal({ row: r, day: d, meta: approvedMeta });
            return;
          }
          if (!isFuture && !fri) {
            setQuickMarkMenu({
              empId: r.employeeId,
              day: d,
              x: e.clientX,
              y: e.clientY
            });
          }
        }}
        onOvertimeChange={(r, hours) => {
          const p = patchOf(r);
          const newPatch: EmployeePatch = { ...p, overtimeHours: hours };
          setPatches((s) => ({ ...s, [r.employeeId]: newPatch }));
          persistPatch(r.employeeId, newPatch);
        }}
        onLateChange={(r, days) => {
          const p = patchOf(r);
          const newPatch: EmployeePatch = { ...p, lateDays: days };
          setPatches((s) => ({ ...s, [r.employeeId]: newPatch }));
          persistPatch(r.employeeId, newPatch);
        }}
        onNoteChange={(r, note) => {
          const p = patchOf(r);
          const newPatch: EmployeePatch = { ...p, note };
          setPatches((s) => ({ ...s, [r.employeeId]: newPatch }));
          persistPatch(r.employeeId, newPatch);
        }}
        onViewTimesheet={(r) => setEmployeeCardModal(r)}
        shown={shown}
      />

      {/* ── PAGINATION BAR ── */}
      {visible.length > 0 && !hub.loading && (
        <AttendancePagination
          pageSize={pageSize}
          setPageSize={setPageSize}
          page={page}
          setPage={setPage}
          totalStaff={totalStaff}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}

      {/* ── QUICK RIGHT-CLICK MARK SELECTOR POPOVER ── */}
      {quickMarkMenu && (
        <AttendanceQuickMarkPopover
          quickMarkMenu={quickMarkMenu}
          onClose={() => setQuickMarkMenu(null)}
          onSelectMark={(empId, day, mark) => setCellDirect(empId, day, mark)}
        />
      )}

      {/* ── APPROVED LEAVE LOCKED MODAL ── */}
      {lockedLeaveModal && (
        <ApprovedLeaveLockedModal
          modalState={lockedLeaveModal}
          month={month}
          onClose={() => setLockedLeaveModal(null)}
          onNavigateToLeaves={() => navigate('/Human-Resources/Leaves')}
        />
      )}

      {/* ── INDIVIDUAL EMPLOYEE ATTENDANCE CARD & PRINT MODAL ── */}
      {employeeCardModal && (
        <EmployeeTimesheetModal
          employee={employeeCardModal}
          month={month}
          totalDays={total}
          dayNos={dayNos}
          patch={patchOf(employeeCardModal)}
          tally={tallyOf(employeeCardModal)}
          finalDays={finalDays}
          isDayFuture={isDayFuture}
          onClose={() => setEmployeeCardModal(null)}
        />
      )}

      {/* ── ALL EMPLOYEES HIDDEN PRINT REGISTER TEMPLATE ── */}
      <PrintableAttendanceRegister
        month={month}
        total={total}
        dayNos={dayNos}
        visible={visible}
        patchOf={patchOf}
        tallyOf={tallyOf}
        finalDays={finalDays}
        shown={shown}
      />
    </div>
  );
};

export default AttendanceSheetPage;
