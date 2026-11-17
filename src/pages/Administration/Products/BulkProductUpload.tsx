import React, { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Context/Auth';
import { useLanguage, getUrduText } from '../../../Context/LanguageContext';
import { toast } from 'react-hot-toast';
import { logActivity } from '../../../service/auditLogger';
import {
  MdCloudUpload,
  MdRefresh,
  MdArrowBack,
  MdLayers,
  MdSquareFoot,
} from 'react-icons/md';

import { DuplicateStatus, ProcessedRow } from './BulkUpload/types/bulkUploadTypes';
import { useBulkUploadState } from './BulkUpload/hooks/useBulkUploadState';
import { parseExcelFile } from './BulkUpload/utils/bulkUploadParser';
import {
  exportFilteredRows,
  syncMasterHierarchy,
  executeRowsUpload,
  downloadOtherTemplate,
  downloadTileTemplate,
} from './BulkUpload/services/bulkUploadService';

import { BulkUploadDropzone } from './BulkUpload/components/BulkUploadDropzone';
import { BulkUploadStatsBar } from './BulkUpload/components/BulkUploadStatsBar';
import { BulkUploadPreviewTable } from './BulkUpload/components/BulkUploadPreviewTable';
import { BulkUploadConfirmationDock } from './BulkUpload/components/BulkUploadConfirmationDock';
import { BulkUploadBatchesSection } from './BulkUpload/components/BulkUploadBatchesSection';
import { BatchItemsModal } from './BulkUpload/modals/BatchItemsModal';
import { UploadSuccessModal } from './BulkUpload/modals/UploadSuccessModal';

export type { DuplicateStatus, ProcessedRow };

const BulkProductUpload: React.FC = () => {
  const { userName, userEmail } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
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
    setExistingCategories,
    setExistingBrands,
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
  } = useBulkUploadState();

  const modalPageSize = 25;

  useEffect(() => {
    fetchUploadBatches();
  }, []);

  const formatUploadDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const handleTabChange = (tab: 'OTHER' | 'TILES') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setActiveFilterTab('ALL');
    setSearchTerm('');
  };

  const handleDownloadOtherTemplate = () => {
    downloadOtherTemplate();
    toast.success('Downloaded Other Products Excel template!');
  };

  const handleDownloadTileTemplate = () => {
    downloadTileTemplate();
    toast.success('Downloaded Tile Products Excel template!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAnalyzing(true);
    setUploadResult(null);

    try {
      const result = await parseExcelFile(file);
      setOtherRows(result.otherRows);
      setTileRows(result.tileRows);
      setExistingCategories(result.existingCategories);
      setExistingBrands(result.existingBrands);
      setExistingPrints(result.existingPrints);

      const totalParsed = result.otherRows.length + result.tileRows.length;
      if (totalParsed === 0) {
        toast.error('The selected file contains no readable product rows.');
        return;
      }

      if (result.tileRows.length > 0 && result.otherRows.length === 0) {
        setActiveTab('TILES');
      } else if (result.otherRows.length > 0 && result.tileRows.length === 0) {
        setActiveTab('OTHER');
      }

      toast.success(
        `Parsed ${totalParsed} items (${result.tileRows.length} Tiles, ${result.otherRows.length} Other Products)`
      );
    } catch (err: any) {
      console.error('File parsing error:', err);
      toast.error('Failed to parse file: ' + (err.message || 'Unknown error'));
    } finally {
      setAnalyzing(false);
    }
  };

  // Metrics for current tab
  const metrics = useMemo(() => {
    const total = processedRows.length;
    const ready = processedRows.filter(r => r.status === 'ready').length;
    const fileDup = processedRows.filter(r => r.status === 'duplicate_in_file').length;
    const dbDup = processedRows.filter(r => r.status === 'duplicate_in_db').length;
    const invalid = processedRows.filter(r => r.status === 'invalid').length;
    const selected = processedRows.filter(r => r.selected).length;
    return { total, ready, fileDup, dbDup, invalid, selected };
  }, [processedRows]);

  // Filtered rows for current tab
  const filteredRows = useMemo(() => {
    return processedRows.filter(r => {
      if (activeFilterTab === 'READY' && r.status !== 'ready') return false;
      if (activeFilterTab === 'FILE_DUP' && r.status !== 'duplicate_in_file') return false;
      if (activeFilterTab === 'DB_DUP' && r.status !== 'duplicate_in_db') return false;
      if (activeFilterTab === 'INVALID' && r.status !== 'invalid') return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inCode = (r.code || '').toLowerCase().includes(query);
        const inName = (r.productName || '').toLowerCase().includes(query);
        const inCat = (r.category || '').toLowerCase().includes(query);
        const inParent = (r.parentCat || '').toLowerCase().includes(query);
        const inBrand = (r.brand || '').toLowerCase().includes(query);
        const inPrint = (r.print || '').toLowerCase().includes(query);
        if (!inCode && !inName && !inCat && !inParent && !inBrand && !inPrint) return false;
      }

      return true;
    });
  }, [processedRows, activeFilterTab, searchTerm]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Row selection handlers
  const toggleRowSelect = (id: string) => {
    setProcessedRows(prev =>
      prev.map(r => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const selectAllFiltered = () => {
    const ids = new Set(filteredRows.map(r => r.id));
    setProcessedRows(prev =>
      prev.map(r => (ids.has(r.id) ? { ...r, selected: true } : r))
    );
  };

  const deselectAllFiltered = () => {
    const ids = new Set(filteredRows.map(r => r.id));
    setProcessedRows(prev =>
      prev.map(r => (ids.has(r.id) ? { ...r, selected: false } : r))
    );
  };

  const removeRow = (id: string) => {
    setProcessedRows(prev => prev.filter(r => r.id !== id));
  };

  const removeAllDuplicates = () => {
    const dupsCount = processedRows.filter(r => r.status === 'duplicate_in_file' || r.status === 'duplicate_in_db').length;
    if (dupsCount === 0) {
      toast('No duplicate rows to remove.');
      return;
    }
    setProcessedRows(prev => prev.filter(r => r.status === 'ready' || r.status === 'invalid'));
    toast.success(`Removed ${dupsCount} duplicate rows from the list.`);
  };

  const removeInvalidRows = () => {
    const count = processedRows.filter(r => r.status === 'invalid').length;
    if (count === 0) {
      toast('No rejected rows to remove.');
      return;
    }
    setProcessedRows(prev => prev.filter(r => r.status !== 'invalid'));
    toast.success(`Removed ${count} rejected rows from the list.`);
  };

  const handleExportFiltered = (type: 'ALL' | 'DUPLICATES' | 'REJECTED' = 'DUPLICATES') => {
    let rowsToExport: ProcessedRow[] = [];
    if (type === 'DUPLICATES') {
      rowsToExport = processedRows.filter(r => r.status === 'duplicate_in_file' || r.status === 'duplicate_in_db');
    } else if (type === 'REJECTED') {
      rowsToExport = processedRows.filter(r => r.status === 'invalid');
    } else {
      rowsToExport = filteredRows;
    }

    if (rowsToExport.length === 0) {
      toast.error('No rows matching this export criteria.');
      return;
    }

    exportFilteredRows(rowsToExport, type);
    toast.success(`Exported ${rowsToExport.length} rows to Excel.`);
  };

  const handleExecuteUpload = async () => {
    const rowsToProcess = processedRows.filter(
      r => (r.status === 'ready' && r.selected) || (uploadMode === 'UPDATE_EXISTING' && r.status === 'duplicate_in_db' && r.selected)
    );

    if (rowsToProcess.length === 0) {
      toast.error('No valid rows selected for upload.');
      return;
    }

    setLoading(true);
    let mastersCreated = 0;

    try {
      if (autoCreateMasters) {
        setUploadProgress({ current: 0, total: rowsToProcess.length, stage: 'Auto-syncing master categories, brands & prints...' });
        const syncRes = await syncMasterHierarchy(rowsToProcess);
        mastersCreated = syncRes.totalCreated;
        if (mastersCreated > 0) {
          toast.success(
            `Master Data: Created ${syncRes.createdParents} Parents, ${syncRes.createdSubs} Subs, ${syncRes.createdCats} Sizes, ${syncRes.createdBrands} Brands, ${syncRes.createdPrints} Prints in database!`
          );
        }
      }

      setUploadProgress({ current: 0, total: rowsToProcess.length, stage: `Uploading ${rowsToProcess.length} products to database...` });
      const { inserted, updated } = await executeRowsUpload(processedRows, activeTab, uploadMode);

      const skipped = processedRows.length - (inserted + updated);
      setUploadResult({
        newCount: inserted,
        updatedCount: updated,
        skippedCount: skipped,
        totalRows: processedRows.length,
        mastersCount: mastersCreated,
      });

      // Audit log batch
      try {
        await logActivity({
          action: 'BULK_UPLOAD',
          tableName: 'products',
          performedBy: userName || userEmail || 'Super Admin',
          details: {
            batch_type: activeTab,
            file_name: fileName || `${activeTab.toLowerCase()}_bulk_upload.xlsx`,
            total_rows: rowsToProcess.length,
            inserted_count: inserted,
            updated_count: updated,
            skipped_count: skipped,
            items: rowsToProcess.map(r => ({
              code: r.code || '',
              productName: r.productName || '',
              category: r.category || '',
              subCategory: r.subCategory || '',
              parentCat: r.parentCat || '',
              brand: r.brand || '',
              purchasePrice: r.purchasePrice || 0,
              retailPrice: r.retailPrice || 0,
              uom: r.uom || (activeTab === 'TILES' ? 'BOX' : 'PCS'),
              minimumStock: r.minimumStock || 0,
              status: r.status === 'ready' ? 'New Added' : 'Updated',
              ...(activeTab === 'TILES' ? {
                print: r.print || '',
                tileWidth: r.tileWidth,
                tileHeight: r.tileHeight,
                piecesPerBox: r.piecesPerBox
              } : {})
            })),
            uploaded_at: new Date().toISOString()
          }
        });
        fetchUploadBatches();
      } catch (logErr) {
        console.warn('Bulk upload audit logging failed:', logErr);
      }

      toast.success(
        `Successfully uploaded: ${inserted} added, ${updated} updated, ${skipped} skipped.`
      );
    } catch (err: any) {
      toast.error('Upload halted: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleExecuteUploadBoth = async () => {
    const otherSelected = otherRows.filter(r => (r.status === 'ready' && r.selected) || (uploadMode === 'UPDATE_EXISTING' && r.status === 'duplicate_in_db' && r.selected));
    const tileSelected = tileRows.filter(r => (r.status === 'ready' && r.selected) || (uploadMode === 'UPDATE_EXISTING' && r.status === 'duplicate_in_db' && r.selected));
    const totalSelected = otherSelected.length + tileSelected.length;

    if (totalSelected === 0) {
      toast.error('No selected rows ready for upload in either tab.');
      return;
    }

    setLoading(true);
    let mastersCreated = 0;

    try {
      if (autoCreateMasters) {
        const allRowsToUpload = [...otherSelected, ...tileSelected];
        setUploadProgress({ current: 0, total: allRowsToUpload.length, stage: 'Auto-syncing master categories, brands & prints for both tabs...' });
        const syncRes = await syncMasterHierarchy(allRowsToUpload);
        mastersCreated = syncRes.totalCreated;
        if (mastersCreated > 0) {
          toast.success(
            `Master Data: Created ${syncRes.createdParents} Parents, ${syncRes.createdSubs} Subs, ${syncRes.createdCats} Sizes, ${syncRes.createdBrands} Brands, ${syncRes.createdPrints} Prints in database!`
          );
        }
      }

      setUploadProgress({ current: 0, total: totalSelected, stage: 'Uploading all products from both tabs...' });
      const otherRes = await executeRowsUpload(otherRows, 'OTHER', uploadMode);
      const tileRes = await executeRowsUpload(tileRows, 'TILES', uploadMode);

      const totalInserted = otherRes.inserted + tileRes.inserted;
      const totalUpdated = otherRes.updated + tileRes.updated;
      const totalSkipped = (otherRows.length + tileRows.length) - (totalInserted + totalUpdated);

      setUploadResult({
        newCount: totalInserted,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        totalRows: otherRows.length + tileRows.length,
        mastersCount: mastersCreated,
      });

      // Log both batches
      try {
        if (otherSelected.length > 0) {
          await logActivity({
            action: 'BULK_UPLOAD',
            tableName: 'products',
            performedBy: userName || userEmail || 'Super Admin',
            details: {
              batch_type: 'OTHER',
              file_name: fileName || 'General_Products_Upload.xlsx',
              total_rows: otherSelected.length,
              inserted_count: otherRes.inserted,
              updated_count: otherRes.updated,
              skipped_count: otherRows.length - (otherRes.inserted + otherRes.updated),
              items: otherSelected.map(r => ({
                code: r.code || '',
                productName: r.productName || '',
                category: r.category || '',
                subCategory: r.subCategory || '',
                parentCat: r.parentCat || '',
                brand: r.brand || '',
                purchasePrice: r.purchasePrice || 0,
                retailPrice: r.retailPrice || 0,
                uom: r.uom || 'PCS',
                minimumStock: r.minimumStock || 0,
                status: r.status === 'ready' ? 'New Added' : 'Updated'
              })),
              uploaded_at: new Date().toISOString()
            }
          });
        }

        if (tileSelected.length > 0) {
          await logActivity({
            action: 'BULK_UPLOAD',
            tableName: 'products',
            performedBy: userName || userEmail || 'Super Admin',
            details: {
              batch_type: 'TILES',
              file_name: fileName || 'Tile_Products_Upload.xlsx',
              total_rows: tileSelected.length,
              inserted_count: tileRes.inserted,
              updated_count: tileRes.updated,
              skipped_count: tileRows.length - (tileRes.inserted + tileRes.updated),
              items: tileSelected.map(r => ({
                code: r.code || '',
                productName: r.productName || '',
                category: r.category || '',
                subCategory: r.subCategory || '',
                parentCat: r.parentCat || '',
                brand: r.brand || '',
                purchasePrice: r.purchasePrice || 0,
                retailPrice: r.retailPrice || 0,
                uom: r.uom || 'BOX',
                minimumStock: r.minimumStock || 0,
                status: r.status === 'ready' ? 'New Added' : 'Updated',
                print: r.print || '',
                tileWidth: r.tileWidth,
                tileHeight: r.tileHeight,
                piecesPerBox: r.piecesPerBox
              })),
              uploaded_at: new Date().toISOString()
            }
          });
        }
        fetchUploadBatches();
      } catch (logErr) {
        console.warn('Both tabs batch audit log failed:', logErr);
      }

      toast.success(
        `Successfully uploaded both tabs: ${totalInserted} added, ${totalUpdated} updated, ${totalSkipped} skipped.`
      );
    } catch (err: any) {
      toast.error('Upload halted: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setOtherRows([]);
    setTileRows([]);
    setFileName(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-slate-800 dark:text-slate-100">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MdCloudUpload className="text-emerald-600 text-2xl" />
            {isRTL ? "بلک پروڈکٹ اپلوڈ مع ڈپلیکیٹ پروٹیکشن" : "Bulk Product Upload with Smart Duplicate Protection"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL ? "ایکسل یا CSV فائل سے پروڈکٹس اور ٹائلز اپلوڈ کریں مع مکمل ڈپلیکیٹ پروٹیکشن۔" : "Imports Excel/CSV files with auto-detection of tiles vs standard products and full duplicate protection."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFileLoaded && (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <MdRefresh className="text-sm" /> {isRTL ? "دوسری فائل منتخب کریں" : "Choose Another File"}
            </button>
          )}
          <button
            onClick={() => navigate('/Administration/Products/List')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isRTL ? "پروڈکٹس لسٹ" : "Products List"} <MdArrowBack className={isRTL ? "rotate-180" : ""} />
          </button>
        </div>
      </div>

      {/* TOP TABS: OTHER PRODUCTS vs TILE PRODUCTS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stroke dark:border-strokedark pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('OTHER')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'OTHER'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <MdLayers className="text-base" />
          <span>{isRTL ? "دیگر پروڈکٹس اپلوڈ کریں" : "Upload Other Products"}</span>
          {otherRows.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'OTHER' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {otherRows.length} {isRTL ? "آئٹمز" : "items"}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('TILES')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'TILES'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <MdSquareFoot className="text-base" />
          <span>{isRTL ? "ٹائل پروڈکٹس اپلوڈ کریں" : "Upload Tile Products"}</span>
          {tileRows.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'TILES' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {tileRows.length} {isRTL ? "آئٹمز" : "items"}
            </span>
          )}
        </button>

        {isMixedFile && (
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 ml-auto flex items-center gap-1.5">
            <span>💡</span> Both categories separated: <strong>{otherRows.length} Other</strong> & <strong>{tileRows.length} Tiles</strong>
          </span>
        )}
      </div>

      {/* STEP 1: FILE PICKER / DROPZONE */}
      {!hasFileLoaded && (
        <BulkUploadDropzone
          isRTL={isRTL}
          activeTab={activeTab}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          handleDownloadTileTemplate={handleDownloadTileTemplate}
          handleDownloadOtherTemplate={handleDownloadOtherTemplate}
          getUrduText={getUrduText}
          analyzing={analyzing}
        />
      )}

      {/* STEP 2: DUPLICATE ANALYSIS & UPLOAD CONTROLS */}
      {hasFileLoaded && (
        <div className="space-y-5">
          {/* MASTER HIERARCHY AUTO-PROVISIONING BANNER */}
          {pendingMasters.total > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                  <span className="text-base">✨</span>
                  <span>New Master Hierarchy Detected in File ({pendingMasters.total} items):</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  {pendingMasters.parents.length > 0 && (
                    <span className="bg-white dark:bg-boxdark px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-800 dark:text-emerald-300">
                      📁 {pendingMasters.parents.length} Parent Categories ({pendingMasters.parents.slice(0, 3).join(', ')}{pendingMasters.parents.length > 3 ? '...' : ''})
                    </span>
                  )}
                  {pendingMasters.subs.length > 0 && (
                    <span className="bg-white dark:bg-boxdark px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-800 dark:text-emerald-300">
                      📂 {pendingMasters.subs.length} Sub Categories
                    </span>
                  )}
                  {pendingMasters.brands.length > 0 && (
                    <span className="bg-white dark:bg-boxdark px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-800 dark:text-emerald-300">
                      🏢 {pendingMasters.brands.length} Brands ({pendingMasters.brands.slice(0, 3).join(', ')}{pendingMasters.brands.length > 3 ? '...' : ''})
                    </span>
                  )}
                  {pendingMasters.prints.length > 0 && (
                    <span className="bg-white dark:bg-boxdark px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-800 dark:text-emerald-300">
                      🎨 {pendingMasters.prints.length} Prints ({pendingMasters.prints.slice(0, 3).join(', ')}{pendingMasters.prints.length > 3 ? '...' : ''})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-boxdark px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 font-bold text-emerald-800 dark:text-emerald-200 text-xs shadow-2xs hover:bg-emerald-50 dark:hover:bg-meta-4 transition">
                  <input
                    type="checkbox"
                    checked={autoCreateMasters}
                    onChange={(e) => setAutoCreateMasters(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Auto-create on upload</span>
                </label>
              </div>
            </div>
          )}

          {/* FILE INFO & QUICK STATS */}
          <BulkUploadStatsBar
            activeTab={activeTab}
            fileName={fileName}
            metrics={metrics}
            activeFilterTab={activeFilterTab}
            setActiveFilterTab={setActiveFilterTab}
            setCurrentPage={setCurrentPage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectAllFiltered={selectAllFiltered}
            deselectAllFiltered={deselectAllFiltered}
            removeInvalidRows={removeInvalidRows}
            removeAllDuplicates={removeAllDuplicates}
            handleExportFiltered={handleExportFiltered}
          />

          {/* MAIN PREVIEW TABLE */}
          <BulkUploadPreviewTable
            activeTab={activeTab}
            filteredRows={filteredRows}
            paginatedRows={paginatedRows}
            processedRows={processedRows}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            selectAllFiltered={selectAllFiltered}
            deselectAllFiltered={deselectAllFiltered}
            toggleRowSelect={toggleRowSelect}
            removeRow={removeRow}
            masterLookup={masterLookup}
          />

          {/* STEP 3: UPLOAD CONFIGURATION & CONFIRMATION DOCK */}
          <BulkUploadConfirmationDock
            uploadMode={uploadMode}
            setUploadMode={setUploadMode}
            autoCreateMasters={autoCreateMasters}
            setAutoCreateMasters={setAutoCreateMasters}
            handleReset={handleReset}
            loading={loading}
            metrics={metrics}
            handleExecuteUpload={handleExecuteUpload}
            uploadProgress={uploadProgress}
            activeTab={activeTab}
            isMixedFile={isMixedFile}
            handleExecuteUploadBoth={handleExecuteUploadBoth}
            otherRows={otherRows}
            tileRows={tileRows}
          />
        </div>
      )}

      {/* SECTION: PREVIOUS UPLOAD BATCHES */}
      <BulkUploadBatchesSection
        uploadBatches={uploadBatches}
        currentTabBatches={currentTabBatches}
        batchesLoading={batchesLoading}
        historyTab={historyTab}
        setHistoryTab={setHistoryTab}
        batchSearchTerm={batchSearchTerm}
        setBatchSearchTerm={setBatchSearchTerm}
        fetchUploadBatches={fetchUploadBatches}
        formatUploadDate={formatUploadDate}
        setSelectedBatchForView={setSelectedBatchForView}
        setModalItemSearch={setModalItemSearch}
        setModalPage={setModalPage}
      />

      {/* MODAL: VIEW ITEMS IN SELECTED UPLOAD BATCH */}
      <BatchItemsModal
        selectedBatchForView={selectedBatchForView}
        setSelectedBatchForView={setSelectedBatchForView}
        modalItemSearch={modalItemSearch}
        setModalItemSearch={setModalItemSearch}
        modalPage={modalPage}
        setModalPage={setModalPage}
        modalPageSize={modalPageSize}
        formatUploadDate={formatUploadDate}
      />

      {/* RESULT MODAL UPON SUCCESSFUL UPLOAD */}
      <UploadSuccessModal
        uploadResult={uploadResult}
        handleReset={handleReset}
        navigate={navigate}
      />
    </div>
  );
};

export default BulkProductUpload;
