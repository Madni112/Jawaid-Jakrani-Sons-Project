import React, { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import { isoDay } from '../../utils/dateRange';
import {
  decideLeave,
  deleteLeave,
  deleteLeaveType,
  getLeave,
  LeaveApplication,
  LeaveStatus,
  LeaveType,
  saveLeave,
  saveLeaveType,
  updateLeave,
  updateLeaveType,
  getAttendance,
  AttendanceRow
} from '../../services/hr.service';
import { TabStrip, SortState, RegisterStat } from '../Masters/masterUi';
import { useHub } from '../Setup/useHub';

// Extracted utils
import {
  TABS,
  blankApp,
  blankType,
  days,
  addDaysIso,
  diffDaysIso,
  isDateFriday,
  Balance
} from './leave/utils/leaveUtils';

// Extracted components
import { LeaveHeader } from './leave/components/LeaveHeader';
import { LeaveStatsStrip } from './leave/components/LeaveStatsStrip';
import { LeaveToolbar } from './leave/components/LeaveToolbar';
import { LeaveApplicationsTab } from './leave/components/LeaveApplicationsTab';
import { LeaveBalancesTab } from './leave/components/LeaveBalancesTab';
import { LeaveTypesTab } from './leave/components/LeaveTypesTab';

// Extracted modals
import { LeaveApplicationModal } from './leave/modals/LeaveApplicationModal';
import { LeaveTypeModal } from './leave/modals/LeaveTypeModal';
import { LeaveApplicationDetailModal } from './leave/modals/LeaveApplicationDetailModal';
import { OverLimitApprovalModal } from './leave/modals/OverLimitApprovalModal';
import { EmployeeLeaveBreakdownModal } from './leave/modals/EmployeeLeaveBreakdownModal';
import { EmployeeAttendanceHistoryModal } from './leave/modals/EmployeeAttendanceHistoryModal';

export const LeavePage: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const hub = useHub(() => getLeave(tenantSlug, branchId), [tenantSlug, branchId]);
  const [tab, setTab] = useState(TABS[0]);
  const [search, setSearch] = useState('');
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [status, setStatus] = useState('');
  const [typeState, setTypeState] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortState | null>({ key: 'from', dir: 'desc' });
  const [draft, setDraft] = useState<Partial<LeaveApplication> | null>(null);
  const [typeDraft, setTypeDraft] = useState<Partial<LeaveType> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  // Attendance Summary Modal State
  const [attModalEmpId, setAttModalEmpId] = useState<number | null>(null);
  const [attModalMonth, setAttModalMonth] = useState<string>(() => isoDay().slice(0, 7));
  const [attModalRows, setAttModalRows] = useState<AttendanceRow[] | null>(null);
  const [attModalLoading, setAttModalLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!attModalEmpId) return;
    let active = true;
    setAttModalLoading(true);
    getAttendance(tenantSlug, branchId, attModalMonth)
      .then((res) => {
        if (active) {
          setAttModalRows(res.data || []);
        }
      })
      .catch((err) => {
        console.warn('Failed to load attendance summary:', err);
      })
      .finally(() => {
        if (active) setAttModalLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attModalEmpId, attModalMonth, tenantSlug, branchId]);

  const [viewingApp, setViewingApp] = useState<LeaveApplication | null>(null);
  const [viewingBalance, setViewingBalance] = useState<Balance | null>(null);
  const [overLimitConfirmApp, setOverLimitConfirmApp] = useState<LeaveApplication | null>(null);

  const editable = can('hr-leave:edit');
  const rows = hub.value?.data ?? [];
  const types = hub.value?.types ?? [];
  const employees = hub.value?.employees ?? [];
  const allBalances = (hub.value?.balances ?? []).map(b => ({
    ...b,
    designation: b.designation || b.department || 'Staff'
  }));

  const getEmpBalanceInfo = (empId?: number | null) => {
    if (!empId) return { allowed: 15, taken: 0, remaining: 15 };
    const balObj = allBalances.find(b => b.employeeId === empId);
    const allowed = balObj?.rows?.reduce((s, r) => s + r.allowed, 0) ?? 15;
    const taken = balObj?.rows?.reduce((s, r) => s + r.taken, 0) ?? 0;
    const remaining = Math.max(0, allowed - taken);
    return { allowed, taken, remaining };
  };

  const handleApproveClick = (a: LeaveApplication) => {
    const { remaining } = getEmpBalanceInfo(a.employeeId);
    if (a.days > remaining) {
      setOverLimitConfirmApp(a);
    } else {
      decide(a, 'Approved');
    }
  };

  const inWindow = useMemo(() => rows.filter(a =>
    (!fromDate || a.from >= fromDate) && (!toDate || a.from <= toDate) &&
    (!search.trim() || `${a.number || ''} ${a.employeeName || ''} ${a.employeeCode || ''} ${a.designation || ''} ${a.leaveTypeName || ''} ${a.reason || ''}`
      .toLowerCase().includes(search.trim().toLowerCase()))),
    [rows, fromDate, toDate, search]);

  const visible = useMemo(() => {
    const list = status ? inWindow.filter(a => a.status === status) : inWindow;
    if (!sort) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((x: any, y: any) => {
      const av = x[sort.key], bv = y[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [inWindow, status, sort]);

  const onSort = (k: string) => setSort(s => (s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));

  const shown = useMemo(() => ({
    days: visible.reduce((s, a) => s + a.days, 0),
    waiting: visible.filter(a => a.status === 'Applied').length,
    waitingDays: visible.filter(a => a.status === 'Applied').reduce((s, a) => s + a.days, 0),
    approvedDays: visible.filter(a => a.status === 'Approved').reduce((s, a) => s + a.days, 0)
  }), [visible]);

  const statusCounts = [
    { value: '', label: 'All', count: inWindow.length },
    ...(hub.value?.statuses ?? []).map(s => ({ value: s, label: s, count: inWindow.filter(a => a.status === s).length }))
  ];

  const balances = useMemo(() => allBalances.filter(b =>
    !search.trim() || `${b.code} ${b.name} ${b.designation}`.toLowerCase().includes(search.trim().toLowerCase())),
    [allBalances, search]);

  const balanceTotals = useMemo(() => {
    const entitled = balances.reduce((sum, b) => sum + b.rows.reduce((s, r) => s + r.allowed, 0), 0);
    const used = balances.reduce((sum, b) => sum + b.rows.reduce((s, r) => s + r.taken, 0), 0);
    return {
      entitled,
      used,
      remaining: Math.max(0, entitled - used)
    };
  }, [balances]);

  const typesScoped = useMemo(() => types.filter(t =>
    !search.trim() || `${t.code} ${t.name} ${t.description}`.toLowerCase().includes(search.trim().toLowerCase())),
    [types, search]);

  const typesVisible = useMemo(() => typeState
    ? typesScoped.filter(t => (typeState === 'Active') === t.isActive) : typesScoped,
    [typesScoped, typeState]);

  const typeTotals = useMemo(() => ({
    perYear: typesVisible.reduce((s, t) => s + t.daysPerYear, 0),
    carry: typesVisible.reduce((s, t) => s + (t.carryForward || 0), 0),
    applied: typesVisible.reduce((s, t) => s + (t.applied || 0), 0),
    stopped: typesScoped.filter(t => !t.isActive).length
  }), [typesVisible, typesScoped]);

  const typeStateCounts = [
    { value: '', label: 'All', count: typesScoped.length },
    { value: 'Active', label: 'Active', count: typesScoped.filter(t => t.isActive).length },
    { value: 'Stopped', label: 'Stopped', count: typesScoped.filter(t => !t.isActive).length }
  ];

  const approvedType = new Set(rows.filter(a => a.status === 'Approved').map(a => a.leaveTypeId));

  const stats: RegisterStat[] = tab === 'Applications' ? [
    {
      label: 'Applications',
      value: status ? `${visible.length} of ${inWindow.length}` : String(inWindow.length),
      title: 'Requests currently listed on screen'
    },
    { label: 'Days asked', value: days(shown.days), title: 'Total days requested across listed applications' },
    {
      label: 'Waiting on a decision',
      value: String(shown.waiting),
      tone: shown.waiting ? 'warn' : undefined,
      title: shown.waiting ? `${days(shown.waitingDays)} day(s) of leave are pending approval` : 'Nothing is left undecided'
    },
    {
      label: 'Approved days',
      value: days(shown.approvedDays),
      tone: 'ok',
      title: 'Total leave days approved on register'
    }
  ] : tab === 'Balances' ? [
    {
      label: 'Staff',
      value: balances.length === allBalances.length ? String(balances.length) : `${balances.length} of ${allBalances.length}`,
      title: 'Members of staff listed'
    },
    { label: 'Entitled', value: days(balanceTotals.entitled), title: `Total leave days allowed for the year` },
    { label: 'Used', value: days(balanceTotals.used), tone: 'ok', title: 'Approved leaves used so far' },
    {
      label: 'Remaining',
      value: days(balanceTotals.remaining),
      tone: balanceTotals.remaining ? 'ok' : 'bad',
      title: 'Total leaves remaining across all staff'
    }
  ] : [
    {
      label: 'Leave types',
      value: typeState ? `${typesVisible.length} of ${typesScoped.length}` : String(typesScoped.length),
      title: 'Leave categories configured'
    },
    { label: 'Days a year', value: days(typeTotals.perYear), title: 'Total annual days allowed across categories' },
    { label: 'Carry forward', value: days(typeTotals.carry), title: 'Days allowed to carry forward' },
    {
      label: 'Applications',
      value: String(typeTotals.applied),
      title: 'Requests booked against these kinds'
    }
  ];

  const activeFilters = [
    search && `search “${search}”`,
    tab === 'Applications' && status && `status ${status}`,
    tab === 'Applications' && (fromDate || toDate) && `from ${fromDate || 'the beginning'} → ${toDate || 'today'}`,
    tab === 'Leave Types' && typeState && `type ${typeState.toLowerCase()}`
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setStatus('');
    setTypeState('');
    setFromDate('');
    setToDate('');
    if (search) { setSearch(''); setSearchEpoch(n => n + 1); }
  };

  const set = (patch: Partial<LeaveApplication>) => setDraft(d => (d ? { ...d, ...patch } : d));

  // Date and Range Bi-directional sync handlers
  const handleFromChange = (newFrom: string) => {
    if (!draft) return;
    const currentDays = draft.days || 1;
    if (draft.halfDay) {
      set({ from: newFrom, to: newFrom, days: 0.5 });
    } else {
      const newTo = addDaysIso(newFrom, currentDays);
      set({ from: newFrom, to: newTo || newFrom });
    }
  };

  const handleDaysChange = (newDaysVal: number) => {
    if (!draft) return;
    const dCount = Math.max(0.5, Number(newDaysVal) || 1);
    const baseFrom = draft.from || isoDay();
    const newTo = dCount === 0.5 ? baseFrom : addDaysIso(baseFrom, dCount);
    set({ days: dCount, from: baseFrom, to: newTo, halfDay: dCount === 0.5 });
  };

  const handleToChange = (newTo: string) => {
    if (!draft) return;
    const baseFrom = draft.from || isoDay();
    if (newTo < baseFrom) {
      set({ to: baseFrom, days: 1 });
    } else {
      const dCount = diffDaysIso(baseFrom, newTo, !!draft.halfDay);
      set({ to: newTo, days: dCount });
    }
  };

  const handleHalfDayToggle = (isHalf: boolean) => {
    if (!draft) return;
    const baseFrom = draft.from || isoDay();
    if (isHalf) {
      set({ halfDay: true, days: 0.5, to: baseFrom });
    } else {
      const dCount = Math.max(1, draft.days === 0.5 ? 1 : draft.days || 1);
      set({ halfDay: false, days: dCount, to: addDaysIso(baseFrom, dCount) });
    }
  };

  const submit = async (close = true) => {
    if (!draft) return;
    if (!draft.employeeId) { setError('Choose the employee'); return; }
    if (!draft.leaveTypeId) { setError('Choose the kind of leave'); return; }
    if (isDateFriday(draft.from)) {
      setError('From Date falls on a Friday (weekly holiday). Please choose a working day.');
      return;
    }
    if (isDateFriday(draft.to)) {
      setError('To Date falls on a Friday (weekly holiday). Please choose a working day.');
      return;
    }

    const isOther = String(draft.leaveTypeName || '').toLowerCase().includes('other') || draft.leaveTypeId === 3;
    if (isOther && !String(draft.customType || '').trim()) {
      setError('Please specify the custom leave type');
      return;
    }

    const payload: Partial<LeaveApplication> = {
      ...draft,
      leaveTypeName: isOther ? (draft.customType || 'Other') : draft.leaveTypeName,
      status: 'Applied',
      approvedBy: ''
    };

    setSaving(true); setError(''); setNotice('');
    try {
      if (draft.id) {
        await updateLeave(draft.id, payload, tenantSlug, branchId);
        setNotice(`Leave application #${draft.number || draft.id} updated and submitted for approval.`);
      } else {
        await saveLeave(payload, tenantSlug, branchId);
        setNotice(`Leave application recorded successfully for ${draft.employeeName || 'employee'}.`);
      }
      hub.reload();
      if (close) setDraft(null);
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  };

  const decide = async (a: LeaveApplication, next: LeaveStatus) => {
    setError(''); setNotice('');
    try {
      const action = next === 'Approved' ? 'Approve' : next === 'Cancelled' ? 'Cancel' : 'Reject';
      await decideLeave(a.id, action as any, undefined, tenantSlug, branchId);
      setNotice(`Application marked as ${next} for ${a.employeeName} (${a.days} day(s)).`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
    setConfirmId(null);
  };

  const remove = async (a: LeaveApplication) => {
    setError(''); setNotice(''); setConfirmId(null);
    try {
      await deleteLeave(a.id, tenantSlug, branchId);
      setNotice(`Leave application deleted.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  const submitType = async () => {
    if (!typeDraft) return;
    if (!String(typeDraft.name ?? '').trim()) { setError('Leave type name is required'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      if (typeDraft.id) await updateLeaveType(typeDraft.id, typeDraft, tenantSlug, branchId);
      else await saveLeaveType(typeDraft, tenantSlug, branchId);
      setNotice(`${typeDraft.name} saved.`);
      setTypeDraft(null);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  };

  const removeType = async (t: LeaveType) => {
    setError(''); setNotice(''); setConfirmId(null);
    try {
      await deleteLeaveType(t.id, tenantSlug, branchId);
      setNotice(`${t.name} has been deleted.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  const isOtherSelected = !!draft && (
    draft.leaveTypeId === 3 ||
    String(draft.leaveTypeName || '').toLowerCase().includes('other') ||
    !!types.find(t => t.id === draft.leaveTypeId)?.name.toLowerCase().includes('other')
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="rounded-sm border border-stroke bg-white p-4 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <LeaveHeader
          tab={tab}
          onNewApplication={() => {
            setError('');
            setNotice('');
            setDraft(blankApp());
          }}
        />

        <LeaveStatsStrip stats={stats} />

        <LeaveToolbar
          tab={tab}
          searchEpoch={searchEpoch}
          onSearch={setSearch}
          status={status}
          onStatusChange={setStatus}
          statusCounts={statusCounts}
          typeState={typeState}
          onTypeStateChange={setTypeState}
          typeStateCounts={typeStateCounts}
          fromDate={fromDate}
          toDate={toDate}
          onDateChange={(f, t) => { setFromDate(f); setToDate(t); }}
        />
      </div>

      {/* Alert Notifications */}
      {(error || hub.error || notice) && (
        <div className={`text-xs font-semibold rounded-md px-4 py-3 flex items-center justify-between shadow-sm ${error || hub.error ? 'text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300' : 'text-green-800 bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900 dark:text-green-300'}`}>
          <span>{error || hub.error || notice}</span>
          <button type="button" onClick={() => { setError(''); setNotice(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Record Leave Application Form Modal/Card */}
      <LeaveApplicationModal
        draft={draft}
        setDraft={setDraft}
        rows={rows}
        employees={employees}
        types={types}
        saving={saving}
        editable={editable}
        isOtherSelected={isOtherSelected}
        getEmpBalanceInfo={getEmpBalanceInfo}
        handleFromChange={handleFromChange}
        handleDaysChange={handleDaysChange}
        handleToChange={handleToChange}
        handleHalfDayToggle={handleHalfDayToggle}
        onViewAttendance={(empId) => {
          setAttModalEmpId(empId);
          setAttModalMonth(isoDay().slice(0, 7));
        }}
        onSubmit={() => submit()}
        onClose={() => setDraft(null)}
      />

      {/* Leave Type Form Modal/Card */}
      <LeaveTypeModal
        typeDraft={typeDraft}
        setTypeDraft={setTypeDraft}
        saving={saving}
        editable={editable}
        onSubmitType={submitType}
        onClose={() => setTypeDraft(null)}
      />

      {/* Table Container Card */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stroke dark:border-strokedark">
          <TabStrip tabs={TABS} active={tab} onChange={t => { setTab(t); setError(''); setNotice(''); }} />
        </div>

        <div className="overflow-x-auto max-h-[64vh]">
          {tab === 'Applications' && (
            <LeaveApplicationsTab
              loading={hub.loading}
              visible={visible}
              rows={rows}
              sort={sort}
              onSort={onSort}
              activeFilters={activeFilters}
              onClearFilters={clearAll}
              editable={editable}
              confirmId={confirmId}
              setConfirmId={setConfirmId}
              confirmCancelId={confirmCancelId}
              setConfirmCancelId={setConfirmCancelId}
              shown={shown}
              getEmpBalanceInfo={getEmpBalanceInfo}
              onViewApp={(a) => setViewingApp(a)}
              onApproveClick={handleApproveClick}
              onDecide={decide}
              onEdit={(a) => {
                setError(''); setNotice('');
                setDraft({ ...a, customType: a.customType || '' });
              }}
              onRemove={remove}
              onNewApplication={() => { setDraft(blankApp()); setError(''); setNotice(''); }}
            />
          )}

          {tab === 'Balances' && (
            <LeaveBalancesTab
              loading={hub.loading}
              balances={balances}
              activeFilters={activeFilters}
              onClearFilters={clearAll}
              onViewBalance={(b) => setViewingBalance(b)}
            />
          )}

          {tab === 'Leave Types' && (
            <LeaveTypesTab
              loading={hub.loading}
              typesVisible={typesVisible}
              types={types}
              activeFilters={activeFilters}
              onClearFilters={clearAll}
              editable={editable}
              confirmId={confirmId}
              setConfirmId={setConfirmId}
              approvedType={approvedType}
              typeTotals={typeTotals}
              onEditType={(t) => { setError(''); setNotice(''); setTypeDraft({ ...t }); }}
              onRemoveType={removeType}
              onAddType={() => { setError(''); setNotice(''); setTypeDraft(blankType()); }}
            />
          )}
        </div>
      </div>

      {/* Viewing Application Details Slide-over / Modal */}
      <LeaveApplicationDetailModal
        viewingApp={viewingApp}
        onClose={() => setViewingApp(null)}
        editable={editable}
        confirmCancelId={confirmCancelId}
        setConfirmCancelId={setConfirmCancelId}
        getEmpBalanceInfo={getEmpBalanceInfo}
        onApproveClick={handleApproveClick}
        onDecide={decide}
      />

      {/* Over-Limit Approval Confirmation Warning Modal */}
      <OverLimitApprovalModal
        overLimitConfirmApp={overLimitConfirmApp}
        onClose={() => setOverLimitConfirmApp(null)}
        getEmpBalanceInfo={getEmpBalanceInfo}
        onConfirmApprove={(target) => {
          setOverLimitConfirmApp(null);
          decide(target, 'Approved');
        }}
      />

      {/* Employee Leave Balance Breakdown Modal */}
      <EmployeeLeaveBreakdownModal
        viewingBalance={viewingBalance}
        onClose={() => setViewingBalance(null)}
        rows={rows}
        employees={employees}
        onApplyForEmployee={(emp) => {
          setViewingBalance(null);
          setDraft({
            ...blankApp(),
            employeeId: emp.id,
            employeeName: emp.name,
            employeeCode: emp.code,
            designation: emp.designationName || emp.departmentName || ''
          });
          setTab('Applications');
        }}
      />

      {/* Individual Employee Attendance Summary & Timesheet Modal */}
      <EmployeeAttendanceHistoryModal
        attModalEmpId={attModalEmpId ? String(attModalEmpId) : null}
        onClose={() => setAttModalEmpId(null)}
        employees={employees}
        draft={draft as any}
        attModalRows={attModalRows || []}
        attModalMonth={attModalMonth}
        setAttModalMonth={setAttModalMonth}
        attModalLoading={attModalLoading}
      />
    </div>
  );
};

export default LeavePage;
