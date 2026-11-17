import { AttendanceRow, ApprovedLeaveMeta, HrMark } from '../../../../services/hr.service';

export interface Patch {
  days: Record<string, HrMark | ''>;
  overtimeHours: number;
  lateDays: number;
  note: string;
}

export interface AttendanceTally {
  counts: Record<string, number>;
  marked: number;
  unpaid: number;
}

export interface AttendanceSummaryStats {
  marked: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  off: number;
  holiday: number;
  unpaid: number;
  overtime: number;
  late: number;
}

export interface QuickMarkMenuState {
  empId: number;
  day: number;
  x: number;
  y: number;
}

export interface LockedLeaveModalState {
  row: AttendanceRow;
  day: number;
  meta: ApprovedLeaveMeta;
}

export type { AttendanceRow, ApprovedLeaveMeta, HrMark };
