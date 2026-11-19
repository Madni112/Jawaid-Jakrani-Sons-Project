import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

import {
  AddVoucherProps,
  PartyMetadata,
  VoucherFormValues
} from './types/voucherTypes';
import {
  PRESET_DEFINITIONS,
  normalizeVoucherType,
  buildInitialItems
} from './utils/voucherConstants';
import {
  syncVoucherBalances,
  saveVoucherToDatabase
} from './utils/voucherBalanceSync';

import { VoucherNoticeBanners } from './components/VoucherNoticeBanners';
import { VoucherHeaderCard } from './components/VoucherHeaderCard';
import { VoucherQuickMetaBar } from './components/VoucherQuickMetaBar';
import { VoucherKhataForm } from './components/VoucherKhataForm';
import { VoucherGeneralJournalTable } from './components/VoucherGeneralJournalTable';

function AddVoucher({ voucherTypePreset }: AddVoucherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activePreset = (voucherTypePreset || searchParams.get('type') || '').toUpperCase();
  const presetMeta = PRESET_DEFINITIONS[activePreset];

  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [partiesMap, setPartiesMap] = useState<Record<string, PartyMetadata>>({});
  const [fetchedVoucher, setFetchedVoucher] = useState<any>(null);
  const [nextVoucherNo, setNextVoucherNo] = useState<string>('VCH-001');

  const editData = location.state?.voucher || fetchedVoucher;
  const isEditMode = !!editData;

  const isOpeningBalance = isEditMode && (
    String(editData?.voucher_no || '').startsWith('OB-') ||
    String(editData?.voucher_no || '').startsWith('OBV-') ||
    editData?.metadata?.isOpeningBalance === true ||
    String(editData?.narration || '').toLowerCase().includes('opening balance') ||
    String(editData?.notes || '').toLowerCase().includes('opening balance')
  );

  const isSingleRowMode = presetMeta ? presetMeta.isSingleRow : isOpeningBalance;
  const isTwoPartyMode = activePreset === 'CRV' || activePreset === 'VPV' || activePreset === 'EXP';

  useEffect(() => {
    const fetchVoucherMetadata = async () => {
      try {
        setMetadataLoading(true);

        let currentVoucher = location.state?.voucher;
        const queryId = searchParams.get('id') || currentVoucher?.id;
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

        const [coaRes, bankRes, vendRes, custRes, vchRes] = await Promise.all([
          fetchAllPages(supabase.from('chart_of_accounts').select('*').order('account_code', { ascending: true })),
          fetchAllPages(supabase.from('banks').select('*')),
          fetchAllPages(supabase.from('vendors').select('*')),
          fetchAllPages(supabase.from('customers').select('*')),
          fetchAllPages(supabase.from('financial_vouchers').select('id, voucher_no, account_code, total_amount, debit, credit, items'))
        ]);

        const accountDetails: Record<string, any> = {};
        const pMap: Record<string, PartyMetadata> = {};

        // Pre-aggregate voucher debits and credits per account code
        const coaDebits: Record<string, number> = {};
        const coaCredits: Record<string, number> = {};
        const accountsWithOBVoucher = new Set<string>();

        if (vchRes.data && Array.isArray(vchRes.data)) {
          vchRes.data.forEach((v: any) => {
            const isOB = String(v.voucher_no || '').startsWith('OB-') ||
              String(v.voucher_no || '').startsWith('OBV-') ||
              String(v.voucher_no || '').startsWith('OBC-') ||
              Boolean(v.metadata?.isOpeningBalance);

            // Exclude current voucher when in edit mode so Previous Balance reflects prior state
            const isCurrentEditing = queryId && String(v.id) === String(queryId);

            if (isOB && !isCurrentEditing) {
              const code = String(v.account_code || '').trim();
              if (code) accountsWithOBVoucher.add(code);
              if (v.items && Array.isArray(v.items)) {
                v.items.forEach((it: any) => {
                  const itCode = String(it.accountCode || it.account_code || '').trim();
                  if (itCode) accountsWithOBVoucher.add(itCode);
                });
              }
            }

            if (isCurrentEditing) return;

            if (v.items && Array.isArray(v.items) && v.items.length > 0) {
              v.items.forEach((it: any) => {
                const code = String(it.accountCode || it.account_code || '').trim();
                if (code) {
                  coaDebits[code] = (coaDebits[code] || 0) + (Number(it.debit) || 0);
                  coaCredits[code] = (coaCredits[code] || 0) + (Number(it.credit) || 0);
                }
              });
            } else if (v.account_code) {
              const code = String(v.account_code).trim();
              const d = Number(v.debit) || (v.credit ? 0 : Number(v.total_amount)) || 0;
              const c = Number(v.credit) || 0;
              coaDebits[code] = (coaDebits[code] || 0) + d;
              coaCredits[code] = (coaCredits[code] || 0) + c;
            }
          });
        }

        // 1. Chart of Accounts
        if (coaRes.data && Array.isArray(coaRes.data)) {
          coaRes.data.forEach((a: any) => {
            if (a.account_code) {
              const code = String(a.account_code).trim();
              let inferredType = a.account_type;
              if (!inferredType) {
                if (code.startsWith('2020-')) inferredType = 'Customer';
                else if (code.startsWith('2010-')) inferredType = 'Vendor';
                else if (code.startsWith('1010-')) inferredType = 'Cash';
                else if (code.startsWith('5')) inferredType = 'Expense';
                else inferredType = 'General Ledger';
              }
              const isCustomer = code.startsWith('2020-') || inferredType === 'Customer';
              const isVendor = code.startsWith('2010-') || inferredType === 'Vendor';
              const isAssetOrExp = code.startsWith('1') || code.startsWith('5') || isCustomer;

              const hasOBInVouchers = accountsWithOBVoucher.has(code);
              const opBal = hasOBInVouchers ? 0 : Number(a.opening_balance || 0);
              const d = coaDebits[code] || 0;
              const c = coaCredits[code] || 0;

              let nature = a.balance_nature;
              let computedBal = 0;

              if (isCustomer) {
                nature = nature || 'Debit';
                const signedOp = nature.toLowerCase() === 'credit' ? -opBal : opBal;
                computedBal = signedOp + (d - c);
              } else if (isVendor) {
                nature = nature || 'Credit';
                const signedOp = nature.toLowerCase() === 'debit' ? -opBal : opBal;
                computedBal = signedOp + (c - d);
              } else if (isAssetOrExp) {
                nature = nature || 'Debit';
                computedBal = opBal + (d - c);
              } else {
                nature = nature || 'Credit';
                computedBal = opBal + (c - d);
              }

              accountDetails[code] = {
                account_code: code,
                account_title: a.account_title || `Account ${code}`,
                account_type: inferredType,
                balance_nature: nature
              };
              pMap[code] = {
                code,
                name: a.account_title || code,
                type: inferredType,
                phone: '',
                city: '',
                address: '',
                currentBalance: computedBal,
                balanceNature: nature
              };
            }
          });
        }

        // 2. Customers
        if (custRes.data && Array.isArray(custRes.data)) {
          custRes.data.forEach((c: any) => {
            const code = String(c.customer_code || c.customerCode || c.account_code || c.coa_code || '').trim();
            const d = coaDebits[code] || 0;
            const cr = coaCredits[code] || 0;
            const hasOBInVouchers = accountsWithOBVoucher.has(code);
            const opBal = hasOBInVouchers ? 0 : Number(c.opening_balance || 0);
            const isCr = String(c.balance_nature || '').toLowerCase() === 'credit';
            const signedOp = isCr ? -opBal : opBal;
            const computedFromVouchers = signedOp + (d - cr);

            const finalBal = pMap[code]?.currentBalance !== undefined
              ? pMap[code].currentBalance
              : computedFromVouchers;

            const phone = c.primaryPhone || c.phone || c.mobile || '';
            const city = c.city || c.area || '';
            const address = c.address || '';

            if (code) {
              const partyObj: PartyMetadata = {
                id: c.id,
                raw: c,
                code,
                name: c.customerName || c.customer_name || `Customer ${code}`,
                type: 'Customer',
                phone,
                city,
                address,
                currentBalance: finalBal,
                balanceNature: isCr ? 'Credit' : 'Debit'
              };
              accountDetails[code] = {
                account_code: code,
                account_title: partyObj.name,
                account_type: 'Customer',
                balance_nature: 'Debit'
              };
              pMap[code] = partyObj;
              if (c.account_code) pMap[String(c.account_code).trim()] = partyObj;
              if (c.customer_code) pMap[String(c.customer_code).trim()] = partyObj;
              if (c.customerCode) pMap[String(c.customerCode).trim()] = partyObj;
              if (c.coa_code) pMap[String(c.coa_code).trim()] = partyObj;
            }
          });
        }

        // 3. Vendors
        if (vendRes.data && Array.isArray(vendRes.data)) {
          vendRes.data.forEach((v: any) => {
            const code = String(v.vendor_code || v.vendorCode || v.account_code || '').trim();
            const d = coaDebits[code] || 0;
            const cr = coaCredits[code] || 0;
            const hasOBInVouchers = accountsWithOBVoucher.has(code);
            const opBal = hasOBInVouchers ? 0 : Number(v.opening_balance || 0);
            const isDr = String(v.balance_nature || '').toLowerCase() === 'debit';
            const signedOp = isDr ? -opBal : opBal;
            const computedFromVouchers = signedOp + (cr - d);

            const finalBal = pMap[code]?.currentBalance !== undefined
              ? pMap[code].currentBalance
              : computedFromVouchers;

            const phone = v.phone || v.cell_no || v.phone_no || '';
            const city = v.city || '';
            const address = v.address || '';

            if (code) {
              const vendObj: PartyMetadata = {
                id: v.id,
                raw: v,
                code,
                name: v.vendor_name || v.name || `Vendor ${code}`,
                type: 'Vendor',
                phone,
                city,
                address,
                currentBalance: finalBal,
                balanceNature: isDr ? 'Debit' : 'Credit'
              };
              accountDetails[code] = {
                account_code: code,
                account_title: vendObj.name,
                account_type: 'Vendor',
                balance_nature: 'Credit'
              };
              pMap[code] = vendObj;
              if (v.account_code) pMap[String(v.account_code).trim()] = vendObj;
              if (v.vendor_code) pMap[String(v.vendor_code).trim()] = vendObj;
              if (v.vendorCode) pMap[String(v.vendorCode).trim()] = vendObj;
            }
          });
        }

        // 4. Banks
        if (bankRes.data && Array.isArray(bankRes.data)) {
          bankRes.data.forEach((b: any) => {
            const code = String(b.accountNumber || b.id).trim();
            const netBal = Number(b.netBalance ?? b.openingBalance ?? 0);
            if (!accountDetails[code]) {
              accountDetails[code] = {
                account_code: code,
                account_title: `${b.bankName || 'Bank'} (${b.accountTitle || code})`,
                account_type: 'Bank Account',
                balance_nature: 'Debit'
              };
            }
            pMap[code] = {
              code,
              name: `${b.bankName || 'Bank'} (${b.accountTitle || code})`,
              type: 'Bank Account',
              phone: '',
              city: '',
              address: b.accountTitle || '',
              currentBalance: netBal,
              balanceNature: 'Debit'
            };
          });
        }

        // 5. Ensure Cash in Hand
        if (!accountDetails['1010-001']) {
          accountDetails['1010-001'] = {
            account_code: '1010-001',
            account_title: 'Cash in Hand (دکان کا کیش)',
            account_type: 'Cash',
            balance_nature: 'Debit'
          };
          pMap['1010-001'] = {
            code: '1010-001',
            name: 'Cash in Hand (دکان کا کیش)',
            type: 'Cash',
            phone: '',
            city: '',
            address: 'Counter Cash Drawer',
            currentBalance: 0,
            balanceNature: 'Debit'
          };
        }

        setPartiesMap(pMap);

        const mergedList = Object.values(accountDetails).sort((a, b) =>
          a.account_code.localeCompare(b.account_code)
        );
        setAllAccounts(mergedList);

        // Sequence calculation
        const targetPrefix = presetMeta ? presetMeta.prefix : 'VCH';
        try {
          const { data: vchRecords } = await supabase
            .from('financial_vouchers')
            .select('voucher_no');

          let highestSeq = 0;
          if (vchRecords && Array.isArray(vchRecords)) {
            const regex = new RegExp(`^${targetPrefix}-(\\d+)`, 'i');
            vchRecords.forEach((v: any) => {
              const rawNo = String(v.voucher_no || '').trim();
              const match = rawNo.match(regex);
              if (match && match[1]) {
                const parsed = parseInt(match[1], 10);
                if (parsed > highestSeq) highestSeq = parsed;
              }
            });
          }
          const seqFormatted = `${targetPrefix}-${String(highestSeq + 1).padStart(3, '0')}`;
          setNextVoucherNo(seqFormatted);
        } catch (seqErr) {
          console.warn('Voucher sequence calculation note:', seqErr);
        }
      } catch (err: any) {
        toast.error('Failed to load metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchVoucherMetadata();
  }, [activePreset]);

  // Account filtering helper per preset and row
  const getFilteredAccounts = (rowIndex: number) => {
    if (!presetMeta) return allAccounts;

    if (activePreset === 'SAV' || activePreset === 'SRV') {
      return allAccounts.filter(
        (a) => a.account_code.startsWith('2020-') || a.account_type === 'Customer'
      );
    }

    if (activePreset === 'PAV' || activePreset === 'PRV') {
      return allAccounts.filter(
        (a) => a.account_code.startsWith('2010-') || a.account_type === 'Vendor'
      );
    }

    if (activePreset === 'CRV') {
      if (rowIndex === 0) {
        return allAccounts.filter(
          (a) => a.account_code.startsWith('1010-') || a.account_type === 'Cash' || a.account_type === 'Bank Account'
        );
      }
      return allAccounts.filter(
        (a) => a.account_code.startsWith('2020-') || a.account_type === 'Customer'
      );
    }

    if (activePreset === 'VPV') {
      if (rowIndex === 0) {
        return allAccounts.filter(
          (a) => a.account_code.startsWith('2010-') || a.account_type === 'Vendor'
        );
      }
      return allAccounts.filter(
        (a) => a.account_code.startsWith('1010-') || a.account_type === 'Cash' || a.account_type === 'Bank Account'
      );
    }

    if (activePreset === 'EXP') {
      if (rowIndex === 0) {
        return allAccounts.filter(
          (a) => a.account_code.startsWith('5') || a.account_type === 'Expense'
        );
      }
      return allAccounts.filter(
        (a) => a.account_code.startsWith('1010-') || a.account_type === 'Cash' || a.account_type === 'Bank Account'
      );
    }

    return allAccounts;
  };

  const validationSchema = Yup.object().shape({
    voucherType: Yup.string().required('Please select a voucher type'),
    voucherDate: Yup.string().required('Transaction Date is required'),
    items: Yup.array().of(
      Yup.object().shape({
        accountCode: Yup.string().required('Account is required'),
        debit: Yup.number().min(0),
        credit: Yup.number().min(0)
      })
    ).min(isSingleRowMode ? 1 : 2, isSingleRowMode ? 'At least 1 row required' : 'Voucher entries require at least 2 balanced row lines')
  });

  if (metadataLoading) {
    return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  }

  const pageTitle = isOpeningBalance ? 'Opening Balance Voucher' : (presetMeta ? presetMeta.title : 'General Journal Voucher');
  const listReturnRoute = presetMeta ? presetMeta.listRoute : '/Registration/Vouchers/List';

  const isOpeningBalanceLocked = isOpeningBalance;
  const isAutoGenerated = !isOpeningBalanceLocked && Boolean(
    editData?.original_invoice_no ||
    editData?.metadata?.invoice_no ||
    editData?.metadata?.linkedReturnNo ||
    editData?.metadata?.linkedInvoiceNo ||
    (editData?.metadata?.auto_generated && !editData?.metadata?.isOpeningBalance && !String(editData?.voucher_no || '').startsWith('OB-'))
  );
  const isLockedVoucher = isAutoGenerated || isOpeningBalanceLocked;

  // Party resolution for Opening Balance vouchers
  const obPartyCode = String(editData?.account_code || '').trim();
  const isVendorOB = String(editData?.voucher_no || '').startsWith('OBV-') ||
    String(editData?.voucher_no || '').startsWith('OB-2010') ||
    obPartyCode.startsWith('2010-');
  const obPartyName = editData?.account_title || partiesMap[obPartyCode]?.name || (isVendorOB ? 'Vendor' : 'Customer');

  const handleOpenPartyProfile = async () => {
    if (isVendorOB) {
      const party = partiesMap[obPartyCode];
      let vendorId = party?.id;
      let vendorRecord = party?.raw;

      if (!vendorId) {
        let vendQuery = supabase.from('vendors').select('*');
        if (obPartyCode) {
          vendQuery = vendQuery.or(`account_code.eq.${obPartyCode},vendor_code.eq.${obPartyCode}`);
        } else if (obPartyName) {
          vendQuery = vendQuery.or(`vendor_name.eq.${obPartyName},name.eq.${obPartyName}`);
        }
        const { data: vDb } = await vendQuery.limit(1).maybeSingle();
        if (vDb) {
          vendorId = vDb.id;
          vendorRecord = vDb;
        }
      }

      if (vendorId) {
        navigate(`/Purchase/Vendor/Edit/${vendorId}`, { state: { vendor: vendorRecord } });
      } else {
        navigate(`/Purchase/Vendor/List?search=${encodeURIComponent(obPartyName)}`);
      }
    } else {
      const party = partiesMap[obPartyCode];
      let customerId = party?.id;
      let customerRecord = party?.raw;

      if (!customerId) {
        let custQuery = supabase.from('customers').select('*');
        if (obPartyCode) {
          custQuery = custQuery.or(`account_code.eq.${obPartyCode},customer_code.eq.${obPartyCode},coa_code.eq.${obPartyCode},customercode.eq.${obPartyCode},customerCode.eq.${obPartyCode}`);
        } else if (obPartyName) {
          custQuery = custQuery.or(`customerName.eq.${obPartyName},customer_name.eq.${obPartyName},name.eq.${obPartyName}`);
        }
        const { data: cDb } = await custQuery.limit(1).maybeSingle();
        if (cDb) {
          customerId = cDb.id;
          customerRecord = cDb;
        }
      }

      if (customerId) {
        navigate(`/Sales/Customers/Edit/${customerId}`, { state: { customer: customerRecord } });
      } else {
        navigate(`/Sales/Customers/List?search=${encodeURIComponent(obPartyName)}`);
      }
    }
  };

  const autoInvoiceNo = editData?.original_invoice_no || editData?.metadata?.invoice_no || editData?.metadata?.linkedReturnNo || editData?.metadata?.linkedInvoiceNo;
  const moduleSource = editData?.metadata?.moduleSource || (
    String(editData?.voucher_no || '').startsWith('PAV-') || String(editData?.voucher_no || '').startsWith('VPV-') ? 'purchase_bill' :
    String(editData?.voucher_no || '').startsWith('PRV-') ? 'purchase_return' :
    String(editData?.voucher_no || '').startsWith('VRV-') ? 'purchase_return_receipt' :
    String(editData?.voucher_no || '').startsWith('SRV-') || String(editData?.voucher_no || '').startsWith('CPV-') ? 'sales_return' : 'sales_invoice'
  );

  const sourceDocumentLabel = moduleSource === 'purchase_bill'
    ? 'Purchase Bill'
    : moduleSource === 'purchase_return'
    ? 'Purchase Return'
    : moduleSource === 'purchase_return_receipt'
    ? 'Purchase Return Receipt'
    : moduleSource === 'purchase_receipt'
    ? 'Vendor Payment Slip'
    : moduleSource === 'sales_return_receipt'
    ? 'Sales Return Receipt'
    : (moduleSource === 'sales_return' || String(autoInvoiceNo).startsWith('RTN')
    ? 'Sales Return Note'
    : (moduleSource === 'sales_receipt' || String(editData?.voucher_no || '').startsWith('CRV-') ? 'Sales Receipt' : 'Sales Invoice'));

  const handleOpenSourceDocument = async () => {
    if (moduleSource === 'purchase_bill') {
      if (autoInvoiceNo) {
        const isNum = /^\d+$/.test(String(autoInvoiceNo));
        const query = supabase.from('purchases').select('*');
        if (isNum) {
          query.or(`id.eq.${autoInvoiceNo},purchase_no.eq.${autoInvoiceNo}`);
        } else {
          query.eq('purchase_no', autoInvoiceNo);
        }
        const { data: pur } = await query.maybeSingle();
        if (pur?.id) {
          navigate(`/Purchase/Purchases/Edit/${pur.id}`, { state: { purchaseRecord: pur } });
          return;
        }
      }
      navigate(`/Purchase/Purchase/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else if (moduleSource === 'purchase_return') {
      navigate(`/Purchase/Purchase-Return/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else if (moduleSource === 'purchase_return_receipt') {
      navigate(`/Purchase/Purchase-Return-Receipt/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else if (moduleSource === 'purchase_receipt') {
      navigate(`/Purchase/Purchase-Receipt/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else if (moduleSource === 'sales_return_receipt') {
      navigate(`/Sales/Sales-Return-Receipt/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else if (moduleSource === 'sales_return' || String(autoInvoiceNo).startsWith('RTN')) {
      navigate(`/Sales-Return/Debit-Notes/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else if (moduleSource === 'sales_receipt' || String(editData?.voucher_no || '').startsWith('CRV-')) {
      navigate(`/Sales/InvoiceReceipt/List?search=${encodeURIComponent(autoInvoiceNo || '')}`);
    } else {
      if (autoInvoiceNo) {
        const isNum = /^\d+$/.test(String(autoInvoiceNo));
        const query = supabase.from('sales_invoices').select('*');
        if (isNum) {
          query.or(`id.eq.${autoInvoiceNo},invoice_no.eq.${autoInvoiceNo}`);
        } else {
          query.eq('invoice_no', autoInvoiceNo);
        }
        const { data: inv } = await query.maybeSingle();
        if (inv?.id) {
          const parsedItems = Array.isArray(inv.items)
            ? inv.items
            : (typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : []);
          const enrichedInv = {
            ...inv,
            items: parsedItems.map((it: any) => ({
              ...it,
              warehouse: it.warehouse || inv.dispatch_warehouse || ''
            }))
          };
          navigate(`/Sales/Invoice/edit/${inv.id}`, { state: { invoice: enrichedInv } });
          return;
        }
      }
      navigate(`/Sales/Invoice/edit/${encodeURIComponent(autoInvoiceNo || '')}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl text-xs space-y-5 pb-12">
      <VoucherNoticeBanners
        isOpeningBalanceLocked={isOpeningBalanceLocked}
        obPartyName={obPartyName}
        obPartyCode={obPartyCode}
        isVendorOB={isVendorOB}
        onOpenPartyProfile={handleOpenPartyProfile}
        isAutoGenerated={isAutoGenerated}
        autoInvoiceNo={autoInvoiceNo}
        sourceDocumentLabel={sourceDocumentLabel}
        onOpenSourceDocument={handleOpenSourceDocument}
      />

      <VoucherHeaderCard
        isEditMode={isEditMode}
        pageTitle={pageTitle}
        voucherNo={editData?.voucher_no}
        activePreset={activePreset}
        presetMeta={presetMeta}
        isOpeningBalance={isOpeningBalance}
        listReturnRoute={listReturnRoute}
      />

      <Formik
        initialValues={{
          voucherNo: editData?.voucher_no || nextVoucherNo,
          voucherType: editData?.voucher_type ? normalizeVoucherType(editData.voucher_type) : (presetMeta ? presetMeta.typeName : 'Journal Voucher'),
          voucherDate: editData?.voucher_date || new Date().toISOString().split('T')[0],
          notes: (() => {
            if (!editData) return '';
            if (editData.metadata?.notes !== undefined) return String(editData.metadata.notes);
            const parts = String(editData.narration || '').split(' | ');
            if (parts.length > 1) return parts.slice(1).join(' | ');
            return '';
          })(),
          items: buildInitialItems(editData, presetMeta, activePreset)
        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={async (values: VoucherFormValues) => {
          if (isOpeningBalanceLocked) {
            toast.error(`Opening Balance vouchers are view-only. Please edit ${isVendorOB ? 'Vendor' : 'Customer'} details from their profile.`);
            return;
          }

          if (isAutoGenerated) {
            toast.error(`This voucher is linked to ${sourceDocumentLabel} #${autoInvoiceNo}. Please edit the document directly.`);
            return;
          }

          let sumDebits = 0;
          let sumCredits = 0;

          values.items.forEach((item: any) => {
            sumDebits += Number(item.debit) || 0;
            sumCredits += Number(item.credit) || 0;
          });

          if (isSingleRowMode) {
            const primaryItem = values.items[0];
            const enteredAmt = Number(primaryItem.debit) || Number(primaryItem.credit) || 0;
            if (enteredAmt <= 0) {
              toast.error('Please enter a valid amount greater than 0.');
              return;
            }
          } else {
            if (sumDebits.toFixed(2) !== sumCredits.toFixed(2) || sumDebits <= 0) {
              toast.error(`Unbalanced Entry! Total Debit (${sumDebits.toFixed(2)}) must match Total Credit (${sumCredits.toFixed(2)}).`);
              return;
            }
          }

          try {
            setLoading(true);
            const firstItem = values.items[0] || ({} as any);
            const firstAcc = allAccounts.find((a: any) => a.account_code === firstItem.accountCode);

            let effectiveDebit = Number(firstItem.debit) || 0;
            let effectiveCredit = Number(firstItem.credit) || 0;

            if (activePreset === 'SAV') {
              const amt = effectiveDebit || effectiveCredit;
              effectiveDebit = amt;
              effectiveCredit = 0;
            } else if (activePreset === 'SRV') {
              const amt = effectiveDebit || effectiveCredit;
              effectiveDebit = 0;
              effectiveCredit = amt;
            } else if (activePreset === 'PAV') {
              const amt = effectiveDebit || effectiveCredit;
              effectiveDebit = 0;
              effectiveCredit = amt;
            } else if (activePreset === 'PRV') {
              const amt = effectiveDebit || effectiveCredit;
              effectiveDebit = amt;
              effectiveCredit = 0;
            }

            const effectiveTotal = isSingleRowMode
              ? (effectiveDebit > 0 ? effectiveDebit : effectiveCredit)
              : sumDebits;

            const isCust = activePreset === 'SAV' || activePreset === 'SRV' || activePreset === 'CRV' || activePreset === 'CPV' || (firstItem.accountCode && String(firstItem.accountCode).startsWith('2020'));
            const isVend = activePreset === 'PAV' || activePreset === 'PRV' || activePreset === 'VPV' || activePreset === 'VRV' || (firstItem.accountCode && String(firstItem.accountCode).startsWith('2010'));

            const primaryItemIdx = activePreset === 'CRV' || activePreset === 'VRV' ? 1 : 0;
            const primaryItem = values.items[primaryItemIdx] || values.items[0] || ({} as any);
            const particularsText = String(primaryItem.description || '').trim();
            const notesText = String(values.notes || '').trim();

            let finalNarration = '';
            if (particularsText && notesText && particularsText !== notesText) {
              finalNarration = `${particularsText} | ${notesText}`;
            } else if (particularsText) {
              finalNarration = particularsText;
            } else if (notesText) {
              finalNarration = notesText;
            } else {
              finalNarration = `${values.voucherType} for ${firstAcc?.account_title || firstItem.accountCode}`;
            }

            const databasePayload: any = {
              voucher_no: values.voucherNo,
              voucher_type: values.voucherType,
              voucher_date: values.voucherDate,
              narration: finalNarration,
              total_amount: effectiveTotal,
              items: values.items,
              account_code: firstItem.accountCode || editData?.account_code || '',
              account_title: firstAcc?.account_title || editData?.account_title || '',
              debit: isSingleRowMode ? effectiveDebit : sumDebits,
              credit: isSingleRowMode ? effectiveCredit : sumCredits,
              original_invoice_no: particularsText || editData?.original_invoice_no || null,
              metadata: {
                ...(editData?.metadata || {}),
                preset: activePreset,
                party_type: isCust ? 'customer' : isVend ? 'vendor' : 'general',
                party_code: firstItem.accountCode || editData?.account_code || '',
                party_name: firstAcc?.account_title || editData?.account_title || '',
                particulars: particularsText,
                notes: notesText,
                previous_balance: editData?.metadata?.previous_balance ?? 0
              }
            };

            await saveVoucherToDatabase(databasePayload, isEditMode, editData?.id);

            await syncVoucherBalances({
              values,
              editData,
              firstItem,
              firstAcc,
              effectiveTotal,
              activePreset
            });

            toast.success(isEditMode ? 'Voucher updated successfully!' : 'Voucher recorded successfully!');
            navigate(listReturnRoute);
          } catch (err: any) {
            toast.error(err.message || 'Failed to save voucher');
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ handleChange, values, setFieldValue }) => {
          let primaryPartyCode = '';
          let primaryItemIndex = 0;

          if (isSingleRowMode) {
            primaryPartyCode = values.items[0]?.accountCode || '';
            primaryItemIndex = 0;
          } else if (activePreset === 'CRV') {
            primaryPartyCode = values.items[1]?.accountCode || '';
            primaryItemIndex = 1;
          } else if (activePreset === 'VPV') {
            primaryPartyCode = values.items[0]?.accountCode || '';
            primaryItemIndex = 0;
          } else if (activePreset === 'EXP') {
            primaryPartyCode = values.items[0]?.accountCode || '';
            primaryItemIndex = 0;
          } else {
            primaryPartyCode = values.items[0]?.accountCode || '';
          }

          const partyData = partiesMap[String(primaryPartyCode || '').trim()];

          let currentEnteredAmount = 0;
          if (isSingleRowMode) {
            const it = values.items[0];
            currentEnteredAmount = Number(it?.debit) || Number(it?.credit) || 0;
          } else {
            const it = values.items[primaryItemIndex];
            currentEnteredAmount = Number(it?.debit) || Number(it?.credit) || 0;
          }

          const oldBalance = partyData ? Number(partyData.currentBalance || 0) : 0;
          const creationBalance = editData?.metadata?.previous_balance !== undefined
            ? Number(editData.metadata.previous_balance)
            : null;
          let expectedNewBalance = oldBalance;
          let impactSign = '+';

          if (activePreset === 'SAV') {
            impactSign = '+';
            expectedNewBalance = oldBalance + currentEnteredAmount;
          } else if (activePreset === 'SRV') {
            impactSign = '-';
            expectedNewBalance = Math.max(0, oldBalance - currentEnteredAmount);
          } else if (activePreset === 'CRV') {
            impactSign = '-';
            expectedNewBalance = oldBalance - currentEnteredAmount;
          } else if (activePreset === 'PAV') {
            impactSign = '+';
            expectedNewBalance = oldBalance + currentEnteredAmount;
          } else if (activePreset === 'PRV') {
            impactSign = '-';
            expectedNewBalance = Math.max(0, oldBalance - currentEnteredAmount);
          } else if (activePreset === 'VPV') {
            impactSign = '-';
            expectedNewBalance = oldBalance - currentEnteredAmount;
          } else if (activePreset === 'EXP') {
            impactSign = '+';
            expectedNewBalance = oldBalance + currentEnteredAmount;
          }

          const isCustomer = activePreset === 'SAV' || activePreset === 'SRV' || activePreset === 'CRV' || (partyData?.type === 'Customer');
          const isVendor = activePreset === 'PAV' || activePreset === 'PRV' || activePreset === 'VPV' || (partyData?.type === 'Vendor');
          const isExpense = activePreset === 'EXP' || (partyData?.type === 'Expense');
          const balSuffix = isCustomer ? 'Dr (Receivable)' : isVendor ? 'Cr (Payable)' : isExpense ? 'Dr (Expense)' : '';

          return (
            <Form className="space-y-5">
              <VoucherQuickMetaBar
                voucherNo={values.voucherNo}
                voucherType={values.voucherType}
                voucherDate={values.voucherDate}
                onChange={handleChange}
              />

              {(isSingleRowMode || isTwoPartyMode) ? (
                <VoucherKhataForm
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  presetMeta={presetMeta}
                  activePreset={activePreset}
                  isSingleRowMode={isSingleRowMode}
                  isTwoPartyMode={isTwoPartyMode}
                  primaryItemIndex={primaryItemIndex}
                  primaryPartyCode={primaryPartyCode}
                  partyData={partyData}
                  getFilteredAccounts={getFilteredAccounts}
                  currentEnteredAmount={currentEnteredAmount}
                  oldBalance={oldBalance}
                  creationBalance={creationBalance}
                  expectedNewBalance={expectedNewBalance}
                  impactSign={impactSign}
                  balSuffix={balSuffix}
                  isEditMode={isEditMode}
                  isOpeningBalanceLocked={isOpeningBalanceLocked}
                  isAutoGenerated={isAutoGenerated}
                  isVendorOB={isVendorOB}
                  sourceDocumentLabel={sourceDocumentLabel}
                  autoInvoiceNo={autoInvoiceNo}
                  loading={loading}
                  onOpenPartyProfile={handleOpenPartyProfile}
                  onCancel={() => navigate(listReturnRoute)}
                />
              ) : (
                <VoucherGeneralJournalTable
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  getFilteredAccounts={getFilteredAccounts}
                  isLockedVoucher={isLockedVoucher}
                  loading={loading}
                  onCancel={() => navigate(listReturnRoute)}
                />
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

export default AddVoucher;
