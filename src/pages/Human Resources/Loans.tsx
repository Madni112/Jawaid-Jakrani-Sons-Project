import React, { useMemo, useState } from 'react';
import { Banknote, X } from 'lucide-react';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import {
  deleteLoan, EmployeeLoan, getLoans, saveLoan, updateLoan
} from '../../services/hr.service';
import {
  DateWindow, ListToolbar, RegisterStat, SearchBox, SortState, StatStrip, StatusPills, TabStrip
} from '../Masters/masterUi';
import { useHub } from '../Setup/useHub';
import { money, calcEndMonth, blank } from './loans/utils/loanHelpers';
import { LoanDetailsModal } from './loans/components/LoanDetailsModal';
import { LoanForm } from './loans/components/LoanForm';
import { LoansTable } from './loans/components/LoansTable';

export { calcEndMonth };

const TABS = ['Advance', 'Loan'];

export const LoansPage: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const hub = useHub(() => getLoans(tenantSlug, branchId), [tenantSlug, branchId]);
  const [tab, setTab] = useState<'Advance' | 'Loan'>('Advance');
  const [search, setSearch] = useState('');
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortState | null>({ key: 'sanctionedOn', dir: 'desc' });
  const [draft, setDraft] = useState<Partial<EmployeeLoan> | null>(null);
  const [viewRecord, setViewRecord] = useState<EmployeeLoan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const editable = can('hr-loans:edit');
  const rows = hub.value?.data ?? [];
  const months = hub.value?.months ?? [];

  const inWindow = useMemo(() => rows.filter((l: EmployeeLoan) =>
    (!fromDate || l.sanctionedOn >= fromDate) && (!toDate || l.sanctionedOn <= toDate) &&
    (!search.trim() || `${l.number} ${l.employeeName} ${l.employeeCode} ${l.purpose} ${l.kind}`
      .toLowerCase().includes(search.trim().toLowerCase()))),
  [rows, fromDate, toDate, search]);

  const inTab = useMemo(() => {
    if (tab === 'Advance') return inWindow.filter((l: EmployeeLoan) => (l.kind || '').toLowerCase().includes('adv'));
    return inWindow.filter((l: EmployeeLoan) => (l.kind || '').toLowerCase().includes('loan'));
  }, [inWindow, tab]);

  const visible = useMemo(() => {
    const list = status ? inTab.filter((l: EmployeeLoan) => l.status === status) : inTab;
    if (!sort) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a: any, b: any) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [inTab, status, sort]);

  const onSort = (k: string) => setSort(s => (s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));

  const shown = useMemo(() => ({
    amount: visible.reduce((s: number, l: EmployeeLoan) => s + l.amount, 0),
    recovered: visible.reduce((s: number, l: EmployeeLoan) => s + l.deducted, 0),
    balance: visible.reduce((s: number, l: EmployeeLoan) => s + l.balance, 0)
  }), [visible]);
  const holders = new Set(visible.filter((l: EmployeeLoan) => l.balance > 0).map((l: EmployeeLoan) => l.employeeId)).size;

  const stats: RegisterStat[] = [
    {
      label: 'Records',
      value: status ? `${visible.length} of ${inTab.length}` : String(inTab.length),
      title: `${tab} matching active search filters`
    },
    { label: 'Sanctioned', value: `Rs. ${money(shown.amount)}`, title: `Total ${tab.toLowerCase()} amount sanctioned` },
    { label: 'Recovered', value: `Rs. ${money(shown.recovered)}`, tone: 'ok', title: 'Total recovered from payroll' },
    {
      label: 'Outstanding',
      value: `Rs. ${money(shown.balance)}`,
      tone: shown.balance ? 'warn' : undefined,
      title: `${holders} employee(s) hold outstanding ${tab.toLowerCase()} balance`
    }
  ];

  const statusCounts = [
    { value: '', label: 'All', count: inTab.length },
    ...(hub.value?.statuses ?? []).map((s: string) => ({ value: s, label: s, count: inTab.filter((l: EmployeeLoan) => l.status === s).length }))
  ];

  const activeFilters = [
    search && `search “${search}”`,
    status && `status ${status}`,
    (fromDate || toDate) && `sanctioned ${fromDate || 'the beginning'} → ${toDate || 'today'}`
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setStatus('');
    setFromDate('');
    setToDate('');
    if (search) { setSearch(''); setSearchEpoch(n => n + 1); }
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.employeeId) { setError('Choose the employee'); return; }
    if (!draft.id && !(Number(draft.amount) > 0)) { setError('Enter a valid sanctioned amount (greater than 0)'); return; }
    if (Number(draft.amount || 0) <= 0) { setError('Sanctioned amount must be greater than zero'); return; }

    const isAdvance = draft.kind === 'Advance';
    const selectedEmp = (hub.value?.employees ?? []).find((e: any) => e.id === draft.employeeId);
    const empSalary = Number(selectedEmp?.gross || selectedEmp?.basicSalary || selectedEmp?.net || 0);
    const maxAdvanceAllowed = empSalary > 0 ? Math.round(empSalary * 0.5) : 0;
    const minMonthsForLoan = !isAdvance && Number(draft.amount || 0) > 0 && empSalary > 0
      ? Math.max(1, Math.ceil(Number(draft.amount || 0) / empSalary))
      : 1;

    const perMonth = draft && Number(draft.installments) > 0
      ? Math.round((Number(draft.amount) || 0) / Number(draft.installments)) : 0;

    if (isAdvance && empSalary > 0 && Number(draft.amount || 0) > maxAdvanceAllowed) {
      setError(`Advance amount (Rs. ${money(Number(draft.amount))}) cannot exceed the 50% limit of Rs. ${money(maxAdvanceAllowed)} (Monthly Salary: Rs. ${money(empSalary)}).`);
      return;
    }
    if (!isAdvance && empSalary > 0 && Number(draft.installments || 0) < minMonthsForLoan) {
      setError(`Loan recovery duration must be at least ${minMonthsForLoan} months for an employee with Rs. ${money(empSalary)} monthly salary.`);
      return;
    }
    if (!isAdvance && empSalary > 0 && (Number(draft.installmentAmount) || perMonth) > empSalary) {
      setError(`Monthly installment (Rs. ${money(Number(draft.installmentAmount) || perMonth)}) cannot exceed employee's monthly salary of Rs. ${money(empSalary)}. Minimum ${minMonthsForLoan} months required.`);
      return;
    }

    if (draft.paidOutOf === 'Split') {
      const totalAmt = Number(draft.amount || 0);
      const cashAmt = Number(draft.cashAmount || 0);
      const bankAmt = Number(draft.bankAmount || 0);
      if (cashAmt <= 0 && bankAmt <= 0) {
        setError('Please enter cash and bank amounts for the split payout.');
        return;
      }
      if (cashAmt + bankAmt !== totalAmt) {
        setError(`Split allocation total (Rs. ${money(cashAmt + bankAmt)}) must equal the total sanctioned amount (Rs. ${money(totalAmt)}).`);
        return;
      }
      if (!draft.accountId && cashAmt > 0) {
        setError('Please select a cash drawer for the cash portion.');
        return;
      }
      if (!draft.bankId && bankAmt > 0) {
        setError('Please select a bank account for the bank portion.');
        return;
      }
    }

    setSaving(true); setError(''); setNotice('');
    try {
      const payload: Partial<EmployeeLoan> = {
        ...draft,
        installments: isAdvance ? 1 : Math.max(1, Number(draft.installments) || 1),
        installmentAmount: isAdvance ? Number(draft.amount || 0) : (Number(draft.installmentAmount) || perMonth)
      };

      if (draft.id) {
        const out = await updateLoan(tenantSlug, branchId, draft.id, payload);
        setNotice(`${out.number} has been updated — Rs. ${money(out.balance)} still owed.`);
      } else {
        const created = await saveLoan(tenantSlug, branchId, payload);
        setNotice(`${created.number} — Rs. ${money(created.amount)} sanctioned to ${created.employeeName}.`);
      }
      hub.reload();
      setDraft(null);
    } catch (e) { setError((e as Error).message); }
    setSaving(false);
  };

  const remove = async (l: EmployeeLoan) => {
    setError(''); setNotice(''); setConfirmId(null);
    try {
      await deleteLoan(tenantSlug, branchId, l.id);
      setNotice(`${l.number} has been deleted and its issuing journal taken back.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  const setStatusOf = async (l: EmployeeLoan, next: EmployeeLoan['status']) => {
    setError(''); setNotice('');
    try {
      const out = await updateLoan(tenantSlug, branchId, l.id, { status: next });
      setNotice(`${out.number} is ${out.status.toLowerCase()}.`);
      hub.reload();
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Card */}
      <div className="rounded-sm border border-stroke bg-white p-5 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              Loans &amp; Salary Advances
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage employee salary advances and multi-month loan sanctions, installment schedules, and payroll recoveries.
            </p>
          </div>
          <ListToolbar
            addLabel={tab === 'Advance' ? 'SANCTION ADVANCE' : 'SANCTION LOAN'}
            onAdd={() => {
              setDraft({
                ...blank(months),
                kind: tab === 'Advance' ? 'Advance' : 'Loan',
                installments: tab === 'Advance' ? 1 : 12
              });
              setError('');
              setNotice('');
            }}
          />
        </div>

        {/* Stats Strip */}
        <div className="pt-4 pb-1">
          <StatStrip stats={stats} />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3.5 pt-4 border-t border-stroke dark:border-strokedark">
          <SearchBox
            key={searchEpoch}
            placeholder={tab === 'Advance' ? 'Search advances by voucher #, staff, or purpose' : 'Search loans by voucher #, staff, or purpose'}
            onSearch={setSearch}
          />
          <StatusPills value={status} onChange={setStatus} counts={statusCounts} />
          <DateWindow from={fromDate} to={toDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />
        </div>
      </div>

      {/* Notifications */}
      {(error || hub.error || notice) && (
        <div className={`text-xs font-semibold rounded-md px-4 py-3 flex items-center justify-between shadow-sm ${
          error || hub.error ? 'text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300' : 'text-green-800 bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900 dark:text-green-300'}`}>
          <span>{error || hub.error || notice}</span>
          <button type="button" onClick={() => { setError(''); setNotice(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Sanction / Edit Loan Form */}
      {draft && (
        <LoanForm
          draft={draft}
          setDraft={setDraft}
          hub={hub}
          months={months}
          editable={editable}
          saving={saving}
          onSubmit={submit}
          onClose={() => setDraft(null)}
        />
      )}

      {/* Main Records Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stroke dark:border-strokedark">
          <TabStrip
            tabs={TABS}
            active={tab}
            onChange={(t: string) => {
              setTab(t as 'Advance' | 'Loan');
              setError('');
              setNotice('');
            }}
          />
        </div>

        <LoansTable
          hub={hub}
          visible={visible}
          sort={sort}
          onSort={onSort}
          editable={editable}
          activeFilters={activeFilters}
          clearAll={clearAll}
          shown={shown}
          holders={holders}
          confirmId={confirmId}
          setConfirmId={setConfirmId}
          onView={l => setViewRecord(l)}
          onEdit={l => { setDraft({ ...l }); setError(''); setNotice(''); }}
          onDelete={remove}
          onStatusChange={setStatusOf}
          onAddNew={() => { setDraft(blank(months)); setError(''); setNotice(''); }}
        />
      </div>

      {/* Month-Wise Breakdown & Statement Modal */}
      <LoanDetailsModal
        loan={viewRecord}
        onClose={() => setViewRecord(null)}
      />
    </div>
  );
};

export default LoansPage;
