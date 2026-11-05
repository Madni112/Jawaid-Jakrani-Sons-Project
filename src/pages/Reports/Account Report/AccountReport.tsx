import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { SearchableMultiSelect } from '../../../components/SearchableMultiSelect';
import { DEFAULT_SUB_AREAS, DEFAULT_AREAS, DEFAULT_SUBAREA_AREAS_MAP } from '../../../components/SubAreaAreaInput';
import {
  MasterThemePreset,
  getMasterThemePreset,
  isNHTTheme2Active,
} from '../../../constant/themeConfig';
import { LuBarChart2, LuDownload, LuPrinter, LuSearch } from 'react-icons/lu';

const AccountReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);

  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());

  useEffect(() => {
    const updateMasterPreset = () => {
      setMasterPreset(getMasterThemePreset());
    };
    window.addEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
    window.addEventListener('storage', updateMasterPreset);
    return () => {
      window.removeEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
      window.removeEventListener('storage', updateMasterPreset);
    };
  }, []);

  const isTheme2 = masterPreset === 'nht-2' || (masterPreset !== 'nht-1' && isNHTTheme2Active());

  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') ? Number(searchParams.get('tab')) : null;
  const defaultTab = isTheme2 ? 11 : 1;
  const initialTab = Number(location.state?.activeTab || location.state?.tab || queryTab || defaultTab);
  const [activeTab, setActiveTab] = useState<number>(initialTab);
  const [trialViewMode, setTrialViewMode] = useState<'hierarchy' | '2-column' | '6-column'>('hierarchy');

  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [uniqueCategoryCodes, setUniqueCategoryCodes] = useState<any[]>([]);
  const [uniqueSubCategoryCodes, setUniqueSubCategoryCodes] = useState<any[]>([]);
  const [uniqueControlCodes, setUniqueControlCodes] = useState<any[]>([]);

  const getPastWeekDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState(location.state?.filters || {
    categoryCode: [],
    subCategoryCode: [],
    controlCode: [],
    chartOfAccountCode: [],
    city: [],
    area: [],
    customerCategory: [],
    customer: [],
    vendor: [],
    company: [],
    voucherType: 'All',
    saleType: 'Sale',
    salesman: [],
    showZeroValues: false,
    showOnlyTransacted: false,
    dateFrom: getPastWeekDateString(),
    dateTo: getTodayDateString()
  });

  useEffect(() => {
    navigate('.', { replace: true, state: { ...location.state, activeTab, filters } });
  }, [activeTab, filters, navigate]);

  useEffect(() => {
    const fetchAccountCriteriaLookups = async () => {
      try {
        setLoading(true);
        const [custRes, vendRes, smRes, compRes, coaRes] = await Promise.all([
          supabase.from('customers').select('id, customerName, registrationType, primaryPhone, customer_code, customerCode, city, address, notes'),
          supabase.from('vendors').select('id, vendor_name'),
          supabase.from('salesmen').select('id, name'),
          supabase.from('companies').select('id, name'),
          supabase.from('chart_of_accounts').select('id, category_code, sub_category_code, control_code, account_code, account_title')
        ]);

        if (custRes.data) setCustomers(custRes.data);
        if (vendRes.data) setVendors(vendRes.data);
        if (smRes.data) setSalesmen(smRes.data);
        if (compRes.data) setCompanies(compRes.data);

        if (coaRes.data) {
          setChartOfAccounts(coaRes.data);
          const cats = Array.from(new Set(coaRes.data.map((item: any) => item.category_code).filter(Boolean)));
          setUniqueCategoryCodes(cats);
          const subs = Array.from(new Set(coaRes.data.map((item: any) => item.sub_category_code).filter(Boolean)));
          setUniqueSubCategoryCodes(subs);
          const ctrls = Array.from(new Set(coaRes.data.map((item: any) => item.control_code).filter(Boolean)));
          setUniqueControlCodes(ctrls);
        }
      } catch (err: any) {
        toast.error('Financial registry lookup interruption: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountCriteriaLookups();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'categoryCode') {
        updated.subCategoryCode = [];
        updated.controlCode = [];
        updated.chartOfAccountCode = [];
      } else if (field === 'subCategoryCode') {
        updated.controlCode = [];
        updated.chartOfAccountCode = [];
      } else if (field === 'controlCode') {
        updated.chartOfAccountCode = [];
      }
      return updated;
    });
  };

  const getFilteredSubCategoryCodesPool = () => {
    if (!filters.categoryCode || filters.categoryCode.length === 0) return uniqueSubCategoryCodes;
    return Array.from(new Set(
      chartOfAccounts
        .filter((item: any) => filters.categoryCode.includes(item.category_code))
        .map((item: any) => item.sub_category_code)
        .filter(Boolean)
    ));
  };

  const getFilteredControlCodesPool = () => {
    if ((!filters.categoryCode || filters.categoryCode.length === 0) && (!filters.subCategoryCode || filters.subCategoryCode.length === 0)) return uniqueControlCodes;
    return Array.from(new Set(
      chartOfAccounts
        .filter((item: any) => (filters.categoryCode?.length === 0 || filters.categoryCode?.includes(item.category_code)))
        .filter((item: any) => (filters.subCategoryCode?.length === 0 || filters.subCategoryCode?.includes(item.sub_category_code)))
        .map((item: any) => item.control_code)
        .filter(Boolean)
    ));
  };

  const getFilteredChartOfAccountsPool = () => {
    let pool = chartOfAccounts;
    if (filters.categoryCode && filters.categoryCode.length > 0) {
      pool = pool.filter((item: any) => item.category_code === filters.categoryCode);
    }
    if (filters.subCategoryCode && filters.subCategoryCode.length > 0) {
      pool = pool.filter((item: any) => filters.subCategoryCode.includes(item.sub_category_code));
    }
    if (filters.controlCode && filters.controlCode.length > 0) {
      pool = pool.filter((item: any) => filters.controlCode.includes(item.control_code));
    }
    return pool;
  };

  const categoryCodeOptions = useMemo(() => uniqueCategoryCodes, [uniqueCategoryCodes]);
  const subCategoryCodeOptions = useMemo(() => getFilteredSubCategoryCodesPool(), [uniqueSubCategoryCodes, chartOfAccounts, filters.categoryCode]);
  const controlCodeOptions = useMemo(() => getFilteredControlCodesPool(), [uniqueControlCodes, chartOfAccounts, filters.categoryCode, filters.subCategoryCode]);
  const chartOfAccountOptions = useMemo(() => getFilteredChartOfAccountsPool().map(c => `${c.account_code} - ${c.account_title}`), [chartOfAccounts, filters.categoryCode, filters.subCategoryCode, filters.controlCode]);
  const getCustomerLocation = (c: any) => {
    let city = c.city || c.sub_area || c.subArea || '';
    let area = c.area || '';

    if (c.notes && c.notes.includes('Location:')) {
      const match = c.notes.match(/Location:\s*([^|\n]+)(?:\s*\|\s*([^\n]+))?/);
      if (match) {
        const noteCity = match[1]?.trim();
        const noteArea = match[2]?.trim();
        if (!city) city = noteCity;
        if (city && city.toLowerCase() === 'hyderabad' && noteCity && noteCity.toLowerCase() !== 'hyderabad') {
          city = noteCity;
        }
        if (!area && noteArea) area = noteArea;
      }
    }

    if (!city && c.address) {
      const addr = String(c.address).toLowerCase();
      for (const dCity of DEFAULT_SUB_AREAS) {
        if (addr.includes(dCity.toLowerCase())) {
          city = dCity;
          break;
        }
      }
    }

    return { city: city || 'Hyderabad', area: area || '' };
  };

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    customers.forEach(c => {
      const loc = getCustomerLocation(c);
      if (loc.city) cities.add(loc.city);
    });
    DEFAULT_SUB_AREAS.forEach(c => cities.add(c));
    return Array.from(cities).filter(Boolean).sort();
  }, [customers]);

  const isCityMatch = (filterCity: string, targetCity: string) => {
    if (!filterCity || !targetCity) return false;
    const f = filterCity.trim().toLowerCase();
    const t = targetCity.trim().toLowerCase();
    if (f === t) return true;
    if ((f === 'matli' || f === 'ماتلی') && (t === 'matli' || t === 'ماتلی')) return true;
    return false;
  };

  const areaOptions = useMemo(() => {
    const areas = new Set<string>();
    const rawCityFilters = (filters.city && filters.city.length > 0 && !filters.city.includes('All'))
      ? (Array.isArray(filters.city) ? filters.city : [filters.city])
      : [];

    if (rawCityFilters.length > 0) {
      rawCityFilters.forEach(city => {
        const mapped = DEFAULT_SUBAREA_AREAS_MAP[city] || [];
        mapped.forEach(a => areas.add(a));
        if (city.toLowerCase() === 'matli' && DEFAULT_SUBAREA_AREAS_MAP['ماتلی']) {
          DEFAULT_SUBAREA_AREAS_MAP['ماتلی'].forEach(a => areas.add(a));
        } else if (city === 'ماتلی' && DEFAULT_SUBAREA_AREAS_MAP['Matli']) {
          DEFAULT_SUBAREA_AREAS_MAP['Matli'].forEach(a => areas.add(a));
        }
      });
      customers.forEach(c => {
        const loc = getCustomerLocation(c);
        const matches = rawCityFilters.some(f => isCityMatch(f, loc.city));
        if (matches && loc.area) areas.add(loc.area);
      });
    } else {
      DEFAULT_AREAS.forEach(a => areas.add(a));
      customers.forEach(c => {
        const loc = getCustomerLocation(c);
        if (loc.area) areas.add(loc.area);
      });
    }
    return Array.from(areas).filter(Boolean).sort();
  }, [customers, filters.city]);

  const customerOptions = useMemo(() => {
    let pool = customers;
    if (filters.city && filters.city.length > 0 && !filters.city.includes('All')) {
      const rawCityFilters = Array.isArray(filters.city) ? filters.city : [filters.city];
      pool = pool.filter(c => {
        const loc = getCustomerLocation(c);
        return rawCityFilters.some(f => isCityMatch(f, loc.city));
      });
    }
    if (filters.area && filters.area.length > 0 && !filters.area.includes('All')) {
      const rawAreaFilters = Array.isArray(filters.area) ? filters.area : [filters.area];
      pool = pool.filter(c => {
        const loc = getCustomerLocation(c);
        return rawAreaFilters.some(f => f.trim().toLowerCase() === (loc.area || '').trim().toLowerCase());
      });
    }
    if (filters.customerCategory && filters.customerCategory.length > 0 && !filters.customerCategory.includes('All')) {
      pool = pool.filter(c => filters.customerCategory.includes(c.registrationType || 'Retail / General'));
    }
    return pool.map(c => {
      const code = c.customer_code || c.customerCode;
      return code ? `[${code}] ${c.customerName}` : c.customerName;
    }).filter(Boolean);
  }, [customers, filters.city, filters.area, filters.customerCategory]);
  const customerCategoryOptions = useMemo(() => {
    const fromCust = customers.map(c => c.registrationType).filter(Boolean);
    const standard = ['Retail / General', 'Contractor / Builder', 'Wholesaler / Dealer', 'Registered Corporate'];
    return Array.from(new Set([...standard, ...fromCust]));
  }, [customers]);
  const vendorOptions = useMemo(() => vendors.map(v => v.vendor_name).filter(Boolean), [vendors]);
  const companyOptions = useMemo(() => companies.map(c => c.name).filter(Boolean), [companies]);
  const salesmanOptions = useMemo(() => salesmen.map(s => s.name).filter(Boolean), [salesmen]);

  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
    setFilters(prev => ({
      categoryCode: [],
      subCategoryCode: [],
      controlCode: [],
      chartOfAccountCode: [],
      customerCategory: [],
      customer: [],
      vendor: [],
      company: [],
      voucherType: 'All',
      saleType: 'Sale',
      salesman: [],
      showZeroValues: false,
      showOnlyTransacted: false,
      dateFrom: prev.dateFrom,
      dateTo: prev.dateTo
    }));
  };

  const handleDispatchReportView = () => {
    if (activeTab === 1 || activeTab === 8) {
      if (filters.dateFrom && filters.dateTo) {
        const start = new Date(filters.dateFrom);
        const end = new Date(filters.dateTo);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 93) {
          toast.error("Please select a date range of 3 months or less for detailed reports.");
          return;
        }
      }
    }

    navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/Account-Report/Print`, {
      state: { tab: activeTab, criteria: filters }
    });
  };

  const tabNames: Record<number, string> = {
    1: 'General Ledger',
    2: 'Customer Summary',
    3: 'Vendor Balance Detail',
    4: 'Operational Expenses',
    5: 'Chart of Accounts',
    6: 'Vendor Outstanding',
    7: 'Customer Recovery',
    8: 'Voucher Report',
    9: 'Cash & Bank Daybook',
    10: 'Salesman Statement',
    11: 'Trial Balance',
    12: 'Aging Report',
    13: 'Customer Balance Detail',
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-black dark:text-bodydark text-xs antialiased font-sans relative">
      <div>
        <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-wider">
          {isTheme2 ? (tabNames[activeTab] || 'Financial Reports') : 'Corporate Account Auditing Center'}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {isTheme2
            ? `Reports / Accounting Reports / ${tabNames[activeTab] || 'Financial Reports'}`
            : 'Compile general ledgers, trial balance summaries, and corporate financial aging statements'}
        </p>
      </div>

      <div className={`flex flex-wrap gap-1.5 ${isTheme2 ? 'bg-transparent pb-1' : 'border-b border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-1'} font-semibold text-xs`}>
        {[11, 1, 13, 3, 2, 4, 5, 6, 7, 8, 9, 10, 12].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer text-xs ${
              activeTab === t
                ? isTheme2
                  ? 'bg-[#800020] text-white font-bold shadow-xs'
                  : 'border-b-2 border-primary text-primary font-black bg-primary/5'
                : isTheme2
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            {tabNames[t]}
          </button>
        ))}
      </div>

      <div className={`${isTheme2 ? 'rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs' : 'rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6'}`}>
        <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className={`font-bold text-sm ${isTheme2 ? 'text-slate-900 dark:text-white' : 'text-primary uppercase tracking-wider'}`}>
            {isTheme2 ? 'Report Criteria & Filters' : 'Report Criteria Specification'}
          </h3>
          {isTheme2 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-semibold">
                Financial Year 2026-27 (Active)
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

          {(activeTab === 1 || activeTab === 13) && (
            <>
              <SearchableMultiSelect 
                label="City / Sub Area:" 
                placeholder="All Cities" 
                options={cityOptions} 
                value={filters.city || []} 
                onChange={(val) => {
                  handleInputChange('city', val);
                  handleInputChange('area', []);
                  handleInputChange('customer', []);
                }} 
              />
              <SearchableMultiSelect 
                label="Area / Market:" 
                placeholder="All Areas" 
                options={areaOptions} 
                value={filters.area || []} 
                onChange={(val) => {
                  handleInputChange('area', val);
                  handleInputChange('customer', []);
                }} 
              />
              <SearchableMultiSelect 
                label="Customer Category / Type:" 
                placeholder="All Categories" 
                options={customerCategoryOptions} 
                value={filters.customerCategory} 
                onChange={(val) => handleInputChange('customerCategory', val)} 
              />
              <SearchableMultiSelect 
                label="Select Customer Title:" 
                placeholder="All Customers" 
                options={customerOptions} 
                value={filters.customer} 
                onChange={(val) => handleInputChange('customer', val)} 
              />
              <div className="md:col-span-4 flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={Boolean(filters.showZeroValues)} 
                    onChange={(e) => handleInputChange('showZeroValues', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-stroke dark:border-strokedark focus:ring-0 cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-bold text-black dark:text-white">Show Zero Values (Settled Accounts)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={Boolean(filters.showOnlyTransacted)} 
                    onChange={(e) => handleInputChange('showOnlyTransacted', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-stroke dark:border-strokedark focus:ring-0 cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-bold text-black dark:text-white">Show Only Customers With Transaction</span>
                </label>
              </div>
            </>
          )}

          {activeTab === 3 && (
            <>
              <SearchableMultiSelect 
                label="Select Procurement Vendor:" 
                placeholder="All Vendors" 
                options={vendorOptions} 
                value={filters.vendor} 
                onChange={(val) => handleInputChange('vendor', val)} 
              />
              <div className="md:col-span-3 flex flex-wrap items-center gap-6 pt-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={Boolean(filters.showZeroValues)} 
                    onChange={(e) => handleInputChange('showZeroValues', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-stroke dark:border-strokedark focus:ring-0 cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-bold text-black dark:text-white">Show Zero Values (Settled / Inactive Vendors)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={Boolean(filters.showOnlyTransacted)} 
                    onChange={(e) => handleInputChange('showOnlyTransacted', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-stroke dark:border-strokedark focus:ring-0 cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-bold text-black dark:text-white">Show Only Vendors With Transactions</span>
                </label>
              </div>
            </>
          )}

          {activeTab === 1 && (
            <>
              <SearchableMultiSelect label="Category Code:" placeholder="Category Code" options={categoryCodeOptions} value={filters.categoryCode} onChange={(val) => handleInputChange('categoryCode', val)} />
              <SearchableMultiSelect label="Sub-Category:" placeholder="Sub-Category" options={subCategoryCodeOptions} value={filters.subCategoryCode} onChange={(val) => handleInputChange('subCategoryCode', val)} />
              <SearchableMultiSelect label="Control Code:" placeholder="Control Code" options={controlCodeOptions} value={filters.controlCode} onChange={(val) => handleInputChange('controlCode', val)} />
              <SearchableMultiSelect
                label="Chart of Account Code:"
                placeholder="Account"
                options={chartOfAccountOptions}
                value={filters.chartOfAccountCode}
                onChange={(val) => {
                  const cleanCode = val.map((v: string) => v.split(' - ')[0]);
                  handleInputChange('chartOfAccountCode', cleanCode);
                }}
              />
              <SearchableMultiSelect label="Select Customer Title:" placeholder="Customer" options={customerOptions} value={filters.customer} onChange={(val) => handleInputChange('customer', val)} />
            </>
          )}

          {activeTab === 2 && (
            <SearchableMultiSelect label="Select Customer Title:" placeholder="Customer" options={customerOptions} value={filters.customer} onChange={(val) => handleInputChange('customer', val)} />
          )}

          {activeTab === 3 && (
            <SearchableMultiSelect label="Select Procurement Vendor:" placeholder="Vendor" options={vendorOptions} value={filters.vendor} onChange={(val) => handleInputChange('vendor', val)} />
          )}

          {activeTab === 4 && (
            <div className="md:col-span-4 text-gray-400 italic font-mono">Generates dynamic operational statement parameters sheets on print compilation dispatch tracking pools.</div>
          )}

          {activeTab === 5 && (
            <SearchableMultiSelect label="Category Code Selection:" placeholder="Category Code" options={categoryCodeOptions} value={filters.categoryCode} onChange={(val) => handleInputChange('categoryCode', val)} />
          )}

          {activeTab === 6 && (
            <SearchableMultiSelect label="Select Procurement Vendor:" placeholder="Vendor" options={vendorOptions} value={filters.vendor} onChange={(val) => handleInputChange('vendor', val)} />
          )}

          {activeTab === 7 && (
            <>
              <SearchableMultiSelect label="Select Customer Title:" placeholder="Customer" options={customerOptions} value={filters.customer} onChange={(val) => handleInputChange('customer', val)} />
              {/* <SearchableMultiSelect label="Linked Principal Company:" placeholder="Company" options={companyOptions} value={filters.company} onChange={(val) => handleInputChange('company', val)} /> */}
            </>
          )}

          {activeTab === 8 && (
            <div>
              <label className="block font-bold text-gray-500 mb-1">Select Voucher Classification:</label>
              <select value={filters.voucherType} onChange={(e) => handleInputChange('voucherType', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                <option value="All">All Vouchers</option>
                <option value="Cash Receipt">Cash Receipt Voucher (CRV)</option>
                <option value="Cash Payment">Cash Payment Voucher (CPV)</option>
                <option value="Bank Receipt">Bank Receipt Voucher (BRV)</option>
                <option value="Bank Payment">Bank Payment Voucher (BPV)</option>
              </select>
            </div>
          )}

          {activeTab === 9 && (
            <div>
              <label className="block font-bold text-gray-500 mb-1">Allocation Activity Mode:</label>
              <select value={filters.saleType} onChange={(e) => handleInputChange('saleType', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                <option value="Sale">Commercial Invoice Sales</option>
                <option value="Purchase">Procurement Supplier Purchase</option>
                <option value="Banks">Corporate Bank Registers</option>
                <option value="Cashbook">Counter Cash Box Ledger</option>
              </select>
            </div>
          )}

          {activeTab === 10 && (
            <SearchableMultiSelect label="Linked Salesman Agent:" placeholder="Salesman" options={salesmanOptions} value={filters.salesman} onChange={(val) => handleInputChange('salesman', val)} />
          )}

          {activeTab === 11 && isTheme2 ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Financial Year</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                  <option>Financial Year 2026-27 (Active)</option>
                  <option>Financial Year 2025-26</option>
                  <option>Financial Year 2024-25</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">View</label>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                  {(['hierarchy', '2-column', '6-column'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTrialViewMode(mode)}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                        trialViewMode === mode
                          ? 'bg-[#800020] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">As Of Date</label>
                <input
                  type="date"
                  value={filters.dateTo || getTodayDateString()}
                  onChange={(e) => handleInputChange('dateTo', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">From Account (L5)</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                  <option>-- First --</option>
                  {chartOfAccountOptions.slice(0, 30).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">To Account (L5)</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                  <option>-- Last --</option>
                  {chartOfAccountOptions.slice(0, 30).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Type</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                  <option>All Types</option>
                  <option>Asset</option>
                  <option>Liability</option>
                  <option>Equity</option>
                  <option>Revenue</option>
                  <option>Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Level</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                  <option>Level 5 - Detail</option>
                  <option>Level 4 - Sub-Control</option>
                  <option>Level 3 - Control</option>
                  <option>Level 2 - Group</option>
                  <option>Level 1 - Class</option>
                </select>
              </div>

              <div className="md:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex-1 relative">
                  <LuSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by account code or name..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.showZeroValues)}
                      onChange={(e) => handleInputChange('showZeroValues', e.target.checked)}
                      className="w-4 h-4 rounded text-[#800020] accent-[#800020] border-slate-300"
                    />
                    <span>Show Zero Balances</span>
                  </label>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <span>Expand</span>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <span>Collapse</span>
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 11 ? (
            <SearchableMultiSelect label="Category Code Selection:" placeholder="Category Code" options={categoryCodeOptions} value={filters.categoryCode} onChange={(val) => handleInputChange('categoryCode', val)} />
          ) : null}

          {activeTab === 12 && (
            <SearchableMultiSelect label="Select Customer Title:" placeholder="Customer" options={customerOptions} value={filters.customer} onChange={(val) => handleInputChange('customer', val)} />
          )}

          {activeTab !== 5 && activeTab !== 11 && activeTab !== 12 && (
            <>
              <div><label className="block font-bold text-gray-500 mb-1">Date Bracket From:</label><input type="date" max={new Date().toISOString().split('T')[0]} value={filters.dateFrom} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; let newDateFrom = e.target.value; if (newDateFrom > today) newDateFrom = today; handleInputChange('dateFrom', newDateFrom); if (activeTab === 1 || activeTab === 8) { const dFrom = new Date(newDateFrom); const dTo = new Date(filters.dateTo); const diffDays = Math.ceil(Math.abs(dTo.getTime() - dFrom.getTime()) / (1000 * 60 * 60 * 24)); if (dTo < dFrom || diffDays > 90) { const maxAllowed = new Date(dFrom.setDate(dFrom.getDate() + 90)).toISOString().split('T')[0]; handleInputChange('dateTo', maxAllowed < today ? maxAllowed : today); } } }} className="w-full border border-stroke rounded p-2 bg-transparent font-semibold text-black dark:text-white text-xs outline-none dark:bg-boxdark" /></div>
              <div><label className="block font-bold text-gray-500 mb-1">Date Bracket To:</label><input type="date" min={filters.dateFrom} max={filters.dateFrom && (activeTab === 1 || activeTab === 8) ? [new Date(new Date(filters.dateFrom).setDate(new Date(filters.dateFrom).getDate() + 90)).toISOString().split('T')[0], new Date().toISOString().split('T')[0]].sort()[0] : new Date().toISOString().split('T')[0]} value={filters.dateTo} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; const maxAllowed = filters.dateFrom && (activeTab === 1 || activeTab === 8) ? [new Date(new Date(filters.dateFrom).setDate(new Date(filters.dateFrom).getDate() + 90)).toISOString().split('T')[0], today].sort()[0] : today; let newDateTo = e.target.value; if (newDateTo > maxAllowed) newDateTo = maxAllowed; if (newDateTo < filters.dateFrom) newDateTo = filters.dateFrom; handleInputChange('dateTo', newDateTo); }} className="w-full border border-stroke rounded p-2 bg-transparent font-semibold text-black dark:text-white text-xs outline-none dark:bg-boxdark" /></div>
              <div className="md:col-span-4 flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Quick Dates:</span>
                <button type="button" onClick={() => { const t = new Date().toISOString().split('T')[0]; handleInputChange('dateFrom', t); handleInputChange('dateTo', t); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition">Today</button>
                <button type="button" onClick={() => { const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.toISOString().split('T')[0]; handleInputChange('dateFrom', ys); handleInputChange('dateTo', ys); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition">Yesterday</button>
                <button type="button" onClick={() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const s = new Date(d.setDate(diff)).toISOString().split('T')[0]; handleInputChange('dateFrom', s); handleInputChange('dateTo', new Date().toISOString().split('T')[0]); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition">This Week</button>
                <button type="button" onClick={() => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; handleInputChange('dateFrom', s); handleInputChange('dateTo', new Date().toISOString().split('T')[0]); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition">This Month</button>
                <button type="button" onClick={() => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0]; const e = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0]; handleInputChange('dateFrom', s); handleInputChange('dateTo', e); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition">Last Month</button>
              </div>
            </>
          )}
        </div>

        <div className={`mt-8 pt-4 border-t ${isTheme2 ? 'border-slate-100 dark:border-slate-800' : 'border-stroke dark:border-strokedark'} flex items-center justify-end gap-3`}>
          {isTheme2 && (
            <>
              <button
                type="button"
                onClick={() => {
                  toast.success('Downloading report CSV...');
                  handleDispatchReportView();
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <LuDownload size={14} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleDispatchReportView}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <LuPrinter size={14} />
                <span>Print</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleDispatchReportView}
            className={`${
              isTheme2
                ? 'rounded-lg bg-[#800020] hover:bg-[#6b001a] py-2 px-6 font-bold text-white transition text-xs shadow-sm flex items-center gap-2 cursor-pointer'
                : 'rounded bg-primary py-2.5 px-12 font-black text-white hover:bg-opacity-90 transition text-xs shadow-sm h-9 cursor-pointer uppercase tracking-wider'
            }`}
          >
            {isTheme2 ? (
              <>
                <LuBarChart2 size={15} />
                <span>Generate</span>
              </>
            ) : (
              'Show Report'
            )}
          </button>
        </div>
      </div>

      {/* Amal ERP Empty State Preview Card when in NHT Theme 2 */}
      {isTheme2 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
          <div className="flex items-end gap-1.5 text-slate-300 dark:text-slate-600 mb-4 h-10">
            <span className="w-1.5 h-6 bg-slate-300 dark:bg-slate-600 rounded-full inline-block" />
            <span className="w-1.5 h-10 bg-slate-300 dark:bg-slate-600 rounded-full inline-block" />
            <span className="w-1.5 h-4 bg-slate-300 dark:bg-slate-600 rounded-full inline-block" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
            Select a financial year and click <strong className="text-slate-700 dark:text-slate-200">Generate</strong> to view the {tabNames[activeTab] || 'trial balance'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountReport;
