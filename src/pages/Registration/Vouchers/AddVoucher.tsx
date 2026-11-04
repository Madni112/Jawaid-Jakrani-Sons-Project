import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import AccountCombobox from '../../../components/AccountCombobox';


const normalizeVoucherType = (type?: string) => {
  if (!type) return '';
  const t = type.trim();
  if (t === 'JV' || t.toLowerCase().includes('journal')) return 'Journal Voucher';
  if (t === 'CPV' || t.toLowerCase().includes('cash payment')) return 'Cash Payment Voucher';
  if (t === 'CRV' || t.toLowerCase().includes('cash receipt')) return 'Cash Receipt Voucher';
  if (t === 'BPV' || t.toLowerCase().includes('bank payment')) return 'Bank Payment Voucher';
  if (t === 'BRV' || t.toLowerCase().includes('bank receipt')) return 'Bank Receipt Voucher';
  return t;
};

const buildInitialItems = (v: any) => {
  const isOB = v?.voucher_no?.startsWith('OB-') || 
    (v?.narration && String(v.narration).toLowerCase().includes('opening balance')) ||
    (v?.notes && String(v.notes).toLowerCase().includes('opening balance'));

  if (isOB) {
    let custCode = v?.account_code || '';
    let d = Number(v?.debit) || 0;
    let c = Number(v?.credit) || 0;
    let desc = v?.narration || v?.notes || `Opening Balance for Customer ${v?.account_title || ''}`;
    let sm = '';

    if (v?.items && Array.isArray(v.items) && v.items.length > 0) {
      const foundCust = v.items.find((it: any) => it.accountCode !== '3010-001' && (String(it.accountCode).startsWith('2020-') || it.accountCode));
      if (foundCust) {
        custCode = foundCust.accountCode || custCode;
        d = Number(foundCust.debit) || 0;
        c = Number(foundCust.credit) || 0;
        desc = foundCust.description || desc;
        sm = foundCust.salesman || '';
      }
    }

    if (d === 0 && c === 0) {
      d = Number(v?.total_amount) || 0;
    }

    return [
      { accountCode: custCode, salesman: sm, description: desc, debit: d, credit: c }
    ];
  }

  if (v?.items && Array.isArray(v.items) && v.items.length > 0) {
    return v.items;
  }
  if (v) {
    const d = Number(v.debit) || Number(v.total_amount) || 0;
    const c = Number(v.credit) || 0;
    const desc = v.narration || v.notes || `Voucher ${v.voucher_no || ''}`;
    const custAccount = v.account_code || '';
    
    if (d > 0) {
      return [
        { accountCode: custAccount, salesman: '', description: desc, debit: d, credit: 0 },
        { accountCode: '3010-001', salesman: '', description: 'Owner Capital / Equity Balancing', debit: 0, credit: d }
      ];
    } else if (c > 0) {
      return [
        { accountCode: '3010-001', salesman: '', description: 'Owner Capital / Equity Balancing', debit: c, credit: 0 },
        { accountCode: custAccount, salesman: '', description: desc, debit: 0, credit: c }
      ];
    }
  }
  return [
    { accountCode: '', salesman: '', description: '', debit: 0, credit: 0 },
    { accountCode: '', salesman: '', description: '', debit: 0, credit: 0 }
  ];
};

