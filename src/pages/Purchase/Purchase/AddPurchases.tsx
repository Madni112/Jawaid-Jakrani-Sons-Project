import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { FiArrowLeft } from 'react-icons/fi';
import { getWarehouseDispatchStatus } from '../../../utils/locationUtils';

// Subcomponents
import PurchaseHeader from './components/PurchaseHeader';
import PurchaseTileItemsTable from './components/PurchaseTileItemsTable';
import PurchaseStandardItemsTable from './components/PurchaseStandardItemsTable';
import PurchaseChallanSection from './components/PurchaseChallanSection';
import PurchaseSummaryFooter from './components/PurchaseSummaryFooter';

// Hooks, Utils & Services
import { usePurchaseMetadata } from './hooks/usePurchaseMetadata';
import { handleSubmitPurchase } from './services/purchaseSubmitService';
import { catalogHasTileProducts } from '../../../utils/looseUomHelpers';
import {
  isTileProduct,
  calculatePurchaseLineTotals,
  parseGrnItemsToTilesAndStandard,
  handleTileProductSelectionHelper,
  updateTileRowCalcsHelper,
  purchaseValidationSchema,
  blockInvalidChar
} from './utils/purchaseHelpers';
import {
  formatProductStockHelper,
  getWarehouseStockInfoHelper
} from './utils/purchaseStockHelpers';
import { PurchaseFormValues } from './types/purchaseTypes';

