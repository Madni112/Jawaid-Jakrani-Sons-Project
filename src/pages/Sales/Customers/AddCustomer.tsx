import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { useLanguage } from '../../../Context/LanguageContext';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';

import {
  TIER_OPTIONS,
  DEFAULT_SUB_AREAS,
  DEFAULT_AREAS,
  DEFAULT_SUBAREA_AREAS_MAP
} from './constants/customerConstants';
import { getInitialLocation } from './utils/customerLocationHelpers';
import { CustomerHeaderBanner } from './components/CustomerHeaderBanner';
import { CustomerStepTabs } from './components/CustomerStepTabs';
import { CustomerIdentityTab } from './components/CustomerIdentityTab';
import { CustomerContactTab } from './components/CustomerContactTab';
import { CustomerAccountTab } from './components/CustomerAccountTab';
import { CustomerTaxTab } from './components/CustomerTaxTab';
import { CustomerNotesTab } from './components/CustomerNotesTab';
import { CustomerStepperActions } from './components/CustomerStepperActions';

const AddCustomer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [companies, setCompanies] = useState<any[]>([]);
  const [suggestedCode, setSuggestedCode] = useState<string>('');

  const [tierOptions, setTierOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uj_custom_tiers');
      const customList: string[] = saved ? JSON.parse(saved) : [];
      return Array.from(new Set([...TIER_OPTIONS, ...customList]));
    } catch {
      return TIER_OPTIONS;
    }
  });

  const handleAddCustomTier = (newTier: string) => {
    const clean = newTier.trim();
    if (!clean) return;
    setTierOptions((prev) => {
      const updated = Array.from(new Set([clean, ...prev]));
      try {
        const saved = localStorage.getItem('uj_custom_tiers');
        const customList: string[] = saved ? JSON.parse(saved) : [];
        if (!customList.includes(clean)) {
          localStorage.setItem('uj_custom_tiers', JSON.stringify([...customList, clean]));
        }
      } catch (e) {
        console.error('Failed to save custom tier:', e);
      }
      return updated;
    });
    toast.success(`Added "${clean}" to Customer Tiers`);
  };

  const [subAreaOptions, setSubAreaOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uj_custom_sub_areas');
      const customList: string[] = saved ? JSON.parse(saved) : [];
      return Array.from(new Set([...DEFAULT_SUB_AREAS, ...customList])).sort();
    } catch {
      return DEFAULT_SUB_AREAS;
    }
  });

  // Mapping of Sub Area -> List of Areas saved under it
  const [subAreaToAreasMap, setSubAreaToAreasMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('uj_subarea_areas_map');
      const customMap = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_SUBAREA_AREAS_MAP, ...customMap };
    } catch {
      return DEFAULT_SUBAREA_AREAS_MAP;
    }
  });

  const handleAddCustomSubArea = (newVal: string) => {
    const clean = newVal.trim();
    if (!clean) return;
    setSubAreaOptions((prev) => {
      const updated = Array.from(new Set([clean, ...prev])).sort();
      try {
        const saved = localStorage.getItem('uj_custom_sub_areas');
        const customList: string[] = saved ? JSON.parse(saved) : [];
        if (!customList.includes(clean)) {
          localStorage.setItem('uj_custom_sub_areas', JSON.stringify([...customList, clean]));
        }
      } catch (e) {
        console.error('Failed to save custom sub area:', e);
      }
      return updated;
    });
    toast.success(`Added "${clean}" to Cities`);
  };

  // Saves new area specifically UNDER the active Sub Area
  const handleAddCustomArea = (newArea: string, currentSubArea: string) => {
    const cleanArea = newArea.trim();
    const cleanSub = currentSubArea.trim();
    if (!cleanArea) return;

    setSubAreaToAreasMap((prev) => {
      const existing = prev[cleanSub] || DEFAULT_AREAS;
      const updatedList = Array.from(new Set([cleanArea, ...existing])).sort();
      const nextMap = { ...prev, [cleanSub]: updatedList };

      try {
        localStorage.setItem('uj_subarea_areas_map', JSON.stringify(nextMap));
      } catch (e) {
        console.error('Failed to save subarea-areas map:', e);
      }

      return nextMap;
    });

    toast.success(`Saved Area "${cleanArea}" under "${cleanSub}"`);
  };

  const { tenantId } = useAuth();
  const { isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [fetchedCustomer, setFetchedCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState<boolean>(false);

  // If navigated directly to /Sales/Customers/Edit/:id or refreshed, load customer from DB
  useEffect(() => {
    if (id && !location.state?.customer) {
      setCustomerLoading(true);
      supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching customer by id:', error);
            toast.error('Failed to load customer details');
          } else if (data) {
            setFetchedCustomer(data);
          }
          setCustomerLoading(false);
        });
    }
  }, [id, location.state?.customer]);

  // Extract customer data if passed via navigation (Edit Mode) or fetched from DB
  const editData = location.state?.customer || fetchedCustomer;
  const isEditMode = !!(id || editData);
  const [existingOBDate, setExistingOBDate] = useState<string>('');

  useEffect(() => {
    if (editData) {
      const code = editData.customer_code || editData.customerCode || editData.coa_code;
      const name = editData.customerName || editData.customername || editData.customer_name || editData.name;
      if (code || name) {
        let q = supabase
          .from('financial_vouchers')
          .select('voucher_date')
          .like('voucher_no', 'OB-%');

        if (code && name) {
          q = q.or(`account_code.eq.${code},account_title.eq.${name}`);
        } else if (code) {
          q = q.eq('account_code', code);
        } else {
          q = q.eq('account_title', name);
        }

        q.order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.voucher_date) {
              setExistingOBDate(data.voucher_date);
            }
          });
      }
    }
  }, [editData]);

  // Universal redirect helper back to customer list
  const handleNavigateToList = () => {
    navigate('/Sales/Customers/List');
  };

  useEffect(() => {
    const fetchInitialMetadata = async () => {
      try {
        const [compRes, coaRes, custRes] = await Promise.all([
          supabase.from('companies').select('id, name'),
          supabase.from('chart_of_accounts').select('account_code, control_code'),
          supabase.from('customers').select('customer_code, customerCode, coa_code')
        ]);

        if (compRes.data) setCompanies(compRes.data);

        // Merge any existing customer tiers from DB
        try {
          const { data: dbCustTiers } = await supabase
            .from('customers')
            .select('registrationType, registrationtype')
            .limit(100);
          if (dbCustTiers && dbCustTiers.length > 0) {
            const tiersFromDb = dbCustTiers
              .map((c: any) => c.registrationType || c.registrationtype)
              .filter((t: any) => typeof t === 'string' && t.trim().length > 1);
            if (tiersFromDb.length > 0) {
              setTierOptions((prev) => Array.from(new Set([...prev, ...tiersFromDb])));
            }
          }
        } catch (e) {
          console.warn('Could not load tiers from customers:', e);
        }

        // Also merge any existing areas and sub areas from customers table
        try {
          const { data: custAreaData } = await supabase
            .from('customers')
            .select('city, address, sub_area, area')
            .limit(500);
          if (custAreaData && custAreaData.length > 0) {
            const dbSubAreas = custAreaData
              .map((c: any) => (c.city || c.sub_area || '').trim())
              .filter((v: any) => typeof v === 'string' && v.length > 1);
            if (dbSubAreas.length > 0) {
              setSubAreaOptions((prev) => Array.from(new Set([...prev, ...dbSubAreas])).sort());
            }

            // Sync sub_area -> area database records into mapping
            setSubAreaToAreasMap((prev) => {
              const nextMap = { ...prev };
              custAreaData.forEach((c: any) => {
                const s = c.sub_area?.trim();
                const a = (c.area || c.city)?.trim();
                if (s && a) {
                  const curr = nextMap[s] || DEFAULT_AREAS;
                  if (!curr.includes(a)) {
                    nextMap[s] = [a, ...curr];
                  }
                }
              });
              return nextMap;
            });
          }
        } catch (e) {
          console.warn('Could not load areas from customers table:', e);
        }

        // Derive next suggested customer ledger code starting sequentially from 2020-001
        if (!isEditMode) {
          const coaList = coaRes.data || [];
          const custList = custRes.data || [];
          const usedCodes = new Set<string>();

          coaList.forEach((a: any) => {
            const code = String(a.account_code || '').trim().toUpperCase();
            if (code) usedCodes.add(code);
          });

          custList.forEach((c: any) => {
            const code1 = String(c.customer_code || '').trim().toUpperCase();
            const code2 = String(c.customerCode || '').trim().toUpperCase();
            const code3 = String(c.coa_code || '').trim().toUpperCase();
            if (code1) usedCodes.add(code1);
            if (code2) usedCodes.add(code2);
            if (code3) usedCodes.add(code3);
          });

          let seq = 1;
          while (true) {
            const candidate = `2020-${String(seq).padStart(3, '0')}`;
            if (!usedCodes.has(candidate)) {
              setSuggestedCode(candidate);
              break;
            }
            seq++;
          }
        }
      } catch (err: any) {
        console.error('Error loading metadata in AddCustomer:', err);
      }
    };

    fetchInitialMetadata();
  }, [isEditMode]);

  const initialLoc = getInitialLocation(editData);

  // Sync edit location into options and mapping so dropdown immediately shows them
  useEffect(() => {
    if (editData) {
      const loc = getInitialLocation(editData);
      if (loc.subArea) {
        setSubAreaOptions((prev) => Array.from(new Set([...prev, loc.subArea])).sort());
      }
      if (loc.subArea && loc.area) {
        setSubAreaToAreasMap((prev) => {
          const existing = prev[loc.subArea] || DEFAULT_AREAS;
          if (!existing.includes(loc.area)) {
            return { ...prev, [loc.subArea]: [loc.area, ...existing] };
          }
          return prev;
        });
      }
    }
  }, [editData]);

  const validationSchema = Yup.object().shape({
    customerName: Yup.string().trim().required('Customer / Business Name is required'),
    subArea: Yup.string().trim().required('City is required'),
    primaryPhone: Yup.string().trim().required('Primary Contact Phone is required')
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const trimmedName = values.customerName.trim();
      const companyVal = values.company || '';

      // --- DYNAMIC DUPLICATE VALIDATION CHECK ENGINE ---
      let query = supabase
        .from('customers')
        .select('id, customerName')
        .eq('customerName', trimmedName)
        .eq('company', companyVal);

      const customerId = editData?.id || id;
      if (isEditMode && customerId) {
        query = query.neq('id', customerId);
      }

      const { data: existingRecords, error: checkError } = await query;
      if (checkError) throw checkError;

      if (existingRecords && existingRecords.length > 0) {
        toast.error(`A customer record named "${trimmedName}" with this branch already exists!`);
        setLoading(false);
        return;
      }

      const cleanCode = (values.customer_code || suggestedCode || '').trim();
      const parsedOpeningBal = Number(values.openingBalance || 0);
      const computedBalance =
        values.balanceNature === 'Credit' ? -Math.abs(parsedOpeningBal) : Math.abs(parsedOpeningBal);

      const regTypeVal = values.registrationType ? values.registrationType.trim() : '';
      const secPhoneVal = values.secondaryPhone ? values.secondaryPhone.trim() : '';

      const cityVal = (() => {
        const s = (values.subArea || '').trim();
        const a = (values.area || '').trim();
        const PAK_CITIES = [
          'hyderabad',
          'karachi',
          'sukkur',
          'lahore',
          'faisalabad',
          'rawalpindi',
          'multan',
          'peshawar',
          'quetta',
          'nawabshah',
          'mirpurkhas',
          'larkana',
          'islamabad'
        ];
        if (PAK_CITIES.includes(s.toLowerCase())) return s;
        if (PAK_CITIES.includes(a.toLowerCase())) return a;
        return s || a || values.city || 'Hyderabad';
      })();

      // --- SMART SCHEMA-ADAPTIVE COLUMN MAPPER ---
      const KNOWN_CUSTOMER_COLUMNS = new Set([
        'customerName',
        'customer_code',
        'customerCode',
        'account_code',
        'coa_code',
        'page_no',
        'pageNo',
        'registrationType',
        'primaryPhone',
        'phone',
        'secondaryPhone',
        'secondaryphone',
        'email',
        'website',
        'address',
        'city',
        'province',
        'company',
        'cnicNo',
        'ntnNo',
        'ntn_strn',
        'stRegNo',
        'notes',
        'followUpDate',
        'currentBalance',
        'balance',
        'opening_balance',
        'customer_name',
        'sub_area',
        'area'
      ]);

      const dbColumns: string[] = [];
      try {
        const { data: probeData } = await supabase.from('customers').select('*').limit(1);
        if (probeData && probeData.length > 0) {
          dbColumns.push(...Object.keys(probeData[0]));
        }
      } catch (probeErr) {
        console.warn('Schema probe notice:', probeErr);
      }

      const hasCol = (colName: string) => {
        if (dbColumns.length > 0) return dbColumns.some((c) => c.toLowerCase() === colName.toLowerCase());
        return KNOWN_CUSTOMER_COLUMNS.has(colName);
      };

      const getExactCols = (colName: string) => {
        if (dbColumns.length > 0) return dbColumns.filter((c) => c.toLowerCase() === colName.toLowerCase());
        return KNOWN_CUSTOMER_COLUMNS.has(colName) ? [colName] : [];
      };

      const sanitizedPayload: any = {};
      const setCol = (fieldKey: string, val: any) => {
        const matchingCols = getExactCols(fieldKey);
        if (matchingCols.length > 0) {
          matchingCols.forEach((col) => {
            sanitizedPayload[col] = val;
          });
        }
      };

      // Set customer name across all existing database name columns
      setCol('customerName', trimmedName);
      setCol('customername', trimmedName);
      setCol('customer_name', trimmedName);
      setCol('name', trimmedName);

      // Customer Code / Ledger Code
      setCol('customer_code', cleanCode);
      setCol('customerCode', cleanCode);
      setCol('coa_code', cleanCode);
      setCol('account_code', cleanCode);

      // Page Number
      setCol('page_no', values.page_no ? String(values.page_no).trim() : '');
      setCol('pageNo', values.page_no ? String(values.page_no).trim() : '');

      // Registration Type / Customer Tier
      setCol('registrationType', regTypeVal);
      setCol('registrationtype', regTypeVal);

      // Phone
      setCol('primaryPhone', values.primaryPhone ? values.primaryPhone.trim() : '');
      setCol('primaryphone', values.primaryPhone ? values.primaryPhone.trim() : '');
      setCol('phone', values.primaryPhone ? values.primaryPhone.trim() : '');

      // Secondary Phone
      setCol('secondaryPhone', secPhoneVal);
      setCol('secondaryphone', secPhoneVal);

      // Location / City / Area / Address / Province / Business info
      setCol('sub_area', values.subArea ? values.subArea.trim() : '');
      setCol('subArea', values.subArea ? values.subArea.trim() : '');
      setCol('area', values.area ? values.area.trim() : '');
      setCol('city', cityVal);
      setCol('address', values.address ? values.address.trim() : '');
      setCol('province', values.province || 'Sindh');
      setCol('company', companyVal);
      setCol('email', values.email ? values.email.trim() : '');
      setCol('website', values.website ? values.website.trim() : '');
      setCol('ntnNo', values.ntnNo ? values.ntnNo.trim() : '');
      setCol('ntn_strn', values.ntnNo ? values.ntnNo.trim() : '');
      setCol('cnicNo', values.cnicNo ? values.cnicNo.trim() : '');
      setCol('stRegNo', values.stRegNo ? values.stRegNo.trim() : '');
      setCol('notes', values.notes ? values.notes.trim() : '');
      setCol('followUpDate', values.followUpDate || null);

      const obDate = values.openingBalanceDate || new Date().toISOString().split('T')[0];
      setCol('opening_balance', Math.abs(parsedOpeningBal));
      setCol('balance', computedBalance);
      setCol('currentBalance', computedBalance);
      setCol('balance_nature', values.balanceNature || 'Debit');
      setCol('balanceNature', values.balanceNature || 'Debit');
      setCol('opening_balance_date', obDate);
      setCol('openingBalanceDate', obDate);

      // If Sub Area or Area was entered but DB has no dedicated columns, preserve in notes
      const sVal = values.subArea ? values.subArea.trim() : '';
      const aVal = values.area ? values.area.trim() : '';
      if ((sVal || aVal) && !hasCol('sub_area') && !hasCol('subarea')) {
        const exactNotes = getExactCols('notes')[0] || 'notes';
        const areaNote = `Location: ${[sVal, aVal].filter(Boolean).join(' | ')}`;
        if (sanitizedPayload[exactNotes]) {
          if (!sanitizedPayload[exactNotes].includes(areaNote)) {
            sanitizedPayload[exactNotes] += ` | ${areaNote}`;
          }
        } else {
          sanitizedPayload[exactNotes] = areaNote;
        }
      }

      // If secondary phone was entered but DB has no secondary phone column, preserve in notes
      if (secPhoneVal && !hasCol('secondaryphone') && !hasCol('secondaryPhone')) {
        const exactNotes = getExactCols('notes')[0] || 'notes';
        if (sanitizedPayload[exactNotes]) {
          if (!sanitizedPayload[exactNotes].includes(secPhoneVal)) {
            sanitizedPayload[exactNotes] += ` | Alt Phone: ${secPhoneVal}`;
          }
        } else {
          sanitizedPayload[exactNotes] = `Alt Phone: ${secPhoneVal}`;
        }
      }

      // Self-healing database executor: handles schema cache column casing mismatches automatically
      const executeSave = async (dataPayload: any) => {
        const customerId = editData?.id || id;
        if (isEditMode && customerId) {
          return await supabase.from('customers').update(dataPayload).eq('id', customerId);
        } else {
          return await supabase.from('customers').insert([dataPayload]).select('id');
        }
      };

      let saveResponse = await executeSave(sanitizedPayload);

      // Auto-fallback: if PostgREST still reports any missing column in schema cache, strip it and retry
      if (
        saveResponse.error &&
        (saveResponse.error.code === 'PGRST204' || saveResponse.error.message?.includes('schema cache'))
      ) {
        const fallbackPayload = { ...sanitizedPayload };
        for (let attempt = 0; attempt < 6 && saveResponse.error; attempt++) {
          const errMsg = saveResponse.error.message || '';
          const colMatch = errMsg.match(/Could not find the '([^']+)' column/i);
          if (colMatch && colMatch[1]) {
            const missingCol = colMatch[1].toLowerCase();
            const foundKey = Object.keys(fallbackPayload).find((k) => k.toLowerCase() === missingCol);
            if (foundKey) {
              delete fallbackPayload[foundKey];
              saveResponse = await executeSave(fallbackPayload);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      if (saveResponse.error) throw saveResponse.error;

      if (isEditMode) {
        toast.success(`Customer "${trimmedName}" updated successfully!`);
      } else {
        toast.success(`Customer "${trimmedName}" registered successfully!`);
      }

      // --- AUTO-SYNC WITH CHART OF ACCOUNTS (COA) ---
      if (cleanCode) {
        try {
          const coaPayload: any = {
            category_code: '1. ASSETS',
            sub_category_code: 'Current Assets',
            control_code: 'Customers',
            account_code: cleanCode,
            account_title: trimmedName,
            opening_balance: Math.abs(parsedOpeningBal),
            balance_nature: values.balanceNature || 'Debit',
            notes: `Customer ledger account for ${trimmedName} (Synced from Customers module)`
          };
          if (tenantId) coaPayload.tenant_id = tenantId;

          const { data: existingCOA } = await supabase
            .from('chart_of_accounts')
            .select('id')
            .eq('account_code', cleanCode)
            .maybeSingle();

          if (existingCOA?.id) {
            await supabase.from('chart_of_accounts').update(coaPayload).eq('id', existingCOA.id);
          } else {
            const { error: insErr } = await supabase.from('chart_of_accounts').insert([coaPayload]);
            if (insErr) {
              console.error('COA auto-sync insert error:', insErr);
            }
          }

          // --- TWO-WAY SYNC: UPDATE OR INSERT OPENING BALANCE FINANCIAL VOUCHER ---
          try {
            let voucherQuery = supabase
              .from('financial_vouchers')
              .select('id')
              .like('voucher_no', 'OB-%');

            if (cleanCode && trimmedName) {
              voucherQuery = voucherQuery.or(`account_code.eq.${cleanCode},account_title.eq.${trimmedName}`);
            } else if (cleanCode) {
              voucherQuery = voucherQuery.eq('account_code', cleanCode);
            } else {
              voucherQuery = voucherQuery.eq('account_title', trimmedName);
            }

            let { data: existingVoucher } = await voucherQuery.maybeSingle();

            if (!existingVoucher) {
              const { data: fallbackVoucher } = await supabase
                .from('financial_vouchers')
                .select('id')
                .ilike('narration', '%Opening Balance%')
                .or(`account_code.eq.${cleanCode},account_title.eq.${trimmedName}`)
                .maybeSingle();
              if (fallbackVoucher) {
                existingVoucher = fallbackVoucher;
              }
            }

            const isDebit = values.balanceNature !== 'Credit';
            const bal = Math.abs(parsedOpeningBal);
            const voucherPayload: any = {
              account_code: cleanCode,
              account_title: trimmedName,
              customerName: trimmedName,
              customer_name: trimmedName,
              voucher_date: obDate,
              total_amount: bal,
              debit: isDebit ? bal : 0,
              credit: !isDebit ? bal : 0,
              narration: `Opening Balance for Customer ${trimmedName}`,
              items: [
                {
                  accountCode: cleanCode,
                  accountTitle: trimmedName,
                  description: `Opening Balance for Customer ${trimmedName}`,
                  debit: isDebit ? bal : 0,
                  credit: !isDebit ? bal : 0
                }
              ],
              metadata: {
                preset: 'SAV',
                auto_generated: true,
                isOpeningBalance: true,
                balanceNature: values.balanceNature || 'Debit'
              }
            };

            if (existingVoucher) {
              if (bal > 0) {
                await supabase.from('financial_vouchers').update(voucherPayload).eq('id', existingVoucher.id);
              } else {
                await supabase.from('financial_vouchers').delete().eq('id', existingVoucher.id);
              }
            } else if (bal > 0) {
              const vNum = cleanCode.replace('2020-', '');
              await supabase.from('financial_vouchers').insert([
                {
                  voucher_no: `OB-${vNum}`,
                  voucher_type: 'Journal Voucher',
                  ...voucherPayload
                }
              ]);
            }
          } catch (vErr) {
            console.warn('Voucher auto-sync note:', vErr);
          }
        } catch (coaErr) {
          console.warn('COA auto-sync note:', coaErr);
        }
      }

      handleNavigateToList();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const validateRequiredFields = (values: any): boolean => {
    if (!values.customerName || !values.customerName.trim()) {
      toast.error('Customer / Business Name is required (Step 1: Identity)');
      setActiveTab(1);
      return false;
    }
    if (!values.subArea || !values.subArea.trim()) {
      toast.error('City is required (Step 2: Contact & Address)');
      setActiveTab(2);
      return false;
    }
    if (!values.primaryPhone || !values.primaryPhone.trim()) {
      toast.error('Primary Contact Phone is required (Step 2: Contact & Address)');
      setActiveTab(2);
      return false;
    }
    return true;
  };

  if (customerLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Spinner size="w-8 h-8" />
        <span className="text-sm font-semibold text-gray-500">Loading Customer Profile...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. Breadcrumb Navigation */}
      <Breadcrumb pageName={isEditMode ? 'Edit Customer Profile' : 'New Customer Registration'} />

      {/* 2. Header Action Banner */}
      <CustomerHeaderBanner
        isEditMode={isEditMode}
        customerName={
          editData?.customerName || editData?.customername || editData?.customer_name || editData?.name
        }
        onNavigateToList={handleNavigateToList}
      />

      {/* 3. Main Form Canvas */}
      <Formik
        initialValues={
          editData
            ? {
                ...editData,
                customerName:
                  editData.customerName || editData.customername || editData.customer_name || editData.name || '',
                customer_code: editData.customer_code || editData.customerCode || editData.coa_code || '',
                page_no: editData.page_no || editData.pageNo || editData.page_number || '',
                registrationType: editData.registrationType || editData.registrationtype || '',
                subArea: initialLoc.subArea,
                city: initialLoc.subArea,
                area: initialLoc.area,
                primaryPhone: editData.primaryPhone || editData.phone || '',
                secondaryPhone: editData.secondaryPhone || '',
                email: editData.email || '',
                address: editData.address || '',
                province: editData.province || 'Sindh',
                company: editData.company || '',
                website: editData.website || '',
                notes: editData.notes || '',
                followUpDate: editData.followUpDate || '',
                openingBalance:
                  editData.opening_balance !== undefined &&
                  editData.opening_balance !== null &&
                  editData.opening_balance !== ''
                    ? Math.abs(Number(editData.opening_balance))
                    : editData.currentBalance !== undefined &&
                      editData.currentBalance !== null &&
                      editData.currentBalance !== ''
                    ? Math.abs(Number(editData.currentBalance))
                    : editData.balance !== undefined && editData.balance !== null && editData.balance !== ''
                    ? Math.abs(Number(editData.balance))
                    : '',
                balanceNature:
                  editData.balance_nature ||
                  editData.balanceNature ||
                  ((editData.currentBalance && Number(editData.currentBalance) < 0) ||
                  (editData.balance && Number(editData.balance) < 0)
                    ? 'Credit'
                    : 'Debit'),
                openingBalanceDate:
                  existingOBDate ||
                  editData.opening_balance_date ||
                  editData.openingBalanceDate ||
                  (editData.created_at
                    ? editData.created_at.split('T')[0]
                    : new Date().toISOString().split('T')[0])
              }
            : {
                customerName: '',
                subArea: '',
                area: '',
                customer_code: suggestedCode || '',
                page_no: '',
                registrationType: '',
                primaryPhone: '',
                secondaryPhone: '',
                email: '',
                address: '',
                province: 'Sindh',
                company: '',
                website: '',
                ntnNo: '',
                cnicNo: '',
                stRegNo: '',
                notes: '',
                followUpDate: '',
                openingBalance: '',
                balanceNature: 'Debit',
                openingBalanceDate: new Date().toISOString().split('T')[0]
              }
        }
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, values, errors, touched, setFieldValue }) => (
          <Form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (validateRequiredFields(values)) {
                handleSubmit(values);
              }
            }}
          >
            {/* Step Wizard Tabs Bar */}
            <CustomerStepTabs activeTab={activeTab} setActiveTab={setActiveTab} isRTL={isRTL} />

            {/* Step 1: Customer Identity & Classification */}
            {activeTab === 1 && (
              <CustomerIdentityTab
                values={values}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                setFieldValue={setFieldValue}
                tierOptions={tierOptions}
                onAddCustomTier={handleAddCustomTier}
              />
            )}

            {/* Step 2: Contact Information & Location */}
            {activeTab === 2 && (
              <CustomerContactTab
                values={values}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                setFieldValue={setFieldValue}
                subAreaOptions={subAreaOptions}
                subAreaToAreasMap={subAreaToAreasMap}
                onAddCustomSubArea={handleAddCustomSubArea}
                onAddCustomArea={handleAddCustomArea}
              />
            )}

            {/* Step 3: Account & Ledger Configuration */}
            {activeTab === 3 && (
              <CustomerAccountTab
                values={values}
                handleChange={handleChange}
                setFieldValue={setFieldValue}
                suggestedCode={suggestedCode}
              />
            )}

            {/* Step 4: Taxation & Legal Identifiers */}
            {activeTab === 4 && <CustomerTaxTab values={values} handleChange={handleChange} />}

            {/* Step 5: CRM Follow-Up & Remarks */}
            {activeTab === 5 && <CustomerNotesTab values={values} handleChange={handleChange} />}

            {/* Bottom Stepper Actions Bar */}
            <CustomerStepperActions
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isEditMode={isEditMode}
              loading={loading}
              isRTL={isRTL}
              onCancel={handleNavigateToList}
              onNext={() => {
                if (activeTab === 1 && !values.customerName?.trim()) {
                  toast.error(
                    isRTL
                      ? 'کسٹمر کا نام درج کرنا ضروری ہے (مرحلہ 1)'
                      : 'Customer / Business Name is required (Step 1)'
                  );
                  return;
                }
                if (activeTab === 2 && !values.primaryPhone?.trim()) {
                  toast.error(
                    isRTL
                      ? 'فون نمبر درج کرنا ضروری ہے (مرحلہ 2)'
                      : 'Primary Contact Phone is required (Step 2)'
                  );
                  return;
                }
                setActiveTab((prev) => Math.min(5, prev + 1));
              }}
              onSubmit={() => {
                if (validateRequiredFields(values)) {
                  handleSubmit(values);
                }
              }}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddCustomer;
