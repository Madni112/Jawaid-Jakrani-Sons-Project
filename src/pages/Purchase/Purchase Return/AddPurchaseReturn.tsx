import React, { useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { MdArrowBack } from 'react-icons/md';
import { getWarehouseDispatchStatus } from '../../../utils/locationUtils';
import { getWarehouseAvailableStock, formatStockWithBoxesAndPcs } from '../../../utils/stockCalculator';

// Subcomponents
import { ReturnHeader } from './components/ReturnHeader';
import { ReturnStandardItemsTable } from './components/ReturnStandardItemsTable';
import { ReturnTileItemsTable } from './components/ReturnTileItemsTable';
import { ReturnChallanSection } from './components/ReturnChallanSection';
import { ReturnSummaryFooter } from './components/ReturnSummaryFooter';

// Hooks, Utils & Services
import { usePurchaseReturnMetadata } from './hooks/usePurchaseReturnMetadata';
import { handleSubmitPurchaseReturn } from './services/purchaseReturnSubmitService';
import {
  parseGatePasses,
  isTileProduct,
  formatMoney,
  blockInvalidChar,
  parsePurchaseItemsForReturn,
  createPurchaseReturnValidationSchema,
  handleTileReturnProductSelectionHelper,
  handleTileItemChangeHelper
} from './utils/purchaseReturnHelpers';

const AddPurchaseReturn: React.FC = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const editData = location.state?.returnRecord || location.state?.record;
  const isEditMode = !!editData;
  const defaultReturnNo = isEditMode && editData?.return_no ? editData.return_no : '';
  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);

  // Autocomplete UI dropdown states
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState(0);
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);
  const [highlightedPoIndex, setHighlightedPoIndex] = useState(0);

  const vendorContainerRef = useRef<HTMLDivElement>(null);
  const poContainerRef = useRef<HTMLDivElement>(null);

  const {
    loading,
    setLoading,
    metadataLoading,
    vendors,
    locations,
    productList,
    stockDataset,
    totalStockMap,
    bankAccountsList,
    purchaseOrdersList,
    pastPurchaseReturnsList,
    workflowSettings,
    vendorSearchQuery,
    setVendorSearchQuery,
    poSearchQuery,
    setPoSearchQuery,
    selectedPoNo,
    setSelectedPoNo,
    selectedPoObj,
    setSelectedPoObj,
    filteredVendors,
    filteredPurchases
  } = usePurchaseReturnMetadata(editData, isEditMode);

  const getProductOverallStock = (p: any): number => {
    if (!p) return 0;
    const name = (p.product_name || p.itemName || '').trim().toLowerCase();
    if (name && totalStockMap[name] !== undefined) return totalStockMap[name];
    if (p.current_stock !== undefined && p.current_stock !== null) return Number(p.current_stock || 0);
    const matched = productList.find(pr =>
      (name && pr.product_name && pr.product_name.toLowerCase() === name) ||
      (p.item_sr_no && (pr.item_sr_no === p.item_sr_no || pr.sku === p.item_sr_no))
    );
    if (matched) {
      const mName = (matched.product_name || '').trim().toLowerCase();
      if (totalStockMap[mName] !== undefined) return totalStockMap[mName];
      return Number(matched.current_stock || 0);
    }
    return 0;
  };

  const getItemWarehouseStock = (productName: string, warehouseName: string, itemCode?: string): number => {
    if (!productName || !warehouseName) return 0;
    return getWarehouseAvailableStock(productName, warehouseName, stockDataset, itemCode);
  };

  const getVendorBoughtProducts = (vendorName: string) => {
    const vTrim = (vendorName || '').trim().toLowerCase();
    if (!vTrim) return [];

    const matchedPurchases = purchaseOrdersList.filter(p => {
      const sName = (p.supplier_name || p.vendor_name || '').trim().toLowerCase();
      return sName === vTrim || sName.includes(vTrim) || vTrim.includes(sName);
    });

    if (selectedPoNo && selectedPoObj && selectedPoObj.items) {
      return (selectedPoObj.items || []).map((item: any) => {
        const pName = item.itemName || item.product_name || '';
        const matchingProd = productList.find(p => (p.product_name || '').toLowerCase() === pName.toLowerCase());
        return {
          id: matchingProd?.id || pName,
          product_name: pName,
          item_sr_no: item.sku || matchingProd?.item_sr_no || matchingProd?.sku || '',
          purchase_price: Number(item.rate || item.cost_price || matchingProd?.purchase_price || 0),
          uom: item.uom || matchingProd?.uom || 'Nos',
          totalBoughtQty: Number(item.qty || item.quantity || 0),
          lastPoNo: selectedPoNo,
          current_stock: matchingProd?.current_stock || 0
        };
      });
    }

    const prodMap: Record<string, any> = {};
    matchedPurchases.forEach(pur => {
      (pur.items || []).forEach((item: any) => {
        const pName = item.itemName || item.product_name || '';
        if (!pName) return;
        const key = pName.toLowerCase();
        const matchingProd = productList.find(p => (p.product_name || '').toLowerCase() === key);
        const qty = Number(item.qty || item.quantity || 0);
        const price = Number(item.rate || item.cost_price || 0);

        if (!prodMap[key]) {
          prodMap[key] = {
            id: matchingProd?.id || pName,
            product_name: pName,
            item_sr_no: item.sku || matchingProd?.item_sr_no || matchingProd?.sku || '',
            purchase_price: price || Number(matchingProd?.purchase_price || 0),
            uom: item.uom || matchingProd?.uom || 'Nos',
            totalBoughtQty: qty,
            lastPoNo: pur.purchase_no,
            current_stock: matchingProd?.current_stock || 0
          };
        } else {
          prodMap[key].totalBoughtQty += qty;
          if (price > 0) prodMap[key].purchase_price = price;
        }
      });
    });

    return Object.values(prodMap);
  };

  const handleTileReturnProductSelection = (
    selectedProduct: any,
    tIdx: number,
    chosenWarehouse: string,
    setFieldValue: any,
    currentTileItem?: any
  ) => handleTileReturnProductSelectionHelper(selectedProduct, tIdx, chosenWarehouse, setFieldValue, locations, currentTileItem);

  const handleTileItemChange = (
    tIdx: number,
    field: any,
    val: any,
    tileItems: any[],
    setFieldValue: any
  ) => handleTileItemChangeHelper(tIdx, field, val, tileItems, setFieldValue);

  const parsePurchaseItems = (p: any, defaultWarehouse?: string) =>
    parsePurchaseItemsForReturn(p, defaultWarehouse || locations[0]?.name || 'Central Warehouse A', productList, locations);

  const validationSchema = useMemo(() =>
    createPurchaseReturnValidationSchema(workflowSettings, editData, productList),
    [workflowSettings, editData, productList]
  );

  const initialValues = useMemo(() => {
    if (isEditMode && editData) {
      return {
        returnNo: editData.return_no || defaultReturnNo,
        gatePasses: editData.metadata?.gatePasses || parseGatePasses(editData.gate_pass_no || editData.return_no, editData.source_warehouse),
        vendorName: editData.vendor_name || '',
        sourceWarehouse: editData.source_warehouse || (locations[0]?.name || 'Main Warehouse'),
        purchaseNo: editData.purchase_no || editData.original_purchase_no || editData.metadata?.linkedPurchaseNo || '',
        returnDate: editData.return_date || new Date().toISOString().split('T')[0],
        paymentTerm: editData.payment_term || (editData.metadata?.cashAmount && editData.metadata?.bankAmount ? 'Split' : 'By Cash'),
        selectedBankId: editData.metadata?.selectedBankId || '',
        amountPaid: editData.amount_paid || 0,
        cashAmountPaid: editData.metadata?.cashAmount || '',
        bankAmountPaid: editData.metadata?.bankAmount || '',
        remarks: editData.remarks || '',
        showTileSection: Boolean((Array.isArray(editData.metadata?.tile_items) && editData.metadata.tile_items.length > 0) || (Array.isArray(editData.tile_items) && editData.tile_items.length > 0) || editData.metadata?.showTileSection),
        tileItems: (Array.isArray(editData.metadata?.tile_items) && editData.metadata.tile_items.length > 0)
          ? editData.metadata.tile_items
          : (Array.isArray(editData.tile_items) && editData.tile_items.length > 0)
            ? editData.tile_items
            : [],
        items: ((editData.items || []).filter((i: any) => !i.isTileItem).length > 0
          ? (editData.items || []).filter((i: any) => !i.isTileItem)
          : [{
            skuCode: '',
            itemName: '',
            warehouse: editData.source_warehouse || (locations[0]?.name || 'Main Warehouse'),
            qty: 1,
            rate: 0,
            uom: 'Nos',
            discountPer: 0,
            discountAmt: 0
          }]).map((i: any) => ({
          skuCode: i.sku || i.skuCode || '',
          itemName: i.itemName || i.product_name || '',
          warehouse: i.warehouse || editData.source_warehouse || (locations[0]?.name || 'Main Warehouse'),
          qty: Number(i.qty || i.quantity || 1),
          rate: Number(i.rate || i.cost_price || 0),
          uom: i.uom || 'Nos',
          discountPer: Number(i.discountPer || i.discount_per || 0),
          discountAmt: Number(i.discountAmt || i.discount_amt || 0)
        }))
      };
    }

    return {
      returnNo: defaultReturnNo,
      gatePasses: {} as Record<string, string>,
      vendorName: '',
      sourceWarehouse: locations.length > 0 ? locations[0].name : 'Main Warehouse',
      purchaseNo: '',
      returnDate: new Date().toISOString().split('T')[0],
      paymentTerm: 'On Credit',
      selectedBankId: '',
      amountPaid: 0,
      cashAmountPaid: '',
      bankAmountPaid: '',
      remarks: '',
      showTileSection: false,
      tileItems: [],
      items: [{
        skuCode: '',
        itemName: '',
        warehouse: locations.length > 0 ? locations[0].name : 'Main Warehouse',
        qty: 1,
        rate: 0,
        uom: 'Nos'
      }]
    };
  }, [isEditMode, editData, defaultReturnNo, locations]);

  if (metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full text-xs text-black dark:text-bodydark">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-black dark:text-white text-base">
              {isEditMode ? 'Modify Purchase Return (Debit Note)' : 'Create Outbound Purchase Return (Debit Note)'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Return damaged or excess inventory to wholesale supplier and generate balanced debit note credit line
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return/List`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stroke rounded dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition cursor-pointer text-primary"
          >
            <MdArrowBack size={15} /> Back to Log Registry
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          enableReinitialize={isEditMode}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            if (!values.vendorName) {
              toast.error('Validation Error: Please select a wholesale vendor first!');
              return;
            }
            if (!values.sourceWarehouse) {
              toast.error('Validation Error: Please select the source warehouse location!');
              return;
            }

            await handleSubmitPurchaseReturn({
              values,
              isEditMode,
              editData,
              locations,
              productList,
              vendors,
              bankAccountsList,
              tenantId,
              shouldPrintAfterSave,
              defaultReturnNo,
              selectedPoNo,
              navigate,
              setLoading
            });
          }}
        >
          {({ handleChange, values, setFieldValue, errors, touched, handleSubmit }) => {
            let totalItemGross = 0;
            let totalDiscount = 0;
            (values.items || []).forEach((i: any) => {
              const g = Number(i.qty || 0) * Number(i.rate || 0);
              totalItemGross += g;
              totalDiscount += Number(i.discountAmt || 0);
            });

            const tileTotalSum = values.showTileSection
              ? (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0)
              : 0;

            const grossTotal = totalItemGross + tileTotalSum;
            const totalReturnNet = Math.max(0, grossTotal - totalDiscount);
            const taxAmt = 0;

            const currentLiquidRefund = Number(values.amountPaid || 0);
            const netCreditLineDebt = Math.max(0, totalReturnNet - currentLiquidRefund);

            const activeVendor = (values.vendorName || vendorSearchQuery || '').trim();
            const boughtProducts = getVendorBoughtProducts(activeVendor);

            const getMaxReturnable = (itemName: string, skuCode?: string) => {
              if (!activeVendor || !itemName) return null;
              const pLower = (itemName || '').trim().toLowerCase();
              const sLower = (skuCode || '').trim().toLowerCase();

              if (selectedPoNo && selectedPoObj) {
                const poItem = (selectedPoObj.items || []).find((it: any) =>
                  (it.itemName || it.product_name || '').trim().toLowerCase() === pLower ||
                  (sLower && (it.sku || it.skuCode || '').trim().toLowerCase() === sLower)
                );
                if (!poItem) return 0;
                const matchedP = productList.find(p => (p.product_name || '').toLowerCase() === pLower);
                const rawPcs = Number(matchedP?.pieces_per_box ?? matchedP?.pcs_per_box ?? 4) || 4;
                const isTile = Boolean(matchedP && (String(matchedP.category || '').toLowerCase().includes('tile') || String(matchedP.scenario_name || '').toLowerCase().includes('tile')));
                const pcsPerBox = isTile ? rawPcs : 1;

                let billedQty = Number(poItem.qty || poItem.quantity || 0);
                let alreadyReturned = 0;
                (pastPurchaseReturnsList || []).forEach(rtn => {
                  if (editData && String(rtn.id) === String(editData.id)) return;
                  const rPo = rtn.purchase_no || rtn.original_purchase_no || rtn.metadata?.linkedPurchaseNo;
                  if (String(rPo || '').trim().toLowerCase() !== String(selectedPoNo).trim().toLowerCase()) return;
                  (rtn.items || []).forEach((rit: any) => {
                    if ((rit.itemName || rit.product_name || '').trim().toLowerCase() === pLower) {
                      alreadyReturned += Number(rit.qty || rit.quantity || 0);
                    }
                  });
                  if (Array.isArray(rtn.metadata?.tile_items)) {
                    rtn.metadata.tile_items.forEach((t: any) => {
                      if ((t.itemName || t.product_name || '').trim().toLowerCase() === pLower) {
                        alreadyReturned += Number(t.boxQty || 0) + (Number(t.loosePcs || 0) / pcsPerBox);
                      }
                    });
                  }
                });

                return Math.max(0, billedQty - alreadyReturned);
              }

              const boughtProd = boughtProducts.find((p: any) =>
                (p.product_name || '').trim().toLowerCase() === pLower ||
                (sLower && (p.item_sr_no || '').trim().toLowerCase() === sLower)
              );
              if (!boughtProd) return 0;

              const matchedP = productList.find(p => (p.product_name || '').toLowerCase() === pLower);
              const rawPcs = Number(matchedP?.pieces_per_box ?? matchedP?.pcs_per_box ?? 4) || 4;
              const isTile = Boolean(matchedP && (String(matchedP.category || '').toLowerCase().includes('tile') || String(matchedP.scenario_name || '').toLowerCase().includes('tile')));
              const pcsPerBox = isTile ? rawPcs : 1;

              let totalLifetimeBought = Number(boughtProd.totalBoughtQty || 0);
              let alreadyReturned = 0;
              (pastPurchaseReturnsList || []).forEach(rtn => {
                if (editData && String(rtn.id) === String(editData.id)) return;
                if ((rtn.vendor_name || '').trim().toLowerCase() !== activeVendor.toLowerCase()) return;
                (rtn.items || []).forEach((rit: any) => {
                  if ((rit.itemName || rit.product_name || '').trim().toLowerCase() === pLower) {
                    alreadyReturned += Number(rit.qty || rit.quantity || 0);
                  }
                });
                if (Array.isArray(rtn.metadata?.tile_items)) {
                  rtn.metadata.tile_items.forEach((t: any) => {
                    if ((t.itemName || t.product_name || '').trim().toLowerCase() === pLower) {
                      alreadyReturned += Number(t.boxQty || 0) + (Number(t.loosePcs || 0) / pcsPerBox);
                    }
                  });
                }
              });

              return Math.max(0, totalLifetimeBought - alreadyReturned);
            };

            const exceededBillItems: string[] = [];
            (values.items || []).forEach((it: any) => {
              if (!it.itemName) return;
              const maxRet = getMaxReturnable(it.itemName, it.skuCode);
              if (maxRet !== null) {
                const q = Number(it.qty || 0);
                if (q > maxRet + 0.0001) exceededBillItems.push(it.itemName);
              }
            });

            if (values.showTileSection && Array.isArray(values.tileItems)) {
              values.tileItems.forEach((t: any) => {
                if (!t.itemName) return;
                const maxRet = getMaxReturnable(t.itemName, t.skuCode);
                if (maxRet !== null) {
                  const matchedTileProd = productList.find(p => (p.product_name || '').toLowerCase() === (t.itemName || '').toLowerCase());
                  const rawPcs = Number(matchedTileProd?.pieces_per_box ?? matchedTileProd?.pcs_per_box ?? 4) || 4;
                  const pcsPerBox = rawPcs > 0 ? rawPcs : 4;
                  const enteredBoxes = Number(t.boxQty || 0) + (Number(t.loosePcs || 0) / pcsPerBox);
                  if (enteredBoxes > maxRet + 0.0001) exceededBillItems.push(t.itemName);
                }
              });
            }

            const hasBillExceeded = exceededBillItems.length > 0;

            const handleProductSelection = (p: any, rowIndex: number) => {
              const displaySku = p.item_sr_no || p.sku || `SKU-${p.id || ''}`;
              const price = Number(p.purchase_price ?? p.cost_price ?? p.rate ?? 0);
              const uom = p.uom || 'Nos';

              const updatedItems = [...values.items];
              const cur = updatedItems[rowIndex] || {};
              updatedItems[rowIndex] = {
                ...cur,
                skuCode: displaySku,
                itemName: p.product_name,
                rate: price,
                uom: uom
              };

              setFieldValue('items', updatedItems);
            };

            const uniqueReturnWarehouses = Array.from(new Set([
              ...(values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0).map((i: any) => (i.warehouse || '').trim()),
              ...(values.showTileSection && Array.isArray(values.tileItems)
                ? values.tileItems.filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0)).map((t: any) => (t.warehouse || values.sourceWarehouse || '').trim())
                : [])
            ].filter(Boolean)));

            const uniqueManualReturnWarehouses = uniqueReturnWarehouses.filter(wh => {
              const requiredLocs = workflowSettings?.manual_challan_locations_purchase_return || [];
              const isSettingOn = Boolean(workflowSettings?.require_manual_challan_purchase_return);
              const status = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.sourceWarehouse, productList);
              if (status.hasExistingSlip) return true;
              if (isSettingOn && requiredLocs.includes(wh)) {
                if (!editData) return true;
                return status.isNewOrIncreased;
              }
              return false;
            });

            return (
              <Form className="p-6.5 space-y-6">
                <ReturnHeader
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  isEditMode={isEditMode}
                  defaultReturnNo={defaultReturnNo}
                  vendorSearchQuery={vendorSearchQuery}
                  setVendorSearchQuery={setVendorSearchQuery}
                  filteredVendors={filteredVendors}
                  isVendorDropdownOpen={isVendorDropdownOpen}
                  setIsVendorDropdownOpen={setIsVendorDropdownOpen}
                  highlightedVendorIndex={highlightedVendorIndex}
                  setHighlightedVendorIndex={setHighlightedVendorIndex}
                  vendorContainerRef={vendorContainerRef}
                  poSearchQuery={poSearchQuery}
                  setPoSearchQuery={setPoSearchQuery}
                  filteredPurchases={filteredPurchases}
                  isPoDropdownOpen={isPoDropdownOpen}
                  setIsPoDropdownOpen={setIsPoDropdownOpen}
                  highlightedPoIndex={highlightedPoIndex}
                  setHighlightedPoIndex={setHighlightedPoIndex}
                  poContainerRef={poContainerRef}
                  selectedPoNo={selectedPoNo}
                  setSelectedPoNo={setSelectedPoNo}
                  setSelectedPoObj={setSelectedPoObj}
                  parsePurchaseItemsForReturn={parsePurchaseItems}
                  locations={locations}
                />

                <ReturnStandardItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  productList={productList}
                  boughtProducts={boughtProducts}
                  locations={locations}
                  workflowSettings={workflowSettings}
                  getItemWarehouseStock={getItemWarehouseStock}
                  getProductOverallStock={getProductOverallStock}
                  handleProductSelection={handleProductSelection}
                  blockInvalidChar={blockInvalidChar}
                  formatMoney={formatMoney}
                  formatStockWithBoxesAndPcs={formatStockWithBoxesAndPcs}
                  getMaxReturnable={getMaxReturnable}
                  selectedPoNo={selectedPoNo}
                />

                <ReturnTileItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  productList={productList}
                  boughtProducts={boughtProducts}
                  locations={locations}
                  workflowSettings={workflowSettings}
                  getItemWarehouseStock={getItemWarehouseStock}
                  getProductOverallStock={getProductOverallStock}
                  handleTileReturnProductSelection={handleTileReturnProductSelection}
                  handleTileItemChange={handleTileItemChange}
                  blockInvalidChar={blockInvalidChar}
                  formatMoney={formatMoney}
                  formatStockWithBoxesAndPcs={formatStockWithBoxesAndPcs}
                  isTileProduct={isTileProduct}
                  getMaxReturnable={getMaxReturnable}
                  selectedPoNo={selectedPoNo}
                />

                <ReturnChallanSection
                  values={values}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  workflowSettings={workflowSettings}
                  uniqueManualReturnWarehouses={uniqueManualReturnWarehouses}
                />

                {(() => {
                  const isNegativeStockBlocked = workflowSettings?.allow_negative_stock === false;
                  const exceedingStandardItems: string[] = [];
                  if (isNegativeStockBlocked) {
                    (values.items || []).forEach((it: any) => {
                      if (!it.itemName || !it.warehouse) return;
                      const curWhStock = getItemWarehouseStock(it.itemName, it.warehouse, it.skuCode);
                      const q = Number(it.qty || 0);
                      if (q > 0 && q > curWhStock + 0.0001) {
                        exceedingStandardItems.push(it.itemName);
                      }
                    });
                  }

                  const exceedingTileItems: string[] = [];
                  if (isNegativeStockBlocked && values.showTileSection) {
                    (values.tileItems || []).forEach((t: any) => {
                      if (!t.itemName) return;
                      const wh = t.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse');
                      if (!wh) return;
                      const matchedTileProd = productList.find((p: any) => p.product_name === t.itemName || p.item_sr_no === t.skuCode);
                      const tRawPcs = Number(matchedTileProd?.pieces_per_box ?? matchedTileProd?.pcs_per_box ?? 4);
                      const tPcsPerBox = tRawPcs > 0 ? tRawPcs : 4;
                      const totalEnteredBoxes = Number(t.boxQty || 0) + Number(t.loosePcs || 0) / tPcsPerBox;
                      const curWhStock = getItemWarehouseStock(t.itemName, wh, t.skuCode);
                      if (totalEnteredBoxes > 0 && totalEnteredBoxes > curWhStock + 0.0001) {
                        exceedingTileItems.push(t.itemName);
                      }
                    });
                  }

                  const negativeStockBlockedItems = [...new Set([...exceedingStandardItems, ...exceedingTileItems])];
                  const hasStockExceeded = negativeStockBlockedItems.length > 0;

                  return (
                    <ReturnSummaryFooter
                      values={values}
                      handleChange={handleChange}
                      setFieldValue={setFieldValue}
                      formatMoney={formatMoney}
                      grossTotal={grossTotal}
                      totalDiscount={totalDiscount}
                      taxAmt={taxAmt}
                      totalReturnNet={totalReturnNet}
                      currentLiquidRefund={currentLiquidRefund}
                      netCreditLineDebt={netCreditLineDebt}
                      loading={loading}
                      isEditMode={isEditMode}
                      navigate={navigate}
                      tenantId={tenantId}
                      hasStockExceeded={hasStockExceeded}
                      negativeStockBlockedItems={negativeStockBlockedItems}
                      hasBillExceeded={hasBillExceeded}
                      exceededBillItems={exceededBillItems}
                      selectedPoNo={selectedPoNo}
                      setShouldPrintAfterSave={setShouldPrintAfterSave}
                      handleSubmit={handleSubmit}
                      toast={toast}
                    />
                  );
                })()}
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default AddPurchaseReturn;
