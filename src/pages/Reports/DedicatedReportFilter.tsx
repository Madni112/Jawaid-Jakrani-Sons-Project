import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../Context/supabaseClient';
import { useAuth } from '../../Context/Auth';
import Spinner from '../../ui/Spinner';
import { DEFAULT_SUB_AREAS, DEFAULT_AREAS, DEFAULT_SUBAREA_AREAS_MAP } from '../../components/SubAreaAreaInput';
import { MdArrowBack, MdTune, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { FilterCriteria, FilterPreset } from './dedicatedFilter/types/dedicatedFilterTypes';
import { REPORT_REGISTRY } from './dedicatedFilter/constants/reportRegistry';
import DedicatedFilterHeaderCard from './dedicatedFilter/components/DedicatedFilterHeaderCard';
import SavedPresetsToolbar from './dedicatedFilter/components/SavedPresetsToolbar';
import SavePresetModal from './dedicatedFilter/components/SavePresetModal';
import FilterFieldsGrid from './dedicatedFilter/components/FilterFieldsGrid';
import FilterDateSortSection from './dedicatedFilter/components/FilterDateSortSection';
import FilterReportFlags from './dedicatedFilter/components/FilterReportFlags';
import { fetchProductColors, extractProductColor } from '../../utils/colorService';

const DedicatedReportFilter: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  useEffect(() => {
    if (reportId === 'basic-sales-report') {
      navigate(`${tenantId ? `/${tenantId}` : ''}/basic-sales-report`, { replace: true });
    }
  }, [reportId, tenantId, navigate]);

  const activeConfig = REPORT_REGISTRY[reportId || 'sale-inv-detail'] || REPORT_REGISTRY['sale-inv-detail'];

  const [loading, setLoading] = useState(true);

  // Lookups data
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dbColorList, setDbColorList] = useState<string[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);

  // Criteria State
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [criteria, setCriteria] = useState<FilterCriteria>({
    city: [],
    area: [],
    customer: [],
    supplier: [],
    salesman: [],
    transport: [],
    parentCategory: [],
    subCategory: [],
    subSubCategory: [],
    uom: [],
    bin: [],
    product: [],
    color: [],
    location: [],
    saleType: 'All',
    saleMethod: 'All',
    invoiceNo: 'All',
    taxScenario: 'All',
    accountType: 'All',
    voucherType: [],
    sortBy: activeConfig.categoryName === 'Inventory & Warehouses'
      ? 'name_asc'
      : (activeConfig.categoryName === 'Accounts & Financials' || activeConfig.printType === 'loyalty')
        ? 'amount_desc'
        : (activeConfig.singleDateFilter ? 'date_asc' : 'date_desc'),
    dateFrom: activeConfig.singleDateFilter ? todayStr : firstOfMonthStr,
    dateTo: todayStr,
    showZeroSales: false,
    showZeroValues: false,
    showOnlyTransacted: false
  });

  // Saved Filter Presets
  const presetStorageKey = `erp_report_presets_${activeConfig.id}`;
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem(presetStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleApplyPreset = (preset: FilterPreset) => {
    setCriteria({ ...preset.criteria });
    setActivePresetId(preset.id);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    const newPreset: FilterPreset = {
      id: String(Date.now()),
      name: newPresetName.trim(),
      criteria: { ...criteria }
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem(presetStorageKey, JSON.stringify(updated));
    setActivePresetId(newPreset.id);
    setNewPresetName('');
    setShowSavePresetModal(false);
    toast.success(`Preset "${newPreset.name}" saved successfully!`);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem(presetStorageKey, JSON.stringify(updated));
    if (activePresetId === id) setActivePresetId(null);
    toast.success('Preset removed');
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoading(true);
        const [
          custRes,
          suppRes,
          smRes,
          transRes,
          catRes,
          binRes,
          prodRes,
          locRes,
          invRes,
          uomRes
        ] = await Promise.allSettled([
          fetchAllPages(supabase.from('customers').select('id, customerName, registrationType, customer_code, customerCode, city, address, notes')),
          fetchAllPages(supabase.from('vendors').select('id, vendor_name, name')),
          supabase.from('salesmen').select('id, name'),
          supabase.from('logistics_transportation').select('id, name'),
          supabase.from('inventory_categories').select('id, name, parent_id'),
          supabase.from('inventory_surface_finishes').select('id, name'),
          fetchAllPages(supabase.from('products').select('id, product_name, product_description, bin')),
          supabase.from('inventory_locations').select('id, name'),
          fetchAllPages(supabase.from('sales_invoices').select('id, total_amount, customer_name, invoice_no').order('id', { ascending: false })),
          supabase.from('inventory_uom').select('id, short_code, full_name').eq('is_active', true)
        ]);

        if (custRes.status === 'fulfilled' && custRes.value.data) setCustomers(custRes.value.data);
        if (suppRes.status === 'fulfilled' && suppRes.value.data) setSuppliers(suppRes.value.data);
        if (smRes.status === 'fulfilled' && smRes.value.data) setSalesmen(smRes.value.data);
        if (transRes.status === 'fulfilled' && transRes.value.data) setTransports(transRes.value.data);
        if (catRes.status === 'fulfilled' && catRes.value.data) setCategories(catRes.value.data);
        if (binRes.status === 'fulfilled' && binRes.value.data) setBins(binRes.value.data);
        if (prodRes.status === 'fulfilled' && prodRes.value.data) setProducts(prodRes.value.data);
        if (locRes.status === 'fulfilled' && locRes.value.data) setLocations(locRes.value.data);
        if (invRes.status === 'fulfilled' && invRes.value.data) setAvailableInvoices(invRes.value.data);
        fetchProductColors().then((cList) => {
          if (cList && cList.length > 0) setDbColorList(cList);
        }).catch(() => {});
        if (uomRes.status === 'fulfilled' && uomRes.value.data) {
          setUoms(uomRes.value.data.map((u: any) => ({ id: u.id, name: `${u.short_code} = ${u.full_name}` })));
        }
      } catch (err: any) {
        toast.error('Lookup load failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLookups();
  }, [tenantId]);

  const handleInputChange = (field: string, value: any) => {
    setCriteria((prev: any) => ({ ...prev, [field]: value }));
  };

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
    const rawCityFilters = (criteria.city && criteria.city.length > 0 && !criteria.city.includes('All'))
      ? (Array.isArray(criteria.city) ? criteria.city : [criteria.city])
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
  }, [customers, criteria.city]);

  const customerOptions = useMemo(() => {
    let pool = customers;
    if (criteria.city && criteria.city.length > 0 && !criteria.city.includes('All')) {
      const rawCityFilters = Array.isArray(criteria.city) ? criteria.city : [criteria.city];
      pool = pool.filter(c => {
        const loc = getCustomerLocation(c);
        return rawCityFilters.some(f => isCityMatch(f, loc.city));
      });
    }
    if (criteria.area && criteria.area.length > 0 && !criteria.area.includes('All')) {
      const rawAreaFilters = Array.isArray(criteria.area) ? criteria.area : [criteria.area];
      pool = pool.filter(c => {
        const loc = getCustomerLocation(c);
        return rawAreaFilters.some(f => f.trim().toLowerCase() === (loc.area || '').trim().toLowerCase());
      });
    }
    if (criteria.customerCategory && criteria.customerCategory.length > 0 && !criteria.customerCategory.includes('All')) {
      pool = pool.filter(c => criteria.customerCategory?.includes(c.registrationType || 'Retail / General'));
    }
    return pool.map((c) => {
      const code = c.customer_code || c.customerCode;
      return code ? `[${code}] ${c.customerName}` : c.customerName;
    }).filter(Boolean);
  }, [customers, criteria.city, criteria.area, criteria.customerCategory]);

  const customerCategoryOptions = useMemo(() => {
    const fromCust = customers.map((c: any) => c.registrationType).filter(Boolean);
    const standard = ['Retail / General', 'Contractor / Builder', 'Wholesaler / Dealer', 'Registered Corporate'];
    return Array.from(new Set([...standard, ...fromCust]));
  }, [customers]);

  const supplierOptions = useMemo(() => suppliers.map((s) => s.vendor_name || s.name).filter(Boolean), [suppliers]);
  const salesmanOptions = useMemo(() => salesmen.map((s) => s.name).filter(Boolean), [salesmen]);
  const transportOptions = useMemo(() => transports.map((t) => t.name).filter(Boolean), [transports]);
  const parentCategories = useMemo(() => categories.filter((c) => c.parent_id === null), [categories]);
  const parentCategoryOptions = useMemo(() => parentCategories.map((c) => c.name).filter(Boolean), [parentCategories]);

  // Selected parent category IDs based on current parentCategory filter
  const selectedParentNames = useMemo(() => {
    const raw = criteria.parentCategory;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.map((x: any) => String(x).trim().toLowerCase()).filter((x: string) => x && x !== 'all');
  }, [criteria.parentCategory]);

  const activeParentCategories = useMemo(() => {
    if (selectedParentNames.length === 0) return parentCategories;
    return parentCategories.filter((p) => selectedParentNames.includes(String(p.name).trim().toLowerCase()));
  }, [parentCategories, selectedParentNames]);

  const activeParentIdSet = useMemo(() => {
    return new Set(activeParentCategories.map((p) => p.id));
  }, [activeParentCategories]);

  // Sub-categories matching the selected parent category / categories
  const subCategories = useMemo(() => {
    return categories.filter((c) => c.parent_id && activeParentIdSet.has(c.parent_id));
  }, [categories, activeParentIdSet]);

  const subCategoryOptions = useMemo(() => {
    return Array.from(new Set(subCategories.map((c) => c.name).filter(Boolean)));
  }, [subCategories]);

  // Selected sub-category IDs based on current subCategory filter
  const selectedSubCategoryNames = useMemo(() => {
    const raw = criteria.subCategory;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.map((x: any) => String(x).trim().toLowerCase()).filter((x: string) => x && x !== 'all');
  }, [criteria.subCategory]);

  const activeSubCategories = useMemo(() => {
    if (selectedSubCategoryNames.length === 0) return subCategories;
    return subCategories.filter((s) => selectedSubCategoryNames.includes(String(s.name).trim().toLowerCase()));
  }, [subCategories, selectedSubCategoryNames]);

  const activeSubIdSet = useMemo(() => {
    return new Set(activeSubCategories.map((s) => s.id));
  }, [activeSubCategories]);

  // Leaf / Sub-sub-categories matching the selected sub-categories
  const subSubCategories = useMemo(() => {
    return categories.filter((c) => c.parent_id && activeSubIdSet.has(c.parent_id));
  }, [categories, activeSubIdSet]);

  const subSubCategoryOptions = useMemo(() => {
    return Array.from(new Set(subSubCategories.map((c) => c.name).filter(Boolean)));
  }, [subSubCategories]);

  // Auto-prune subCategory selections that are no longer valid when parentCategory changes
  useEffect(() => {
    if (Array.isArray(criteria.subCategory) && criteria.subCategory.length > 0 && selectedParentNames.length > 0) {
      const validSubs = new Set(subCategoryOptions.map((s) => String(s).toLowerCase()));
      const pruned = criteria.subCategory.filter((s: string) => validSubs.has(String(s).toLowerCase()));
      if (pruned.length !== criteria.subCategory.length) {
        setCriteria((prev: any) => ({ ...prev, subCategory: pruned }));
      }
    }
  }, [subCategoryOptions, selectedParentNames.length]);

  // Auto-prune subSubCategory selections that are no longer valid when subCategory/parentCategory changes
  useEffect(() => {
    if (Array.isArray(criteria.subSubCategory) && criteria.subSubCategory.length > 0 && (selectedSubCategoryNames.length > 0 || selectedParentNames.length > 0)) {
      const validLeafs = new Set(subSubCategoryOptions.map((s) => String(s).toLowerCase()));
      const pruned = criteria.subSubCategory.filter((s: string) => validLeafs.has(String(s).toLowerCase()));
      if (pruned.length !== criteria.subSubCategory.length) {
        setCriteria((prev: any) => ({ ...prev, subSubCategory: pruned }));
      }
    }
  }, [subSubCategoryOptions, selectedSubCategoryNames.length, selectedParentNames.length]);

  const uomOptions = useMemo(() => uoms.map((u) => u.name).filter(Boolean), [uoms]);
  const binOptions = useMemo(() => bins.map((b) => b.name).filter(Boolean), [bins]);
  const productOptions = useMemo(() => products.map((p) => p.product_name).filter(Boolean), [products]);
  const locationOptions = useMemo(() => locations.map((l) => l.name).filter(Boolean), [locations]);
  const colorOptions = useMemo(() => {
    const fromProds = products.map((p: any) => extractProductColor(p)).filter(Boolean);
    return Array.from(new Set([...dbColorList, ...fromProds])).sort();
  }, [dbColorList, products]);
  const invoiceOptions = useMemo(
    () => availableInvoices.map((i) => i.invoice_no || `INV-${String(i.id).padStart(4, '0')}`),
    [availableInvoices]
  );
  const voucherTypeOptions = useMemo(() => [
    'Cash Payment Voucher (CPV)',
    'Cash Receipt Voucher (CRV)',
    'Bank Payment Voucher (BPV)',
    'Bank Receipt Voucher (BRV)',
    'Journal Voucher (JV)',
    'Expense Voucher (EXP)'
  ], []);

  const handleGenerate = () => {
    const dest = `${tenantId ? `/${tenantId}` : ''}${activeConfig.targetPrintPath}`;
    let effectiveDateFrom = criteria.dateFrom;
    let effectiveDateTo = criteria.dateTo;

    if (activeConfig.singleDateFilter) {
      const selectedDay = criteria.dateTo || criteria.dateFrom || todayStr;
      effectiveDateFrom = selectedDay;
      effectiveDateTo = selectedDay;
    }

    const filterPayload = {
      ...criteria,
      asOfDate: criteria.asOfDate || (activeConfig.singleDateFilter ? (criteria.dateTo || criteria.dateFrom || todayStr) : (criteria.dateTo || todayStr)),
      dateFrom: effectiveDateFrom,
      dateTo: effectiveDateTo,
      vendor: criteria.supplier,
      brand: criteria.bin,
      parentCategory: criteria.parentCategory,
      subCategory: criteria.subCategory,
      subSubCategory: criteria.subSubCategory,
      category: criteria.parentCategory
    };
    navigate(dest, {
      state: {
        type: activeConfig.printType,
        tab: activeConfig.tab || 1,
        criteria: filterPayload,
        filters: filterPayload
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs antialiased font-sans pb-16 pt-2">
      {/* Header & Breadcrumb */}
      <DedicatedFilterHeaderCard
        activeConfig={activeConfig}
        tenantId={tenantId}
        onNavigateDashboard={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/Reports-Dashboard`)}
      />

      {/* Saved Presets Toolbar */}
      <SavedPresetsToolbar
        savedPresets={savedPresets}
        activePresetId={activePresetId}
        onApplyPreset={handleApplyPreset}
        onDeletePreset={handleDeletePreset}
        onOpenSaveModal={() => setShowSavePresetModal(true)}
      />

      {/* Save Preset Modal */}
      <SavePresetModal
        isOpen={showSavePresetModal}
        presetName={newPresetName}
        onPresetNameChange={setNewPresetName}
        onSave={handleSavePreset}
        onClose={() => setShowSavePresetModal(false)}
      />

      {/* Criteria Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wide text-xs">
            <MdTune size={16} />
            <span>Target Parameters & Query Constraints</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Leave blank to include all records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FilterFieldsGrid
            activeConfig={activeConfig}
            criteria={criteria}
            handleInputChange={handleInputChange}
            invoiceOptions={invoiceOptions}
            customerCategoryOptions={customerCategoryOptions}
            cityOptions={cityOptions}
            areaOptions={areaOptions}
            customerOptions={customerOptions}
            supplierOptions={supplierOptions}
            salesmanOptions={salesmanOptions}
            transportOptions={transportOptions}
            locationOptions={locationOptions}
            parentCategoryOptions={parentCategoryOptions}
            subCategoryOptions={subCategoryOptions}
            subSubCategoryOptions={subSubCategoryOptions}
            productOptions={productOptions}
            colorOptions={colorOptions}
            binOptions={binOptions}
            uomOptions={uomOptions}
            voucherTypeOptions={voucherTypeOptions}
          />

          <FilterDateSortSection
            activeConfig={activeConfig}
            criteria={criteria}
            handleInputChange={handleInputChange}
          />

          <FilterReportFlags
            reportId={reportId}
            activeConfig={activeConfig}
            criteria={criteria}
            handleInputChange={handleInputChange}
          />
        </div>

        {/* Action Button Footer */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/Reports-Dashboard`)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs cursor-pointer"
          >
            <MdArrowBack size={15} />
            <span>Cancel & Back</span>
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 px-10 rounded-xl font-black text-xs shadow-md hover:shadow-lg transition cursor-pointer tracking-wide"
          >
            <MdCheckCircle size={18} />
            <span>Generate {activeConfig.title}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DedicatedReportFilter;
