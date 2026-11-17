import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../../../Context/supabaseClient';
import { DuplicateStatus, ProcessedRow } from '../types/bulkUploadTypes';

export const useBulkUploadState = () => {
  const [activeTab, setActiveTab] = useState<'OTHER' | 'TILES'>('OTHER');
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; stage: string } | null>(null);

  const [autoCreateMasters, setAutoCreateMasters] = useState(true);
  const [existingCategories, setExistingCategories] = useState<any[]>([]);
  const [existingBrands, setExistingBrands] = useState<any[]>([]);
  const [existingPrints, setExistingPrints] = useState<any[]>([]);

  const [otherRows, setOtherRows] = useState<ProcessedRow[]>([]);
  const [tileRows, setTileRows] = useState<ProcessedRow[]>([]);

  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'READY' | 'FILE_DUP' | 'DB_DUP' | 'INVALID'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadMode, setUploadMode] = useState<'SKIP_DUPLICATES' | 'UPDATE_EXISTING'>('SKIP_DUPLICATES');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const [uploadResult, setUploadResult] = useState<{
    newCount: number;
    updatedCount: number;
    skippedCount: number;
    totalRows: number;
    mastersCount?: number;
  } | null>(null);

  const [uploadBatches, setUploadBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [selectedBatchForView, setSelectedBatchForView] = useState<any | null>(null);
  const [modalItemSearch, setModalItemSearch] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [historyTab, setHistoryTab] = useState<'ALL' | 'OTHER' | 'TILES'>('ALL');

  const fetchUploadBatches = async () => {
    setBatchesLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action_type', 'BULK_UPLOAD')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) {
        setUploadBatches(data);
      }
    } catch (err) {
      console.error('Failed to load upload batches:', err);
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadBatches();
  }, []);

  const processedRows = useMemo(() => {
    return activeTab === 'TILES' ? tileRows : otherRows;
  }, [activeTab, tileRows, otherRows]);

  const setProcessedRows = (updater: React.SetStateAction<ProcessedRow[]>) => {
    if (activeTab === 'TILES') {
      setTileRows(updater);
    } else {
      setOtherRows(updater);
    }
  };

  const hasFileLoaded = otherRows.length > 0 || tileRows.length > 0;
  const isMixedFile = otherRows.length > 0 && tileRows.length > 0;

  const currentTabBatches = useMemo(() => {
    return uploadBatches.filter((b: any) => {
      const bType = String(b.details?.batch_type || 'OTHER').toUpperCase();
      if (historyTab !== 'ALL' && bType !== historyTab) return false;
      if (!batchSearchTerm) return true;
      const s = batchSearchTerm.toLowerCase();
      const fName = String(b.details?.file_name || '').toLowerCase();
      const by = String(b.performed_by || '').toLowerCase();
      return fName.includes(s) || by.includes(s);
    });
  }, [uploadBatches, historyTab, batchSearchTerm]);

  const pendingMasters = useMemo(() => {
    const parentSet = new Set<string>();
    const subSet = new Set<string>();
    const catSet = new Set<string>();
    const brandSet = new Set<string>();
    const printSet = new Set<string>();

    const allRows = [...otherRows, ...tileRows];
    if (allRows.length === 0) {
      return { parents: [], subs: [], cats: [], brands: [], prints: [], total: 0 };
    }

    const dbParentMap = new Map<string, any>();
    const dbSubMap = new Map<string, any>();
    const dbCatMap = new Map<string, any>();

    (existingCategories || []).forEach((c: any) => {
      const cName = String(c.name || '').trim().toLowerCase();
      if (c.parent_id === null || c.parent_id === undefined) {
        dbParentMap.set(cName, c);
      }
    });

    (existingCategories || []).forEach((c: any) => {
      const cName = String(c.name || '').trim().toLowerCase();
      if (c.parent_id !== null && c.parent_id !== undefined) {
        const isParentRoot = Array.from(dbParentMap.values()).some((p: any) => p.id === c.parent_id);
        if (isParentRoot) {
          dbSubMap.set(`${c.parent_id}:::${cName}`, c);
        }
      }
    });

    (existingCategories || []).forEach((c: any) => {
      const cName = String(c.name || '').trim().toLowerCase();
      if (c.parent_id !== null && c.parent_id !== undefined) {
        const isParentSub = Array.from(dbSubMap.values()).some((s: any) => s.id === c.parent_id);
        if (isParentSub) {
          dbCatMap.set(`${c.parent_id}:::${cName}`, c);
        }
      }
    });

    const dbBrandSet = new Set((existingBrands || []).map((b: any) => String(b.name || '').trim().toLowerCase()));
    const dbPrintSet = new Set((existingPrints || []).map((p: any) => String(p.name || '').trim().toLowerCase()));

    allRows.forEach((r) => {
      const p = (r.parentCat || '').trim();
      const s = (r.subCategory || '').trim();
      const c = (r.category || '').trim();
      const b = (r.brand || '').trim();
      const pr = (r.print || '').trim();

      if (p && !dbParentMap.has(p.toLowerCase())) {
        parentSet.add(p);
      }
      if (s) {
        const pObj = dbParentMap.get(p.toLowerCase());
        const subKey = pObj ? `${pObj.id}:::${s.toLowerCase()}` : '';
        if (!subKey || !dbSubMap.has(subKey)) {
          subSet.add(s);
        }
      }
      if (c) {
        catSet.add(c);
      }
      if (b && !dbBrandSet.has(b.toLowerCase())) {
        brandSet.add(b);
      }
      if (pr && !dbPrintSet.has(pr.toLowerCase())) {
        printSet.add(pr);
      }
    });

    return {
      parents: Array.from(parentSet),
      subs: Array.from(subSet),
      cats: Array.from(catSet),
      brands: Array.from(brandSet),
      prints: Array.from(printSet),
      total: parentSet.size + subSet.size + brandSet.size + printSet.size,
    };
  }, [otherRows, tileRows, existingCategories, existingBrands, existingPrints]);

  const masterLookup = useMemo(() => {
    const parentSet = new Set<string>();
    const subSet = new Map<string, Set<string>>();
    const catSet = new Map<string, Set<string>>();

    const dbParentIdMap = new Map<number | string, string>();
    const dbSubIdMap = new Map<number | string, { parentLower: string; subLower: string }>();

    (existingCategories || []).forEach((c: any) => {
      const nameLower = String(c.name || '').trim().toLowerCase();
      if (c.parent_id === null || c.parent_id === undefined) {
        parentSet.add(nameLower);
        dbParentIdMap.set(c.id, nameLower);
      }
    });

    (existingCategories || []).forEach((c: any) => {
      const nameLower = String(c.name || '').trim().toLowerCase();
      if (c.parent_id !== null && c.parent_id !== undefined && dbParentIdMap.has(c.parent_id)) {
        const parentLower = dbParentIdMap.get(c.parent_id)!;
        if (!subSet.has(parentLower)) subSet.set(parentLower, new Set());
        subSet.get(parentLower)!.add(nameLower);
        dbSubIdMap.set(c.id, { parentLower, subLower: nameLower });
      }
    });

    (existingCategories || []).forEach((c: any) => {
      const nameLower = String(c.name || '').trim().toLowerCase();
      if (c.parent_id !== null && c.parent_id !== undefined && dbSubIdMap.has(c.parent_id)) {
        const { parentLower, subLower } = dbSubIdMap.get(c.parent_id)!;
        const key = `${parentLower}:::${subLower}`;
        if (!catSet.has(key)) catSet.set(key, new Set());
        catSet.get(key)!.add(nameLower);
      }
    });

    const brandSet = new Set(
      (existingBrands || []).map((b: any) => String(b.name || '').trim().toLowerCase())
    );

    const printSet = new Set(
      (existingPrints || []).map((p: any) => String(p.name || '').trim().toLowerCase())
    );

    return {
      isParentExists: (name?: string) => {
        if (!name || !name.trim()) return false;
        return parentSet.has(name.trim().toLowerCase());
      },
      isSubExists: (parentName?: string, subName?: string) => {
        if (!parentName || !subName || !parentName.trim() || !subName.trim()) return false;
        const pLower = parentName.trim().toLowerCase();
        const sLower = subName.trim().toLowerCase();
        return subSet.has(pLower) && subSet.get(pLower)!.has(sLower);
      },
      isCatExists: (parentName?: string, subName?: string, catName?: string) => {
        if (!parentName || !subName || !catName) return false;
        const pLower = parentName.trim().toLowerCase();
        const sLower = subName.trim().toLowerCase();
        const cLower = catName.trim().toLowerCase();
        const key = `${pLower}:::${sLower}`;
        return catSet.has(key) && catSet.get(key)!.has(cLower);
      },
      isBrandExists: (brandName?: string) => {
        if (!brandName || !brandName.trim()) return false;
        return brandSet.has(brandName.trim().toLowerCase());
      },
      isPrintExists: (printName?: string) => {
        if (!printName || !printName.trim()) return false;
        return printSet.has(printName.trim().toLowerCase());
      },
    };
  }, [existingCategories, existingBrands, existingPrints]);

  return {
    activeTab,
    setActiveTab,
    fileName,
    setFileName,
    analyzing,
    setAnalyzing,
    loading,
    setLoading,
    uploadProgress,
    setUploadProgress,
    autoCreateMasters,
    setAutoCreateMasters,
    existingCategories,
    setExistingCategories,
    existingBrands,
    setExistingBrands,
    existingPrints,
    setExistingPrints,
    otherRows,
    setOtherRows,
    tileRows,
    setTileRows,
    activeFilterTab,
    setActiveFilterTab,
    searchTerm,
    setSearchTerm,
    uploadMode,
    setUploadMode,
    currentPage,
    setCurrentPage,
    pageSize,
    uploadResult,
    setUploadResult,
    uploadBatches,
    batchesLoading,
    batchSearchTerm,
    setBatchSearchTerm,
    selectedBatchForView,
    setSelectedBatchForView,
    modalItemSearch,
    setModalItemSearch,
    modalPage,
    setModalPage,
    historyTab,
    setHistoryTab,
    processedRows,
    setProcessedRows,
    hasFileLoaded,
    isMixedFile,
    currentTabBatches,
    pendingMasters,
    masterLookup,
    fetchUploadBatches,
  };
};
