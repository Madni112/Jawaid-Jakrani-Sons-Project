import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import SearchableMultiSelect from '../../../components/SearchableMultiSelect';
import SearchableDropdown from '../../../components/SearchableDropdown';
import SaleReportPrint from './SaleReportPrint';
import { 
    MdCategory, 
    MdInventory, 
    MdTrendingUp, 
    MdTune, 
    MdPeople, 
    MdLayers, 
    MdReceipt,
    MdMenuBook,
    MdSearch,
    MdFileDownload,
    MdPictureAsPdf,
    MdPrint
} from 'react-icons/md';

const salesTabs = [
    { key: 'category-sales', label: 'Category-Wise Sales', icon: MdCategory, badge: 'NEW' },
    { key: 'product-sales-history', label: 'Product Sales History', icon: MdInventory },
    { key: 'sale', label: 'Commercial Sales (Salesman-Wise)', icon: MdTrendingUp },
    { key: 'sales-query', label: 'Parameter Register', icon: MdTune },
    { key: 'customer-sales', label: 'Customer Sales & Volume', icon: MdPeople },
    { key: 'return', label: 'Sales Return & Credit', icon: MdLayers },
    { key: 'invoice', label: 'Sale Invoice Report', icon: MdReceipt }
] as const;

const SalesReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tenantId } = useAuth();
    const [loading, setLoading] = useState(true);

    const [hasGenerated, setHasGenerated] = useState(false);
    const [generatedPayload, setGeneratedPayload] = useState<{ type: string; filters: any } | null>(null);

    const searchParams = new URLSearchParams(location.search);
    const queryTab = searchParams.get('tab');
    const initialReportType = (queryTab || location.state?.reportType || location.state?.tab || location.state?.activeTab || 'category-sales') as 'sale' | 'sales-query' | 'customer-sales' | 'return' | 'invoice' | 'product-sales-history' | 'category-sales';
    const [reportType, setReportType] = useState<'sale' | 'sales-query' | 'customer-sales' | 'return' | 'invoice' | 'product-sales-history' | 'category-sales'>(initialReportType);

    useEffect(() => {
        const tabParam = new URLSearchParams(location.search).get('tab');
        if (tabParam && tabParam !== reportType) {
            handleTabChange(tabParam as any);
        }
    }, [location.search]);

    const [customers, setCustomers] = useState<any[]>([]);
    const [salesmen, setSalesmen] = useState<any[]>([]);
    const [transports, setTransportFleet] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [uoms, setUoms] = useState<any[]>([]);

    const [bins, setBins] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);

    const parseCriteriaArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' && val !== 'All' ? [val] : []);

    const [criteria, setCriteria] = useState(() => {
        const base = location.state?.criteria || {};
        return {
            customer: location.state?.customer ? [location.state.customer] : parseCriteriaArray(base.customer),
            salesman: location.state?.salesman ? [location.state.salesman] : parseCriteriaArray(base.salesman),
            transport: location.state?.transport ? [location.state.transport] : parseCriteriaArray(base.transport),
            parentCategory: location.state?.parentCategory ? [location.state.parentCategory] : parseCriteriaArray(base.parentCategory),
            subCategory: location.state?.subCategory ? [location.state.subCategory] : parseCriteriaArray(base.subCategory),
            subSubCategory: location.state?.subSubCategory ? [location.state.subSubCategory] : parseCriteriaArray(base.subSubCategory),
            uom: parseCriteriaArray(base.uom), 
            bin: parseCriteriaArray(base.bin), 
            product: parseCriteriaArray(base.product), 
            location: parseCriteriaArray(base.location),
            saleType: base.saleType || 'All', 
            saleMethod: base.saleMethod || 'All', 
            invoiceNo: base.invoiceNo || 'All',
            viewMode: location.state?.viewMode || base.viewMode || 'summary',
            showZeroSales: location.state?.showZeroSales === true || base.showZeroSales === true,
            sortBy: base.sortBy || 'date_desc',
            withLedgerSummary: base.withLedgerSummary || false,
            dateFrom: location.state?.dateFrom || base.dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            dateTo: location.state?.dateTo || base.dateTo || new Date().toISOString().split('T')[0]
        };
    });

    useEffect(() => {
        navigate('.', { replace: true, state: { ...location.state, reportType, criteria } });
    }, [reportType, criteria, navigate]);

    useEffect(() => {
        const fetchCriteriaLookups = async () => {
            try {
                setLoading(true);
                const [custRes, smRes, transRes, catRes, binRes, prodRes, locRes, invRes, uomRes] = await Promise.all([
                    supabase.from('customers').select('id, customerName, customer_code, customerCode'),
                    supabase.from('salesmen').select('id, name'),
                    supabase.from('logistics_transportation').select('id, name'),
                    supabase.from('inventory_categories').select('id, name, parent_id'),
                    supabase.from('inventory_surface_finishes').select('id, name'),
                    supabase.from('products').select('id, product_name'),
                    supabase.from('inventory_locations').select('id, name'),
                    supabase.from('sales_invoices').select('id, total_amount, customer_name').order('id', { ascending: false }),
                    supabase.from('inventory_uom').select('id, short_code, full_name').eq('is_active', true)
                ]);

                if (custRes.data) setCustomers(custRes.data);
                if (smRes.data) setSalesmen(smRes.data);
                if (transRes.data) setTransportFleet(transRes.data);
                if (catRes.data) setCategories(catRes.data);
                if (binRes.data) setBins(binRes.data);
                if (prodRes.data) setProducts(prodRes.data);
                if (locRes.data) setLocations(locRes.data);
                if (invRes.data) setAvailableInvoices(invRes.data);

                if (uomRes.data) {
                    const normalizedUoms = uomRes.data.map((u: any) => ({
                        id: u.id,
                        name: `${u.short_code} = ${u.full_name}`
                    }));
                    setUoms(normalizedUoms);
                }
            } catch (err: any) {
                toast.error('Lookup Interruption: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCriteriaLookups();
    }, [tenantId]);

    const handleGenerateReport = () => {
        if (reportType === 'sale' || reportType === 'customer-sales' || reportType === 'product-sales-history') {
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
        setGeneratedPayload({ type: reportType, filters: { ...criteria } });
        setHasGenerated(true);
        setTimeout(() => {
            document.getElementById('generated-sales-report')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };

    const handlePrintWindow = () => {
        if (!hasGenerated) {
            handleGenerateReport();
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
        const exportBtn = document.getElementById('sales-report-export-excel-btn');
        if (exportBtn) {
            exportBtn.click();
        } else {
            window.print();
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setCriteria(prev => {
            const updated = { ...prev, [field]: value };
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

    const handleTabChange = (type: 'sale' | 'sales-query' | 'customer-sales' | 'return' | 'invoice' | 'product-sales-history' | 'category-sales') => {
        setReportType(type);
        setCriteria(prev => ({
            customer: [],
            salesman: [],
            transport: [],
            parentCategory: [], subCategory: [], subSubCategory: [],
            uom: [], bin: [], product: [], location: [],
            saleType: 'All', saleMethod: 'All', invoiceNo: 'All',
            withLedgerSummary: false,
            dateFrom: prev.dateFrom,
            dateTo: prev.dateTo
        }));
    };

    const customerOptions = useMemo(() => customers.map(c => {
        const code = c.customer_code || c.customerCode;
        return code ? `[${code}] ${c.customerName}` : c.customerName;
    }).filter(Boolean), [customers]);
    const salesmanOptions = useMemo(() => salesmen.map(s => s.name).filter(Boolean), [salesmen]);
    const transportOptions = useMemo(() => transports.map(t => t.name).filter(Boolean), [transports]);
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
    const uomOptions = useMemo(() => uoms.map(u => u.name).filter(Boolean), [uoms]);

    const binOptions = useMemo(() => bins.map(b => b.name).filter(Boolean), [bins]);
    const productOptions = useMemo(() => products.map(p => p.product_name).filter(Boolean), [products]);
    const locationOptions = useMemo(() => locations.map(l => l.name).filter(Boolean), [locations]);
    const invoiceOptions = useMemo(() => availableInvoices.map(i => `INV-${String(i.id).padStart(4, '0')}`), [availableInvoices]);

    if (loading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

    const currentTabObj = salesTabs.find(t => t.key === reportType) || salesTabs[0];

    return (
        <div className="mx-auto max-w-7xl flex flex-col gap-5 text-black dark:text-bodydark text-xs antialiased font-sans relative pb-16 print:max-w-none print:p-0 print:m-0 print:space-y-0 print:pb-0">
            {/* ── TOP HEADER & BREADCRUMBS ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold tracking-wide uppercase">
                        <span>Sales & Commercial</span>
                        <span>/</span>
                        <span>Auditing Reports</span>
                        <span>/</span>
                        <span className="text-primary font-bold">{currentTabObj.label}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight flex items-center gap-2">
                        <span>Commercial Sales Auditing Center</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
                            Live Audited
                        </span>
                    </h2>
                </div>
            </div>

            {/* ── 1. HORIZONTAL TABS BAR ── */}
            <div className="bg-white dark:bg-boxdark p-1.5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-x-auto print:hidden">
                <div className="flex items-center gap-1.5 min-w-max">
                    {salesTabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = reportType === tab.key;
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
                                {tab.badge && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-2xl border border-stroke bg-white shadow-2xs dark:border-strokedark dark:bg-boxdark p-6">
                <h3 className="font-bold text-sm text-black dark:text-white mb-4 uppercase tracking-wider text-primary">Report Criteria Specification</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {(reportType === 'sale' || reportType === 'sales-query') && (
                        <>
                            <SearchableMultiSelect label="Market Customer:" placeholder="Customer" options={customerOptions} value={criteria.customer} onChange={(val) => handleInputChange('customer', val)} />
                            <SearchableMultiSelect label="Salesman:" placeholder="Salesman" options={salesmanOptions} value={criteria.salesman} onChange={(val) => handleInputChange('salesman', val)} />
                            <SearchableMultiSelect label="Transport / Driver:" placeholder="Transport" options={transportOptions} value={criteria.transport} onChange={(val) => handleInputChange('transport', val)} />

                            <SearchableMultiSelect label="Parent Category:" placeholder="Parent Category" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
                            <SearchableMultiSelect label="Sub Category:" placeholder="Sub Category" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
                            <SearchableMultiSelect label="Category:" placeholder="Category" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />

                            <SearchableMultiSelect label="Product Groups (UOM):" placeholder="UOM" options={uomOptions} value={criteria.uom} onChange={(val) => handleInputChange('uom', val)} />
                            <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
                            <SearchableMultiSelect label="Target Stock Assets:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
                            <SearchableMultiSelect label="Dispatching Warehouses:" placeholder="Location" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />
                            
                            <div>
                                <label className="block text-gray-500 mb-1 font-bold">Sale Type Allocation:</label>
                                <select value={criteria.saleType} onChange={(e) => handleInputChange('saleType', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                                    <option value="All">All Sale Types</option>
                                    <option value="Cash">Cash Sale</option>
                                    <option value="Credit">Credit Sale</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-500 mb-1 font-bold">Sale Method Mode:</label>
                                <select value={criteria.saleMethod} onChange={(e) => handleInputChange('saleMethod', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                                    <option value="All">All Sale Methods</option>
                                    <option value="Direct">Direct Sale</option>
                                    <option value="Challan">Via Challan Link</option>
                                </select>
                            </div>
                        </>
                    )}

                    {reportType === 'customer-sales' && (
                        <>
                            <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-stroke dark:border-strokedark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <span className="font-bold text-xs text-black dark:text-white uppercase tracking-wider">Report Presentation View Mode:</span>
                                    <p className="text-[11px] text-gray-500">Choose between Customer Performance & Volume Leaderboard or Itemized Customer Grouped Invoices.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-boxdark p-1 rounded border border-stroke dark:border-strokedark shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'summary')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            (criteria.viewMode || 'summary') === 'summary'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📊 Summary (Customer Leaderboard)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'detailed')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            criteria.viewMode === 'detailed'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📑 Detailed (Customer Grouped Cards)
                                    </button>
                                </div>
                            </div>

                            <SearchableMultiSelect label="Market Customer:" placeholder="Customer" options={customerOptions} value={criteria.customer} onChange={(val) => handleInputChange('customer', val)} />
                            <SearchableMultiSelect label="Salesman:" placeholder="Salesman" options={salesmanOptions} value={criteria.salesman} onChange={(val) => handleInputChange('salesman', val)} />
                            <SearchableMultiSelect label="Transport / Driver:" placeholder="Transport" options={transportOptions} value={criteria.transport} onChange={(val) => handleInputChange('transport', val)} />

                            <SearchableMultiSelect label="Parent Category:" placeholder="Parent Category" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
                            <SearchableMultiSelect label="Sub Category:" placeholder="Sub Category" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
                            <SearchableMultiSelect label="Category:" placeholder="Category" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />

                            <SearchableMultiSelect label="Product Groups (UOM):" placeholder="UOM" options={uomOptions} value={criteria.uom} onChange={(val) => handleInputChange('uom', val)} />
                            <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
                            <SearchableMultiSelect label="Target Stock Assets:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
                            <SearchableMultiSelect label="Dispatching Warehouses:" placeholder="Location" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />
                            
                            <div>
                                <label className="block text-gray-500 mb-1 font-bold">Sale Type Allocation:</label>
                                <select value={criteria.saleType} onChange={(e) => handleInputChange('saleType', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                                    <option value="All">All Sale Types</option>
                                    <option value="Cash">Cash Sale</option>
                                    <option value="Credit">Credit Sale</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-500 mb-1 font-bold">Sale Method Mode:</label>
                                <select value={criteria.saleMethod} onChange={(e) => handleInputChange('saleMethod', e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none">
                                    <option value="All">All Sale Methods</option>
                                    <option value="Direct">Direct Sale</option>
                                    <option value="Challan">Via Challan Link</option>
                                </select>
                            </div>
                        </>
                    )}
                    {reportType === 'return' && (
                        <>
                            <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-stroke dark:border-strokedark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <span className="font-bold text-xs text-black dark:text-white uppercase tracking-wider">Report Presentation View Mode:</span>
                                    <p className="text-[11px] text-gray-500">Choose between Customer Return Summary Leaderboard or Itemized Customer Return Debit Breakdown.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-boxdark p-1 rounded border border-stroke dark:border-strokedark shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'summary')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            (criteria.viewMode || 'summary') === 'summary'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📊 Summary (Customer Leaderboard)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'detailed')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            criteria.viewMode === 'detailed'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📑 Detailed (Customer Cards)
                                    </button>
                                </div>
                            </div>

                            <SearchableMultiSelect label="Market Customer:" placeholder="Customer" options={customerOptions} value={criteria.customer} onChange={(val) => handleInputChange('customer', val)} />
                            <SearchableMultiSelect label="Salesman:" placeholder="Salesman" options={salesmanOptions} value={criteria.salesman} onChange={(val) => handleInputChange('salesman', val)} />
                            <SearchableMultiSelect label="Transport / Driver:" placeholder="Transport" options={transportOptions} value={criteria.transport} onChange={(val) => handleInputChange('transport', val)} />

                            <SearchableMultiSelect label="Parent Category:" placeholder="Parent Category" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
                            <SearchableMultiSelect label="Sub Category:" placeholder="Sub Category" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
                            <SearchableMultiSelect label="Category:" placeholder="Category" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />

                            <SearchableMultiSelect label="Product Groups (UOM):" placeholder="UOM" options={uomOptions} value={criteria.uom} onChange={(val) => handleInputChange('uom', val)} />
                            <SearchableMultiSelect label="Brand:" placeholder="Brand" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
                            <SearchableMultiSelect label="Target Stock Assets:" placeholder="Product" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
                            <SearchableMultiSelect label="Dispatching Warehouses:" placeholder="Location" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />
                        </>
                    )}

                    {reportType === 'invoice' && (
                        <>
                            <div className="md:col-span-2">
                                <SearchableDropdown
                                    label="Select Target Bill Invoice Profile: *"
                                    placeholder="Invoice"
                                    options={invoiceOptions}
                                    value={criteria.invoiceNo === 'All' ? 'All' : `INV-${String(criteria.invoiceNo).padStart(4, '0')}`}
                                    onChange={(val) => {
                                        const cleanVal = val === 'All' ? 'All' : val.replace(/^INV-/i, '');
                                        handleInputChange('invoiceNo', cleanVal);
                                    }}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <SearchableMultiSelect label="Filter by Customer:" placeholder="All Customers" options={customerOptions} value={criteria.customer} onChange={(val) => handleInputChange('customer', val)} />
                            </div>
                        </>
                    )}

                    {reportType === 'category-sales' && (
                        <>
                            <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-stroke dark:border-strokedark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <span className="font-bold text-xs text-black dark:text-white uppercase tracking-wider">Report Presentation View Mode:</span>
                                    <p className="text-[11px] text-gray-500">Choose between Executive Category Performance Leaderboard (1 row / category) or Itemized Category Transactions.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-boxdark p-1 rounded border border-stroke dark:border-strokedark shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'summary')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            (criteria.viewMode || 'summary') === 'summary'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📊 Summary (Category Leaderboard)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'detailed')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            criteria.viewMode === 'detailed'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📑 Detailed (Category Transactions)
                                    </button>
                                </div>
                            </div>

                            <SearchableMultiSelect label="Parent Category:" placeholder="All Parent Categories" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
                            <SearchableMultiSelect label="Sub Category:" placeholder="All Sub Categories" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
                            <SearchableMultiSelect label="Category:" placeholder="All Categories" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />
                            <SearchableMultiSelect label="Filter by Product:" placeholder="All Products" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />

                            <SearchableMultiSelect label="Market Customer:" placeholder="All Customers" options={customerOptions} value={criteria.customer} onChange={(val) => handleInputChange('customer', val)} />
                            <SearchableMultiSelect label="Salesman:" placeholder="All Salesmen" options={salesmanOptions} value={criteria.salesman} onChange={(val) => handleInputChange('salesman', val)} />
                            <SearchableMultiSelect label="Brand:" placeholder="All Brands" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
                            <SearchableMultiSelect label="Dispatching Warehouse:" placeholder="All Warehouses" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />

                            <div className="md:col-span-4 flex items-center gap-4 pt-2 pb-1 border-t border-stroke dark:border-strokedark">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={Boolean(criteria.showZeroSales)} 
                                        onChange={(e) => handleInputChange('showZeroSales', e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded border-stroke focus:ring-0 cursor-pointer accent-emerald-600"
                                    />
                                    <span className="text-xs font-bold text-black dark:text-white">Show Categories With Zero Sales (Include Unsold Categories)</span>
                                </label>
                            </div>
                        </>
                    )}

                    {reportType === 'product-sales-history' && (
                        <>
                            <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-stroke dark:border-strokedark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <span className="font-bold text-xs text-black dark:text-white uppercase tracking-wider">Report Presentation View Mode:</span>
                                    <p className="text-[11px] text-gray-500">Choose between 1-line product performance summary or detailed invoice-by-invoice transaction history.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-boxdark p-1 rounded border border-stroke dark:border-strokedark shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'summary')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            (criteria.viewMode || 'summary') === 'summary'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📊 Summary (1 Row / Product)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('viewMode', 'detailed')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                            criteria.viewMode === 'detailed'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-black'
                                        }`}
                                    >
                                        📑 Detailed (Invoice Breakdown)
                                    </button>
                                </div>
                            </div>

                            <SearchableMultiSelect label="Target Stock Products / Items:" placeholder="All Products" options={productOptions} value={criteria.product} onChange={(val) => handleInputChange('product', val)} />
                            <SearchableMultiSelect label="Parent Category:" placeholder="All Parent Categories" options={parentCategoryOptions} value={criteria.parentCategory} onChange={(val) => handleInputChange('parentCategory', val)} />
                            <SearchableMultiSelect label="Sub Category:" placeholder="All Sub Categories" options={subCategoryOptions} value={criteria.subCategory} onChange={(val) => handleInputChange('subCategory', val)} />
                            <SearchableMultiSelect label="Category:" placeholder="All Categories" options={subSubCategoryOptions} value={criteria.subSubCategory} onChange={(val) => handleInputChange('subSubCategory', val)} />

                            <SearchableMultiSelect label="Brand:" placeholder="All Brands" options={binOptions} value={criteria.bin} onChange={(val) => handleInputChange('bin', val)} />
                            <SearchableMultiSelect label="Market Customer:" placeholder="All Customers" options={customerOptions} value={criteria.customer} onChange={(val) => handleInputChange('customer', val)} />
                            <SearchableMultiSelect label="Salesman:" placeholder="All Salesmen" options={salesmanOptions} value={criteria.salesman} onChange={(val) => handleInputChange('salesman', val)} />
                            <SearchableMultiSelect label="Dispatching Warehouse:" placeholder="All Warehouses" options={locationOptions} value={criteria.location} onChange={(val) => handleInputChange('location', val)} />

                            <div className="md:col-span-4 flex items-center gap-4 pt-2 pb-1 border-t border-stroke dark:border-strokedark">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={Boolean(criteria.showZeroSales)} 
                                        onChange={(e) => handleInputChange('showZeroSales', e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded border-stroke focus:ring-0 cursor-pointer accent-emerald-600"
                                    />
                                    <span className="text-xs font-bold text-black dark:text-white">Show Products With Zero Sales (Display Full Inventory Catalog)</span>
                                </label>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-gray-500 mb-1 font-bold">Sort Records By:</label>
                        <select
                            value={criteria.sortBy || 'date_desc'}
                            onChange={(e) => handleInputChange('sortBy', e.target.value)}
                            className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-semibold text-xs text-black dark:text-white dark:bg-boxdark outline-none"
                        >
                            <option value="date_desc">Date (Newest First)</option>
                            <option value="date_asc">Date (Oldest First)</option>
                            <option value="amount_desc">Gross Amount (Highest First)</option>
                            <option value="amount_asc">Gross Amount (Lowest First)</option>
                            <option value="invoice_asc">Document / Invoice # (A - Z)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-500 mb-1">Date From (Start):</label>
                        <input
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={criteria.dateFrom}
                            onChange={(e) => {
                                const today = new Date().toISOString().split('T')[0];
                                let newDateFrom = e.target.value;
                                if (newDateFrom > today) newDateFrom = today;
                                handleInputChange('dateFrom', newDateFrom);
                            }}
                            className="w-full border border-stroke rounded p-2 bg-transparent font-semibold text-black dark:text-white text-xs outline-none dark:bg-boxdark"
                        />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-500 mb-1">Date To (End Date):</label>
                        <input
                            type="date"
                            min={criteria.dateFrom}
                            value={criteria.dateTo}
                            onChange={(e) => {
                                let newDateTo = e.target.value;
                                if (newDateTo < criteria.dateFrom) newDateTo = criteria.dateFrom;
                                handleInputChange('dateTo', newDateTo);
                            }}
                            className="w-full border border-stroke rounded p-2 bg-transparent font-semibold text-black dark:text-white text-xs outline-none dark:bg-boxdark"
                        />
                    </div>

                    <div className="md:col-span-4 flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Quick Date Window:</span>
                        <button type="button" onClick={() => { const t = new Date().toISOString().split('T')[0]; handleInputChange('dateFrom', t); handleInputChange('dateTo', t); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition cursor-pointer">Today</button>
                        <button type="button" onClick={() => { const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.toISOString().split('T')[0]; handleInputChange('dateFrom', ys); handleInputChange('dateTo', ys); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition cursor-pointer">Yesterday</button>
                        <button type="button" onClick={() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const s = new Date(d.setDate(diff)).toISOString().split('T')[0]; handleInputChange('dateFrom', s); handleInputChange('dateTo', new Date().toISOString().split('T')[0]); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition cursor-pointer">This Week</button>
                        <button type="button" onClick={() => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; handleInputChange('dateFrom', s); handleInputChange('dateTo', new Date().toISOString().split('T')[0]); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition cursor-pointer">This Month</button>
                        <button type="button" onClick={() => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0]; const e = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0]; handleInputChange('dateFrom', s); handleInputChange('dateTo', e); }} className="py-1 px-2.5 bg-gray-100 hover:bg-primary hover:text-white rounded text-[10px] font-bold transition cursor-pointer">Last Month</button>
                    </div>
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
                        onClick={handleGenerateReport}
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
                            Choose your criteria in the filter bar above and click the Generate Report button to fetch the live sales records and calculations.
                        </p>
                    </div>
                </div>
            ) : generatedPayload ? (
                <div id="generated-sales-report" className="mt-8 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-md transition-all">
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
                                navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/Sales-Report/Print`, {
                                    state: { type: generatedPayload.type, filters: generatedPayload.filters }
                                });
                            }}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                            Open in Fullscreen Print View →
                        </button>
                    </div>

                    <SaleReportPrint
                        key={`${generatedPayload.type}_${JSON.stringify(generatedPayload.filters)}`}
                        embedded={true}
                        typeOverride={generatedPayload.type}
                        filtersOverride={generatedPayload.filters}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default SalesReport;
