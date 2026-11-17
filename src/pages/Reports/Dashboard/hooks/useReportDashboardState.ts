import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { exportMultiSheetExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';
import {
  MasterThemePreset,
  getMasterThemePreset,
  isNHTTheme2Active,
  getReportLayoutMode,
  ReportLayoutMode,
} from '../../../../constant/themeConfig';
import { ReportItem, CategoryMeta } from '../types/reportDashboardTypes';
import {
  ALL_REPORTS,
  CATEGORY_META,
  STORAGE_KEY,
  STORAGE_CAT_KEY,
  getInitialReports,
  getInitialCategories,
} from '../data/reportDashboardData';

interface UseReportDashboardStateProps {
  tenantId?: string | null;
  businessName?: string | null;
}

export const useReportDashboardState = ({ tenantId, businessName }: UseReportDashboardStateProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());
  const [reportLayout, setReportLayout] = useState<ReportLayoutMode>(() => getReportLayoutMode());

  useEffect(() => {
    const updateMasterPreset = () => {
      setMasterPreset(getMasterThemePreset());
      setReportLayout(getReportLayoutMode());
    };
    window.addEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
    window.addEventListener('jakwani_report_layout_mode_changed', updateMasterPreset);
    window.addEventListener('storage', updateMasterPreset);
    return () => {
      window.removeEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
      window.removeEventListener('jakwani_report_layout_mode_changed', updateMasterPreset);
      window.removeEventListener('storage', updateMasterPreset);
    };
  }, []);

  const isTheme2 = masterPreset === 'nht-2' || (masterPreset !== 'nht-1' && isNHTTheme2Active());
  const isClassicReport = reportLayout === 'classic';

  const [reportsList, setReportsList] = useState<ReportItem[]>(getInitialReports);
  const [categoriesList, setCategoriesList] = useState<CategoryMeta[]>(getInitialCategories);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitialCategory = () => {
    const fromState = (location.state as any)?.category;
    const fromParam = searchParams.get('category');
    return fromState || fromParam || 'all';
  };

  const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory);
  const [exporting, setExporting] = useState(false);
  const [draggedReportId, setDraggedReportId] = useState<string | null>(null);
  const [draggedCatKey, setDraggedCatKey] = useState<string | null>(null);
  const [justDroppedReportId, setJustDroppedReportId] = useState<string | null>(null);
  const [justDroppedCatKey, setJustDroppedCatKey] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const target = (location.state as any)?.category || searchParams.get('category');
    if (target && target !== selectedCategory) {
      setSelectedCategory(target);
      setCollapsedCats((prev) => ({
        ...prev,
        [target]: false,
      }));
    }
  }, [location.state, searchParams]);

  // Auto-scroll window when dragging near top or bottom screen edges
  useEffect(() => {
    if (!draggedReportId && !draggedCatKey) return;

    let animationFrameId: number;
    let scrollVelocity = 0;

    const handleGlobalDragOver = (e: DragEvent) => {
      const viewportHeight = window.innerHeight;
      const clientY = e.clientY;
      const edgeThreshold = 90;

      if (clientY < edgeThreshold) {
        const intensity = (edgeThreshold - clientY) / edgeThreshold;
        scrollVelocity = -Math.max(6, Math.round(intensity * 22));
      } else if (clientY > viewportHeight - edgeThreshold) {
        const intensity = (clientY - (viewportHeight - edgeThreshold)) / edgeThreshold;
        scrollVelocity = Math.max(6, Math.round(intensity * 22));
      } else {
        scrollVelocity = 0;
      }
    };

    const scrollLoop = () => {
      if (scrollVelocity !== 0) {
        window.scrollBy(0, scrollVelocity);
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, [draggedReportId, draggedCatKey]);

  const toggleCatCollapse = (key: string) => {
    setCollapsedCats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTabClick = (categoryKey: string) => {
    if (categoryKey === selectedCategory || categoryKey === 'all') {
      setSelectedCategory('all');
      setCollapsedCats({});
      setSearchParams({}, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSelectedCategory(categoryKey);
    setSearchParams({ category: categoryKey }, { replace: true });
    setCollapsedCats((prev) => ({
      ...prev,
      [categoryKey]: false,
    }));
  };

  const filteredReports = useMemo(() => {
    return reportsList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }
      return true;
    });
  }, [reportsList, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reportsList.length };
    reportsList.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [reportsList]);

  const reportsListRef = useRef(reportsList);
  reportsListRef.current = reportsList;

  const categoriesListRef = useRef(categoriesList);
  categoriesListRef.current = categoriesList;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedReportId(id);
  };

  const handleDragEnter = (targetId: string) => {
    if (!draggedReportId || draggedReportId === targetId) return;

    setReportsList((prevList) => {
      const sourceIndex = prevList.findIndex((r) => r.id === draggedReportId);
      const targetIndex = prevList.findIndex((r) => r.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prevList;

      const updated = [...prevList];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    if (draggedReportId) {
      const droppedId = draggedReportId;
      setJustDroppedReportId(droppedId);
      setTimeout(() => setJustDroppedReportId(null), 650);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reportsListRef.current.map((r) => r.id)));
        toast.success('Card arrangement saved!', { id: 'report-order-save', duration: 1200 });
      } catch (err) {
        console.error('Failed to save report order to localStorage', err);
      }
    }
    setDraggedReportId(null);
  };

  const handleCatDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCatKey(key);
  };

  const handleCatDragEnter = (targetKey: string) => {
    if (!draggedCatKey || draggedCatKey === targetKey) return;

    setCategoriesList((prevList) => {
      const sourceIndex = prevList.findIndex((c) => c.key === draggedCatKey);
      const targetIndex = prevList.findIndex((c) => c.key === targetKey);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prevList;

      const updated = [...prevList];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const handleCatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCatDragEnd = () => {
    if (draggedCatKey) {
      const droppedKey = draggedCatKey;
      setJustDroppedCatKey(droppedKey);
      setTimeout(() => setJustDroppedCatKey(null), 650);

      try {
        localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(categoriesListRef.current.map((c) => c.key)));
        toast.success('Category container order saved!', { id: 'category-order-save', duration: 1200 });
      } catch (err) {
        console.error('Failed to save category order to localStorage', err);
      }
    }
    setDraggedCatKey(null);
  };

  const handleResetOrder = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_CAT_KEY);
      setReportsList(ALL_REPORTS);
      setCategoriesList(CATEGORY_META);
      setCollapsedCats({});
      setSearchParams({}, { replace: true });
      setSearchQuery('');
      setSelectedCategory('all');
      toast.success('Reports layout reset to default order.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (report: ReportItem) => {
    const dest = `${tenantId ? `/${tenantId}` : ''}/Reports/view/${report.id}`;
    navigate(dest, { state: report.state || {} });
  };

  const handleBatchExport = async () => {
    try {
      setExporting(true);
      const directoryCols: ExcelColumn[] = [
        { header: 'Report ID', key: 'id', width: 22 },
        { header: 'Report Name', key: 'title', width: 35 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Description', key: 'description', width: 55 },
        { header: 'Audit Status', key: 'badge', width: 16 }
      ];

      const exportData = reportsList.map((r) => ({
        id: r.id.toUpperCase(),
        title: r.title,
        category: r.category.toUpperCase(),
        description: r.description,
        badge: r.badge || 'STANDARD'
      }));

      await exportMultiSheetExcel({
        fileName: `Master_Reports_Directory_${new Date().toISOString().split('T')[0]}.xlsx`,
        companyName: businessName || getBrandConfig().fullName,
        sheets: [
          {
            sheetName: 'Reports Catalog',
            reportTitle: 'Master ERP Reports Directory & Audit Statements Catalog',
            columns: directoryCols,
            data: exportData,
            summaryRow: false,
            theme: 'emerald'
          }
        ]
      });

      toast.success('Master Reports Directory catalog exported successfully!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return {
    isTheme2,
    isClassicReport,
    reportsList,
    categoriesList,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    exporting,
    draggedReportId,
    draggedCatKey,
    justDroppedReportId,
    justDroppedCatKey,
    collapsedCats,
    filteredReports,
    categoryCounts,
    setSearchParams,
    toggleCatCollapse,
    handleTabClick,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragEnd,
    handleCatDragStart,
    handleCatDragEnter,
    handleCatDragOver,
    handleCatDragEnd,
    handleResetOrder,
    handleNavigate,
    handleBatchExport,
  };
};
