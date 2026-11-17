import React, { useMemo } from 'react';
import { EmployeeLoan, monthNamed } from '../../../../services/hr.service';
import { isoDay } from '../../../../utils/dateRange';
import {
  Area, Check, Field, FormFooter, Pick, SearchPick, Text
} from '../../../Masters/masterUi';
import { money, calcEndMonth } from '../utils/loanHelpers';

interface LoanFormProps {
  draft: Partial<EmployeeLoan>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<EmployeeLoan> | null>>;
  hub: any;
  months: string[];
  editable: boolean;
  saving: boolean;
  onSubmit: () => Promise<void>;
  onClose: () => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  draft,
  setDraft,
  hub,
  months,
  editable,
  saving,
  onSubmit,
  onClose,
}) => {
  const set = (patch: Partial<EmployeeLoan>) => setDraft(d => (d ? { ...d, ...patch } : d));

  const isAdvance = draft?.kind === 'Advance';
  const selectedEmp = useMemo(() => {
    return (hub.value?.employees ?? []).find((e: any) => e.id === draft?.employeeId);
  }, [hub.value?.employees, draft?.employeeId]);

  const empSalary = Number(selectedEmp?.gross || selectedEmp?.basicSalary || selectedEmp?.net || 0);
  const maxAdvanceAllowed = empSalary > 0 ? Math.round(empSalary * 0.5) : 0;
  const isNegativeAmount = draft?.amount !== undefined && draft?.amount !== null && Number(draft.amount) < 0;
  const isOverAdvanceLimit = isAdvance && empSalary > 0 && Number(draft?.amount || 0) > maxAdvanceAllowed;

  const minMonthsForLoan = useMemo(() => {
    const amt = Number(draft?.amount || 0);
    if (!isAdvance && amt > 0 && empSalary > 0) {
      return Math.max(1, Math.ceil(amt / empSalary));
    }
    return 1;
  }, [isAdvance, draft?.amount, empSalary]);

  const isUnderMinMonths = !isAdvance && empSalary > 0 && Number(draft?.amount || 0) > 0 && Number(draft?.installments || 0) > 0 && Number(draft?.installments || 0) < minMonthsForLoan;

  const currentMonthCode = draft?.sanctionedOn ? draft.sanctionedOn.slice(0, 7) : (months[0] ?? isoDay().slice(0, 7));
  const nextMonthCode = useMemo(() => {
    const mIndex = months.indexOf(currentMonthCode);
    if (mIndex >= 0 && mIndex + 1 < months.length) return months[mIndex + 1];
    const d = new Date(currentMonthCode + '-01');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  }, [currentMonthCode, months]);
  const isThisMonthRecovery = (draft?.startMonth || currentMonthCode) === currentMonthCode;

  const loanStartMonth = draft?.startMonth || currentMonthCode;
  const loanEndMonth = calcEndMonth(loanStartMonth, Number(draft?.installments || 1));

  const perMonth = draft && Number(draft.installments) > 0
    ? Math.round((Number(draft.amount) || 0) / Number(draft.installments)) : 0;

  return (
    <div className="rounded-sm border border-stroke bg-white p-5 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="text-base font-bold text-black dark:text-white mb-5 pb-3 border-b border-stroke dark:border-strokedark">
        {draft.id ? `Edit ${draft.number} - ${draft.employeeName}` : 'Sanction a Loan or Advance'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Employee Picker */}
        <Field label="Employee" required className="lg:col-span-2">
          <SearchPick
            options={(hub.value?.employees ?? []).map((e: any) => ({ id: e.id, label: e.name, sub: e.code }))}
            valueId={draft.employeeId || null}
            valueLabel={draft.employeeName}
            onPick={o => {
              const amt = Number(draft.amount || 0);
              const inst = Number(draft.installments || 12);
              const perM = !isAdvance && inst > 0 ? Math.round(amt / inst) : amt;
              set({
                employeeId: o?.id ?? 0,
                employeeName: o?.label ?? '',
                installmentAmount: isAdvance ? amt : perM
              });
            }}
            placeholder="Search staff by name or code..."
          />
        </Field>

        {/* Kind (Advance / Loan) */}
        <Field label="Kind" required hint={isAdvance ? "Advance: 100% recovered from next salary" : "Loan: Recovered over monthly installments"}>
          <Pick value={draft.kind ?? 'Advance'} onChange={e => {
            const k = e.target.value as 'Advance' | 'Loan';
            const isAdv = k === 'Advance';
            const amt = Number(draft.amount || 0);
            const inst = isAdv ? 1 : Number(draft.installments || 12);
            const perM = isAdv ? amt : (inst > 0 ? Math.round(amt / inst) : 0);
            set({
              kind: k,
              installments: inst,
              installmentAmount: perM
            });
          }} disabled={!editable}>
            {(hub.value?.kinds ?? ['Advance', 'Loan']).map((k: string) => <option key={k} value={k}>{k}</option>)}
          </Pick>
        </Field>

        {/* Employee Salary Overview Strip */}
        {selectedEmp && (
          <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Monthly Gross Salary</span>
                <span className="font-bold font-mono text-black dark:text-white text-sm">
                  {empSalary > 0 ? `Rs. ${money(empSalary)}` : 'Not configured'}
                </span>
              </div>
              {isAdvance && empSalary > 0 && (
                <div className="border-l border-stroke dark:border-strokedark pl-4">
                  <span className="text-gray-400 block text-[11px] font-medium">Advance Policy Limit (50%)</span>
                  <span className="font-bold font-mono text-teal-600 dark:text-teal-400 text-sm">
                    Max Rs. {money(maxAdvanceAllowed)}
                  </span>
                </div>
              )}
              {!isAdvance && empSalary > 0 && Number(draft.amount || 0) > 0 && (
                <div className="border-l border-stroke dark:border-strokedark pl-4">
                  <span className="text-gray-400 block text-[11px] font-medium">Minimum Required Duration</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                    {minMonthsForLoan} Months (Max Rs. {money(empSalary)}/mo)
                  </span>
                </div>
              )}
            </div>

            {isAdvance && empSalary > 0 && !draft.id && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-400 text-[11px]">Quick Amount:</span>
                <button
                  type="button"
                  onClick={() => set({ amount: Math.round(empSalary * 0.25), installmentAmount: Math.round(empSalary * 0.25) })}
                  className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-mono text-[11px] font-bold hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                >
                  25% (Rs. {money(Math.round(empSalary * 0.25))})
                </button>
                <button
                  type="button"
                  onClick={() => set({ amount: maxAdvanceAllowed, installmentAmount: maxAdvanceAllowed })}
                  className="px-2.5 py-1 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition shadow-2xs cursor-pointer"
                >
                  50% Max (Rs. {money(maxAdvanceAllowed)})
                </button>
              </div>
            )}

            {!isAdvance && empSalary > 0 && !draft.id && Number(draft.amount || 0) > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-400 text-[11px]">Quick Duration:</span>
                <button
                  type="button"
                  onClick={() => {
                    const amt = Number(draft.amount || 0);
                    set({ installments: minMonthsForLoan, installmentAmount: Math.round(amt / minMonthsForLoan) });
                  }}
                  className="px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                >
                  Min ({minMonthsForLoan} mo · Rs. {money(Math.round((draft.amount || 0) / minMonthsForLoan))}/mo)
                </button>
                {minMonthsForLoan <= 12 && (
                  <button
                    type="button"
                    onClick={() => {
                      const amt = Number(draft.amount || 0);
                      set({ installments: 12, installmentAmount: Math.round(amt / 12) });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-mono text-[11px] font-bold hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                  >
                    12 mo (Rs. {money(Math.round((draft.amount || 0) / 12))}/mo)
                  </button>
                )}
                {minMonthsForLoan <= 24 && (
                  <button
                    type="button"
                    onClick={() => {
                      const amt = Number(draft.amount || 0);
                      set({ installments: 24, installmentAmount: Math.round(amt / 24) });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-mono text-[11px] font-bold hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                  >
                    24 mo (Rs. {money(Math.round((draft.amount || 0) / 24))}/mo)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sanctioned Date */}
        <Field label="Sanctioned On" required>
          <Text type="date" value={draft.sanctionedOn ?? ''} onChange={e => set({ sanctionedOn: e.target.value })} disabled={!editable} />
        </Field>

        {/* Amount */}
        <Field
          label="Sanctioned Amount (Rs.)"
          required
          error={isNegativeAmount ? 'Amount must be greater than zero' : isOverAdvanceLimit ? `Exceeds 50% salary limit (Rs. ${money(maxAdvanceAllowed)})` : undefined}
        >
          <Text
            type="number"
            min="1"
            max={isAdvance && empSalary > 0 ? maxAdvanceAllowed : undefined}
            value={draft.amount !== undefined && draft.amount !== null ? draft.amount : ''}
            placeholder={isAdvance && empSalary > 0 ? `Max Rs. ${money(maxAdvanceAllowed)}` : 'e.g. 50000'}
            onKeyDown={e => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                e.preventDefault();
              }
            }}
            onChange={e => {
              const val = e.target.value;
              if (val === '') {
                set({ amount: '' as any, installmentAmount: 0 });
                return;
              }
              const amt = Math.max(0, Number(val) || 0);
              const inst = Number(draft.installments || 12);
              const perM = !isAdvance && inst > 0 ? Math.round(amt / inst) : amt;
              set({
                amount: amt,
                installmentAmount: perM
              });
            }}
            disabled={!editable || !!draft.id}
          />
        </Field>

        {/* If Loan: Show Installments & Monthly Amount */}
        {!isAdvance ? (
          <>
            <Field
              label="Recovered Over (months)"
              required
              hint={!isUnderMinMonths && empSalary > 0 && minMonthsForLoan > 1 ? `Min ${minMonthsForLoan} months required` : 'Number of monthly installments'}
              error={isUnderMinMonths ? `Minimum ${minMonthsForLoan} months required (Max Rs. ${money(empSalary)}/mo salary)` : undefined}
            >
              <Text
                type="number"
                min="1"
                value={draft.installments !== undefined && draft.installments !== null ? draft.installments : ''}
                placeholder={String(minMonthsForLoan || 12)}
                onKeyDown={e => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={e => {
                  const userVal = e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1);
                  const amt = Number(draft.amount || 0);
                  const valNum = Number(userVal) || 0;
                  set({
                    installments: userVal as any,
                    installmentAmount: valNum > 0 ? Math.round(amt / valNum) : 0
                  });
                }}
                disabled={!editable || !!draft.id}
              />
            </Field>
            <Field
              label="Monthly Installment (Rs.)"
              hint={draft.id ? 'May not exceed outstanding balance.' : `Auto split: Rs. ${money(perMonth)} / mo`}
              error={empSalary > 0 && (Number(draft.installmentAmount || perMonth) > empSalary) ? `Exceeds monthly salary (Rs. ${money(empSalary)})` : undefined}
            >
              <Text
                type="number"
                min="0"
                max={empSalary > 0 ? empSalary : undefined}
                value={draft.installmentAmount || ''}
                placeholder={String(perMonth)}
                onKeyDown={e => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={e => set({ installmentAmount: Math.max(0, Number(e.target.value) || 0) })}
                disabled={!editable}
              />
            </Field>
          </>
        ) : (
          <div className="lg:col-span-2 flex items-center p-3.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 self-center mt-2">
            <p className="text-xs text-teal-800 dark:text-teal-300 font-medium">
              <span className="font-bold">Lump Sum Salary Advance:</span> Full amount of <span className="font-bold font-mono">Rs. {money(draft.amount || 0)}</span> will be deducted once on the selected recovery month.
            </p>
          </div>
        )}

        {/* Recovery Starts Month */}
        <Field
          label="Recovery Month"
          required
          hint={!isAdvance
            ? `Repayment Schedule: ${monthNamed(loanStartMonth)} → ${monthNamed(loanEndMonth)} (${Number(draft.installments || 1)} months)`
            : 'The salary month advance is recovered in full'
          }
        >
          <Pick value={draft.startMonth ?? ''} onChange={e => set({ startMonth: e.target.value })} disabled={!editable}>
            {months.map(m => <option key={m} value={m}>{monthNamed(m)}</option>)}
          </Pick>
        </Field>

        {/* If Loan: Checkbox Option for Cut installment from this month's salary */}
        {!isAdvance && (
          <div className="lg:col-span-4 p-3 rounded-lg bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Check
                checked={isThisMonthRecovery}
                onChange={(checked: boolean) => {
                  set({ startMonth: checked ? currentMonthCode : nextMonthCode });
                }}
                label="Cut installment from this month's salary"
                disabled={!editable}
              />
            </div>
            <div className="text-xs font-medium">
              {isThisMonthRecovery ? (
                <span className="text-teal-700 dark:text-teal-400">
                  ✓ Starts in <strong>{monthNamed(currentMonthCode)}</strong> · Completes in <strong>{monthNamed(calcEndMonth(currentMonthCode, Number(draft.installments || 1)))}</strong> ({Number(draft.installments || 1)} installments)
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  ⏳ Starts in <strong>{monthNamed(loanStartMonth)}</strong> · Completes in <strong>{monthNamed(loanEndMonth)}</strong> ({Number(draft.installments || 1)} installments)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Paid Out Of (Mode) */}
        <Field label="Paid Out Of" required hint="Cash drawer, bank account, or split between both">
          <Pick
            value={draft.paidOutOf || (draft.bankId || draft.bankName ? 'Bank' : 'Cash')}
            onChange={e => {
              const mode = e.target.value as 'Cash' | 'Bank' | 'Split';
              const defaultBank = (hub.value?.banks ?? [])[0];
              const defaultCash = (hub.value?.cashAccounts ?? [])[0];
              const totalAmt = Number(draft.amount || 0);

              if (mode === 'Split') {
                const halfCash = Math.floor(totalAmt / 2);
                const halfBank = totalAmt - halfCash;
                set({
                  paidOutOf: 'Split',
                  accountId: draft.accountId ?? (defaultCash?.id || null),
                  accountName: defaultCash ? `${defaultCash.account_code ? `${defaultCash.account_code} - ` : ''}${defaultCash.account_title}` : 'Cash in Hand',
                  cashAmount: draft.cashAmount !== undefined && draft.cashAmount > 0 ? draft.cashAmount : halfCash,
                  bankId: draft.bankId ?? (defaultBank?.id || null),
                  bankName: defaultBank?.bankName || '',
                  bankAmount: draft.bankAmount !== undefined && draft.bankAmount > 0 ? draft.bankAmount : halfBank
                });
              } else if (mode === 'Bank') {
                set({
                  paidOutOf: 'Bank',
                  bankId: defaultBank?.id || null,
                  bankName: defaultBank?.bankName || '',
                  bankAmount: totalAmt,
                  cashAmount: 0,
                  accountId: null,
                  accountName: defaultBank ? `${defaultBank.bankName} (${defaultBank.accountNumber || defaultBank.accountTitle || ''})` : 'Bank'
                });
              } else {
                set({
                  paidOutOf: 'Cash',
                  bankId: null,
                  bankName: '',
                  bankAmount: 0,
                  cashAmount: totalAmt,
                  accountId: defaultCash?.id || null,
                  accountName: defaultCash ? `${defaultCash.account_code ? `${defaultCash.account_code} - ` : ''}${defaultCash.account_title}` : 'Cash in Hand'
                });
              }
            }}
            disabled={!editable}
          >
            <option value="Cash">💵 Cash in Hand</option>
            <option value="Bank">🏦 Bank Account / Transfer</option>
            <option value="Split">💳 Split (Cash + Bank)</option>
          </Pick>
        </Field>

        {/* If Single Cash: Show Cash Drawer Selector */}
        {(!draft.paidOutOf || draft.paidOutOf === 'Cash') && !draft.bankId && !draft.bankName && (
          <Field label="Select Cash Drawer" required className="lg:col-span-2" hint="Cash drawer ledger to debit/credit">
            <Pick
              value={String(draft.accountId ?? ((hub.value?.cashAccounts ?? [])[0]?.id || ''))}
              onChange={e => {
                const cId = Number(e.target.value);
                const c = (hub.value?.cashAccounts ?? []).find((x: any) => x.id === cId);
                set({
                  accountId: cId || null,
                  accountName: c ? `${c.account_code ? `${c.account_code} - ` : ''}${c.account_title}` : 'Cash in Hand'
                });
              }}
              disabled={!editable}
            >
              {(hub.value?.cashAccounts ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.account_code ? `${c.account_code} — ` : ''}{c.account_title}
                </option>
              ))}
            </Pick>
          </Field>
        )}

        {/* If Single Bank: Show Bank Account Selector & Cheque Ref */}
        {draft.paidOutOf === 'Bank' && (
          <>
            <Field label="Select Bank Account" required className="lg:col-span-2">
              <Pick
                value={String(draft.bankId ?? ((hub.value?.banks ?? [])[0]?.id || ''))}
                onChange={e => {
                  const bId = Number(e.target.value);
                  const b = (hub.value?.banks ?? []).find((x: any) => x.id === bId);
                  set({
                    bankId: bId || null,
                    bankName: b?.bankName || '',
                    accountName: b ? `${b.bankName} (${b.accountNumber || b.accountTitle})` : 'Bank'
                  });
                }}
                disabled={!editable}
              >
                {(hub.value?.banks ?? []).map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountNumber ? `${b.accountNumber} (${b.accountTitle || ''})` : b.accountTitle}
                  </option>
                ))}
              </Pick>
            </Field>

            <Field label="Cheque / Transaction Ref #" hint="Optional transaction or cheque #">
              <Text
                value={draft.chequeNo ?? ''}
                onChange={e => set({ chequeNo: e.target.value })}
                placeholder="e.g. CHQ-99120 or TXN-5541"
                disabled={!editable}
              />
            </Field>
          </>
        )}

        {/* If Split: Render Cash + Bank Breakdown Panel */}
        {draft.paidOutOf === 'Split' && (() => {
          const totalAmt = Number(draft.amount || 0);
          const cashAmt = Number(draft.cashAmount || 0);
          const bankAmt = Number(draft.bankAmount || 0);
          const sum = cashAmt + bankAmt;
          const diff = totalAmt - sum;
          const isMatch = totalAmt > 0 && diff === 0;

          return (
            <div className="lg:col-span-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/70 dark:border-amber-800/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    💳 Split Disbursement Breakdown (Cash + Bank)
                  </span>
                  {isMatch ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                      ✓ Balanced: Rs. {money(totalAmt)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                      ⚠️ {diff > 0 ? `Rs. ${money(diff)} Remaining to Allocate` : `Rs. ${money(Math.abs(diff))} Over Allocated`}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const halfCash = Math.floor(totalAmt / 2);
                    const halfBank = totalAmt - halfCash;
                    set({ cashAmount: halfCash, bankAmount: halfBank });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <span>⚡ Split 50 / 50</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cash Portion */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      💵 Cash Portion
                    </span>
                    <span className="text-xs font-mono font-bold text-black dark:text-white">
                      Rs. {money(draft.cashAmount || 0)}
                    </span>
                  </div>

                  <Field label="Cash Amount (Rs.)" required>
                    <Text
                      type="number"
                      min="0"
                      value={draft.cashAmount !== undefined && draft.cashAmount !== null ? draft.cashAmount : ''}
                      placeholder="e.g. 10000"
                      onChange={e => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        set({ cashAmount: val });
                      }}
                      disabled={!editable}
                    />
                  </Field>

                  <Field label="Select Cash Drawer" required>
                    <Pick
                      value={String(draft.accountId ?? ((hub.value?.cashAccounts ?? [])[0]?.id || ''))}
                      onChange={e => {
                        const cId = Number(e.target.value);
                        const c = (hub.value?.cashAccounts ?? []).find((x: any) => x.id === cId);
                        set({
                          accountId: cId || null,
                          accountName: c ? `${c.account_code ? `${c.account_code} - ` : ''}${c.account_title}` : 'Cash in Hand'
                        });
                      }}
                      disabled={!editable}
                    >
                      {(hub.value?.cashAccounts ?? []).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.account_code ? `${c.account_code} — ` : ''}{c.account_title}
                        </option>
                      ))}
                    </Pick>
                  </Field>
                </div>

                {/* Bank Portion */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                      🏦 Bank Portion
                    </span>
                    <span className="text-xs font-mono font-bold text-black dark:text-white">
                      Rs. {money(draft.bankAmount || 0)}
                    </span>
                  </div>

                  <Field label="Bank Amount (Rs.)" required>
                    <Text
                      type="number"
                      min="0"
                      value={draft.bankAmount !== undefined && draft.bankAmount !== null ? draft.bankAmount : ''}
                      placeholder="e.g. 10000"
                      onChange={e => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        set({ bankAmount: val });
                      }}
                      disabled={!editable}
                    />
                  </Field>

                  <Field label="Select Bank Account" required>
                    <Pick
                      value={String(draft.bankId ?? ((hub.value?.banks ?? [])[0]?.id || ''))}
                      onChange={e => {
                        const bId = Number(e.target.value);
                        const b = (hub.value?.banks ?? []).find((x: any) => x.id === bId);
                        set({
                          bankId: bId || null,
                          bankName: b?.bankName || '',
                          accountName: b ? `${b.bankName} (${b.accountNumber || b.accountTitle})` : 'Bank'
                        });
                      }}
                      disabled={!editable}
                    >
                      {(hub.value?.banks ?? []).map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} — {b.accountNumber ? `${b.accountNumber} (${b.accountTitle || ''})` : b.accountTitle}
                        </option>
                      ))}
                    </Pick>
                  </Field>

                  <Field label="Cheque / Transaction Ref #" hint="Optional transaction or cheque #">
                    <Text
                      value={draft.chequeNo ?? ''}
                      onChange={e => set({ chequeNo: e.target.value })}
                      placeholder="e.g. CHQ-99120 or TXN-5541"
                      disabled={!editable}
                    />
                  </Field>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Purpose */}
        <Field label="Purpose" className="lg:col-span-4">
          <Text value={draft.purpose ?? ''} onChange={e => set({ purpose: e.target.value })} placeholder="e.g. Medical, emergency, festival advance" disabled={!editable} />
        </Field>

        {/* Remarks */}
        <Field label="Remarks" className="lg:col-span-4">
          <Area rows={2} value={draft.remarks ?? ''} onChange={e => set({ remarks: e.target.value })} disabled={!editable} />
        </Field>

        {!!draft.id && draft.status !== 'Cancelled' && (
          <div className="flex items-center gap-4 lg:col-span-4 pt-2">
            <Check checked={draft.status === 'Active'} onChange={v => set({ status: v ? 'Active' : 'Closed' })}
              label="Still being recovered" disabled={!editable || (draft.balance ?? 0) <= 0} />
            <span className="text-xs text-gray-500 font-mono">
              {money(draft.deducted ?? 0)} recovered · {money(draft.balance ?? 0)} remaining ·
              {' '}{draft.left ?? 0} installment(s) left
            </span>
          </div>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
        <FormFooter onSave={onSubmit} onClose={onClose} saving={saving} disabled={!editable}
          saveLabel={draft.id ? 'SAVE' : 'SANCTION AND POST'} />
      </div>
    </div>
  );
};