const AddPurchases: React.FC = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const formikRef = useRef<any>(null);

  const [hasAttempted, setHasAttempted] = useState(false);
  const [submitAction, setSubmitAction] = useState<'save' | 'print'>('save');

  // UI state for dropdown highlights & active cells
  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [activeProdNameIndex, setActiveProdNameIndex] = useState<number | null>(null);
  const [highlightedProdNameIndex, setHighlightedProdNameIndex] = useState<number>(0);
  const [activeTileSkuIndex, setActiveTileSkuIndex] = useState<number | null>(null);
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState<number>(0);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState<number>(0);

  const handleApplyGrnCallback = (grn: any, prods: any[], locs: any[]) => {
    if (!formikRef.current || !grn) return;
    const { setFieldValue } = formikRef.current;
    setFieldValue('grnId', grn.id);
    setFieldValue('grnNo', grn.grn_no || `GRN-${grn.id}`);
    if (grn.vendor_name) setFieldValue('supplierName', grn.vendor_name);
    if (grn.receipt_date) setFieldValue('purchaseDate', grn.receipt_date);

    let rawGps: Record<string, string> = grn.gatePasses || {};
    let grnRemarks = grn.remarks || '';
    if (Object.keys(rawGps).length === 0 && grnRemarks) {
      const jsonMatch = grnRemarks.match(/\[GatePasses:\s*(\{.*?\})\]/s);
      if (jsonMatch) {
        try {
          rawGps = JSON.parse(jsonMatch[1]);
        } catch (e) {}
      }
      if (Object.keys(rawGps).length === 0) {
        const singleMatch = grnRemarks.match(/\[Gate Pass:\s*([^\]]+)\]/i);
        if (singleMatch) {
          const singleVal = singleMatch[1].trim();
          const allWhs = new Set<string>();
          (grn.grn_items || []).forEach((it: any) => {
            const w = it.warehouse_name || it.warehouse;
            if (w) allWhs.add(w);
          });
          if (allWhs.size === 0 && locs[0]?.name) allWhs.add(locs[0].name);
          allWhs.forEach(wh => {
            rawGps[wh] = singleVal;
          });
        }
      }
    }

    grnRemarks = grnRemarks
      .replace(/\[GatePasses:\s*\{.*?\}\]\s*/s, '')
      .replace(/\[Gate Pass:\s*[^\]]+\]\s*/i, '')
      .trim();

    setFieldValue('remarks', grnRemarks);

    const { tileItems: mappedTiles, standardItems: mappedStandard } =
      parseGrnItemsToTilesAndStandard(grn.grn_items || [], prods, locs);

    if (mappedTiles.length > 0) {
      setFieldValue('showTileSection', true);
      setFieldValue('tileItems', mappedTiles);
    } else {
      setFieldValue('showTileSection', false);
      setFieldValue('tileItems', []);
    }

    if (mappedStandard.length > 0) {
      setFieldValue('items', mappedStandard);
    } else if (mappedTiles.length > 0) {
      setFieldValue('items', []);
    }

    const newGatePasses: Record<string, string> = {};
    for (const [wh, slip] of Object.entries(rawGps)) {
      if (!slip) continue;
      const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const cleanVal = slip.startsWith(`${safePrefix}-`) ? slip.slice(safePrefix.length + 1) : slip;
      newGatePasses[wh] = cleanVal;
    }
    setFieldValue('gatePasses', newGatePasses);

    const totalCount = mappedTiles.length + mappedStandard.length;
    toast.success(`Imported ${totalCount} items from ${grn.grn_no}! Enter prices to complete bill.`);
  };

  const {
    loading,
    setLoading,
    metadataLoading,
    suppliers,
    locations,
    productList,
    bankAccountsList,
    defaultPurchaseNo,
    stockDataset,
    totalStockMap,
    workflowSettings,
    editData,
    isEditMode,
    importedGrnData
  } = usePurchaseMetadata(id, location.state, handleApplyGrnCallback);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sku-container')) setActiveSkuIndex(null);
      if (!target.closest('.prod-name-container')) setActiveProdNameIndex(null);
      if (!target.closest('.vendor-search-container')) setIsVendorDropdownOpen(false);
      if (!target.closest('.tile-sku-container')) setActiveTileSkuIndex(null);
      if (!target.closest('.tile-prod-container')) setActiveTileProdIndex(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatProductStock = (p: any, forcedQty?: number): string =>
    formatProductStockHelper(p, totalStockMap, forcedQty);

  const getWarehouseStockInfo = (productName: string, warehouseName: string) =>
    getWarehouseStockInfoHelper(productName, warehouseName, productList, stockDataset, totalStockMap);

  const handleTileProductSelection = (p: any, tIdx: number, currentTileItem: any, setFieldValue: any) =>
    handleTileProductSelectionHelper(p, tIdx, currentTileItem, setFieldValue, locations);

  const updateTileRowCalcs = (
    field: any,
    val: number,
    tIdx: number,
    currentTile: any,
    setFieldValue: any
  ) => updateTileRowCalcsHelper(field, val, tIdx, currentTile, setFieldValue);

  const calculateLineTotals = (item: any, applyTax: boolean) =>
    calculatePurchaseLineTotals(item, applyTax, productList);

  const formInitialValues: PurchaseFormValues = useMemo(() => {
    if (isEditMode && editData) {
      const rawItems = Array.isArray(editData.items) ? editData.items : JSON.parse(editData.items || '[]');
      const rawTileItems = Array.isArray(editData.metadata?.tile_items) && editData.metadata.tile_items.length > 0
        ? editData.metadata.tile_items
        : rawItems.filter((i: any) => i.isTileItem);
      const standardItems = rawItems.filter((i: any) => !i.isTileItem);
      const paymentTerm = editData.payment_term || 'Cash';
      const settlementMode = paymentTerm.includes('Bank') && paymentTerm.includes('Cash')
        ? 'Split'
        : paymentTerm.includes('Bank')
          ? 'Bank'
          : 'Cash';

      const grnId = editData.metadata?.grn_id || editData.grn_id || null;
      const grnNo = editData.metadata?.grn_no || editData.grn_no || (grnId ? `GRN #${grnId}` : null);

      return {
        grnId,
        grnNo,
        purchaseNo: editData.purchase_no || '',
        supplierName: editData.supplier_name || '',
        targetWarehouse: editData.target_warehouse || '',
        purchaseDate: editData.purchase_date || new Date().toISOString().split('T')[0],
        refInvoiceNo: editData.ref_invoice_no || '',
        applyTax: editData.purchase_type && editData.purchase_type !== 'No Tax',
        showDiscount: rawItems.some((i: any) => Number(i.discountAmt || i.discount_amt || 0) > 0),
        showAdditionalCharges: Number(editData.additional_charges || 0) > 0,
        additionalCharges: Number(editData.additional_charges || 0),
        settlementMode: settlementMode as 'Cash' | 'Bank' | 'Split',
        selectedBankTitle: editData.metadata?.selectedBankTitle || editData.selected_bank_title || '',
        cashAmountPaid: Number(editData.cash_amount_paid ?? (settlementMode === 'Cash' ? editData.amount_paid : 0)),
        bankAmountPaid: Number(editData.bank_amount_paid ?? (settlementMode === 'Bank' ? editData.amount_paid : 0)),
        remarks: editData.remarks || '',
        gatePasses: editData.metadata?.gatePasses || {},
        showTileSection: rawTileItems.length > 0,
        tileItems: rawTileItems.map((t: any, tIdx: number) => ({
          id: t.id || `tile-${tIdx}-${Date.now()}`,
          itemName: t.itemName || t.product_name || '',
          skuCode: t.skuCode || t.item_sr_no || t.sku || '',
          warehouse: t.warehouse || locations[0]?.name || 'Main Warehouse',
          boxQty: Number(t.boxQty ?? t.qty ?? 1),
          loosePcs: Number(t.loosePcs ?? 0),
          totalSqm: Number(t.totalSqm ?? 0),
          costPricePerBox: Number(t.costPricePerBox ?? t.rate ?? 0),
          costPricePerPiece: Number(t.costPricePerPiece ?? t.looseRate ?? 0),
          costPricePerSqm: Number(t.costPricePerSqm ?? t.sqmRate ?? 0),
          totalAmount: Number(t.totalAmount ?? 0),
          piecesPerBox: Number(t.piecesPerBox ?? 4),
          sqmPerBox: Number(t.sqmPerBox ?? 1.44)
        })),
        items: (standardItems.length > 0 ? standardItems : [{ itemName: '', skuCode: '', warehouse: locations[0]?.name || '', qty: 1, rate: 0, discountPer: 0, discountAmt: 0, gstRate: 18, gstAmt: 0 }]).map((it: any) => ({
          ...it,
          skuCode: it.skuCode || it.item_sr_no || it.item_code || '',
          warehouse: it.warehouse || it.target_warehouse || locations[0]?.name || '',
          rate: Number(it.rate ?? it.cost_price ?? 0),
          qty: Number(it.qty ?? it.quantity ?? 1),
          gstRate: Number(it.gstRate ?? it.gst_rate ?? 18),
          gstAmt: Number(it.gstAmt ?? it.gst_amt ?? 0),
          discountPer: Number(it.discountPer ?? it.discount_per ?? 0),
          discountAmt: Number(it.discountAmt ?? it.discount_amt ?? 0)
        }))
      };
    }

    const isTileInitial = Boolean(location.state?.isTilePurchase);
    let initTileItems: any[] = [];
    let initStandardItems: any[] = [
      {
        itemName: '',
        skuCode: '',
        warehouse: '',
        qty: 1,
        rate: 0,
        discountPer: 0,
        discountAmt: 0,
        gstRate: 18,
        gstAmt: 0
      }
    ];
    let initSupplier = '';
    let initDate = new Date().toISOString().split('T')[0];
    let initGrnId = location.state?.importGrnId || null;
    let initGrnNo = location.state?.importGrn?.grn_no || importedGrnData?.grn_no || null;
    let initRemarks = '';
    let shouldShowTiles = isTileInitial;

    const grnSource = importedGrnData || location.state?.importGrn;
    let initGatePasses: Record<string, string> = {};
    if (grnSource) {
      initGrnId = grnSource.id || initGrnId;
      initGrnNo = grnSource.grn_no || initGrnNo;
      initSupplier = grnSource.vendor_name || '';
      initDate = grnSource.receipt_date || initDate;
      initRemarks = grnSource.remarks || '';

      let rawGps: Record<string, string> = grnSource.gatePasses || {};
      if (Object.keys(rawGps).length === 0 && initRemarks) {
        const jsonMatch = initRemarks.match(/\[GatePasses:\s*(\{.*?\})\]/s);
        if (jsonMatch) {
          try {
            rawGps = JSON.parse(jsonMatch[1]);
          } catch (e) {}
        }
        if (Object.keys(rawGps).length === 0) {
          const singleMatch = initRemarks.match(/\[Gate Pass:\s*([^\]]+)\]/i);
          if (singleMatch) {
            const singleVal = singleMatch[1].trim();
            const allWhs = new Set<string>();
            (grnSource.grn_items || []).forEach((it: any) => {
              const w = it.warehouse_name || it.warehouse;
              if (w) allWhs.add(w);
            });
            if (allWhs.size === 0 && locations[0]?.name) allWhs.add(locations[0].name);
            allWhs.forEach(wh => {
              rawGps[wh] = singleVal;
            });
          }
        }
      }

      initRemarks = initRemarks
        .replace(/\[GatePasses:\s*\{.*?\}\]\s*/s, '')
        .replace(/\[Gate Pass:\s*[^\]]+\]\s*/i, '')
        .trim();

      const itemsToParse = (grnSource.grn_items && grnSource.grn_items.length > 0)
        ? grnSource.grn_items
        : (importedGrnData?.grn_items || []);

      const { tileItems: parsedTiles, standardItems: parsedStandard } =
        parseGrnItemsToTilesAndStandard(itemsToParse, productList, locations);

      if (parsedTiles.length > 0) {
        initTileItems = parsedTiles;
        shouldShowTiles = true;
      } else {
        shouldShowTiles = false;
      }

      if (parsedStandard.length > 0) {
        initStandardItems = parsedStandard;
      } else if (parsedTiles.length > 0) {
        initStandardItems = [];
      }

      for (const [wh, slip] of Object.entries(rawGps)) {
        if (!slip) continue;
        const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const cleanVal = slip.startsWith(`${safePrefix}-`) ? slip.slice(safePrefix.length + 1) : slip;
        initGatePasses[wh] = cleanVal;
      }
    }

    return {
      grnId: initGrnId,
      grnNo: initGrnNo,
      purchaseNo: defaultPurchaseNo,
      supplierName: initSupplier,
      targetWarehouse: locations[0]?.name || '',
      purchaseDate: initDate,
      refInvoiceNo: '',
      applyTax: false,
      showDiscount: false,
      showAdditionalCharges: false,
      additionalCharges: 0,
      settlementMode: 'Cash',
      selectedBankTitle: '',
      cashAmountPaid: 0,
      bankAmountPaid: 0,
      remarks: initRemarks,
      gatePasses: initGatePasses,
      showTileSection: shouldShowTiles,
      tileItems: initTileItems,
      items: initStandardItems
    };
  }, [isEditMode, editData, defaultPurchaseNo, locations, importedGrnData, productList, location.state]);

  if (loading || metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl text-black dark:text-bodydark text-xs pb-12">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        {/* Header Bar */}
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-black dark:text-white text-lg tracking-tight">
                {isEditMode ? 'Modify Purchase / Inbound Stock Batch' : 'Log New Supplier Stock Purchase'}
              </h3>
              {(formInitialValues.grnNo || formInitialValues.grnId) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                  Linked to {formInitialValues.grnNo || `GRN #${formInitialValues.grnId}`}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Record vendor procurement, receive physical inventory into destination warehouse & settle supplier payables
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20"
          >
            <FiArrowLeft size={14} /> Back to Purchases History
          </button>
        </div>

        <Formik
          innerRef={formikRef}
          initialValues={formInitialValues}
          validationSchema={purchaseValidationSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting }) => {
            await handleSubmitPurchase({
              values,
              isEditMode,
              editData,
              locations,
              productList,
              suppliers,
              tenantId,
              submitAction,
              navigate,
              setLoading,
              setSubmitting
            });
          }}
        >
          {({ handleChange, values, errors, touched, setFieldValue, submitForm }) => {
            const standardItemsTotal = (values.items || []).reduce((acc: any, item: any) => {
              return acc + calculateLineTotals(item, values.applyTax).netTotal;
            }, 0);
            const tileTotalSum = values.showTileSection
              ? (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0)
              : 0;
            const totalBillAmount = standardItemsTotal + tileTotalSum + Number(values.additionalCharges || 0);

            const totalPaid = (values.settlementMode === 'Cash' ? Number(values.cashAmountPaid || 0) : 0) +
              (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : 0) +
              (values.settlementMode === 'Split' ? (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)) : 0);

            const remainingBalance = Math.max(0, totalBillAmount - totalPaid);

            const uniquePurchaseWarehouses = Array.from(new Set([
              ...(values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0).map((i: any) => (i.warehouse || '').trim()),
              ...(values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0)).map((t: any) => (t.warehouse || '').trim())
            ].filter(Boolean)));

            const uniqueManualPurchaseWarehouses = uniquePurchaseWarehouses.filter(wh => {
              const requiredLocs = workflowSettings?.manual_gatepass_locations_purchase || [];
              const isSettingOn = Boolean(workflowSettings?.require_manual_gatepass_purchase);
              const status = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.targetWarehouse, productList);
              if (status.hasExistingSlip) return true;
              if (Boolean(values.gatePasses?.[wh]?.trim())) return true;
              if (isSettingOn && requiredLocs.includes(wh)) {
                if (!editData) return true;
                return status.isNewOrIncreased;
              }
              return false;
            });

            return (
              <Form className="p-6 space-y-6">
                {/* ── LINKED GRN CALLOUT BANNER ── */}
                {(values.grnNo || values.grnId) && (
                  <div className="p-3.5 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/[0.08] via-purple-500/[0.04] to-transparent dark:from-purple-500/15 dark:via-purple-500/[0.06] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs font-bold text-base">
                        📦
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200">
                            Linked to Goods Receipt Note
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-black bg-purple-600 text-white shadow-2xs">
                            {values.grnNo || `GRN #${values.grnId}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                          Physical inventory was already received under this GRN. Entering costs will convert it to a finalized Purchase Bill without creating duplicate stock inward.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                        ⚡ Auto-Billed on Save
                      </span>
                    </div>
                  </div>
                )}

                <PurchaseHeader
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  hasAttempted={hasAttempted}
                  suppliers={suppliers}
                  locations={locations}
                  hasTileProducts={catalogHasTileProducts(productList)}
                  isVendorDropdownOpen={isVendorDropdownOpen}
                  setIsVendorDropdownOpen={setIsVendorDropdownOpen}
                  highlightedVendorIndex={highlightedVendorIndex}
                  setHighlightedVendorIndex={setHighlightedVendorIndex}
                />

                <PurchaseTileItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  productList={productList}
                  locations={locations}
                  isTileProduct={isTileProduct}
                  activeTileProdIndex={activeTileProdIndex}
                  setActiveTileProdIndex={setActiveTileProdIndex}
                  activeTileSkuIndex={activeTileSkuIndex}
                  setActiveTileSkuIndex={setActiveTileSkuIndex}
                  highlightedTileProdIndex={highlightedTileProdIndex}
                  setHighlightedTileProdIndex={setHighlightedTileProdIndex}
                  handleTileProductSelection={handleTileProductSelection}
                  updateTileRowCalcs={updateTileRowCalcs}
                  getWarehouseStockInfo={getWarehouseStockInfo}
                  formatProductStock={formatProductStock}
                  blockInvalidChar={blockInvalidChar}
                />

                <PurchaseStandardItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  activeSkuIndex={activeSkuIndex}
                  setActiveSkuIndex={setActiveSkuIndex}
                  activeProdNameIndex={activeProdNameIndex}
                  setActiveProdNameIndex={setActiveProdNameIndex}
                  highlightedProdNameIndex={highlightedProdNameIndex}
                  setHighlightedProdNameIndex={setHighlightedProdNameIndex}
                  isTileProduct={isTileProduct}
                  productList={productList}
                  locations={locations}
                  getWarehouseStockInfo={getWarehouseStockInfo}
                  formatProductStock={formatProductStock}
                  blockInvalidChar={blockInvalidChar}
                  calculatePurchaseLineTotals={calculateLineTotals}
                  isEditMode={isEditMode}
                  editData={editData}
                  supabase={supabase}
                  toast={toast}
                />

                <PurchaseChallanSection
                  values={values}
                  setFieldValue={setFieldValue}
                  uniqueManualPurchaseWarehouses={uniqueManualPurchaseWarehouses}
                  getWarehouseDispatchStatus={getWarehouseDispatchStatus}
                  editData={editData}
                  productList={productList}
                />

                <PurchaseSummaryFooter
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  hasAttempted={hasAttempted}
                  bankAccountsList={bankAccountsList}
                  totalBillAmount={totalBillAmount}
                  tileTotalSum={tileTotalSum}
                  totalPaid={totalPaid}
                  remainingBalance={remainingBalance}
                  loading={loading}
                  isEditMode={isEditMode}
                  navigate={navigate}
                  tenantId={tenantId}
                  setSubmitAction={setSubmitAction}
                  setHasAttempted={setHasAttempted}
                  submitForm={submitForm}
                  blockInvalidChar={blockInvalidChar}
                />
              </Form>
            );
          }}
        </Formik>

      </div>
    </div>
  );
};

export default AddPurchases;
