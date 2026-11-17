import React, { useMemo, useState } from 'react';
import { isoDay } from '../../utils/dateRange';
import { X } from 'lucide-react';
import { useTenant } from '../../Context/TenantContext';
import { useAuth } from '../../Context/AuthContext';
import {
  approveSheet,
  createSheet,
  deleteSheet,
  getSheet,
  getSheets,
  HrSettings,
  LoanRecoveryItem,
  PayItem,
  PayrollLine,
  previewSheet,
  SalarySheetHead,
  SalarySheetView,
  paySheet,
  saveHrSettings,
  saveSheetLines,
  SheetStatus,
  unapproveSheet,
  updateSheet
} from '../../services/hr.service';
import { SortState } from '../Masters/masterUi';
import { useHub } from '../Setup/useHub';

import { money, thisMonth } from './salary-sheet/utils/salarySheetUtils';
import SalarySheetHeader from './salary-sheet/components/SalarySheetHeader';
import SalarySheetStatsStrip from './salary-sheet/components/SalarySheetStatsStrip';
import SalarySheetToolbar from './salary-sheet/components/SalarySheetToolbar';
import SalarySheetDetailView from './salary-sheet/components/SalarySheetDetailView';
import SalarySheetListTable from './salary-sheet/components/SalarySheetListTable';
import SalarySheetPreviewSection from './salary-sheet/components/SalarySheetPreviewSection';
import GenerateSalarySheetModal from './salary-sheet/modals/GenerateSalarySheetModal';

