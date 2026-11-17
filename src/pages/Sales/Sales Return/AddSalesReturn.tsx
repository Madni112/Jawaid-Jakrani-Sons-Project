import React, { useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { MdReceipt, MdArrowBack } from 'react-icons/md';
import { getWarehouseDispatchStatus } from '../../../utils/locationUtils';
import { formatStockWithBoxesAndPcs, getWarehouseAvailableStock } from '../../../utils/stockCalculator';

// Subcomponents
import SalesReturnHeader from './components/SalesReturnHeader';
import SalesReturnStandardItemsTable from './components/SalesReturnStandardItemsTable';
import SalesReturnTileItemsTable from './components/SalesReturnTileItemsTable';
import SalesReturnChallanSection from './components/SalesReturnChallanSection';
import SalesReturnSummaryFooter from './components/SalesReturnSummaryFooter';

// Hooks, Utils & Services
import { useSalesReturnMetadata } from './hooks/useSalesReturnMetadata';
import { handleSubmitSalesReturn } from './services/salesReturnSubmitService';
import {
  parseGatePasses,
  isTileProduct,
  formatMoney,
  blockInvalidChar,
  createSalesReturnValidationSchema,
  handleTileReturnProductSelectionHelper,
  handleTileItemChangeHelper
} from './utils/salesReturnHelpers';

const AddSalesReturn: React.FC = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams<{ id?: string }>();

  const rawStateData = location.state?.returnData ||
                       location.state?.editData ||
                       location.state?.returnRecord ||
                       location.state?.invoice ||
                       location.state?.item ||
                       location.state?.record;

  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);

  // UI state for dropdowns
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);
  const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);
  const [highlightedInvIndex, setHighlightedInvIndex] = useState(0);

  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [highlightedSkuIndex, setHighlightedSkuIndex] = useState(0);
  const [activeProdNameIndex, setActiveProdNameIndex] = useState<number | null>(null);
  const [highlightedProdNameIndex, setHighlightedProdNameIndex] = useState(0);

  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState<number>(0);
  const [activeTileWhIndex, setActiveTileWhIndex] = useState<number | null>(null);

  const customerContainerRef = useRef<HTMLDivElement>(null);
  const invContainerRef = useRef<HTMLDivElement>(null);

  const {
    loading,
    setLoading,
    metadataLoading,
    customers,
    locations,
    productList,
    bankAccountsList,
    salesInvoicesList,
    salesReturnsList,
    workflowSettings,
    stockDataset,
    editData,
    isEditMode,
    defaultReturnNo,
    customerSearchQuery,
    setCustomerSearchQuery,
    invSearchQuery,
    setInvSearchQuery,
    selectedInvNo,
    setSelectedInvNo,
    selectedInvObj,
    setSelectedInvObj,
    filteredCustomers,
    filteredInvoices
  } = useSalesReturnMetadata(routeId, rawStateData, location.search);

  const getProductOverallStock = (p: any): number => {
    if (!p) return 0;
    const name = (p.product_name || p.itemName || '').trim().toLowerCase();
    const matched = productList.find(pr =>
      (name && pr.product_name && pr.product_name.toLowerCase() === name) ||
      (p.item_sr_no && (pr.item_sr_no === p.item_sr_no || pr.sku === p.item_sr_no))
    );
    if (matched) return Number(matched.current_stock || 0);
    return Number(p.current_stock || 0);
  };

  const getItemWarehouseStock = (productName: string, warehouseName: string, skuCode?: string): number => {
    if (!productName || !warehouseName) return 0;
    const raw = getWarehouseAvailableStock(productName, warehouseName, stockDataset, skuCode);
    return Math.abs(raw) < 0.0001 ? 0 : Number(raw.toFixed(4));
  };

  const getCustomerSoldProducts = (custName: string) => {
    const cTrim = (custName || '').trim().toLowerCase();
    if (!cTrim) return [];

    const matchedInvoices = salesInvoicesList.filter(inv => {
      const name = (inv.customer_name || '').trim().toLowerCase();
      return name === cTrim || name.includes(cTrim) || cTrim.includes(name);
    });

    if (selectedInvNo && selectedInvObj && selectedInvObj.items) {
      return (selectedInvObj.items || []).map((item: any) => {
        const pName = item.itemName || item.product_name || '';
        const itemSku = item.sku || item.skuCode || '';
        const matchingProd = productList.find(p =>
          (p.product_name || '').toLowerCase() === pName.toLowerCase() ||
          (itemSku && (p.item_sr_no || '').toLowerCase() === itemSku.toLowerCase())
        );
        const effectivePrice = Number(item.rp ?? item.rate ?? item.sale_price ?? item.price ?? matchingProd?.retail_price ?? matchingProd?.sales_price ?? matchingProd?.price ?? 0);

        return {
          ...matchingProd,
          id: matchingProd?.id || pName,
          product_name: pName,
          item_sr_no: itemSku || matchingProd?.item_sr_no || matchingProd?.sku || '',
          sale_price: effectivePrice,
          uom: item.uom || matchingProd?.uom || 'Nos',
          totalSoldQty: Number(item.qty || item.quantity || 0),
          lastInvNo: selectedInvNo,
          current_stock: matchingProd?.current_stock || 0
        };
      });
    }

    const prodMap: Record<string, any> = {};
    matchedInvoices.forEach(inv => {
      (inv.items || []).forEach((item: any) => {
        const pName = item.itemName || item.product_name || '';
        if (!pName) return;
        const key = pName.toLowerCase();
        const itemSku = item.sku || item.skuCode || '';
        const matchingProd = productList.find(p =>
          (p.product_name || '').toLowerCase() === key ||
          (itemSku && (p.item_sr_no || '').toLowerCase() === itemSku.toLowerCase())
        );
        const qty = Number(item.qty || item.quantity || 0);
        const price = Number(item.rp ?? item.rate ?? item.sale_price ?? item.price ?? matchingProd?.retail_price ?? matchingProd?.sales_price ?? matchingProd?.price ?? 0);

        if (!prodMap[key]) {
          prodMap[key] = {
            ...matchingProd,
            id: matchingProd?.id || pName,
            product_name: pName,
            item_sr_no: itemSku || matchingProd?.item_sr_no || matchingProd?.sku || '',
            sale_price: price,
            uom: item.uom || matchingProd?.uom || 'Nos',
            totalSoldQty: qty,
            lastInvNo: inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`,
            current_stock: matchingProd?.current_stock || 0
          };
        } else {
          prodMap[key].totalSoldQty += qty;
          if (price > 0) prodMap[key].sale_price = price;
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

  const validationSchema = useMemo(() =>
    createSalesReturnValidationSchema(workflowSettings, editData, productList),
    [workflowSettings, editData, productList]
  );

  const initialValues = useMemo(() => {
    if (isEditMode && editData) {
      return {
        returnNo: (editData.return_no && !editData.return_no.match(/^RTN-\d{6}$/)) ? editData.return_no : (defaultReturnNo || `RTN-${String(editData.id || 1).padStart(4, '0')}`),
        customerName: editData.customer_name || '',
        sourceWarehouse: editData.warehouse_name || editData.source_warehouse || (locations[0]?.name || 'Main Warehouse'),
        invoiceNo: editData.original_invoice_no || editData.invoice_no || editData.metadata?.linkedInvoiceNo || '',
        gatePassNo: editData.gate_pass_no || '',
        gatePasses: editData.metadata?.gatePasses || parseGatePasses(editData.gate_pass_no, editData.warehouse_name || editData.source_warehouse),
        returnDate: editData.return_date || (editData.created_at ? editData.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        paymentTerm: (() => {
          if (editData.payment_term) return editData.payment_term;
          if (editData.metadata?.settlementMode) return editData.metadata.settlementMode;
          if (editData.settlement_mode) {
            if (editData.settlement_mode === 'Cash') return 'By Cash';
            if (editData.settlement_mode === 'Bank') return 'By Bank';
            if (editData.settlement_mode === 'Split') return 'Split';
            return editData.settlement_mode;
          }
          return 'On Credit';
        })(),
        selectedBankId: editData.bank_name || editData.metadata?.selectedBankId || '',
        amountPaid: Number(editData.payout_amount_paid ?? editData.amount_paid ?? 0),
        cashAmountPaid: editData.cash_amount_paid ?? (editData.metadata?.cashPayoutPaid || ''),
        bankAmountPaid: editData.bank_amount ?? (editData.metadata?.bankPayoutPaid || ''),
        remarks: editData.remarks || '',
        ...(() => {
          const rawItems = Array.isArray(editData.items)
            ? editData.items
            : (typeof editData.items === 'string' ? JSON.parse(editData.items || '[]') : []);
          const rawTileItems = Array.isArray(editData.tile_items)
            ? editData.tile_items
            : (typeof editData.tile_items === 'string' ? JSON.parse(editData.tile_items || '[]') : []);

          const isTile = (item: any) => {
            if (item.isTileItem) return true;
            const matched = productList.find(pr =>
              (item.itemName && pr.product_name && pr.product_name.toLowerCase() === item.itemName.toLowerCase()) ||
              (item.product_name && pr.product_name && pr.product_name.toLowerCase() === item.product_name.toLowerCase()) ||
              (item.skuCode && pr.item_sr_no && pr.item_sr_no.toLowerCase() === item.skuCode.toLowerCase()) ||
              (item.sku && pr.item_sr_no && pr.item_sr_no.toLowerCase() === item.sku.toLowerCase())
            );
            return isTileProduct(matched || item);
          };

          const migratedTileItems = [
            ...rawTileItems,
            ...rawItems.filter((i: any) => isTile(i)).map((i: any, tIdx: number) => {
              const matched = productList.find(pr =>
                (i.itemName && pr.product_name && pr.product_name.toLowerCase() === i.itemName.toLowerCase()) ||
                (i.product_name && pr.product_name && pr.product_name.toLowerCase() === i.product_name.toLowerCase()) ||
                (i.skuCode && pr.item_sr_no && pr.item_sr_no.toLowerCase() === i.skuCode.toLowerCase()) ||
                (i.sku && pr.item_sr_no && pr.item_sr_no.toLowerCase() === i.sku.toLowerCase())
              );
              const ppb = Number(i.pcsPerBox || matched?.loose_conversion_ratio || matched?.pieces_per_box || matched?.pcs_per_box || 4) || 4;
              const currentQty = Number(i.qty || i.quantity || 0);
              const boxes = Math.floor(currentQty);
              const loose = Math.round((currentQty - boxes) * ppb);
              const rate = Number(i.rate || i.sale_price || i.price || 0);
              return {
                id: i.id || Date.now() + tIdx,
                itemName: i.itemName || i.product_name || '',
                skuCode: i.sku || i.skuCode || '',
                warehouse: i.warehouse || editData.dispatch_warehouse || (locations[0]?.name || 'Main Warehouse'),
                boxQty: boxes,
                loosePcs: loose,
                pricePerBox: rate,
                pricePerSqm: Number(i.pricePerSqm || 0),
                pricePerPiece: Number(i.pricePerPiece || (ppb > 0 ? rate / ppb : 0)),
                totalAmount: Number(i.amount || (rate * currentQty) || 0),
                totalSqm: Number(i.totalSqm || 0),
                isTileItem: true
              };
            })
          ];

          const standardItems = rawItems.filter((i: any) => !isTile(i)).map((i: any) => ({
            skuCode: i.sku || i.skuCode || '',
            itemName: i.itemName || i.product_name || '',
            warehouse: i.warehouse || editData.dispatch_warehouse || (locations[0]?.name || 'Main Warehouse'),
            qty: Number(i.qty || i.quantity || 1),
            rate: Number(i.rate || i.sale_price || i.price || 0),
            uom: i.uom || 'Nos'
          }));

          return {
            showTileSection: migratedTileItems.length > 0,
            tileItems: migratedTileItems,
            items: standardItems.length > 0 ? standardItems : [{
              skuCode: '',
              itemName: '',
              warehouse: editData.dispatch_warehouse || (locations[0]?.name || 'Main Warehouse'),
              qty: 1,
              rate: 0,
              uom: 'Nos'
            }]
          };
        })()
      };
    }

    return {
      returnNo: defaultReturnNo || 'RTN-0001',
      customerName: '',
      sourceWarehouse: locations[0]?.name || 'Main Warehouse',
      invoiceNo: '',
      gatePassNo: '',
      gatePasses: {} as Record<string, string>,
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
        warehouse: locations[0]?.name || 'Main Warehouse',
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
    <div className="mx-auto max-w-full text-xs text-slate-800 dark:text-slate-200 antialiased font-sans">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white shadow-xs dark:bg-boxdark mb-6 p-5">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MdReceipt className="text-emerald-600" size={24} />
              {isEditMode ? 'Modify Sales Return (Credit Note)' : 'Compile Sales Return Note (Credit Slip)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Return items from customer and automatically deduct chronologically across customer sales invoices (FIFO)
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/List`)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
          >
            <MdArrowBack size={16} /> Back to Return Registry
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            if (!values.customerName) {
              toast.error('Validation Error: Please select a customer first!');
              return;
            }
            if (!values.sourceWarehouse) {
              toast.error('Validation Error: Please select the receiving warehouse location!');
              return;
            }

            await handleSubmitSalesReturn({
              values,
              isEditMode,
              editData,
              locations,
              productList,
              customers,
              bankAccountsList,
              tenantId,
              shouldPrintAfterSave,
              defaultReturnNo,
              selectedInvNo,
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

            const overallGrossTotal = totalItemGross + tileTotalSum;
            const netReturnTotal = Math.max(0, overallGrossTotal - totalDiscount);
            const netCashRefundDisbursed = Number(values.amountPaid || 0);
            const isExchangeReturn = values.paymentTerm === 'Exchange On Invoice' || values.paymentTerm === 'Exchange & Cash Refund';
            const exchangeInvoiceTotal = Number(selectedInvObj?.total_amount || 0);
            const totalDiscountDeducted = totalDiscount;

            const activeCustomer = (values.customerName || customerSearchQuery || '').trim();
            const customerSoldProducts = getCustomerSoldProducts(activeCustomer);

            const getMaxReturnable = (itemName: string, skuCode?: string) => {
              if (!activeCustomer || !itemName) return null;
              const pLower = (itemName || '').trim().toLowerCase();
              const sLower = (skuCode || '').trim().toLowerCase();

              if (selectedInvNo && selectedInvObj) {
                const invItem = (selectedInvObj.items || []).find((it: any) =>
                  (it.itemName || it.product_name || '').trim().toLowerCase() === pLower ||
                  (sLower && (it.sku || it.skuCode || '').trim().toLowerCase() === sLower)
                );
                if (!invItem) return 0;
                const matchedP = productList.find(p => (p.product_name || '').toLowerCase() === pLower);
                const rawPcs = Number(matchedP?.pieces_per_box ?? matchedP?.pcs_per_box ?? 4) || 4;
                const isTile = Boolean(matchedP && (String(matchedP.category || '').toLowerCase().includes('tile') || String(matchedP.scenario_name || '').toLowerCase().includes('tile')));
                const pcsPerBox = isTile ? rawPcs : 1;

                let billedQty = Number(invItem.qty || invItem.quantity || 0);
                let alreadyReturned = 0;
                (salesReturnsList || []).forEach(rtn => {
                  if (editData && String(rtn.id) === String(editData.id)) return;
                  const rInv = rtn.original_invoice_no || rtn.invoice_no || rtn.metadata?.linkedInvoiceNo;
                  if (String(rInv || '').trim().toLowerCase() !== String(selectedInvNo).trim().toLowerCase()) return;
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

              const soldProd = customerSoldProducts.find((p: any) =>
                (p.product_name || '').trim().toLowerCase() === pLower ||
                (sLower && (p.item_sr_no || '').trim().toLowerCase() === sLower)
              );
              if (!soldProd) return 0;

              const matchedP = productList.find(p => (p.product_name || '').toLowerCase() === pLower);
              const rawPcs = Number(matchedP?.pieces_per_box ?? matchedP?.pcs_per_box ?? 4) || 4;
              const isTile = Boolean(matchedP && (String(matchedP.category || '').toLowerCase().includes('tile') || String(matchedP.scenario_name || '').toLowerCase().includes('tile')));
              const pcsPerBox = isTile ? rawPcs : 1;

              let totalLifetimeSold = Number(soldProd.totalSoldQty || 0);
              let alreadyReturned = 0;
              (salesReturnsList || []).forEach(rtn => {
                if (editData && String(rtn.id) === String(editData.id)) return;
                if ((rtn.customer_name || '').trim().toLowerCase() !== activeCustomer.toLowerCase()) return;
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

              return Math.max(0, totalLifetimeSold - alreadyReturned);
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
                  const matchedP = productList.find(p => (p.product_name || '').toLowerCase() === (t.itemName || '').toLowerCase());
                  const rawPcs = Number(matchedP?.pieces_per_box ?? matchedP?.pcs_per_box ?? 4) || 4;
                  const pcsPerBox = rawPcs > 0 ? rawPcs : 4;
                  const enteredBoxes = Number(t.boxQty || 0) + (Number(t.loosePcs || 0) / pcsPerBox);
                  if (enteredBoxes > maxRet + 0.0001) exceededBillItems.push(t.itemName);
                }
              });
            }

            const hasBillExceeded = exceededBillItems.length > 0;

            const uniqueReturnWarehouses = Array.from(new Set([
              ...(values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0).map((i: any) => (i.warehouse || '').trim()),
              ...(values.showTileSection && Array.isArray(values.tileItems)
                ? values.tileItems.filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0)).map((t: any) => (t.warehouse || values.sourceWarehouse || '').trim())
                : [])
            ].filter(Boolean)));

            const uniqueManualReturnWarehouses = uniqueReturnWarehouses.filter(wh => {
              const requiredLocs = workflowSettings?.manual_challan_locations_sales_return || [];
              const isSettingOn = Boolean(workflowSettings?.require_manual_challan_sales_return);
              const status = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.sourceWarehouse, productList);
              if (status.hasExistingSlip) return true;
              if (isSettingOn && requiredLocs.includes(wh)) {
                if (!editData) return true;
                return status.isNewOrIncreased;
              }
              return false;
            });

            return (
              <Form className="space-y-6">
                <SalesReturnHeader
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  defaultReturnNo={defaultReturnNo}
                  formatMoney={formatMoney}
                  netCashRefundDisbursed={netCashRefundDisbursed}
                  customerContainerRef={customerContainerRef}
                  invContainerRef={invContainerRef}
                  isEditMode={isEditMode}
                  filteredCustomers={filteredCustomers}
                  customerSearchQuery={customerSearchQuery}
                  setCustomerSearchQuery={setCustomerSearchQuery}
                  isCustomerDropdownOpen={isCustomerDropdownOpen}
                  setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
                  highlightedCustomerIndex={highlightedCustomerIndex}
                  setHighlightedCustomerIndex={setHighlightedCustomerIndex}
                  locations={locations}
                  selectedInvNo={selectedInvNo}
                  setSelectedInvNo={setSelectedInvNo}
                  invSearchQuery={invSearchQuery}
                  setInvSearchQuery={setInvSearchQuery}
                  isInvDropdownOpen={isInvDropdownOpen}
                  setIsInvDropdownOpen={setIsInvDropdownOpen}
                  highlightedInvIndex={highlightedInvIndex}
                  setHighlightedInvIndex={setHighlightedInvIndex}
                  filteredInvoices={filteredInvoices}
                  setSelectedInvObj={setSelectedInvObj}
                  selectedInvObj={selectedInvObj}
                  isExchangeReturn={isExchangeReturn}
                  exchangeInvoiceTotal={exchangeInvoiceTotal}
                  calculatedGrossTotal={overallGrossTotal}
                />

                <SalesReturnStandardItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  customerSoldProducts={customerSoldProducts}
                  locations={locations}
                  activeSkuIndex={activeSkuIndex}
                  setActiveSkuIndex={setActiveSkuIndex}
                  activeProdNameIndex={activeProdNameIndex}
                  setActiveProdNameIndex={setActiveProdNameIndex}
                  highlightedProdNameIndex={highlightedProdNameIndex}
                  setHighlightedProdNameIndex={setHighlightedProdNameIndex}
                  productList={productList}
                  blockInvalidChar={blockInvalidChar}
                  formatMoney={formatMoney}
                  handleChange={handleChange}
                  highlightedSkuIndex={highlightedSkuIndex}
                  setHighlightedSkuIndex={setHighlightedSkuIndex}
                  getItemWarehouseStock={getItemWarehouseStock}
                  getProductOverallStock={getProductOverallStock}
                  getMaxReturnable={getMaxReturnable}
                  selectedInvNo={selectedInvNo}
                />

                <SalesReturnTileItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  activeTileProdIndex={activeTileProdIndex}
                  setActiveTileProdIndex={setActiveTileProdIndex}
                  activeTileWhIndex={activeTileWhIndex}
                  setActiveTileWhIndex={setActiveTileWhIndex}
                  highlightedTileProdIndex={highlightedTileProdIndex}
                  setHighlightedTileProdIndex={setHighlightedTileProdIndex}
                  customerSoldProducts={customerSoldProducts}
                  productList={productList}
                  locations={locations}
                  isTileProduct={isTileProduct}
                  handleTileReturnProductSelection={handleTileReturnProductSelection}
                  handleTileItemChange={handleTileItemChange}
                  blockInvalidChar={blockInvalidChar}
                  formatMoney={formatMoney}
                  getItemWarehouseStock={getItemWarehouseStock}
                  getProductOverallStock={getProductOverallStock}
                  getMaxReturnable={getMaxReturnable}
                  selectedInvNo={selectedInvNo}
                />

                <SalesReturnChallanSection
                  values={values}
                  setFieldValue={setFieldValue}
                  uniqueManualReturnWarehouses={uniqueManualReturnWarehouses}
                  getWarehouseDispatchStatus={getWarehouseDispatchStatus}
                  editData={editData}
                  productList={productList}
                />

                <SalesReturnSummaryFooter
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  bankAccountsList={bankAccountsList}
                  netCashRefundDisbursed={netCashRefundDisbursed}
                  exchangeInvoiceTotal={exchangeInvoiceTotal}
                  netReturnTotal={netReturnTotal}
                  overallGrossTotal={overallGrossTotal}
                  tileTotalSum={tileTotalSum}
                  totalDiscountDeducted={totalDiscountDeducted}
                  isExchangeReturn={isExchangeReturn}
                  loading={loading}
                  isEditMode={isEditMode}
                  navigate={navigate}
                  tenantId={tenantId}
                  setShouldPrintAfterSave={setShouldPrintAfterSave}
                  handleSubmit={handleSubmit}
                  blockInvalidChar={blockInvalidChar}
                  formatMoney={formatMoney}
                  selectedInvNo={selectedInvNo}
                  selectedInvObj={selectedInvObj}
                  hasBillExceeded={hasBillExceeded}
                  exceededBillItems={exceededBillItems}
                />
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default AddSalesReturn;
