import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import SearchableMultiSelect from '../../../components/SearchableMultiSelect';
import StockReportPrint from './StockReportPrint';
import {
  MdTimeline,
  MdInventory,
  MdAccessTime,
  MdCompareArrows,
  MdBarChart,
  MdCategory,
  MdStorefront,
  MdPauseCircleFilled,
  MdMenuBook,
  MdSearch,
  MdFileDownload,
  MdPictureAsPdf,
  MdPrint
} from 'react-icons/md';

const stockTabs = [
  { key: 1, label: 'Stock Activity', icon: MdTimeline },
  { key: 2, label: 'Stock Balance', icon: MdInventory },
  { key: 3, label: 'Stock Status', icon: MdAccessTime },
  { key: 4, label: 'Stock Transfer', icon: MdCompareArrows },
  { key: 5, label: 'Price Detail Ledger', icon: MdBarChart },
  { key: 7, label: 'Category Valuation', icon: MdCategory },
  { key: 8, label: 'Location Stock', icon: MdStorefront },
] as const;

const StockReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);

  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState<{ tab: number; filters: any } | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab');
  const initialTab = Number(queryTab || location.state?.activeTab || location.state?.tab || 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(initialTab);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam) {
      const num = Number(tabParam) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      if (num && num !== activeTab) {
        handleTabChange(num);
      }
    }
  }, [location.search]);

  const [categories, setCategories] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const parseCriteriaArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' && val !== 'All' ? [val] : []);

  const [criteria, setCriteria] = useState(() => {
    const base = location.state?.criteria || {};
    return {
      uom: location.state?.uom ? [location.state.uom] : parseCriteriaArray(base.uom),
      bin: location.state?.bin ? [location.state.bin] : parseCriteriaArray(base.bin),
      product: location.state?.product ? [location.state.product] : parseCriteriaArray(base.product),
      location: location.state?.location ? [location.state.location] : parseCriteriaArray(base.location),
      employee: parseCriteriaArray(base.employee),
      parentCategory: location.state?.parentCategory ? [location.state.parentCategory] : parseCriteriaArray(base.parentCategory),
      subCategory: location.state?.subCategory ? [location.state.subCategory] : parseCriteriaArray(base.subCategory),
      subSubCategory: location.state?.subSubCategory ? [location.state.subSubCategory] : parseCriteriaArray(base.subSubCategory),
      stockValueTier: base.stockValueTier || 'All',
      dateFrom: location.state?.dateFrom || base.dateFrom || new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      dateFrom: location.state?.dateFrom || base.dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dateTo: location.state?.dateTo || base.dateTo || new Date().toISOString().split('T')[0],
      asOfDate: location.state?.asOfDate || base.asOfDate || new Date().toISOString().split('T')[0],
      showSalePrice: base.showSalePrice !== undefined ? base.showSalePrice : true,
      showPurchasePrice: base.showPurchasePrice !== undefined ? base.showPurchasePrice : true,
      showFinalPrice: base.showFinalPrice !== undefined ? base.showFinalPrice : true,
      showSpecifications: base.showSpecifications !== undefined ? base.showSpecifications : true
    };
  });

  useEffect(() => {
    navigate('.', { replace: true, state: { ...location.state, activeTab, criteria } });
  }, [activeTab, criteria, navigate]);

  useEffect(() => {
    const fetchStockCriteriaLookups = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes, locRes, empRes, uomRes, binRes] = await Promise.all([
          supabase.from('inventory_categories').select('id, name, parent_id'),
          supabase.from('products').select('id, product_name, category, bin, uom'),
          supabase.from('inventory_locations').select('id, name'),
          supabase.from('salesmen').select('id, name'),
          supabase.from('inventory_uom').select('id, short_code, full_name').eq('is_active', true),
          supabase.from('inventory_surface_finishes').select('id, name')
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (prodRes.data) setProducts(prodRes.data);
        if (locRes.data) setLocations(locRes.data);
        if (empRes.data) setEmployees(empRes.data);
        if (binRes.data) setBins(binRes.data);

        if (uomRes.data) {
          const normalizedUoms = uomRes.data.map((u: any) => ({
            id: u.id,
            name: `${u.short_code} = ${u.full_name}`
          }));
          setUoms(normalizedUoms);
        }
      } catch (err: any) {
        toast.error('Stock criteria aggregation error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStockCriteriaLookups();
  }, [tenantId]);

  const handleInputChange = (field: string, value: any) => {
    setCriteria(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'bin') updated.product = [];
      if (field === 'parentCategory') {
        updated.subCategory = [];
        updated.subSubCategory = [];
      }
      if (field === 'subCategory') {
        updated.subSubCategory = [];
      }
      return updated;
    });
  };

  const getContextualProductSelectionPool = () => {
    if (!criteria.bin || criteria.bin.length === 0) return products;
    const selectedBins = criteria.bin.map((b: string) => b.toLowerCase());
    return products.filter(p => selectedBins.includes(String(p.bin || '').trim().toLowerCase()));
  };

  const uomOptions = useMemo(() => uoms.map(u => u.name).filter(Boolean), [uoms]);
  const binOptions = useMemo(() => bins.map(b => b.name).filter(Boolean), [bins]);
  const productOptions = useMemo(() => getContextualProductSelectionPool().map(p => p.product_name).filter(Boolean), [products, criteria.bin]);
  const locationOptions = useMemo(() => locations.map(l => l.name).filter(Boolean), [locations]);
  const parentCategories = useMemo(() => categories.filter(c => c.parent_id === null), [categories]);
  const subCategories = useMemo(() => {
    if (!criteria.parentCategory || criteria.parentCategory.length === 0) {
      const parentIds = new Set(parentCategories.map(p => p.id));
      return categories.filter(c => c.parent_id !== null && parentIds.has(c.parent_id));
    }
    const selectedPCatIds = new Set(parentCategories.filter(c => criteria.parentCategory.includes(c.name)).map(c => c.id));
    return categories.filter(c => c.parent_id !== null && selectedPCatIds.has(c.parent_id));
  }, [categories, criteria.parentCategory, parentCategories]);
  
  const bottomCategories = useMemo(() => {
    if (!criteria.subCategory || criteria.subCategory.length === 0) {
      const subIds = new Set(subCategories.map(s => s.id));
      return categories.filter(c => c.parent_id !== null && subIds.has(c.parent_id));
    }
    const selectedSCatIds = new Set(subCategories.filter(c => criteria.subCategory.includes(c.name)).map(c => c.id));
    return categories.filter(c => c.parent_id !== null && selectedSCatIds.has(c.parent_id));
  }, [categories, criteria.subCategory, subCategories]);

  const parentCategoryOptions = useMemo(() => parentCategories.map(c => c.name).filter(Boolean), [parentCategories]);
  const subCategoryOptions = useMemo(() => subCategories.map(c => c.name).filter(Boolean), [subCategories]);
  const subSubCategoryOptions = useMemo(() => bottomCategories.map(c => c.name).filter(Boolean), [bottomCategories]);
  const employeeOptions = useMemo(() => employees.map(e => e.name).filter(Boolean), [employees]);

  const handleTabChange = (tab: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    setActiveTab(tab);
    setCriteria(prev => ({
      uom: [], bin: [], product: [], location: [], employee: [],
      parentCategory: [], subCategory: [], subSubCategory: [], stockValueTier: 'All',
      dateFrom: prev.dateFrom,
      dateTo: prev.dateTo,
      asOfDate: prev.asOfDate,
      showSalePrice: true,
      showPurchasePrice: true,
      showFinalPrice: true,
      showSpecifications: true
    }));
  };

  const handleDispatchReportView = () => {
    if (activeTab === 1 || activeTab === 2 || activeTab === 3) {
      if (criteria.dateFrom && criteria.dateTo) {
        const start = new Date(criteria.dateFrom);
        const end = new Date(criteria.dateTo);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 93) {
          toast.error("Please select a date range of 3 months or less for detailed reports.");
          return;
        }
      }
    }
    setGeneratedPayload({ tab: activeTab, filters: { ...criteria } });
    setHasGenerated(true);
    setTimeout(() => {
      document.getElementById('generated-stock-report')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handlePrintWindow = () => {
    if (!hasGenerated) {
      handleDispatchReportView();
      setTimeout(() => window.print(), 500);
    } else {
      window.print();
    }
  };

  const handleExportCsv = () => {
    if (!hasGenerated) {
      toast.error("Please click Generate Report first to load the data.");
      return;
    }
    const exportBtn = document.getElementById('stock-report-export-excel-btn');
    if (exportBtn) {
      exportBtn.click();
    } else {
      window.print();
    }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

  const currentTabObj = stockTabs.find(t => t.key === activeTab) || stockTabs[0];

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-5 text-black dark:text-bodydark text-xs antialiased font-sans relative pb-16 print:max-w-none print:p-0 print:m-0 print:space-y-0 print:pb-0">
      {/* ── TOP HEADER & BREADCRUMBS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs print:hidden">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold tracking-wide uppercase">
            <span>Inventory & Logistics</span>
            <span>/</span>
            <span>Auditing Reports</span>
            <span>/</span>
            <span className="text-primary font-bold">{currentTabObj.label}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight flex items-center gap-2">
            <span>Enterprise Stock Auditing Center</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
              Live Audited
            </span>
          </h2>
        </div>
      </div>

      {/* ── 1. HORIZONTAL TABS BAR ── */}
      <div className="bg-white dark:bg-boxdark p-1.5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-x-auto print:hidden">
        <div className="flex items-center gap-1.5 min-w-max">
          {stockTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => navigate('/Reports/Holding-Report')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <MdPauseCircleFilled size={16} className="text-amber-500" />
            <span>Holding Stock Queue ↗</span>
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button
            type="button"
            onClick={() => navigate('/Reports/Sales-Report')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Sales Reports ↗</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/Reports/Purchase-Report')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Purchase Reports ↗</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/Accounts/Ledgers?tab=customer-ledger')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Party Ledgers ↗</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/Reports/Balance-Sheet')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Balance Sheet ↗</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white shadow-2xs dark:border-strokedark dark:bg-boxdark p-6">
        <h3 className="font-bold text-sm text-black dark:text-white mb-4 uppercase tracking-wider text-primary">Report Criteria Specification</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

          {(activeTab === 1 || activeTab === 2) && (
            <>
              <SearchableMultiSelect label="Product Group (UOM):" placeholder="UOM Group" options={uomOptions} value={criteria.uom} onChange={(val) => handleInputChange('uom', val)} />
              <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
              <SearchableMultiSelect label="Select Product Asset:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
            </>
          )}

          {activeTab === 3 && (
            <>
              <SearchableMultiSelect label="Warehouse Location:" placeholder="Location" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />
              <SearchableMultiSelect label="Target Product Asset:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
              <div><label className="block font-bold text-gray-500 mb-1">As Of Date Balance:</label><input type="date" max={new Date().toISOString().split('T')[0]} value={criteria.asOfDate} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; if (e.target.value > today) handleInputChange('asOfDate', today); else handleInputChange('asOfDate', e.target.value); }} className="w-full border rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none" /></div>
            </>
          )}

          {activeTab === 4 && (
            <>
              <SearchableMultiSelect label="Transfer Location:" placeholder="Location" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />
              <SearchableMultiSelect label="Target Product Asset:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
              <SearchableMultiSelect label="Employee Logistics Link:" placeholder="Personnel Agent" options={employeeOptions} value={criteria.employee} onChange={(val) => handleInputChange('employee', val)} />
              <div><label className="block font-bold text-gray-500 mb-1">Transfer Start Date:</label><input type="date" max={new Date().toISOString().split('T')[0]} value={criteria.dateFrom} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; if (e.target.value > today) handleInputChange('dateFrom', today); else handleInputChange('dateFrom', e.target.value); }} className="w-full border rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none" /></div>
              <div><label className="block font-bold text-gray-500 mb-1">Transfer End Date:</label><input type="date" max={new Date().toISOString().split('T')[0]} value={criteria.dateTo} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; if (e.target.value > today) handleInputChange('dateTo', today); else handleInputChange('dateTo', e.target.value); }} className="w-full border rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none" /></div>
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

          {activeTab === 5 && (
            <>
              <SearchableMultiSelect label="Select Product Asset:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
              <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
              <SearchableMultiSelect label="Parent Category:" placeholder="Parent Category" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
              <SearchableMultiSelect label="Sub Category:" placeholder="Sub Category" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
              <SearchableMultiSelect label="Category:" placeholder="Category" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />
            </>
          )}

          {activeTab === 7 && (
            <>
              <SearchableMultiSelect label="Product Group (UOM):" placeholder="UOM Group" options={uomOptions} value={criteria.uom} onChange={(val) => handleInputChange('uom', val)} />
              <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
              <SearchableMultiSelect label="Parent Category:" placeholder="Parent Category" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
              <SearchableMultiSelect label="Sub Category:" placeholder="Sub Category" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
              <SearchableMultiSelect label="Category:" placeholder="Category" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />
              
              <div>
                <label className="block font-bold text-gray-500 mb-1">StockValue Tier Filter:</label>
                <select value={criteria.stockValueTier} onChange={(e) => handleInputChange('stockValueTier', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                  <option value="All">All Financial Valuations</option>
                  <option value="High">High Asset Value First (&gt; Rs. 100,000)</option>
                  <option value="Low">Low Cost Asset Pools (&lt; Rs. 10,000)</option>
                  <option value="Zero">Zero Valuation / Empty Inventory Sheets</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 8 && (
            <>
              <SearchableMultiSelect label="Target Warehouse Location:" placeholder="Location" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />
              <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
              <SearchableMultiSelect label="Select Product Asset:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
              <div><label className="block font-bold text-gray-500 mb-1">As Of Date Cutoff:</label><input type="date" max={new Date().toISOString().split('T')[0]} value={criteria.asOfDate} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; if (e.target.value > today) handleInputChange('asOfDate', today); else handleInputChange('asOfDate', e.target.value); }} className="w-full border rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none" /></div>
            </>
          )}

          {activeTab === 1 && (
            <>
              <div><label className="block font-bold text-gray-500 mb-1">Date Bracket From:</label><input type="date" max={new Date().toISOString().split('T')[0]} value={criteria.dateFrom} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; let newDateFrom = e.target.value; if (newDateFrom > today) newDateFrom = today; handleInputChange('dateFrom', newDateFrom); if (activeTab === 1 || activeTab === 2 || activeTab === 3) { const dFrom = new Date(newDateFrom); const dTo = new Date(criteria.dateTo); const diffDays = Math.ceil(Math.abs(dTo.getTime() - dFrom.getTime()) / (1000 * 60 * 60 * 24)); if (dTo < dFrom || diffDays > 90) { const maxAllowed = new Date(dFrom.setDate(dFrom.getDate() + 90)).toISOString().split('T')[0]; handleInputChange('dateTo', maxAllowed < today ? maxAllowed : today); } } }} className="w-full border border-stroke rounded p-2 bg-transparent font-semibold text-black dark:text-white text-xs outline-none dark:bg-boxdark" /></div>
              <div><label className="block font-bold text-gray-500 mb-1">Date Bracket To:</label><input type="date" min={criteria.dateFrom} max={criteria.dateFrom && (activeTab === 1 || activeTab === 2 || activeTab === 3) ? [new Date(new Date(criteria.dateFrom).setDate(new Date(criteria.dateFrom).getDate() + 90)).toISOString().split('T')[0], new Date().toISOString().split('T')[0]].sort()[0] : new Date().toISOString().split('T')[0]} value={criteria.dateTo} onChange={(e) => { const today = new Date().toISOString().split('T')[0]; const maxAllowed = criteria.dateFrom && (activeTab === 1 || activeTab === 2 || activeTab === 3) ? [new Date(new Date(criteria.dateFrom).setDate(new Date(criteria.dateFrom).getDate() + 90)).toISOString().split('T')[0], today].sort()[0] : today; let newDateTo = e.target.value; if (newDateTo > maxAllowed) newDateTo = maxAllowed; if (newDateTo < criteria.dateFrom) newDateTo = criteria.dateFrom; handleInputChange('dateTo', newDateTo); }} className="w-full border border-stroke rounded p-2 bg-transparent font-semibold text-black dark:text-white text-xs outline-none dark:bg-boxdark" /></div>
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

        <div className="mt-8 pt-4 border-t border-stroke dark:border-strokedark flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={!hasGenerated}
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-stroke dark:border-strokedark disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <MdFileDownload size={15} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            disabled={!hasGenerated}
            onClick={handlePrintWindow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-stroke dark:border-strokedark disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <MdPictureAsPdf size={15} />
            <span>Download PDF (A4)</span>
          </button>
          <button
            type="button"
            disabled={!hasGenerated}
            onClick={handlePrintWindow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-stroke dark:border-strokedark disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <MdPrint size={15} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleDispatchReportView}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-opacity-90 transition shadow-sm cursor-pointer"
          >
            <MdSearch size={16} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Below Report Output (Rendered after clicking Generate Report or Placeholder when not generated) */}
      {!hasGenerated ? (
        <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-16 shadow-2xs flex flex-col items-center justify-center text-center space-y-4 print:hidden">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
            <MdMenuBook size={34} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Select a financial year and date range, then click Generate Report
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Choose your inventory parameters in the filter bar above and click the Generate Report button to fetch live asset valuation and ledger balances.
            </p>
          </div>
        </div>
      ) : generatedPayload ? (
        <div id="generated-stock-report" className="mt-8 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stroke dark:border-strokedark">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                Generated Live Report Result
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/Stock-Report/Print`, {
                  state: { tab: generatedPayload.tab, filters: generatedPayload.filters }
                });
              }}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Open in Fullscreen Print View →
            </button>
          </div>

          <StockReportPrint
            key={`${generatedPayload.tab}_${JSON.stringify(generatedPayload.filters)}`}
            embedded={true}
            tabOverride={generatedPayload.tab}
            filtersOverride={generatedPayload.filters}
          />
        </div>
      ) : null}
    </div>
  );
};

export default StockReport;