export const SalarySheetPage: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const { can } = useAuth();
  const hub = useHub(() => getSheets(tenantSlug, branchId), [tenantSlug, branchId]);
  const [month, setMonth] = useState(thisMonth());
  const [opts, setOpts] = useState({
    deductForAbsence: false,
    recoverLoans: true,
    payBonus: false,
    bonusAmount: 10000,
    bonusReason: ''
  });
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewSheet>>['data'] | null>(null);
  const [detail, setDetail] = useState<SalarySheetView | null>(null);
  const [originalDetail, setOriginalDetail] = useState<SalarySheetView | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjust, setAdjust] = useState<{
    extraEarnings: PayItem[];
    extraDeductions: PayItem[];
    loanRecoveries: LoanRecoveryItem[];
    remarks: string;
  }>({
    extraEarnings: [],
    extraDeductions: [],
    loanRecoveries: [],
    remarks: ''
  });
  const [pay, setPay] = useState<{
    open: boolean;
    payThrough: string;
    accountId: string;
    date: string;
  }>({
    open: false,
    payThrough: 'Bank Transfer',
    accountId: '',
    date: isoDay()
  });
  const [, setSettings] = useState<HrSettings | null>(null);
  const [search, setSearch] = useState('');
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [status, setStatus] = useState<SheetStatus | ''>('');
  const [sort, setSort] = useState<SortState | null>({ key: 'month', dir: 'desc' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const editable = can('hr-salary-sheet:edit');
  const sheets = hub.value?.data ?? [];
  const heads = hub.value?.heads ?? [];
  const accounts = hub.value?.accounts ?? [];
  const flags = hub.value?.settings ?? null;

  const existingSheet = useMemo(
    () => sheets.find((s) => s.month === month),
    [sheets, month]
  );

  const inScope = useMemo(
    () =>
      sheets.filter(
        (s) =>
          !search.trim() ||
          `${s.number} ${s.monthLabel} ${s.status} ${s.payThrough} ${s.accountName} ${s.journalNumber}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
      ),
    [sheets, search]
  );

  const visible = useMemo(() => {
    const list = status ? inScope.filter((s) => s.status === status) : inScope;
    if (!sort) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a: any, b: any) => {
      const av = a[sort.key],
        bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [inScope, status, sort]);

  const onSort = (k: string) =>
    setSort((s) =>
      s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }
    );

  const shown = useMemo(
    () => ({
      employees: visible.reduce((s, x) => s + x.employees, 0),
      gross: visible.reduce((s, x) => s + x.gross, 0),
      deductions: visible.reduce((s, x) => s + x.deductions, 0),
      netPayable: visible.reduce((s, x) => s + x.netPayable, 0),
      unpaidDays: visible.reduce((s, x) => s + x.unpaidDays, 0)
    }),
    [visible]
  );

  const statusCounts = [
    { value: '' as SheetStatus | '', label: 'All', count: inScope.length },
    ...(['Draft', 'Approved', 'Paid'] as SheetStatus[]).map((s) => ({
      value: s,
      label: s,
      count: inScope.filter((x) => x.status === s).length
    }))
  ];

  const activeFilters = [
    search && `search “${search}”`,
    status && `status ${status}`
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setStatus('');
    if (search) {
      setSearch('');
      setSearchEpoch((n) => n + 1);
    }
  };

  const applyPayrollOptions = (newOpts: {
    deductForAbsence: boolean;
    recoverLoans: boolean;
    payBonus?: boolean;
    bonusAmount?: number;
    bonusReason?: string;
  }) => {
    setOpts((prev) => ({ ...prev, ...newOpts }));
    if (!detail || detail.status !== 'Draft') return;

    const [y, m] = (detail.month || month).split('-').map(Number);
    const totalMonthDays = new Date(y || 2026, m || 10, 0).getDate() || 30;

    const updatedLines = detail.lines.map((cur) => {
      let absentCut = 0;
      if (newOpts.deductForAbsence) {
        const unpaidDays = Number(
          cur.unpaidDays ?? (Number(cur.absent || 0) + Number(cur.halfDays || 0) * 0.5)
        );
        absentCut =
          totalMonthDays > 0 ? Math.round((Number(cur.basic || 0) / totalMonthDays) * unpaidDays) : 0;
      }

      const existingRecoveries =
        cur.loanRecoveries && cur.loanRecoveries.length
          ? cur.loanRecoveries
          : cur.recoveries || [];
      const loanRecoveries = existingRecoveries.map((r: any) => {
        const standardInst = Number(r.installmentAmount || r.amount || 0);
        const deductAmount = newOpts.recoverLoans ? standardInst : 0;
        return {
          ...r,
          deductAmount,
          isSkipped: !newOpts.recoverLoans || deductAmount === 0
        };
      });

      const advanceDeduction = loanRecoveries
        .filter((r: any) => String(r.kind || '').toLowerCase().includes('adv'))
        .reduce((s: number, r: any) => s + (r.isSkipped ? 0 : Number(r.deductAmount || 0)), 0);

      const loanDeduction = loanRecoveries
        .filter((r: any) => !String(r.kind || '').toLowerCase().includes('adv'))
        .reduce((s: number, r: any) => s + (r.isSkipped ? 0 : Number(r.deductAmount || 0)), 0);

      const recoveries = loanRecoveries.map((r: any) => ({
        loanId: r.loanId,
        number: r.number,
        amount: r.isSkipped ? 0 : Number(r.deductAmount || 0),
        kind: r.kind,
        isSkipped: r.isSkipped
      }));

      let bonus = Number(cur.bonus || 0);
      let bonusReason = cur.bonusReason || '';
      if (
        newOpts.payBonus !== undefined ||
        newOpts.bonusAmount !== undefined ||
        newOpts.bonusReason !== undefined
      ) {
        const shouldPay = newOpts.payBonus !== undefined ? newOpts.payBonus : opts.payBonus;
        const amt = newOpts.bonusAmount !== undefined ? newOpts.bonusAmount : opts.bonusAmount;
        const rsn = newOpts.bonusReason !== undefined ? newOpts.bonusReason : opts.bonusReason;
        bonus = shouldPay ? Number(amt || 0) : 0;
        bonusReason = shouldPay ? rsn : '';
      }

      const gross = Number(cur.basic || 0) + bonus;
      const totalDeductions = absentCut + advanceDeduction + loanDeduction;
      const netPay = Math.max(0, gross - totalDeductions);

      return {
        ...cur,
        absentCut,
        absence: absentCut,
        advanceDeduction,
        loanDeduction,
        loanRecoveries,
        recoveries,
        bonus,
        bonusReason,
        gross,
        totalDeductions,
        netPay,
        net: netPay
      };
    });

    const gross = updatedLines.reduce(
      (s, l) => s + (Number(l.basic || 0) + Number(l.bonus || 0)),
      0
    );
    const deductions = updatedLines.reduce(
      (s, l) =>
        s +
        (Number(l.absentCut || l.absence || 0) +
          Number(l.advanceDeduction || 0) +
          Number(l.loanDeduction || 0)),
      0
    );
    const netPayable = updatedLines.reduce((s, l) => s + Number(l.netPay ?? l.net ?? 0), 0);

    setDetail((d: any) => ({ ...d, lines: updatedLines, gross, deductions, netPayable }));
    setHasUnsavedChanges(true);
  };

  const saveDraftChanges = async () => {
    if (!detail) return;
    setBusy(true);
    setError('');
    try {
      await saveSheetLines(detail.id, detail.lines);
      setOriginalDetail(JSON.parse(JSON.stringify(detail)));
      setHasUnsavedChanges(false);
      setNotice(`All changes saved to ${detail.number}.`);
      hub.reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const discardDraftChanges = () => {
    if (originalDetail) {
      setDetail(JSON.parse(JSON.stringify(originalDetail)));
    }
    setHasUnsavedChanges(false);
    setNotice('Unsaved changes discarded.');
  };

  const closeDetail = () => {
    if (hasUnsavedChanges && originalDetail) {
      setDetail(JSON.parse(JSON.stringify(originalDetail)));
    }
    setDetail(null);
    setOriginalDetail(null);
    setHasUnsavedChanges(false);
    setAdjusting(null);
  };

  const handleConfirmGenerate = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const existing = sheets.find((s) => s.month === month);
      if (existing) {
        await open(existing);
        setNotice(
          `Opened existing ${existing.number} for ${existing.monthLabel} (${existing.status}).`
        );
        setShowGenerateModal(false);
        setBusy(false);
        return;
      }

      const s = await createSheet(tenantSlug, branchId, {
        month,
        deductForAbsence: opts.deductForAbsence,
        recoverLoans: opts.recoverLoans,
        payBonus: opts.payBonus,
        bonusAmount: opts.bonusAmount,
        bonusReason: opts.bonusReason,
        payThrough: flags?.paySalaryThrough,
        accountId: null,
        notes: ''
      });
      setShowGenerateModal(false);
      setNotice(
        `${s.number} raised for ${s.monthLabel} — ${s.employees} staff, Rs. ${money(
          s.netPayable
        )} payable.`
      );
      setPreview(null);
      hub.reload();
      setDetail(s);
      setOriginalDetail(JSON.parse(JSON.stringify(s)));
      setHasUnsavedChanges(false);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const open = async (head: SalarySheetHead) => {
    setError('');
    setNotice('');
    setAdjusting(null);
    try {
      const s = await getSheet(tenantSlug, branchId, head.id);
      setDetail(s);
      setOriginalDetail(JSON.parse(JSON.stringify(s)));
      setHasUnsavedChanges(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const act = async (
    fn: () => Promise<SalarySheetView>,
    message: (out: SalarySheetView) => string
  ) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const out = await fn();
      setDetail(out);
      setNotice(message(out));
      hub.reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const approve = (s: SalarySheetView) =>
    act(
      () => approveSheet(tenantSlug, branchId, s.id),
      (out) =>
        `${out.number} approved — journal ${out.journalNumber} posted for Rs. ${money(
          out.netPayable
        )} payable.`
    );

  const unapprove = (s: SalarySheetView) =>
    act(
      () => unapproveSheet(tenantSlug, branchId, s.id),
      (out) =>
        `${out.number} returned to Draft and journal ${out.journalNumber || ''} reversed.`
    );

  const payOut = (s: SalarySheetView) =>
    act(
      () =>
        paySheet(tenantSlug, branchId, s.id, {
          payThrough: pay.payThrough,
          accountId: Number(pay.accountId) || undefined,
          accountName: accounts.find((a) => a.id === Number(pay.accountId))?.name,
          date: pay.date
        }),
      (out) =>
        `${out.number} paid Rs. ${money(out.netPayable)} via ${
          out.accountName || out.payThrough
        } — payment journal ${out.paymentJournalNumber}.`
    );

  const removeSheet = async (s: SalarySheetHead) => {
    setError('');
    setNotice('');
    setConfirmId(null);
    try {
      await deleteSheet(tenantSlug, branchId, s.id);
      setNotice(`${s.number} has been deleted.`);
      if (detail?.id === s.id) {
        setDetail(null);
        setPreview(null);
      }
      hub.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onBonusChange = (empId: number, bonusVal: number) => {
    if (!detail) return;
    const updatedLines = detail.lines.map((l) => {
      if (l.employeeId !== empId) return l;
      const bonus = Math.max(0, Number(bonusVal) || 0);
      const gross = Number(l.basic || 0) + bonus;
      const totalDeductions =
        Number(l.absentCut || l.absence || 0) +
        Number(l.advanceDeduction || l.loanDeduction || 0);
      const netPay = Math.max(0, gross - totalDeductions);
      return { ...l, bonus, gross, netPay, net: netPay, totalDeductions };
    });
    const gross = updatedLines.reduce(
      (s, l) => s + (Number(l.basic || 0) + Number(l.bonus || 0)),
      0
    );
    const deductions = updatedLines.reduce(
      (s, l) =>
        s +
        (Number(l.absentCut || l.absence || 0) +
          Number(l.advanceDeduction || l.loanDeduction || 0)),
      0
    );
    const netPayable = updatedLines.reduce((s, l) => s + Number(l.netPay ?? l.net ?? 0), 0);
    setDetail((d: any) => ({ ...d, lines: updatedLines, gross, deductions, netPayable }));
    setHasUnsavedChanges(true);
  };

  const onBonusReasonChange = (empId: number, reason: string) => {
    if (!detail) return;
    const updatedLines = detail.lines.map((l) => {
      if (l.employeeId !== empId) return l;
      return { ...l, bonusReason: reason };
    });
    setDetail((d: any) => ({ ...d, lines: updatedLines }));
    setHasUnsavedChanges(true);
  };

  const onAbsentCutChange = (empId: number, cutVal: number) => {
    if (!detail) return;
    const updatedLines = detail.lines.map((l) => {
      if (l.employeeId !== empId) return l;
      const absentCut = Math.max(0, Number(cutVal) || 0);
      const gross = Number(l.basic || 0) + Number(l.bonus || 0);
      const totalDeductions =
        absentCut + Number(l.advanceDeduction || l.loanDeduction || 0);
      const netPay = Math.max(0, gross - totalDeductions);
      return { ...l, absentCut, absence: absentCut, gross, netPay, net: netPay, totalDeductions };
    });
    const gross = updatedLines.reduce(
      (s, l) => s + (Number(l.basic || 0) + Number(l.bonus || 0)),
      0
    );
    const deductions = updatedLines.reduce(
      (s, l) =>
        s +
        (Number(l.absentCut || l.absence || 0) +
          Number(l.advanceDeduction || l.loanDeduction || 0)),
      0
    );
    const netPayable = updatedLines.reduce((s, l) => s + Number(l.netPay ?? l.net ?? 0), 0);
    setDetail((d: any) => ({ ...d, lines: updatedLines, gross, deductions, netPayable }));
    setHasUnsavedChanges(true);
  };

  const onLoanRecoveryAmountChange = (empId: number, loanId: number, newAmount: number) => {
    if (!detail) return;
    const updatedLines = detail.lines.map((l) => {
      if (l.employeeId !== empId) return l;
      const loanRecoveries = (l.loanRecoveries || []).map((r) => {
        if (r.loanId !== loanId) return r;
        const val = Math.max(0, Number(newAmount) || 0);
        return {
          ...r,
          deductAmount: val,
          isSkipped: val === 0
        };
      });
      const advanceDeduction = loanRecoveries
        .filter((r) => String(r.kind).toLowerCase().includes('adv'))
        .reduce((s, r) => s + (r.isSkipped ? 0 : r.deductAmount), 0);
      const loanDeduction = loanRecoveries
        .filter((r) => !String(r.kind).toLowerCase().includes('adv'))
        .reduce((s, r) => s + (r.isSkipped ? 0 : r.deductAmount), 0);
      const recoveries = loanRecoveries.map((r) => ({
        loanId: r.loanId,
        number: r.number,
        amount: r.isSkipped ? 0 : r.deductAmount,
        kind: r.kind,
        isSkipped: r.isSkipped
      }));
      const gross = Number(l.basic || 0) + Number(l.bonus || 0);
      const absentCut = Number(l.absentCut || l.absence || 0);
      const totalDeductions = absentCut + advanceDeduction + loanDeduction;
      const netPay = Math.max(0, gross - totalDeductions);
      return {
        ...l,
        loanRecoveries,
        recoveries,
        advanceDeduction,
        loanDeduction,
        gross,
        totalDeductions,
        netPay,
        net: netPay
      };
    });
    const gross = updatedLines.reduce(
      (s, l) => s + (Number(l.basic || 0) + Number(l.bonus || 0)),
      0
    );
    const deductions = updatedLines.reduce(
      (s, l) =>
        s +
        (Number(l.absentCut || l.absence || 0) +
          Number(l.advanceDeduction || l.loanDeduction || 0)),
      0
    );
    const netPayable = updatedLines.reduce((s, l) => s + Number(l.netPay ?? l.net ?? 0), 0);
    setDetail((d: any) => ({ ...d, lines: updatedLines, gross, deductions, netPayable }));
    setHasUnsavedChanges(true);
  };

  const startAdjust = (l: PayrollLine) => {
    setAdjusting(l.employeeId);
    setAdjust({
      extraEarnings: (l.extraEarnings || []).map((i) => ({ ...i })),
      extraDeductions: (l.extraDeductions || []).map((i) => ({ ...i })),
      loanRecoveries: (l.loanRecoveries || []).map((r) => ({ ...r })),
      remarks: l.remarks || ''
    });
  };

  const addItem = (kind: 'extraEarnings' | 'extraDeductions', headId: number) => {
    const head = heads.find((h) => h.id === headId);
    if (!head) return;
    setAdjust((a) => ({
      ...a,
      [kind]: [...a[kind], { headId: head.id, name: head.name, amount: 0 }]
    }));
  };

  const saveAdjust = async (s: SalarySheetView, employeeId: number) => {
    await act(
      () =>
        updateSheet(tenantSlug, branchId, s.id, {
          lines: [
            {
              employeeId,
              extraEarnings: adjust.extraEarnings,
              extraDeductions: adjust.extraDeductions,
              loanRecoveries: adjust.loanRecoveries,
              remarks: adjust.remarks
            }
          ]
        }),
      () => 'Payslip lines and loan deductions updated.'
    );
    setAdjusting(null);
  };

  const lines = detail?.lines ?? preview?.lines ?? [];
  const draftMode = !!detail && detail.status === 'Draft' && editable;

  const deptSum = (f: (d: { staff: number; gross: number; net: number }) => number) =>
    (preview?.byDepartment ?? []).reduce((s, d) => s + f(d), 0);

  const headSum = (kind: string) =>
    (preview?.byHead ?? [])
      .filter((h) => h.kind === kind)
      .reduce((s, h) => s + h.amount, 0);

  return (
    <div className="space-y-5">
      {/* ── TOP HEADER CARD ── */}
      <div className="rounded-lg border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <SalarySheetHeader
          detail={detail}
          busy={busy}
          editable={editable}
          onOpenGenerateModal={() => setShowGenerateModal(true)}
        />

        {/* ── STATS CARDS STRIP ── */}
        <SalarySheetStatsStrip detail={detail} shown={shown} />

        {/* ── TOOLBAR (SEARCH + STATUS PILLS) ── */}
        <SalarySheetToolbar
          detail={detail}
          searchEpoch={searchEpoch}
          onSearch={setSearch}
          status={status}
          onStatusChange={setStatus}
          statusCounts={statusCounts}
        />
      </div>

      {/* ── ALERT NOTICES ── */}
      {(error || hub.error || notice) && (
        <div
          className={`text-xs font-semibold rounded-xl p-3.5 flex items-center justify-between ${
            error || hub.error
              ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900'
              : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900'
          }`}
        >
          <span>{error || hub.error || notice}</span>
          <button
            type="button"
            onClick={() => {
              setError('');
              setNotice('');
            }}
            className="p-1 rounded hover:bg-black/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT (DETAIL VIEW OR LIST TABLE) ── */}
      <div className="rounded-xl border border-stroke bg-white shadow-xs dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {detail ? (
          <SalarySheetDetailView
            detail={detail}
            hasUnsavedChanges={hasUnsavedChanges}
            busy={busy}
            editable={editable}
            opts={opts}
            pay={pay}
            setPay={setPay}
            payThroughOptions={hub.value?.payThrough ?? ['Bank Transfer', 'Cheque', 'Cash']}
            accounts={accounts}
            heads={heads}
            draftMode={draftMode}
            adjusting={adjusting}
            setAdjusting={setAdjusting}
            adjust={adjust}
            setAdjust={setAdjust}
            onCloseDetail={closeDetail}
            onSaveDraftChanges={saveDraftChanges}
            onDiscardDraftChanges={discardDraftChanges}
            onApprove={approve}
            onUnapprove={unapprove}
            onPayOut={payOut}
            onApplyPayrollOptions={applyPayrollOptions}
            onBonusChange={onBonusChange}
            onBonusReasonChange={onBonusReasonChange}
            onAbsentCutChange={onAbsentCutChange}
            onLoanRecoveryAmountChange={onLoanRecoveryAmountChange}
            onStartAdjust={startAdjust}
            onAddItem={addItem}
            onSaveAdjust={saveAdjust}
          />
        ) : (
          <SalarySheetListTable
            loading={hub.loading}
            visible={visible}
            sort={sort}
            onSort={onSort}
            activeFilters={activeFilters}
            onClearFilters={clearAll}
            onOpen={open}
            onRemove={removeSheet}
            editable={editable}
            confirmId={confirmId}
            setConfirmId={setConfirmId}
            shown={shown}
            onOpenGenerateModal={() => setShowGenerateModal(true)}
          />
        )}
      </div>

      {/* ── PREVIEW SECTION (WHEN RUNNING PAYROLL) ── */}
      <SalarySheetPreviewSection
        detail={detail}
        lines={lines}
        preview={preview}
        deptSum={deptSum}
        headSum={headSum}
      />

      {/* ── CONFIRMATION MODAL FOR GENERATING SALARY SHEET ── */}
      <GenerateSalarySheetModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        month={month}
        setMonth={setMonth}
        months={hub.value?.months ?? [month]}
        existingSheet={existingSheet}
        opts={opts}
        setOpts={setOpts}
        busy={busy}
        onConfirmGenerate={handleConfirmGenerate}
        onOpenExistingSheet={(s) => {
          open(s);
          setNotice(`Opened existing ${s.number} for ${s.monthLabel} (${s.status}).`);
        }}
        sheets={sheets}
      />
    </div>
  );
};

export default SalarySheetPage;
