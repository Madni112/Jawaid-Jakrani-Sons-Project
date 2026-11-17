import React from 'react';
import { Eye } from 'lucide-react';
import {
  Area,
  Check as CheckBox,
  Field,
  FormFooter,
  Pick,
  SearchPick,
  Text
} from '../../../Masters/masterUi';
import { getLeaveExpiryDate, LeaveApplication, LeaveType } from '../../../../services/hr.service';
import { isDateFriday } from '../utils/leaveUtils';

interface LeaveApplicationModalProps {
  draft: Partial<LeaveApplication> | null;
  setDraft: React.Dispatch<React.SetStateAction<Partial<LeaveApplication> | null>>;
  rows: LeaveApplication[];
  employees: any[];
  types: LeaveType[];
  saving: boolean;
  editable: boolean;
  isOtherSelected: boolean;
  getEmpBalanceInfo: (empId?: number | null) => { allowed: number; taken: number; remaining: number };
  handleFromChange: (newFrom: string) => void;
  handleDaysChange: (newDaysVal: number) => void;
  handleToChange: (newTo: string) => void;
  handleHalfDayToggle: (isHalf: boolean) => void;
  onViewAttendance: (empId: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const LeaveApplicationModal: React.FC<LeaveApplicationModalProps> = ({
  draft,
  setDraft,
  rows,
  employees,
  types,
  saving,
  editable,
  isOtherSelected,
  getEmpBalanceInfo,
  handleFromChange,
  handleDaysChange,
  handleToChange,
  handleHalfDayToggle,
  onViewAttendance,
  onSubmit,
  onClose
}) => {
  if (!draft) return null;

  const set = (patch: Partial<LeaveApplication>) =>
    setDraft((d) => (d ? { ...d, ...patch } : null));

  return (
    <div className="rounded-sm border border-stroke bg-white p-5 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="text-base font-bold text-black dark:text-white mb-5 pb-3 border-b border-stroke dark:border-strokedark">
        {draft.id ? `Edit Application - [${draft.number || draft.id}]` : 'Record Leave Application'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Row 1: Employee & Leave Type */}
        <div className={isOtherSelected ? 'md:col-span-6' : 'md:col-span-7'}>
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-semibold text-black dark:text-white">
                Employee <span className="text-meta-1">*</span>
              </label>
              {draft.employeeId ? (
                <button
                  type="button"
                  onClick={() => onViewAttendance(draft.employeeId!)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary border border-primary/30 px-2.5 py-0.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                  title="View attendance summary and timesheet log for this employee"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Attendance</span>
                </button>
              ) : null}
            </div>
            <SearchPick
              options={employees.map((e) => {
                const info = [e.code, e.designationName || e.departmentName]
                  .filter(Boolean)
                  .join(' · ');
                return {
                  id: e.id,
                  label: e.name,
                  sub: info || undefined
                };
              })}
              valueId={draft.employeeId || null}
              valueLabel={draft.employeeName || rows.find((r) => r.id === draft.id)?.employeeName}
              onPick={(o) => {
                const emp = employees.find((e) => e.id === o?.id);
                set({
                  employeeId: o?.id ?? 0,
                  employeeName: o?.label ?? '',
                  employeeCode: emp?.code ?? '',
                  designation: emp?.designationName || emp?.departmentName || ''
                });
              }}
              placeholder="Search staff by name or code..."
            />
          </div>
        </div>

        <div className={isOtherSelected ? 'md:col-span-3' : 'md:col-span-5'}>
          <Field label="Kind of Leave" required>
            <Pick
              value={String(draft.leaveTypeId ?? '1')}
              onChange={(e) => {
                const val = Number(e.target.value);
                const picked = types.find((t) => t.id === val);
                const isOther = val === 3 || picked?.name.toLowerCase().includes('other');
                set({
                  leaveTypeId: val,
                  leaveTypeName: picked?.name || 'Casual Leave',
                  customType: isOther ? draft.customType || '' : undefined
                });
              }}
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Pick>
          </Field>
        </div>

        {isOtherSelected && (
          <div className="md:col-span-3">
            <Field label="Specify Leave Type" required>
              <Text
                value={draft.customType ?? ''}
                onChange={(e) => set({ customType: e.target.value })}
                placeholder="e.g. Emergency, Exam"
              />
            </Field>
          </div>
        )}

        {/* Row 2: From Date, Days / Range, To Date (with Half Day) */}
        <div className="md:col-span-4">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-black dark:text-white mb-1.5">
              From Date <span className="text-meta-1">*</span>
            </label>
            <div className={isDateFriday(draft.from) ? 'rounded-md ring-1 ring-red-500' : ''}>
              <Text
                type="date"
                value={draft.from ?? ''}
                onChange={(e) => handleFromChange(e.target.value)}
              />
            </div>
            {isDateFriday(draft.from) && (
              <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>Friday is a weekly off day. Please select a working day.</span>
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-4">
          <Field label="Days / Range" required>
            <Text
              type="number"
              step={draft.halfDay ? '0.5' : '1'}
              min="0.5"
              value={draft.days ?? 1}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              disabled={!!draft.halfDay}
            />
          </Field>
        </div>

        <div className="md:col-span-4">
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-semibold text-black dark:text-white">
                To Date <span className="text-meta-1">*</span>
              </label>
              <CheckBox checked={!!draft.halfDay} onChange={handleHalfDayToggle} label="Half Day" />
            </div>
            <div className={isDateFriday(draft.to) ? 'rounded-md ring-1 ring-red-500' : ''}>
              <Text
                type="date"
                value={draft.to ?? ''}
                onChange={(e) => handleToChange(e.target.value)}
                disabled={!!draft.halfDay}
              />
            </div>
            {isDateFriday(draft.to) && (
              <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>Friday is a weekly holiday. Please choose a working day for To Date.</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Reason */}
        <div className="col-span-full">
          <Field label="Reason">
            <Area
              rows={2}
              value={draft.reason ?? ''}
              onChange={(e) => set({ reason: e.target.value })}
              placeholder="What the leave is for — the manager sees this when deciding."
            />
          </Field>
        </div>

        {(draft.to || draft.from) && (
          <div className="col-span-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                Application Expiry Date:
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {getLeaveExpiryDate(draft.to, draft.from)}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              (Auto-expires 2 days after leave date if pending approval)
            </span>
          </div>
        )}

        {!!draft.employeeId &&
          (() => {
            const { allowed, taken, remaining } = getEmpBalanceInfo(draft.employeeId);
            const requestedDays = draft.days || 1;
            const isOver = requestedDays > remaining;
            return (
              <div className="col-span-full">
                <div
                  className={`p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs ${
                    isOver
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Annual Quota Remaining:
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        remaining <= 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : remaining <= 3
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {remaining} of {allowed} Days Left ({taken} used)
                    </span>
                  </div>
                  {isOver && (
                    <span className="font-bold text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>
                        This request ({requestedDays}d) exceeds available balance ({remaining}d
                        left). Approval confirmation will be required.
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
      </div>
      <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
        <FormFooter
          onSave={onSubmit}
          onClose={onClose}
          saving={saving}
          disabled={!editable}
          saveLabel={draft.id ? 'SAVE' : 'RECORD APPLICATION'}
        />
      </div>
    </div>
  );
};

export default LeaveApplicationModal;