function AddVoucher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [accountList, setAccountList] = useState<any[]>([]);
  const [salesmanList, setSalesmanList] = useState<any[]>([]);
  const [fetchedVoucher, setFetchedVoucher] = useState<any>(null);
  const [nextVoucherNo, setNextVoucherNo] = useState<string>('VCH-001');

  const editData = location.state?.voucher || fetchedVoucher;
  const isEditMode = !!editData;
  const isOpeningBalance = isEditMode && (
    String(editData?.voucher_no || '').startsWith('OB-') ||
    String(editData?.narration || '').toLowerCase().includes('opening balance') ||
    String(editData?.notes || '').toLowerCase().includes('opening balance')
  );

  useEffect(() => {
    const fetchVoucherMetadata = async () => {
      try {
        setMetadataLoading(true);

        // If voucher ID is passed via search query (?id=...) and not in state, fetch directly
        let currentVoucher = location.state?.voucher;
        const queryId = searchParams.get('id');
        if (!currentVoucher && queryId) {
          const { data: vDb } = await supabase
            .from('financial_vouchers')
            .select('*')
            .eq('id', queryId)
            .maybeSingle();
          if (vDb) {
            currentVoucher = vDb;
            setFetchedVoucher(vDb);
          }
        }
        const { data: coaData } = await supabase
          .from('chart_of_accounts')
          .select('account_code, account_title, account_type, balance_nature')
          .order('account_code', { ascending: true });
        const { data: bankData } = await supabase.from('banks').select('id, bankName, accountNumber, accountTitle');
        const { data: smData } = await supabase.from('salesmen').select('id, name');

        const accountDetails: Record<string, any> = {};

        // Load actual Chart of Accounts from database
        if (coaData && Array.isArray(coaData)) {
          coaData.forEach((a: any) => {
            if (a.account_code) {
              const code = String(a.account_code).trim();
              accountDetails[code] = {
                account_code: code,
                account_title: a.account_title || `Account ${code}`,
                account_type: a.account_type || (code.startsWith('2020-') ? 'Customer' : 'General Ledger'),
                balance_nature: a.balance_nature || ''
              };
            }
          });
        }

        // Seamlessly register all bank accounts so they show their real bank names
        if (bankData && Array.isArray(bankData)) {
          bankData.forEach((b: any) => {
            const code = String(b.accountNumber || b.id).trim();
            if (!accountDetails[code]) {
              accountDetails[code] = {
                account_code: code,
                account_title: `${b.bankName || 'Bank'} (${b.accountTitle || code})`,
                account_type: 'Bank Account',
                balance_nature: 'Debit'
              };
            }
          });
        }

        // Ensure balancing equity account exists
        if (!accountDetails['3010-001']) {
          accountDetails['3010-001'] = {
            account_code: '3010-001',
            account_title: 'Owner Capital',
            account_type: 'Equity',
            balance_nature: 'Credit'
          };
        }

        const activeVoucher = currentVoucher || editData;
        if (activeVoucher?.account_code) {
          const cCode = String(activeVoucher.account_code).trim();
          if (!accountDetails[cCode]) {
            accountDetails[cCode] = {
              account_code: cCode,
              account_title: activeVoucher.account_title || `Account ${cCode}`,
              account_type: cCode.startsWith('2020-') ? 'Customer' : 'General Ledger',
              balance_nature: activeVoucher.debit > 0 ? 'Debit' : 'Credit'
            };
          }
        }

        if (activeVoucher?.items && Array.isArray(activeVoucher.items)) {
          activeVoucher.items.forEach((it: any) => {
            const c = String(it.accountCode || '').trim();
            if (c && !accountDetails[c]) {
              accountDetails[c] = {
                account_code: c,
                account_title: `Account ${c}`,
                account_type: c.startsWith('2020-') ? 'Customer' : 'General Ledger',
                balance_nature: ''
              };
            }
          });
        }

        const mergedList = Object.values(accountDetails)
          .sort((a, b) => a.account_code.localeCompare(b.account_code));

        setAccountList(mergedList);
        if (smData) setSalesmanList(smData);

        // Calculate next sequential Voucher # starting from VCH-001
        try {
          const { data: vchRecords } = await supabase
            .from('financial_vouchers')
            .select('voucher_no');

          let highestSeq = 0;
          if (vchRecords && Array.isArray(vchRecords)) {
            vchRecords.forEach((v: any) => {
              const rawNo = String(v.voucher_no || '').trim();
              const match = rawNo.match(/VCH-(\d+)/i);
              if (match && match[1]) {
                const parsed = parseInt(match[1], 10);
                if (parsed > highestSeq) highestSeq = parsed;
              }
            });
          }
          const seqFormatted = `VCH-${String(highestSeq + 1).padStart(3, '0')}`;
          setNextVoucherNo(seqFormatted);
        } catch (seqErr) {
          console.warn('Voucher sequence calculation note:', seqErr);
        }
      } catch (err: any) {
        toast.error('Failed to load chart codes or salesmen metadata');
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchVoucherMetadata();
  }, []);

  const validationSchema = Yup.object().shape({
    voucherType: Yup.string().required('Please select a voucher type'),
    voucherDate: Yup.string().required('Required'),
    items: Yup.array().of(
      Yup.object().shape({
        accountCode: Yup.string().required('Required'),
        debit: Yup.number().min(0).required('Required'),
        credit: Yup.number().min(0).required('Required'),
      })
    ).min(isOpeningBalance ? 1 : 2, isOpeningBalance ? 'At least 1 row required' : 'Voucher entries require at least 2 balanced row lines')
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl text-xs">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-stroke dark:border-strokedark text-xl font-bold text-black dark:text-white">
        <span>🧾</span> General Journal
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <h3 className="font-semibold text-gray-500 dark:text-textColor text-sm mb-6 border-b pb-2 tracking-wide">
          {isEditMode ? `Modify Voucher: ${editData.voucher_no}` : 'Add General Journal'}
        </h3>

        <Formik
          initialValues={isEditMode ? {
            voucherNo: editData.voucher_no || '',
            voucherType: normalizeVoucherType(editData.voucher_type),
            voucherDate: editData.voucher_date || '',
            notes: editData.notes || editData.narration || '',
            items: buildInitialItems(editData)
          } : {
            voucherNo: nextVoucherNo,
            voucherType: '',
            voucherDate: new Date().toISOString().split('T')[0],
            notes: '',
            items: [
              { accountCode: '', salesman: '', description: '', debit: 0, credit: 0 },
              { accountCode: '', salesman: '', description: '', debit: 0, credit: 0 }
            ]
          }}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            let sumDebits = 0;
            let sumCredits = 0;

            values.items.forEach((item: any) => {
              sumDebits += Number(item.debit) || 0;
              sumCredits += Number(item.credit) || 0;
            });

            if (!isOpeningBalance && sumDebits.toFixed(2) !== sumCredits.toFixed(2)) {
              toast.error(`Unbalanced Entry! Total Debit (${sumDebits.toFixed(2)}) must match Total Credit (${sumCredits.toFixed(2)}).`);
              return;
            }

            try {
              setLoading(true);
              const firstItem = values.items[0] || {};
              const firstAcc = accountList.find((a: any) => a.account_code === firstItem.accountCode);
              const d = Number(firstItem.debit) || 0;
              const c = Number(firstItem.credit) || 0;
              const effectiveTotal = isOpeningBalance ? (d > 0 ? d : c) : sumDebits;

              const databasePayload: any = {
                voucher_no: values.voucherNo,
                voucher_type: values.voucherType,
                voucher_date: values.voucherDate,
                narration: values.notes.trim(),
                total_amount: effectiveTotal,
                items: isOpeningBalance ? [] : values.items,
                account_code: firstItem.accountCode || editData?.account_code || '',
                account_title: firstAcc?.account_title || editData?.account_title || '',
                debit: d,
                credit: c
              };

              let targetId = editData?.id;
              if (isEditMode && !targetId && values.voucherNo) {
                const { data: vRecord } = await supabase
                  .from('financial_vouchers')
                  .select('id')
                  .eq('voucher_no', values.voucherNo)
                  .maybeSingle();
                if (vRecord) targetId = vRecord.id;
              }

              const executeSave = async (payload: any) => {
                if (isEditMode && targetId) {
                  return await supabase
                    .from('financial_vouchers')
                    .update(payload)
                    .eq('id', targetId);
                } else {
                  return await supabase
                    .from('financial_vouchers')
                    .insert([payload]);
                }
              };

              let saveResult = await executeSave(databasePayload);

              // Auto-fallback if schema cache reports any missing column
              if (saveResult.error && (saveResult.error.code === 'PGRST204' || saveResult.error.message?.includes('schema cache'))) {
                const fallbackPayload = { ...databasePayload };
                for (let attempt = 0; attempt < 5 && saveResult.error; attempt++) {
                  const errMsg = saveResult.error.message || '';
                  const colMatch = errMsg.match(/Could not find the '([^']+)' column/i);
                  if (colMatch && colMatch[1]) {
                    delete fallbackPayload[colMatch[1]];
                    saveResult = await executeSave(fallbackPayload);
                  } else {
                    break;
                  }
                }
              }

              if (saveResult.error) throw saveResult.error;

              // --- TWO-WAY SYNC: UPDATE CUSTOMER BALANCE IN CUSTOMERS & COA ---
              try {
                const custItem = values.items.find((it: any) => (it.accountCode || '').startsWith('2020-'));
                if (custItem) {
                  const custCode = custItem.accountCode.trim();
                  const d = Number(custItem.debit) || 0;
                  const c = Number(custItem.credit) || 0;
                  const amount = d > 0 ? d : c;
                  const nature = d >= c ? 'Debit' : 'Credit';
                  const computedBalance = nature === 'Credit' ? -amount : amount;

                  // 1. Update customer in customers table
                  await supabase
                    .from('customers')
                    .update({
                      opening_balance: amount,
                      balance: computedBalance,
                      currentBalance: computedBalance,
                      balance_nature: nature,
                      balanceNature: nature
                    })
                    .or(`customer_code.eq.${custCode},account_code.eq.${custCode},coa_code.eq.${custCode}`);

                  // 2. Update chart_of_accounts opening balance
                  await supabase
                    .from('chart_of_accounts')
                    .update({
                      opening_balance: amount,
                      balance_nature: nature
                    })
                    .eq('account_code', custCode);
                }
              } catch (syncErr) {
                console.warn('Customer balance sync note:', syncErr);
              }

              toast.success(isEditMode ? 'Voucher & Customer Balance updated successfully!' : 'Voucher saved successfully!');
              navigate('/Registration/Vouchers/List');
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, setFieldValue }) => {
            let totalDebits = 0;
            let totalCredits = 0;
            values.items.forEach((item: any) => {
              totalDebits += Number(item.debit) || 0;
              totalCredits += Number(item.credit) || 0;
            });

            return (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Voucher #:</label>
                    <p className="text-gray-400 font-bold p-2 bg-gray-50 dark:bg-meta-4/10 rounded">{values.voucherNo}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Voucher Type: *</label>
                    <select name="voucherType" onChange={handleChange} value={values.voucherType} className="w-full border border-stroke dark:border-strokedark rounded p-2.5 bg-transparent font-semibold dark:bg-boxdark text-black dark:text-white outline-none focus:border-primary">
                      <option value="" className="dark:bg-boxdark text-gray-400">Select Voucher Type</option>
                      <option value="Cash Payment Voucher" className="dark:bg-boxdark text-black dark:text-white">Cash Payment Voucher</option>
                      <option value="Bank Payment Voucher" className="dark:bg-boxdark text-black dark:text-white">Bank Payment Voucher</option>
                      <option value="Cash Receipt Voucher" className="dark:bg-boxdark text-black dark:text-white">Cash Receipt Voucher</option>
                      <option value="Bank Receipt Voucher" className="dark:bg-boxdark text-black dark:text-white">Bank Receipt Voucher</option>
                      <option value="Journal Voucher" className="dark:bg-boxdark text-black dark:text-white">Journal Voucher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Transaction Date: *</label>
                    <input type="date" name="voucherDate" onChange={handleChange} value={values.voucherDate} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-bold text-black dark:text-white" />
                  </div>
                </div>

                <div className="overflow-x-auto border border-stroke dark:border-strokedark rounded p-4 bg-white dark:bg-boxdark shadow-xs">
                  <table className="w-full table-auto text-center border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-gray-700 dark:text-white text-[11px] uppercase tracking-wide border-b">
                        <th className="p-2 border w-12">S.#</th>
                        <th className="p-2 border text-left min-w-[220px]">Chart Of Account *</th>
                        <th className="p-2 border min-w-[220px]">Description</th>
                        <th className="p-2 border w-32">Debit</th>
                        <th className="p-2 border w-32">Credit</th>
                        {!isOpeningBalance && <th className="p-2 border w-10"></th>}
                      </tr>
                    </thead>
                    <FieldArray name="items">
                      {({ push, remove }) => (
                        <tbody>
                          {values.items.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2 border text-gray-400 font-medium bg-gray-50/30 dark:bg-meta-4/10">{idx + 1}</td>
                              <td className="p-2 border min-w-[220px]">
                                <AccountCombobox
                                  accounts={accountList}
                                  value={String(item.accountCode || '')}
                                  onChange={(selectedCode) => {
                                    setFieldValue(`items.${idx}.accountCode`, selectedCode);
                                  }}
                                />
                              </td>

                              <td className="p-1 border">
                                <input type="text" name={`items.${idx}.description`} onChange={handleChange} value={item.description} className="w-full px-2 outline-none bg-transparent h-8 text-black dark:text-white" placeholder="Enter line details" />
                              </td>
                              <td className="p-1 border">
                                <input type="number" name={`items.${idx}.debit`} onKeyDown={blockInvalidChar} onChange={(e) => {
                                    handleChange(e);
                                    const val = Number(e.target.value) || 0;
                                    if (val > 0) {
                                      setFieldValue(`items.${idx}.credit`, 0);
                                      if (values.items.length === 2) {
                                        const otherIdx = idx === 0 ? 1 : 0;
                                        setFieldValue(`items.${otherIdx}.credit`, val);
                                        setFieldValue(`items.${otherIdx}.debit`, 0);
                                      }
                                    }
                                  }} value={item.debit} className="w-full text-center font-mono font-bold outline-none h-8 bg-transparent text-black dark:text-white" placeholder="0.00" />
                              </td>
                              <td className="p-1 border">
                                <input type="number" name={`items.${idx}.credit`} onKeyDown={blockInvalidChar} onChange={(e) => {
                                    handleChange(e);
                                    const val = Number(e.target.value) || 0;
                                    if (val > 0) {
                                      setFieldValue(`items.${idx}.debit`, 0);
                                      if (values.items.length === 2) {
                                        const otherIdx = idx === 0 ? 1 : 0;
                                        setFieldValue(`items.${otherIdx}.debit`, val);
                                        setFieldValue(`items.${otherIdx}.credit`, 0);
                                      }
                                    }
                                  }} value={item.credit} className="w-full text-center font-mono font-bold outline-none h-8 bg-transparent text-black dark:text-white" placeholder="0.00" />
                              </td>
                              {!isOpeningBalance && (
                                <td className="p-2 border text-center">
                                  {values.items.length > 2 && (
                                    <button type="button" onClick={() => remove(idx)} className="text-red-500 font-bold hover:scale-110 transition">✕</button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                          {!isOpeningBalance && (
                            <tr>
                              <td colSpan={6} className="p-2.5 text-left bg-gray-50/20">
                                <button type="button" onClick={() => push({ accountCode: '', salesman: '', description: '', debit: 0, credit: 0 })} className="text-success font-black hover:underline">+ Add Row</button>
                              </td>
                            </tr>
                          )}
                          <tr className="font-bold bg-slate-50 dark:bg-meta-4/20 text-sm">
                            <td colSpan={3} className="p-3 border text-right font-bold text-black dark:text-white uppercase text-xs">Total Amount</td>
                            <td className={`p-3 border text-center font-mono ${isOpeningBalance || (totalDebits.toFixed(2) === totalCredits.toFixed(2) && totalDebits > 0) ? 'text-success' : 'text-danger'}`}>{totalDebits.toFixed(2)}</td>
                            <td className={`p-3 border text-center font-mono ${isOpeningBalance || (totalDebits.toFixed(2) === totalCredits.toFixed(2) && totalDebits > 0) ? 'text-success' : 'text-danger'}`}>{totalCredits.toFixed(2)}</td>
                            {!isOpeningBalance && <td className="border bg-white dark:bg-boxdark"></td>}
                          </tr>
                        </tbody>
                      )}
                    </FieldArray>
                  </table>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="block text-gray-500 font-bold uppercase">Voucher Note:</label>
                  <textarea name="notes" rows={3} onChange={handleChange} value={values.notes} className="w-full md:w-150 border border-stroke dark:border-strokedark rounded p-2.5 bg-transparent outline-none focus:border-primary text-black dark:text-white" placeholder="Enter overall transaction references note description summary here..." />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
                  <button
                    type="button"
                    onClick={() => navigate('/Registration/Vouchers/List')}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>{isEditMode ? 'Update Record' : 'Add Record'}</span>}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}

export default AddVoucher;
