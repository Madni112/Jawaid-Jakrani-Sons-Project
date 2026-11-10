import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { FiTrash2, FiPlus, FiArrowLeft, FiCheckCircle, FiPrinter } from 'react-icons/fi';
import { fetchWorkflowSettings } from '../../../service/workflowSettingsService';
import { detectIsAlm } from '../../../utils/brand';

// Helper to resolve or auto-register Vendor Chart of Accounts (2010-XXXX)
const resolveVendorCoaAccount = async (vendorName: string, vendorsList: any[] = []) => {
  const cleanName = (vendorName || '').trim();
  if (!cleanName) return { code: '2010-001', title: 'Demo Vendor' };

  // 1. Match from vendorsList
  const matched = vendorsList.find(v =>
    (v.vendor_name || v.supplier_name || v.name || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  const existingCode = matched?.vendor_code || matched?.supplier_code || matched?.coa_code;
  if (existingCode && String(existingCode).startsWith('2010-')) {
    return { code: String(existingCode).trim(), title: matched.vendor_name || cleanName };
  }

  // 2. Query chart_of_accounts
  try {
    const { data: coaRows } = await supabase
      .from('chart_of_accounts')
      .select('account_code, account_title')
      .ilike('account_title', cleanName)
      .limit(1);

    if (coaRows && coaRows.length > 0 && coaRows[0].account_code) {
      return { code: coaRows[0].account_code, title: coaRows[0].account_title || cleanName };
    }

    const { data: allVendCoa } = await supabase
      .from('chart_of_accounts')
      .select('account_code')
      .ilike('account_code', '2010-%');

    let maxSeq = 0;
    (allVendCoa || []).forEach(r => {
      const match = String(r.account_code || '').match(/2010-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const nextCode = `2010-${String(maxSeq + 1).padStart(3, '0')}`;
    await supabase.from('chart_of_accounts').insert([{
      account_code: nextCode,
      account_title: cleanName,
      category_code: '2. LIABILITIES',
      sub_category_code: 'Current Liabilities',
      control_code: 'Vendor',
      notes: `Vendor account for ${cleanName} (Auto-registered from Purchase Bill)`
    }]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveVendorCoaAccount in purchases error:', err);
    return { code: '2010-001', title: cleanName };
  }
};

const AddPurchases = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [submitAction, setSubmitAction] = useState<'save' | 'print'>('save');

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [highlightedSkuIndex, setHighlightedSkuIndex] = useState<number>(0);
  const [activeProdNameIndex, setActiveProdNameIndex] = useState<number | null>(null);
  const [highlightedProdNameIndex, setHighlightedProdNameIndex] = useState<number>(0);
  const [activeTileSkuIndex, setActiveTileSkuIndex] = useState<number | null>(null);
  const [highlightedTileSkuIndex, setHighlightedTileSkuIndex] = useState<number>(0);
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState<number>(0);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState<number>(0);
  const [pendingGrns, setPendingGrns] = useState<any[]>([]);
  const [isGrnDropdownOpen, setIsGrnDropdownOpen] = useState(false);
  const [highlightedGrnIndex, setHighlightedGrnIndex] = useState(0);
  const [grnSearchTerm, setGrnSearchTerm] = useState('');

  const [defaultPurchaseNo, setDefaultPurchaseNo] = useState('');

  const location = useLocation();
  const [importedGrnData, setImportedGrnData] = useState<any>(location.state?.importGrn || null);

  const parseGrnItemsToTilesAndStandard = (
    grnItems: any[],
    products: any[],
    locs: any[]
  ) => {
    const isAlm = detectIsAlm();
    const tileItems: any[] = [];
    const standardItems: any[] = [];

    (grnItems || []).forEach((gi: any, idx: number) => {
      const prod =
        (products || []).find(
          (p: any) =>
            String(p.product_name || '').trim().toLowerCase() ===
            String(gi.product_name || '').trim().toLowerCase()
        ) ||
        (products || []).find(
          (p: any) =>
            gi.skuCode &&
            (String(p.item_sr_no || '').trim().toLowerCase() === String(gi.skuCode || '').trim().toLowerCase() ||
              `sku-${p.id}`.toLowerCase() === String(gi.skuCode || '').trim().toLowerCase())
        );

      const name = String(gi.product_name || prod?.product_name || '').toLowerCase();
      const uom = String(gi.uom || prod?.uom || '').toUpperCase();
      const desc = String(prod?.product_description || '').toLowerCase();
      const cat = String(prod?.category || '').toLowerCase();
      const sub = String(prod?.sub_category || '').toLowerCase();
      const hasTileDimensions =
        /\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?/.test(name) ||
        /\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?/.test(desc);

      const isTile =
        isTileProduct(prod) ||
        hasTileDimensions ||
        uom === 'BOX' ||
        uom === 'SQM' ||
        uom === 'SQ.M' ||
        uom === 'MTR' ||
        name.includes('tile') ||
        name.includes('matt') ||
        name.includes('gloss') ||
        name.includes('porcelain') ||
        name.includes('ceramic') ||
        name.includes('granite') ||
        cat.includes('tile') ||
        sub.includes('tile') ||
        isAlm;

      if (isTile) {
        let pcsPerBox = Number(
          prod?.pieces_per_box || prod?.pcs_per_box || prod?.pieces_per_packing || 0
        );
        if (pcsPerBox <= 1) {
          const match = String(prod?.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
          if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
          else pcsPerBox = 4;
        }

        let sqmPerBox = 1.44;
        const matchSqm = String(prod?.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
        if (matchSqm && Number(matchSqm[1]) > 0) {
          sqmPerBox = Number(matchSqm[1]);
        } else {
          const dimMatch = String(
            `${prod?.sub_category || ''} ${prod?.product_description || ''} ${prod?.item_sr_no || ''} ${gi.product_name || ''}`
          ).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
          if (dimMatch) {
            const h = Number(dimMatch[1]) || 60;
            const w = Number(dimMatch[2]) || 60;
            sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
          }
        }

        const pBox = Number(prod?.purchase_price || 0);
        const confLooseCost = Number(prod?.loose_purchase_price || 0);
        const pPiece = confLooseCost > 0 ? confLooseCost : Number((pBox / pcsPerBox).toFixed(2));
        const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));

        const totalRawQty = Number(
          gi.accepted_qty != null ? gi.accepted_qty : gi.qty != null ? gi.qty : 1
        );

        let boxQty = totalRawQty;
        let loosePcs = 0;
        if (totalRawQty % 1 !== 0 && pcsPerBox > 1) {
          boxQty = Math.floor(totalRawQty);
          const fraction = totalRawQty - boxQty;
          loosePcs = Math.round(fraction * pcsPerBox);
        }

        const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
        const lineSqm = Number(
          ((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2)
        );

        tileItems.push({
          id: `tile-${idx}-${Date.now()}`,
          itemName: gi.product_name,
          skuCode: prod?.item_sr_no || gi.skuCode || (prod ? `SKU-${prod.id}` : ''),
          warehouse: gi.warehouse_name || (locs && locs[0]?.name) || 'Main Warehouse',
          boxQty: boxQty,
          loosePcs: loosePcs,
          totalSqm: lineSqm,
          costPricePerBox: pBox,
          costPricePerPiece: pPiece,
          costPricePerSqm: pSqm,
          totalAmount: lineTotal,
          piecesPerBox: pcsPerBox,
          sqmPerBox: sqmPerBox,
        });
      } else {
        const qtyToBill = Number(gi.accepted_qty != null ? gi.accepted_qty : gi.qty || 1);
        standardItems.push({
          itemName: gi.product_name,
          skuCode: prod?.item_sr_no || '',
          qty: qtyToBill,
          rate: Number(prod?.purchase_price || 0),
          uom: gi.uom || prod?.uom || 'Nos',
          taxPercent: 0,
          warehouse: gi.warehouse_name || (locs && locs[0]?.name) || 'Main Warehouse',
          remarks: '',
          discountPer: 0,
          discountAmt: 0,
          gstRate: 18,
          gstAmt: 0,
        });
      }
    });

    return { tileItems, standardItems };
  };

  const handleApplyGrn = (
    grn: any,
    setFieldValue: any,
    productsOverride?: any[],
    locationsOverride?: any[]
  ) => {
    if (!grn) return;
    setImportedGrnData(grn);
    const prods = productsOverride || productList || [];
    const locs = locationsOverride || locations || [];

    setFieldValue('grnId', grn.id);
    if (grn.vendor_name) setFieldValue('supplierName', grn.vendor_name);
    if (grn.receipt_date) setFieldValue('purchaseDate', grn.receipt_date);
    if (grn.remarks) setFieldValue('remarks', grn.remarks);

    const { tileItems: mappedTiles, standardItems: mappedStandard } =
      parseGrnItemsToTilesAndStandard(grn.grn_items || [], prods, locs);

    if (mappedTiles.length > 0) {
      setFieldValue('showTileSection', true);
      setFieldValue('tileItems', mappedTiles);
    }

    if (mappedStandard.length > 0) {
      setFieldValue('items', mappedStandard);
    } else if (mappedTiles.length > 0) {
      setFieldValue('items', []);
    }

    const totalCount = mappedTiles.length + mappedStandard.length;
    toast.success(
      `Imported ${totalCount} items from ${grn.grn_no}! Enter prices to complete bill.`
    );
  };

  const navigate = useNavigate();
  const formikRef = React.useRef<any>(null);

  const editData = location.state?.purchaseRecord;
  const isEditMode = !!editData;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sku-container')) {
        setActiveSkuIndex(null);
      }
      if (!target.closest('.prod-name-container')) {
        setActiveProdNameIndex(null);
      }
      if (!target.closest('.vendor-search-container')) {
        setIsVendorDropdownOpen(false);
      }
      if (!target.closest('.grn-search-container')) {
        setIsGrnDropdownOpen(false);
      }
      if (!target.closest('.tile-sku-container')) {
        setActiveTileSkuIndex(null);
      }
      if (!target.closest('.tile-prod-container')) {
        setActiveTileProdIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPurchaseMetadata = async () => {
      try {
        setMetadataLoading(true);

        const [vendorRes, countRes, locRes, bankRes] = await Promise.all([
          supabase.from('vendors').select('*'),
          supabase.from('supplier_purchases').select('*', { count: 'exact', head: true }),
          supabase.from('inventory_locations').select('id, name').order('name', { ascending: true }),
          supabase.from('banks').select('id, bankName, accountTitle, accountNumber')
        ]);

        if (countRes.count !== null && countRes.count !== undefined) {
          setDefaultPurchaseNo(String((countRes.count || 0) + 1).padStart(2, '0'));
        }

        const normalizedVendors = (vendorRes.data || []).map((v: any) => ({
          id: v.id,
          vendor_name: v.vendor_name || v.name || 'Unnamed Vendor',
          contact_person: v.contact_person || v.contact || '',
          phone: v.phone || v.mobile || '',
          city: v.city || ''
        })).sort((a: any, b: any) => a.vendor_name.localeCompare(b.vendor_name));
        setSuppliers(normalizedVendors);

        const locData = locRes.data || [];
        if (locRes.data) setLocations(locRes.data);
        if (bankRes.data) setBankAccountsList(bankRes.data);

        let { data: prodData, error: prodErr } = await supabase.from('products').select('id, product_name, purchase_price, uom, item_sr_no, pieces_per_box, pcs_per_box, pieces_per_packing, category, sub_category, sub_sub_category, scenario_name, product_description, allow_loose_sales, loose_uom, loose_conversion_ratio, loose_sale_price, loose_purchase_price');
        if (prodErr && (prodErr.message?.includes('allow_loose_sales') || prodErr.code === '42703')) {
          const fallbackRes = await supabase.from('products').select('id, product_name, purchase_price, uom, item_sr_no, pieces_per_box, pcs_per_box, pieces_per_packing, category, sub_category, sub_sub_category, scenario_name, product_description');
          prodData = fallbackRes.data;
        }
        if (prodData) setProductList(prodData);

        // Fetch GRNs using separate queries to prevent PGRST200 schema foreign key error
        try {
          const [receiptsRes, itemsRes] = await Promise.all([
            supabase.from('grn_receipts').select('*').in('status', ['Confirm', 'Partially Received']).order('created_at', { ascending: false }),
            supabase.from('grn_items').select('*')
          ]);
          const itemsByGrn: Record<string, any[]> = {};
          (itemsRes.data || []).forEach((it: any) => {
            const gId = String(it.grn_id || '');
            if (!itemsByGrn[gId]) itemsByGrn[gId] = [];
            itemsByGrn[gId].push(it);
          });
          const combinedGrns = (receiptsRes.data || []).map((g: any) => ({
            ...g,
            grn_items: itemsByGrn[String(g.id)] || []
          }));
          setPendingGrns(combinedGrns);

          const importId = location.state?.importGrnId;
          const passedGrn = location.state?.importGrn;
          const matchedGrn = (passedGrn && (!importId || passedGrn.id === importId))
            ? passedGrn
            : (importId ? combinedGrns.find((g: any) => g.id === importId) : null);

          if (matchedGrn) {
            setImportedGrnData(matchedGrn);
            setTimeout(() => {
              if (formikRef.current) {
                handleApplyGrn(matchedGrn, formikRef.current.setFieldValue, prodData, locData);
              }
            }, 60);
          }
        } catch (grnErr) {
          console.warn('Error fetching GRNs:', grnErr);
        }

      } catch (err: any) {
        toast.error('Failed to load system procurement metadata lookup profiles: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchPurchaseMetadata();
  }, []);

  const validationSchema = Yup.object().shape({
    supplierName: Yup.string().required('Wholesale Vendor selection is required'),
    purchaseDate: Yup.string().required('Inbound Date is required'),
    purchaseNo: Yup.string().required('Purchase Order Ref is required'),
    settlementMode: Yup.string().required('Payment Method is required'),
    selectedBankTitle: Yup.string().when('settlementMode', {
      is: (val: string) => val === 'Bank' || val === 'Split',
      then: () => Yup.string().required('Please select a Bank account profile'),
      otherwise: () => Yup.string().nullable()
    }),
    cashAmountPaid: Yup.number().when('settlementMode', {
      is: (val: string) => val === 'Cash' || val === 'Split',
      then: () => Yup.number().typeError('Must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    bankAmountPaid: Yup.number().when('settlementMode', {
      is: (val: string) => val === 'Bank' || val === 'Split',
      then: () => Yup.number().typeError('Must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().nullable(),
        qty: Yup.number().typeError('Numeric lines only').nullable(),
        rate: Yup.number().typeError('Numeric lines only').nullable(),
        gstRate: Yup.number().min(0).nullable(),
        gstAmt: Yup.number().min(0).nullable(),
        discountPer: Yup.number().min(0).nullable(),
        discountAmt: Yup.number().min(0).nullable()
      })
    ).nullable()
  });

  const isTileProduct = (p: any) => {
    if (!p) return false;
    const cat = String(p.category || '').toLowerCase().trim();
    const sub = String(p.sub_category || '').toLowerCase().trim();
    const subsub = String(p.sub_sub_category || '').toLowerCase().trim();
    const scn = String(p.scenario_name || '').toLowerCase().trim();
    const desc = String(p.product_description || '').toLowerCase().trim();
    const name = String(p.product_name || '').toLowerCase().trim();
    return (
      subsub.includes('tile') ||
      cat.includes('tile') ||
      sub.includes('tile') ||
      scn.includes('tile') ||
      desc.includes('thickness:') ||
      desc.includes('area/box:') ||
      name.includes('tile')
    );
  };

  const handleTileProductSelection = (p: any, tIdx: number, currentTileItem: any, setFieldValue: any) => {
    let pcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || p.pieces_per_packing || 0);
    if (pcsPerBox <= 1) {
      const match = String(p.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
      if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
      else pcsPerBox = 4;
    }

    let sqmPerBox = 1.44;
    const matchSqm = String(p.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
    if (matchSqm && Number(matchSqm[1]) > 0) {
      sqmPerBox = Number(matchSqm[1]);
    } else {
      const dimMatch = String(`${p.sub_category || ''} ${p.product_description || ''} ${p.item_sr_no || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
      if (dimMatch) {
        const h = Number(dimMatch[1]) || 60;
        const w = Number(dimMatch[2]) || 60;
        sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
      }
    }

    const pBox = Number(p.purchase_price || 0);
    const confLooseCost = Number(p.loose_purchase_price || 0);
    const pPiece = confLooseCost > 0 ? confLooseCost : Number((pBox / pcsPerBox).toFixed(2));
    const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));

    const boxQty = currentTileItem?.boxQty !== undefined ? Number(currentTileItem.boxQty) : 1;
    const loosePcs = currentTileItem?.loosePcs !== undefined ? Number(currentTileItem.loosePcs) : 0;
    const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
    const lineSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));

    setFieldValue(`tileItems.${tIdx}.itemName`, p.product_name);
    setFieldValue(`tileItems.${tIdx}.skuCode`, p.item_sr_no || `SKU-${p.id}`);
    setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
    setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
    setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
    setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
    setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
    setFieldValue(`tileItems.${tIdx}.boxQty`, boxQty);
    setFieldValue(`tileItems.${tIdx}.loosePcs`, loosePcs);
    setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
    setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
    if (!currentTileItem?.warehouse) {
      setFieldValue(`tileItems.${tIdx}.warehouse`, locations[0]?.name || 'Main Warehouse');
    }
  };

  const updateTileRowCalcs = (
    field: 'boxQty' | 'loosePcs' | 'costPricePerBox' | 'costPricePerSqm' | 'costPricePerPiece',
    val: number,
    tIdx: number,
    currentTile: any,
    setFieldValue: any
  ) => {
    const pcsPerBox = Math.max(1, Number(currentTile.piecesPerBox) || 4);
    const sqmPerBox = Math.max(0.01, Number(currentTile.sqmPerBox) || 1.44);

    let boxQty = Number(field === 'boxQty' ? val : currentTile.boxQty || 0);
    let loosePcs = Number(field === 'loosePcs' ? val : currentTile.loosePcs || 0);
    let pBox = Number(field === 'costPricePerBox' ? val : currentTile.costPricePerBox || 0);
    let pSqm = Number(field === 'costPricePerSqm' ? val : currentTile.costPricePerSqm || 0);
    let pPiece = Number(field === 'costPricePerPiece' ? val : currentTile.costPricePerPiece || 0);

    if (field === 'costPricePerBox') {
      pBox = val;
      pSqm = Number((val / sqmPerBox).toFixed(2));
      pPiece = Number((val / pcsPerBox).toFixed(2));
      setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
      setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
      setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
    } else if (field === 'costPricePerSqm') {
      pSqm = val;
      pBox = Number((val * sqmPerBox).toFixed(2));
      pPiece = Number((pBox / pcsPerBox).toFixed(2));
      setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
      setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
      setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
    } else if (field === 'costPricePerPiece') {
      pPiece = val;
      pBox = Number((val * pcsPerBox).toFixed(2));
      pSqm = Number((pBox / sqmPerBox).toFixed(2));
      setFieldValue(`tileItems.${tIdx}.costPricePerBox`, pBox);
      setFieldValue(`tileItems.${tIdx}.costPricePerSqm`, pSqm);
      setFieldValue(`tileItems.${tIdx}.costPricePerPiece`, pPiece);
    } else if (field === 'boxQty') {
      boxQty = val;
      setFieldValue(`tileItems.${tIdx}.boxQty`, boxQty);
    } else if (field === 'loosePcs') {
      loosePcs = val;
      setFieldValue(`tileItems.${tIdx}.loosePcs`, loosePcs);
    }

    const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
    const lineSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
    setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
  };

  const calculatePurchaseLineTotals = (item: any, applyTax: boolean) => {
    const qty = Math.max(0, Number(item.qty) || 0);
    const rate = Math.max(0, Number(item.rate) || 0);
    const grossTotal = qty * rate;
    const discountAmt = Math.max(0, Number(item.discountAmt) || 0);
    const remainingCost = Math.max(0, grossTotal - discountAmt);

    if (!applyTax) {
      return { grossTotal, gstAmt: 0, discountAmt, netTotal: remainingCost };
    }

    const gstAmt = Math.max(0, Number(item.gstAmt) || 0);
    const netTotal = Math.max(0, remainingCost + gstAmt);

    return { grossTotal, gstAmt, discountAmt, netTotal };
  };

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  const formInitialValues = React.useMemo(() => {
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

      return {
        grnId: editData.metadata?.grn_id || editData.grn_id || null,
        purchaseNo: editData.purchase_no || '',
        supplierName: editData.supplier_name || '',
        targetWarehouse: editData.target_warehouse || '',
        purchaseDate: editData.purchase_date || new Date().toISOString().split('T')[0],
        applyTax: editData.purchase_type && editData.purchase_type !== 'No Tax',
        showDiscount: rawItems.some((i: any) => Number(i.discountAmt || i.discount_amt || 0) > 0),
        showAdditionalCharges: Number(editData.additional_charges || 0) > 0,
        additionalCharges: Number(editData.additional_charges || 0),
        settlementMode: settlementMode,
        selectedBankTitle: editData.metadata?.selectedBankTitle || editData.selected_bank_title || '',
        cashAmountPaid: Number(editData.cash_amount_paid ?? (settlementMode === 'Cash' ? editData.amount_paid : 0)),
        bankAmountPaid: Number(editData.bank_amount_paid ?? (settlementMode === 'Bank' ? editData.amount_paid : 0)),
        remarks: editData.remarks || '',
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
    const isAlm = detectIsAlm();
    const isTileInitial = Boolean(
      location.state?.isTilePurchase ||
      location.state?.importGrnId ||
      location.state?.importGrn ||
      importedGrnData ||
      isAlm
    );

    let initTileItems: any[] = [];
    let initStandardItems: any[] = [
      {
        itemName: '',
        skuCode: '',
        warehouse: locations[0]?.name || '',
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
    let initRemarks = '';
    let shouldShowTiles = isTileInitial;

    const grnSource = importedGrnData || location.state?.importGrn;
    if (grnSource) {
      initGrnId = grnSource.id || initGrnId;
      initSupplier = grnSource.vendor_name || '';
      initDate = grnSource.receipt_date || initDate;
      initRemarks = grnSource.remarks || '';

      const { tileItems: parsedTiles, standardItems: parsedStandard } =
        parseGrnItemsToTilesAndStandard(
          grnSource.grn_items || [],
          productList,
          locations
        );

      if (parsedTiles.length > 0) {
        initTileItems = parsedTiles;
        shouldShowTiles = true;
      }
      if (parsedStandard.length > 0) {
        initStandardItems = parsedStandard;
      } else if (parsedTiles.length > 0) {
        initStandardItems = [];
      }
    }

    return {
      grnId: initGrnId,
      purchaseNo: defaultPurchaseNo,
      supplierName: initSupplier,
      purchaseDate: initDate,
      applyTax: false,
      showDiscount: false,
      showAdditionalCharges: false,
      additionalCharges: 0,
      settlementMode: 'Cash',
      selectedBankTitle: '',
      cashAmountPaid: 0,
      bankAmountPaid: 0,
      remarks: initRemarks,
      showTileSection: shouldShowTiles,
      tileItems: initTileItems,
      items: initStandardItems
    };
  }, [isEditMode, editData, defaultPurchaseNo, locations, importedGrnData, productList]);

  if (loading) return <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark"><Spinner /></div>;
  if (metadataLoading) return <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl text-black dark:text-bodydark text-xs pb-12">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        {/* Header Bar */}
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-black dark:text-white text-lg tracking-tight">
              {isEditMode ? 'Modify Purchase / Inbound Stock Batch' : 'Log New Supplier Stock Purchase'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Record vendor procurement, receive physical inventory into destination warehouse & settle supplier payables</p>
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
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={async (values) => {
            try {
              setLoading(true);

              if (values.purchaseNo) {
                let query = supabase.from('supplier_purchases').select('id').eq('purchase_no', values.purchaseNo);
                if (isEditMode && editData?.id) {
                  query = query.neq('id', editData.id);
                }
                const { data: existingRecords, error: checkError } = await query;
                if (checkError) throw checkError;
                if (existingRecords && existingRecords.length > 0) {
                  toast.error('Purchase Order Ref already exists!');
                  setLoading(false);
                  return;
                }
              }

              const validStandardItems = (values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0);
              const validTileItems = values.showTileSection ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0)) : [];

              if (validStandardItems.length === 0 && validTileItems.length === 0) {
                toast.error('Please enter at least one standard item or tile item before saving.');
                setLoading(false);
                return;
              }

              const standardItemsTotal = validStandardItems.reduce((acc: any, item: any) => {
                return acc + calculatePurchaseLineTotals(item, values.applyTax).netTotal;
              }, 0);
              const tileTotalSum = validTileItems.reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
              const totalBillAmount = standardItemsTotal + tileTotalSum + Number(values.additionalCharges || 0);

              const totalPaid = (values.settlementMode === 'Cash' ? Number(values.cashAmountPaid || 0) : 0) +
                (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : 0) +
                (values.settlementMode === 'Split' ? (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)) : 0);

              // Block overpayment
              if (totalPaid > totalBillAmount + 0.01) {
                toast.error(`Overpayment detected! Total paid (Rs. ${totalPaid.toLocaleString()}) exceeds bill total (Rs. ${totalBillAmount.toLocaleString()}). Please correct the payment amount.`);
                setLoading(false);
                return;
              }

              const remainingBalance = Math.max(0, totalBillAmount - totalPaid);

              let paymentTermLabel = 'By Cash';
              if (values.settlementMode === 'Bank') paymentTermLabel = 'By Bank';
              else if (values.settlementMode === 'Split') paymentTermLabel = 'Cash & Bank Combined';

              let grnIdToUse = values.grnId || null;

              // On edit: validate new qty >= already accepted qty in GRN
              if (isEditMode) {
                const linkedGrnId = values.grnId || editData?.metadata?.grn_id || editData?.grn_id || null;
                if (linkedGrnId) {
                  const { data: existingGrnItems } = await supabase
                    .from('grn_items')
                    .select('product_name, warehouse_name, accepted_qty')
                    .eq('grn_id', linkedGrnId);

                  if (existingGrnItems && existingGrnItems.length > 0) {
                    // Group accepted quantities by product
                    const acceptedByProduct: Record<string, number> = {};
                    existingGrnItems.forEach((g: any) => {
                      const pKey = String(g.product_name || '').trim().toLowerCase();
                      const acc = Number(g.accepted_qty || 0);
                      if (acc > 0) {
                        acceptedByProduct[pKey] = (acceptedByProduct[pKey] || 0) + acc;
                      }
                    });

                    // Compare against total new quantities in values.items
                    for (const [pKey, acceptedTotal] of Object.entries(acceptedByProduct)) {
                      if (acceptedTotal <= 0) continue;
                      const newTotalForProduct = values.items
                        .filter((i: any) => String(i.itemName || '').trim().toLowerCase() === pKey)
                        .reduce((sum: number, i: any) => sum + Number(i.qty || 0), 0);

                      // Tolerance of 0.0001 for floating-point rounding
                      if (newTotalForProduct < (acceptedTotal - 0.0001)) {
                        const originalProdName = existingGrnItems.find((g: any) => String(g.product_name || '').trim().toLowerCase() === pKey)?.product_name || pKey;
                        toast.error(
                          `Cannot reduce below approved qty!\n\nProduct: "${originalProdName}"\nAlready Approved in GRN: ${acceptedTotal}\nYour New Total Qty: ${newTotalForProduct}\n\nMinimum allowed total qty is ${acceptedTotal}.`,
                          { duration: 6000 }
                        );
                        setLoading(false);
                        return;
                      }
                    }
                  }
                }
              }

              const workflowSettings = await fetchWorkflowSettings();
              const requireInward = Boolean(workflowSettings.require_inward_challan);

              const standardGrnItems = validStandardItems.map((item: any) => ({
                grn_id: grnIdToUse,
                product_name: item.itemName,
                warehouse_name: item.warehouse || values.targetWarehouse || locations[0]?.name || 'Main Warehouse',
                qty: Number(item.qty),
                uom: item.uom || 'NOS',
                accepted_qty: requireInward ? 0 : Number(item.qty),
                rejected_qty: 0,
                hold_qty: requireInward ? Number(item.qty) : 0
              }));

              const tileGrnItems = validTileItems.map((t: any) => {
                const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
                const bQty = Number(t.boxQty || 0);
                const lPcs = Number(t.loosePcs || 0);
                const totalBoxes = Number((bQty + (lPcs / ppb)).toFixed(3));
                return {
                  grn_id: grnIdToUse,
                  product_name: t.itemName,
                  warehouse_name: t.warehouse || values.targetWarehouse || locations[0]?.name || 'Main Warehouse',
                  qty: totalBoxes,
                  uom: 'BOX',
                  accepted_qty: requireInward ? 0 : totalBoxes,
                  rejected_qty: 0,
                  hold_qty: requireInward ? totalBoxes : 0
                };
              });

              const itemsToInsert = [...standardGrnItems, ...tileGrnItems];

              if (!isEditMode && !grnIdToUse) {
                // If requireInward is ON: generate a "Pending Inward" GRN with accepted_qty=0 so warehouse must verify & accept/reject/hold
                // If requireInward is OFF: generate an immediately "Confirm" GRN with full accepted_qty
                const grnStatus = requireInward ? 'Pending Inward' : 'Confirm';
                const grnRemarks = requireInward ? 'Pending Warehouse Inward Verification' : 'Direct Inward / Verified Purchase';

                const { data: grnData, error: grnError } = await supabase
                  .from('grn_receipts')
                  .insert([{
                    grn_no: `GRN-${values.purchaseNo || Date.now()}`,
                    vendor_name: values.supplierName,
                    receipt_date: values.purchaseDate,
                    status: grnStatus,
                    remarks: grnRemarks
                  }])
                  .select('id')
                  .single();

                if (grnError) throw grnError;
                grnIdToUse = grnData.id;

                const itemsWithGrnId = itemsToInsert.map(i => ({ ...i, grn_id: grnIdToUse }));

                if (itemsWithGrnId.length > 0) {
                  const { error: grnItemsError } = await supabase.from('grn_items').insert(itemsWithGrnId);
                  if (grnItemsError) throw grnItemsError;
                }
              }

              const convertedTileItemsForPayload = validTileItems.map((t: any) => {
                const ppb = Math.max(1, Number(t.piecesPerBox) || 4);
                const bQty = Number(t.boxQty || 0);
                const lPcs = Number(t.loosePcs || 0);
                const totalBoxes = Number((bQty + (lPcs / ppb)).toFixed(3));
                return {
                  itemName: t.itemName,
                  skuCode: t.skuCode,
                  warehouse: t.warehouse || locations[0]?.name || 'Main Warehouse',
                  qty: totalBoxes,
                  rate: Number(t.costPricePerBox || 0),
                  discountPer: 0,
                  discountAmt: 0,
                  gstRate: 0,
                  gstAmt: 0,
                  amount: Number(t.totalAmount || 0),
                  isTileItem: true,
                  boxQty: bQty,
                  loosePcs: lPcs,
                  piecesPerBox: ppb,
                  sqmPerBox: Number(t.sqmPerBox || 1.44),
                  costPricePerBox: Number(t.costPricePerBox || 0),
                  costPricePerPiece: Number(t.costPricePerPiece || 0),
                  costPricePerSqm: Number(t.costPricePerSqm || 0),
                  totalSqm: Number(t.totalSqm || 0)
                };
              });

              const mergedItemsToSave = [...validStandardItems, ...convertedTileItemsForPayload];

              const databasePayload: any = {
                purchase_no: values.purchaseNo,
                supplier_name: values.supplierName,
                vendor_name: values.supplierName,
                target_warehouse: values.targetWarehouse || locations[0]?.name || 'Main Warehouse',
                purchase_date: values.purchaseDate,
                purchase_type: values.applyTax ? 'GST Standard Item' : 'No Tax',
                payment_term: paymentTermLabel,
                amount_paid: totalPaid,
                cash_amount_paid: values.settlementMode === 'Bank' ? 0 : Number(values.cashAmountPaid || 0),
                bank_amount_paid: values.settlementMode === 'Cash' ? 0 : Number(values.bankAmountPaid || 0),
                selected_bank_title: values.selectedBankTitle || null,
                additional_charges: Number(values.additionalCharges || 0),
                total_amount: totalBillAmount,
                remaining_balance: remainingBalance,
                remarks: values.remarks.trim() || null,
                notes: values.remarks.trim() || null,
                items: mergedItemsToSave,
                metadata: {
                  settlementMode: values.settlementMode,
                  selectedBankTitle: values.selectedBankTitle,
                  cashAmountPaid: values.cashAmountPaid,
                  bankAmountPaid: values.bankAmountPaid,
                  applyTax: values.applyTax,
                  grn_id: grnIdToUse,
                  showTileSection: values.showTileSection,
                  tile_items: validTileItems
                }
              };

              if (isEditMode) {
                const { error } = await supabase.from('supplier_purchases').update(databasePayload).eq('id', editData.id);
                if (error) {
                  throw error;
                }

                // Sync updated items back to linked GRN so Inward Challan stays accurate
                const linkedGrnId = values.grnId || editData?.metadata?.grn_id || editData?.grn_id || null;
                if (linkedGrnId) {
                  // Fetch existing GRN items so we retain accepted_qty for already verified items
                  const { data: existingGrnItems } = await supabase
                    .from('grn_items')
                    .select('*')
                    .eq('grn_id', linkedGrnId);

                  await supabase.from('grn_items').delete().eq('grn_id', linkedGrnId);

                  const updatedGrnItems = itemsToInsert.map((item: any) => {
                    const matched = (existingGrnItems || []).find((eg: any) =>
                      eg.product_name === item.product_name &&
                      String(eg.warehouse_name).toUpperCase() === String(item.warehouse_name).toUpperCase()
                    );

                    // Preserve previously verified / accepted quantity
                    const prevAccepted = matched ? Number(matched.accepted_qty || 0) : 0;
                    const prevRejected = matched ? Number(matched.rejected_qty || 0) : 0;
                    const itemQty = Number(item.qty || 0);

                    // If requireInward is false, auto-accept full qty; otherwise preserve prior verified qty
                    const acceptedQty = !requireInward ? itemQty : Math.min(itemQty, prevAccepted);
                    const rejectedQty = !requireInward ? 0 : Math.min(Math.max(0, itemQty - acceptedQty), prevRejected);
                    const holdQty = Math.max(0, Number((itemQty - acceptedQty - rejectedQty).toFixed(3)));

                    return {
                      grn_id: linkedGrnId,
                      product_name: item.product_name,
                      warehouse_name: item.warehouse_name,
                      qty: itemQty,
                      uom: item.uom || 'NOS',
                      accepted_qty: acceptedQty,
                      rejected_qty: rejectedQty,
                      hold_qty: holdQty
                    };
                  });
                  if (updatedGrnItems.length > 0) {
                    await supabase.from('grn_items').insert(updatedGrnItems);
                  }

                  const hasPendingHold = updatedGrnItems.some(it => Number(it.hold_qty || 0) > 0);
                  // Update GRN header date/vendor and status
                  await supabase.from('grn_receipts').update({
                    vendor_name: values.supplierName,
                    receipt_date: values.purchaseDate,
                    status: hasPendingHold ? 'Pending Inward' : 'Confirm'
                  }).eq('id', linkedGrnId);
                }

                // ── AUTO-SYNC FINANCIAL VOUCHERS ON UPDATE (PAV & VPV) ──
                try {
                  const resolvedVendor = await resolveVendorCoaAccount(values.supplierName, suppliers);
                  const purchaseIdentifier = values.purchaseNo || editData?.purchase_no || `PUR-${String(editData.id).padStart(4, '0')}`;
                  const vDate = values.purchaseDate || new Date().toISOString().split('T')[0];

                  // 1. Update PAV
                  const { data: existingPav } = await supabase
                    .from('financial_vouchers')
                    .select('id, metadata')
                    .or(`original_invoice_no.eq.${purchaseIdentifier},metadata->>linkedPurchaseNo.eq.${purchaseIdentifier}`)
                    .ilike('voucher_no', 'PAV-%')
                    .maybeSingle();

                  if (existingPav) {
                    await supabase.from('financial_vouchers').update({
                      total_amount: totalBillAmount,
                      debit: 0,
                      credit: totalBillAmount,
                      account_code: resolvedVendor.code,
                      account_title: resolvedVendor.title,
                      voucher_date: vDate,
                      narration: `Purchase procurement bill from ${resolvedVendor.title} (Bill #${purchaseIdentifier}, ${values.items.length} items)`,
                      original_invoice_no: purchaseIdentifier,
                      items: [
                        {
                          accountCode: resolvedVendor.code,
                          accountTitle: resolvedVendor.title,
                          particulars: `Purchase Bill #${purchaseIdentifier}`,
                          debit: 0,
                          credit: totalBillAmount
                        }
                      ]
                    }).eq('id', existingPav.id);
                  }

                  // 2. Update VPV
                  const { data: existingVpv } = await supabase
                    .from('financial_vouchers')
                    .select('id, metadata')
                    .or(`original_invoice_no.eq.${purchaseIdentifier},metadata->>linkedPurchaseNo.eq.${purchaseIdentifier}`)
                    .ilike('voucher_no', 'VPV-%')
                    .maybeSingle();

                  if (totalPaid > 0) {
                    const paidCash = values.settlementMode === 'Bank' ? 0 : Number(values.cashAmountPaid || 0);
                    const paidBank = values.settlementMode === 'Cash' ? 0 : Number(values.bankAmountPaid || 0);

                    let bankCoaCode = '1020-001';
                    let bankCoaTitle = values.selectedBankTitle || 'Bank Account';
                    if (paidBank > 0 && values.selectedBankTitle) {
                      const { data: bankCoaRows } = await supabase
                        .from('chart_of_accounts')
                        .select('account_code, account_title')
                        .ilike('account_title', `%${values.selectedBankTitle.trim()}%`)
                        .limit(1);
                      if (bankCoaRows && bankCoaRows[0]) {
                        bankCoaCode = bankCoaRows[0].account_code;
                        bankCoaTitle = bankCoaRows[0].account_title;
                      }
                    }

                    const vpvItems: any[] = [
                      {
                        accountCode: resolvedVendor.code,
                        accountTitle: resolvedVendor.title,
                        particulars: `Payment for Purchase Bill #${purchaseIdentifier}`,
                        debit: totalPaid,
                        credit: 0
                      }
                    ];
                    if (paidCash > 0) {
                      vpvItems.push({
                        accountCode: '1010-001',
                        accountTitle: 'Cash in Hand',
                        particulars: `Cash paid from drawer`,
                        debit: 0,
                        credit: paidCash
                      });
                    }
                    if (paidBank > 0) {
                      vpvItems.push({
                        accountCode: bankCoaCode,
                        accountTitle: bankCoaTitle,
                        particulars: `Bank wire payment from ${bankCoaTitle}`,
                        debit: 0,
                        credit: paidBank
                      });
                    }

                    if (existingVpv) {
                      await supabase.from('financial_vouchers').update({
                        total_amount: totalPaid,
                        debit: totalPaid,
                        credit: 0,
                        account_code: resolvedVendor.code,
                        account_title: resolvedVendor.title,
                        voucher_date: vDate,
                        items: vpvItems
                      }).eq('id', existingVpv.id);
                    }
                  } else if (existingVpv) {
                    await supabase.from('financial_vouchers').delete().eq('id', existingVpv.id);
                  }
                } catch (vchErr) {
                  console.warn('Voucher auto-sync in update purchase warning:', vchErr);
                }

                toast.success('Procurement inventory batch updated successfully!');
                if (submitAction === 'print') {
                  navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/Print/${editData.id}`);
                } else {
                  navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`);
                }
              } else {
                const { data: insertedData, error } = await supabase.from('supplier_purchases').insert([databasePayload]).select('id').single();
                if (error) throw error;
                if (values.grnId) {
                  await supabase.from('grn_receipts').update({ status: 'Billed' }).eq('id', values.grnId);
                } else if (grnIdToUse && !requireInward) {
                  await supabase.from('grn_receipts').update({ status: 'Confirm' }).eq('id', grnIdToUse);
                }

                // If requireInward is OFF, immediately update products.current_stock for direct counter purchase
                if (!requireInward) {
                  for (const item of mergedItemsToSave) {
                    if (!item.itemName || !item.itemName.trim()) continue;
                    const { data: prod } = await supabase.from('products').select('id, current_stock').ilike('product_name', item.itemName).maybeSingle();
                    if (prod) {
                      await supabase.from('products').update({ current_stock: Number(prod.current_stock || 0) + Number(item.qty || 0) }).eq('id', prod.id);
                    }
                  }
                }

                // ── AUTO-SYNC FINANCIAL VOUCHERS (PAV & VPV) ──
                try {
                  const resolvedVendor = await resolveVendorCoaAccount(values.supplierName, suppliers);
                  const purchaseIdentifier = values.purchaseNo || (insertedData?.id ? `PUR-${String(insertedData.id).padStart(4, '0')}` : 'PUR-BILL');
                  const vDate = values.purchaseDate || new Date().toISOString().split('T')[0];

                  // 1. PAV (Purchase Amount Voucher)
                  const pavNarration = `Purchase procurement bill from ${resolvedVendor.title} (Bill #${purchaseIdentifier}, ${values.items.length} items)`;
                  const { data: pavRows } = await supabase
                    .from('financial_vouchers')
                    .select('voucher_no')
                    .ilike('voucher_no', 'PAV-%');

                  let maxPavSeq = 0;
                  (pavRows || []).forEach(v => {
                    const match = String(v.voucher_no || '').match(/PAV-(\d+)/i);
                    if (match && match[1]) {
                      const num = parseInt(match[1], 10);
                      if (num > maxPavSeq) maxPavSeq = num;
                    }
                  });
                  const nextPavNo = `PAV-${String(maxPavSeq + 1).padStart(3, '0')}`;

                  await supabase.from('financial_vouchers').insert([{
                    voucher_no: nextPavNo,
                    voucher_type: 'Purchase Amount Voucher',
                    voucher_date: vDate,
                    total_amount: totalBillAmount,
                    debit: 0,
                    credit: totalBillAmount,
                    account_code: resolvedVendor.code,
                    account_title: resolvedVendor.title,
                    customer_name: resolvedVendor.title,
                    customerName: resolvedVendor.title,
                    party_name: resolvedVendor.title,
                    narration: pavNarration,
                    original_invoice_no: purchaseIdentifier,
                    items: [
                      {
                        accountCode: resolvedVendor.code,
                        accountTitle: resolvedVendor.title,
                        particulars: `Purchase Bill #${purchaseIdentifier}`,
                        debit: 0,
                        credit: totalBillAmount
                      }
                    ],
                    metadata: {
                      preset: 'PAV',
                      auto_generated: true,
                      linkedPurchaseNo: purchaseIdentifier,
                      moduleSource: 'purchase_bill'
                    }
                  }]);

                  // 2. VPV (Vendor Payment Voucher) IF UPFRONT PAYMENT MADE
                  if (totalPaid > 0) {
                    const paidCash = values.settlementMode === 'Bank' ? 0 : Number(values.cashAmountPaid || 0);
                    const paidBank = values.settlementMode === 'Cash' ? 0 : Number(values.bankAmountPaid || 0);

                    let bankCoaCode = '1020-001';
                    let bankCoaTitle = values.selectedBankTitle || 'Bank Account';
                    if (paidBank > 0 && values.selectedBankTitle) {
                      try {
                        const { data: bankCoaRows } = await supabase
                          .from('chart_of_accounts')
                          .select('account_code, account_title')
                          .ilike('account_title', `%${values.selectedBankTitle.trim()}%`)
                          .limit(1);
                        if (bankCoaRows && bankCoaRows[0]) {
                          bankCoaCode = bankCoaRows[0].account_code;
                          bankCoaTitle = bankCoaRows[0].account_title;
                        }
                      } catch (bErr) {
                        console.warn('Bank COA lookup warning:', bErr);
                      }
                    }

                    const vpvItems: any[] = [
                      {
                        accountCode: resolvedVendor.code,
                        accountTitle: resolvedVendor.title,
                        particulars: `Payment for Purchase Bill #${purchaseIdentifier}`,
                        debit: totalPaid,
                        credit: 0
                      }
                    ];
                    if (paidCash > 0) {
                      vpvItems.push({
                        accountCode: '1010-001',
                        accountTitle: 'Cash in Hand',
                        particulars: `Cash paid from drawer`,
                        debit: 0,
                        credit: paidCash
                      });
                    }
                    if (paidBank > 0) {
                      vpvItems.push({
                        accountCode: bankCoaCode,
                        accountTitle: bankCoaTitle,
                        particulars: `Bank wire payment from ${bankCoaTitle}`,
                        debit: 0,
                        credit: paidBank
                      });
                    }

                    const modeDesc = paidCash > 0 && paidBank > 0
                      ? `Cash: Rs. ${paidCash} + Bank: Rs. ${paidBank}`
                      : paidBank > 0
                      ? `Bank Transfer: Rs. ${paidBank} (${bankCoaCode})`
                      : `Cash Payment: Rs. ${paidCash}`;

                    const { data: vpvRows } = await supabase
                      .from('financial_vouchers')
                      .select('voucher_no')
                      .ilike('voucher_no', 'VPV-%');

                    let maxVpvSeq = 0;
                    (vpvRows || []).forEach(v => {
                      const match = String(v.voucher_no || '').match(/VPV-(\d+)/i);
                      if (match && match[1]) {
                        const num = parseInt(match[1], 10);
                        if (num > maxVpvSeq) maxVpvSeq = num;
                      }
                    });
                    const nextVpvNo = `VPV-${String(maxVpvSeq + 1).padStart(3, '0')}`;

                    await supabase.from('financial_vouchers').insert([{
                      voucher_no: nextVpvNo,
                      voucher_type: 'Vendor Payment Voucher',
                      voucher_date: vDate,
                      total_amount: totalPaid,
                      debit: totalPaid,
                      credit: 0,
                      account_code: resolvedVendor.code,
                      account_title: resolvedVendor.title,
                      customer_name: resolvedVendor.title,
                      customerName: resolvedVendor.title,
                      party_name: resolvedVendor.title,
                      narration: `Payment disbursed to ${resolvedVendor.title} for Purchase Bill #${purchaseIdentifier} (${modeDesc})`,
                      original_invoice_no: purchaseIdentifier,
                      items: vpvItems,
                      metadata: {
                        preset: 'VPV',
                        auto_generated: true,
                        linkedPurchaseNo: purchaseIdentifier,
                        settlementMode: values.settlementMode,
                        moduleSource: 'purchase_bill'
                      }
                    }]);
                  }
                } catch (vchErr) {
                  console.warn('Voucher auto-sync in insert purchase warning:', vchErr);
                }

                toast.success('Procurement inventory batch recorded successfully!');
                if (submitAction === 'print' && insertedData?.id) {
                  navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/Print/${insertedData.id}`);
                } else {
                  navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`);
                }
              }

            } catch (err: any) {
              toast.error('Submission Interrupted: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, errors, touched, setFieldValue, submitForm }) => {
            const standardItemsTotal = (values.items || []).reduce((acc: any, item: any) => {
              return acc + calculatePurchaseLineTotals(item, values.applyTax).netTotal;
            }, 0);
            const tileTotalSum = values.showTileSection ? (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0) : 0;
            const totalBillAmount = standardItemsTotal + tileTotalSum + Number(values.additionalCharges || 0);

            const totalPaid = (values.settlementMode === 'Cash' ? Number(values.cashAmountPaid || 0) : 0) +
              (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : 0) +
              (values.settlementMode === 'Split' ? (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)) : 0);

            const remainingBalance = Math.max(0, totalBillAmount - totalPaid);

            return (
              <Form className="p-6 space-y-6">



                {/* ── TOP 2-COLUMN HEADER BAR ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-meta-4/5 p-4 rounded-sm border border-stroke dark:border-strokedark relative z-10">
                  <div>
                    <label className="block font-bold text-gray-500 mb-1">Inbound Purchase Date: *</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={values.purchaseDate}
                      onChange={handleChange}
                      className={`w-full rounded border p-2 text-sm bg-transparent font-bold outline-none text-black dark:text-white ${hasAttempted && errors.purchaseDate ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'}`}
                    />
                  </div>

                  {/* Searchable Wholesale Vendor */}
                  <div className="relative vendor-search-container">
                    <label className="block font-bold text-gray-500 mb-1">Wholesale Vendor: *</label>
                    {(() => {
                      const filteredVendors = suppliers.filter(s => {
                        if (!values.supplierName) return true;
                        const q = (values.supplierName || '').toLowerCase().trim();
                        const vName = (s.vendor_name || '').toLowerCase();
                        const vPhone = (s.phone || '').toLowerCase();
                        const vContact = (s.contact_person || '').toLowerCase();
                        return vName.includes(q) || vPhone.includes(q) || vContact.includes(q);
                      });

                      return (
                        <div className="relative">
                          <input
                            type="text"
                            autoComplete="off"
                            value={values.supplierName}
                            onFocus={() => {
                              setIsVendorDropdownOpen(true);
                              setHighlightedVendorIndex(0);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setIsVendorDropdownOpen(true);
                                setHighlightedVendorIndex(prev => prev < filteredVendors.length - 1 ? prev + 1 : 0);
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setIsVendorDropdownOpen(true);
                                setHighlightedVendorIndex(prev => prev > 0 ? prev - 1 : filteredVendors.length - 1);
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredVendors[highlightedVendorIndex]) {
                                  setFieldValue('supplierName', filteredVendors[highlightedVendorIndex].vendor_name);
                                  setIsVendorDropdownOpen(false);
                                }
                              } else if (e.key === 'Escape' || e.key === 'Tab') {
                                setIsVendorDropdownOpen(false);
                              }
                            }}
                            onChange={(e) => {
                              setFieldValue('supplierName', e.target.value);
                              setIsVendorDropdownOpen(true);
                              setHighlightedVendorIndex(0);
                            }}
                            placeholder="Type or search vendor name..."
                            className={`w-full rounded border p-2 text-sm bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white ${hasAttempted && errors.supplierName ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'
                              }`}
                          />

                          {isVendorDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 z-[999999] w-full max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredVendors.length > 0 ? (
                                filteredVendors.map((vendor, vIdx) => (
                                  <div
                                    key={vendor.id}
                                    onMouseEnter={() => setHighlightedVendorIndex(vIdx)}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setFieldValue('supplierName', vendor.vendor_name);
                                      setIsVendorDropdownOpen(false);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setFieldValue('supplierName', vendor.vendor_name);
                                      setIsVendorDropdownOpen(false);
                                    }}
                                    className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${highlightedVendorIndex === vIdx || values.supplierName === vendor.vendor_name
                                        ? 'bg-primary/10 text-primary font-bold'
                                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                                      }`}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-bold">{vendor.vendor_name}</span>
                                      {(vendor.contact_person || vendor.phone) && (
                                        <span className="text-[10px] text-slate-400">
                                          {vendor.contact_person} {vendor.phone ? `• ${vendor.phone}` : ''}
                                        </span>
                                      )}
                                    </div>
                                    {vendor.city && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                        {vendor.city}
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-center text-xs text-slate-400 italic">
                                  No matching vendors found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {hasAttempted && errors.supplierName && (
                      <p className="text-red-500 text-[10px] font-bold mt-1">{String(errors.supplierName)}</p>
                    )}
                  </div>
                </div>

                {/* 🌟 TAX & DISCOUNT TOGGLE BAR: CLEAN & UNCLUTTERED DEFAULT UI */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark rounded-sm relative z-0">
                  <div className="flex items-center gap-6">
                    {/* Tax Invoicing Toggle (Commented out - ready to be re-enabled if client requests GST/FBR Purchase Tax) */}
                    {/*
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={values.applyTax}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFieldValue('applyTax', isChecked);
                          if (!isChecked) {
                            values.items.forEach((_: any, idx: number) => {
                              setFieldValue(`items.${idx}.gstRate`, 0);
                              setFieldValue(`items.${idx}.gstAmt`, 0);
                            });
                          } else {
                            values.items.forEach((item: any, idx: number) => {
                              const r = 18;
                              setFieldValue(`items.${idx}.gstRate`, r);
                              const cost = (Number(item.qty) || 0) * (Number(item.rate) || 0) - (Number(item.discountAmt) || 0);
                              setFieldValue(`items.${idx}.gstAmt`, Number(((cost * r) / 100).toFixed(2)));
                            });
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                      />
                      <span className="font-bold text-xs text-black dark:text-white">Enable GST / FBR Purchase Tax</span>
                    </label>
                    */}

                    {/* Discount Column Toggle */}
                    <div 
                      onClick={() => {
                        const isChecked = !values.showDiscount;
                        setFieldValue('showDiscount', isChecked);
                        if (!isChecked) {
                          values.items.forEach((_: any, idx: number) => {
                            setFieldValue(`items.${idx}.discountPer`, 0);
                            setFieldValue(`items.${idx}.discountAmt`, 0);
                          });
                        }
                      }}
                      className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
                        values.showDiscount 
                          ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' 
                          : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
                      }`}
                    >
                      Discounts
                    </div>

                    {/* Freight Charges Toggle */}
                    <div
                      onClick={() => {
                        const isChecked = !values.showAdditionalCharges;
                        setFieldValue('showAdditionalCharges', isChecked);
                        if (!isChecked) setFieldValue('additionalCharges', 0);
                      }}
                      className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border ${
                        values.showAdditionalCharges
                          ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
                      }`}
                    >
                      Freight Charges
                    </div>

                    {/* + Purchase Tiles Toggle */}
                    <div
                      onClick={() => {
                        const nextVal = !values.showTileSection;
                        setFieldValue('showTileSection', nextVal);
                        if (nextVal && (!values.tileItems || values.tileItems.length === 0)) {
                          setFieldValue('tileItems', [
                            {
                              id: `tile-0-${Date.now()}`,
                              itemName: '',
                              skuCode: '',
                              warehouse: locations[0]?.name || 'Main Warehouse',
                              boxQty: 1,
                              loosePcs: 0,
                              totalSqm: 0,
                              costPricePerBox: 0,
                              costPricePerPiece: 0,
                              costPricePerSqm: 0,
                              totalAmount: 0,
                              piecesPerBox: 4,
                              sqmPerBox: 1.44
                            }
                          ]);
                        }
                      }}
                      className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border shadow-xs ${
                        values.showTileSection
                          ? 'bg-teal-600 text-white border-teal-600 shadow-teal-500/20'
                          : 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                      }`}
                    >
                      {values.showTileSection ? '✓ Tiles Enabled' : '+ Purchase Tiles'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className={`text-[11px] font-bold whitespace-nowrap ${touched.purchaseNo && errors.purchaseNo ? 'text-red-500' : 'text-gray-500'}`}>Purchase Order Ref: *</label>
                    <input
                      type="text"
                      name="purchaseNo"
                      value={values.purchaseNo}
                      readOnly
                      className={`w-32 rounded border bg-gray-50 dark:bg-meta-4 cursor-not-allowed p-1 text-xs font-bold font-mono text-gray-500 outline-none ${
                        touched.purchaseNo && errors.purchaseNo ? 'border-red-500' : 'border-stroke dark:border-strokedark'
                      }`}
                    />
                  </div>
                </div>

                {/* ── PRODUCT ITEM CATALOG ENTRY TABLE ── */}
                <div className="border border-stroke dark:border-strokedark rounded-sm relative z-20 overflow-x-auto pb-44">
                  <div className="w-full min-w-[980px]">
                    <table className="w-full table-auto border-collapse text-left">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                          <th className="p-3 w-10 text-center">S#</th>
                          <th className="p-3 w-48">Code (Search)</th>
                          <th className="p-3 min-w-[240px]">Product Description</th>
                          <th className="p-3 w-44">Destination Warehouse</th>
                          <th className="p-3 min-w-[260px] text-center">Arrived Qty (Boxes / Pcs / Sq.m)</th>
                          <th className="p-3 w-36 text-right">Cost Price (PKR)</th>
                          {values.showDiscount && (
                            <>
                              <th className="p-3 w-20 text-center text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">Disc %</th>
                              <th className="p-3 w-28 text-right text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">Disc Amt</th>
                            </>
                          )}
                          {values.applyTax && (
                            <>
                              <th className="p-3 w-20 text-center text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">GST %</th>
                              <th className="p-3 w-28 text-right text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">GST Amt</th>
                            </>
                          )}
                          <th className="p-3 w-36 text-right pr-4">Net Total Line</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <FieldArray name="items">
                        {({ push, remove }) => (
                          <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {values.items.map((item: any, idx: number) => {
                              const matchedProduct = productList.find(p =>
                                (item.skuCode && (p.item_sr_no === item.skuCode || `SKU-${p.id}` === item.skuCode)) ||
                                (item.itemName && String(p.product_name || '').toLowerCase() === String(item.itemName || '').toLowerCase())
                              );
                              const rawPcs = Number(matchedProduct?.pieces_per_box ?? matchedProduct?.pcs_per_box ?? matchedProduct?.pieces_per_packing ?? 0);
                              const isTile = Boolean(
                                matchedProduct && (
                                  String(matchedProduct.category || '').toLowerCase().includes('tile') ||
                                  String(matchedProduct.scenario_name || '').toLowerCase().includes('tile')
                                ) && (rawPcs > 1 || String(matchedProduct.scenario_name || '').toLowerCase().includes('tile'))
                              );
                              const allowLoose = Boolean(matchedProduct?.allow_loose_sales || isTile);
                              const looseRatio = Number(matchedProduct?.loose_conversion_ratio || rawPcs || (isTile ? 4 : 1)) || 1;
                              const pcsPerBox = looseRatio > 1 ? looseRatio : (isTile ? 4 : 1);
                              const bulkUnitLabel = matchedProduct?.uom || (isTile ? 'Box' : 'Unit');
                              const looseUnitLabel = matchedProduct?.loose_uom || (isTile ? 'Pcs' : 'Units');
                              const uomString = matchedProduct ? matchedProduct.uom : 'NOS';
                              const lineTotals = calculatePurchaseLineTotals(item, values.applyTax);
                              const isCurrentActive = activeSkuIndex === idx;
                              const isCurrentProdNameActive = activeProdNameIndex === idx;

                              const handleProductSelection = (p: any) => {
                                const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                const price = Number(p.purchase_price ?? p.cost_price ?? 0);
                                const updatedItems = [...values.items];
                                const cur = updatedItems[idx] || {};
                                const qty = Number(cur.qty) || 1;
                                const dPer = Number(cur.discountPer) || 0;
                                const dAmt = dPer > 0 ? Number(((price * qty * dPer) / 100).toFixed(2)) : (Number(cur.discountAmt) || 0);

                                updatedItems[idx] = {
                                  ...cur,
                                  skuCode: displaySku,
                                  itemName: p.product_name,
                                  rate: price,
                                  discountAmt: dAmt
                                };

                                setFieldValue('items', updatedItems);
                                setActiveProdNameIndex(null);
                                setActiveSkuIndex(null);
                              };

                              return (
                                <tr key={idx} className={`border-b border-stroke dark:border-strokedark text-xs transition ${isCurrentActive || isCurrentProdNameActive ? 'relative z-50 bg-slate-50/90 dark:bg-meta-4/20' : 'relative z-10 bg-white dark:bg-boxdark hover:bg-slate-50 dark:hover:bg-meta-4/10'}`}>
                                  <td className="p-3 text-center text-gray-400 font-sans">{idx + 1}</td>

                                  {/* Searchable Code */}
                                  <td className="p-3 relative sku-container">
                                    {(() => {
                                      const nonTileList = productList.filter(p => !isTileProduct(p));
                                      const filteredProds = nonTileList.filter(p => {
                                        if (!item.skuCode) return true;
                                        const query = item.skuCode.toLowerCase().trim();
                                        const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                        const name = (p.product_name || '').toLowerCase();
                                        return sku.includes(query) || name.includes(query);
                                      }).sort((a, b) => {
                                        if (!item.skuCode) return 0;
                                        const query = item.skuCode.toLowerCase().trim();
                                        const aSku = (a.item_sr_no || `SKU-${a.id}`).toLowerCase();
                                        const bSku = (b.item_sr_no || `SKU-${b.id}`).toLowerCase();
                                        const aMatch = aSku.startsWith(query) ? 2 : (aSku.includes(query) ? 1 : 0);
                                        const bMatch = bSku.startsWith(query) ? 2 : (bSku.includes(query) ? 1 : 0);
                                        return bMatch - aMatch;
                                      });

                                      return (
                                        <>
                                          <input
                                            type="text"
                                            autoComplete="off"
                                            value={item.skuCode || ''}
                                            onFocus={() => {
                                              setActiveSkuIndex(idx);
                                              setActiveProdNameIndex(null);
                                              setHighlightedSkuIndex(0);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setHighlightedSkuIndex(prev => prev < filteredProds.length - 1 ? prev + 1 : 0);
                                              } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setHighlightedSkuIndex(prev => prev > 0 ? prev - 1 : filteredProds.length - 1);
                                              } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (filteredProds[highlightedSkuIndex]) {
                                                  handleProductSelection(filteredProds[highlightedSkuIndex]);
                                                }
                                              } else if (e.key === 'Escape' || e.key === 'Tab') {
                                                setActiveSkuIndex(null);
                                              }
                                            }}
                                            onChange={(e) => {
                                              setFieldValue(`items.${idx}.skuCode`, e.target.value);
                                              setActiveSkuIndex(idx);
                                            }}
                                            placeholder="TYPE SKU..."
                                            className="w-full rounded border border-stroke dark:border-strokedark p-1.5 bg-transparent font-mono font-bold text-xs uppercase outline-none focus:border-primary"
                                          />

                                          {isCurrentActive && filteredProds.length > 0 && (
                                            <div className="absolute left-0 top-full mt-1.5 z-[99999] w-72 max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                                              {filteredProds.map((prod, pIdx) => (
                                                <div
                                                  key={prod.id}
                                                  onMouseEnter={() => setHighlightedSkuIndex(pIdx)}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleProductSelection(prod);
                                                  }}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleProductSelection(prod);
                                                  }}
                                                  className={`p-2.5 cursor-pointer text-xs flex justify-between items-center ${highlightedSkuIndex === pIdx ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                >
                                                  <div className="min-w-0 pr-2">
                                                    <p className="font-mono font-bold text-black dark:text-white text-xs">{prod.item_sr_no || `SKU-${prod.id}`}</p>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{prod.product_name}</p>
                                                  </div>
                                                  <span className="font-mono font-bold text-emerald-600">Rs. {Number(prod.purchase_price || 0).toLocaleString()}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </td>

                                  {/* Description & Description (Searchable Two-Way Input with Rich Dropdown matching Sales page) */}
                                  <td className="p-3 relative prod-name-container min-w-[260px]">
                                    {(() => {
                                      const query = (item.itemName || '').toLowerCase().trim();
                                      const nonTileList = productList.filter(p => !isTileProduct(p));
                                      const filteredByName = nonTileList.filter(p => {
                                        if (!query) return true;
                                        const name = (p.product_name || '').toLowerCase();
                                        const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                        return name.includes(query) || sku.includes(query);
                                      });

                                      return (
                                        <div className="relative">
                                          <input
                                            type="text"
                                            autoComplete="off"
                                            value={item.itemName || ''}
                                            onFocus={() => {
                                              setActiveProdNameIndex(idx);
                                              setActiveSkuIndex(null);
                                              setHighlightedProdNameIndex(0);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setHighlightedProdNameIndex(prev => prev < filteredByName.length - 1 ? prev + 1 : 0);
                                              } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setHighlightedProdNameIndex(prev => prev > 0 ? prev - 1 : filteredByName.length - 1);
                                              } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (filteredByName[highlightedProdNameIndex]) {
                                                  handleProductSelection(filteredByName[highlightedProdNameIndex]);
                                                }
                                              } else if (e.key === 'Escape' || e.key === 'Tab') {
                                                setActiveProdNameIndex(null);
                                              }
                                            }}
                                            onChange={(e) => {
                                              const typed = e.target.value;
                                              setFieldValue(`items.${idx}.itemName`, typed);
                                              setActiveProdNameIndex(idx);
                                              setHighlightedProdNameIndex(0);

                                              const matched = productList.find(
                                                p => p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase()
                                              );
                                              if (matched) {
                                                handleProductSelection(matched);
                                              }
                                            }}
                                            placeholder="Search Description..."
                                            className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded p-1.5 outline-none text-xs text-black dark:text-white focus:border-primary shadow-xs"
                                          />

                                          {/* Rich Dropdown */}
                                          {isCurrentProdNameActive && filteredByName.length > 0 && (
                                            <div className="absolute left-0 top-full mt-1.5 z-[99999] min-w-[340px] max-w-[420px] max-h-[290px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300">
                                              {filteredByName.map((p, pIdx) => {
                                                const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                                const isHighlighted = pIdx === highlightedProdNameIndex;
                                                return (
                                                  <div
                                                    key={p.id}
                                                    onMouseEnter={() => setHighlightedProdNameIndex(pIdx)}
                                                    onMouseDown={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleProductSelection(p);
                                                    }}
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleProductSelection(p);
                                                    }}
                                                    className={`p-3 cursor-pointer transition flex items-center justify-between group ${isHighlighted
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                                      }`}
                                                  >
                                                    <div className="flex flex-col gap-0.5 text-left pr-2">
                                                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-tight">
                                                        {p.product_name}
                                                      </span>
                                                      <span className="font-mono text-[10px] text-slate-400">
                                                        {displaySku}
                                                      </span>
                                                    </div>
                                                    <div className="text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                                                      Rs. {Number(p.purchase_price || 0).toLocaleString()}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>

                                  {/* ROW-LEVEL DESTINATION WAREHOUSE */}
                                  <td className="p-3 w-48">
                                    <select
                                      value={item.warehouse || locations[0]?.name || ''}
                                      onChange={(e) => {
                                        setFieldValue(`items.${idx}.warehouse`, e.target.value);
                                      }}
                                      className="w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary shadow-xs"
                                    >
                                      {locations.map((loc) => (
                                        <option key={loc.id} value={loc.name}>
                                          {loc.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Arrived Qty with Dedicated Boxes & Loose Pieces & Sq.Mtr for Tiles or Loose Products */}
                                  <td className="p-3 min-w-[260px]">
                                    {isTile ? (
                                      (() => {
                                        let tileWidthCm = 60;
                                        let tileHeightCm = 60;
                                        const desc = matchedProduct?.product_description || '';
                                        const sku = matchedProduct?.item_sr_no || '';
                                        const sizeMatch = desc.match(/Size:\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm/i) ||
                                          sku.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
                                        if (sizeMatch) {
                                          tileHeightCm = Number(sizeMatch[1]) || 60;
                                          tileWidthCm = Number(sizeMatch[2]) || 60;
                                        }
                                        const perPieceSqm = (tileHeightCm * tileWidthCm) / 10000;
                                        const perBoxSqm = perPieceSqm * pcsPerBox;

                                        const currentQty = Number(item.qty || 0);
                                        const boxes = Math.floor(currentQty);
                                        const loosePcs = Math.round((currentQty - boxes) * pcsPerBox);
                                        const totalLineSqm = (boxes * perBoxSqm) + (loosePcs * perPieceSqm);

                                        return (
                                          <div className="flex flex-col gap-1">
                                            {/* ── TOP BADGES: Per Box Sq.Mtr & Per Piece Sq.Mtr ── */}
                                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1 font-mono">
                                              <span className="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/60 font-bold">
                                                Box: {perBoxSqm.toFixed(2)} sq.m
                                              </span>
                                              <span className="text-emerald-700 dark:emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-bold">
                                                Pc: {perPieceSqm.toFixed(4)} sq.m
                                              </span>
                                            </div>

                                            {/* ── INPUTS CONTAINER: BOXES + LOOSE PIECES ── */}
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 p-1.5 rounded-lg border border-stroke dark:border-strokedark shadow-inner">
                                              {/* BOXES INPUT */}
                                              <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-2 py-1 focus-within:border-primary shadow-sm">
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  onKeyDown={blockInvalidChar}
                                                  value={(() => {
                                                    const b = Math.floor(Number(item.qty || 0));
                                                    return b === 0 ? '' : b;
                                                  })()}
                                                  placeholder="0"
                                                  onChange={(e) => {
                                                    const val = e.target.value.trim();
                                                    const newBoxes = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                    const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                                    const combinedQty = Number((newBoxes + currentLoose / pcsPerBox).toFixed(3));
                                                    setFieldValue(`items.${idx}.qty`, combinedQty);

                                                    const cost = combinedQty * (Number(item.rate) || 0);
                                                    if (Number(item.discountPer) > 0) {
                                                      setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                                    }
                                                  }}
                                                  className="w-full bg-transparent text-center font-black text-sm text-primary outline-none min-w-[36px]"
                                                />
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 pl-1 select-none">Box</span>
                                              </div>

                                              <span className="text-gray-400 font-black text-sm select-none">+</span>

                                              {/* LOOSE PIECES INPUT */}
                                              <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-2 py-1 focus-within:border-emerald-500 shadow-sm">
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  onKeyDown={blockInvalidChar}
                                                  value={(() => {
                                                    const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                                    return currentLoose === 0 ? '' : currentLoose;
                                                  })()}
                                                  placeholder={`${pcsPerBox}`}
                                                  onChange={(e) => {
                                                    const val = e.target.value.trim();
                                                    const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                    const currentBoxes = Math.floor(Number(item.qty || 0));

                                                    // Auto carryover if loose pieces >= pcsPerBox
                                                    const extraBoxes = Math.floor(enteredLoose / pcsPerBox);
                                                    const remLoose = enteredLoose % pcsPerBox;
                                                    const finalBoxes = currentBoxes + extraBoxes;
                                                    const combinedQty = remLoose > 0
                                                      ? Number((finalBoxes + remLoose / pcsPerBox).toFixed(3))
                                                      : finalBoxes;

                                                    setFieldValue(`items.${idx}.qty`, combinedQty);

                                                    const cost = combinedQty * (Number(item.rate) || 0);
                                                    if (Number(item.discountPer) > 0) {
                                                      setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                                    }
                                                  }}
                                                  className="w-full bg-transparent text-center font-black text-sm text-emerald-600 dark:text-emerald-400 outline-none min-w-[36px]"
                                                />
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 pl-1 select-none">Pcs</span>
                                              </div>
                                            </div>

                                            {/* ── BOTTOM TOTAL SQ.MTR CALCULATION ── */}
                                            <div className="text-center font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 rounded py-0.5 border border-teal-200/60 dark:border-teal-800/40">
                                              Total: <span className="text-xs font-black">{totalLineSqm.toFixed(2)}</span> sq.m
                                              <span className="text-slate-400 font-sans font-normal ml-1">({boxes} Box{boxes !== 1 ? 'es' : ''}{loosePcs > 0 ? ` + ${loosePcs} Pcs` : ''})</span>
                                            </div>
                                          </div>
                                        );
                                      })()
                                    ) : allowLoose && pcsPerBox > 1 ? (
                                      /* DYNAMIC DUAL INPUT FOR GENERAL PRODUCTS WITH ALLOW LOOSE (KG+GM, LTR+ML, BOX+PCS) */
                                      (() => {
                                        const currentQty = Number(item.qty || 0);
                                        const bulkCount = Math.floor(currentQty);
                                        const looseCount = Math.round((currentQty - bulkCount) * pcsPerBox);

                                        return (
                                          <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 p-1.5 rounded-lg border border-stroke dark:border-strokedark shadow-inner">
                                              {/* BULK UNIT INPUT */}
                                              <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-2 py-1 focus-within:border-primary shadow-sm">
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  onKeyDown={blockInvalidChar}
                                                  value={bulkCount === 0 ? '' : bulkCount}
                                                  placeholder="0"
                                                  onChange={(e) => {
                                                    const val = e.target.value.trim();
                                                    const newBulk = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                    const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                                    const combinedQty = Number((newBulk + currentLoose / pcsPerBox).toFixed(3));
                                                    setFieldValue(`items.${idx}.qty`, combinedQty);

                                                    const cost = combinedQty * (Number(item.rate) || 0);
                                                    if (Number(item.discountPer) > 0) {
                                                      setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                                    }
                                                  }}
                                                  className="w-full bg-transparent text-center font-black text-sm text-primary outline-none min-w-[36px]"
                                                />
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 pl-1 select-none">{bulkUnitLabel}</span>
                                              </div>

                                              <span className="text-gray-400 font-black text-sm select-none">+</span>

                                              {/* LOOSE SUB-UNIT INPUT */}
                                              <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-2 py-1 focus-within:border-emerald-500 shadow-sm">
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  onKeyDown={blockInvalidChar}
                                                  value={looseCount === 0 ? '' : looseCount}
                                                  placeholder={`${pcsPerBox}`}
                                                  onChange={(e) => {
                                                    const val = e.target.value.trim();
                                                    const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                    const currentBulk = Math.floor(Number(item.qty || 0));

                                                    const extraBulk = Math.floor(enteredLoose / pcsPerBox);
                                                    const remLoose = enteredLoose % pcsPerBox;
                                                    const finalBulk = currentBulk + extraBulk;
                                                    const combinedQty = remLoose > 0
                                                      ? Number((finalBulk + remLoose / pcsPerBox).toFixed(3))
                                                      : finalBulk;

                                                    setFieldValue(`items.${idx}.qty`, combinedQty);

                                                    const cost = combinedQty * (Number(item.rate) || 0);
                                                    if (Number(item.discountPer) > 0) {
                                                      setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                                    }
                                                  }}
                                                  className="w-full bg-transparent text-center font-black text-sm text-emerald-600 dark:text-emerald-400 outline-none min-w-[36px]"
                                                />
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 pl-1 select-none">{looseUnitLabel}</span>
                                              </div>
                                            </div>

                                            <div className="text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                              Total: <strong>{currentQty}</strong> {bulkUnitLabel} ({bulkCount} {bulkUnitLabel} + {looseCount} {looseUnitLabel})
                                            </div>
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      /* STANDARD SINGLE QTY INPUT FOR NON-TILE ITEMS */
                                      (() => {
                                        const u = String(uomString || item.uom || matchedProduct?.uom || '').trim().toUpperCase();
                                        const isDecimalUom = [
                                          'KG', 'KILOGRAM', 'GM', 'GRAM', 'TON', 'METRIC TON', 'LBS',
                                          'LTR', 'LITER', 'LITRE', 'ML', 'GAL',
                                          'MTR', 'METER', 'FT', 'FEET', 'INCH', 'CM', 'MM', 'YD',
                                          'SQM', 'SQ.M', 'SQ.MTR', 'SQ.FT', 'SQF', 'SQY', 'SQUARE METER'
                                        ].includes(u);

                                        return (
                                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 border border-stroke dark:border-strokedark">
                                            <input
                                              type="text"
                                              inputMode={isDecimalUom ? "decimal" : "numeric"}
                                              onKeyDown={(e) => {
                                                blockInvalidChar(e);
                                                if (!isDecimalUom && (e.key === '.' || e.key === 'Decimal')) {
                                                  e.preventDefault();
                                                }
                                              }}
                                              name={`items.${idx}.qty`}
                                              value={item.qty === 0 ? '' : item.qty}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const regex = isDecimalUom ? /^\d*\.?\d*$/ : /^\d*$/;
                                                if (val === '' || regex.test(val)) {
                                                  setFieldValue(`items.${idx}.qty`, val);
                                                  const num = parseFloat(val) || 0;
                                                  const cost = num * (Number(item.rate) || 0);
                                                  if (Number(item.discountPer) > 0) {
                                                    setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                                  }
                                                }
                                              }}
                                              placeholder="1"
                                              className="w-full bg-transparent text-center font-black text-xs text-primary outline-none"
                                            />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase select-none">{uomString}</span>
                                          </div>
                                        );
                                      })()
                                    )}
                                  </td>

                                  {/* Cost Price */}
                                  <td className="p-3 w-40 min-w-[140px]">
                                    <div className="flex flex-col gap-1.5">
                                      {/* Bulk / Main Rate Input */}
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.rate`}
                                          value={item.rate}
                                          onChange={(e) => {
                                            const newRate = Math.max(0, Number(e.target.value) || 0);
                                            setFieldValue(`items.${idx}.rate`, newRate);
                                            const cost = (Number(item.qty) || 0) * newRate;
                                            if (Number(item.discountPer) > 0) {
                                              setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                            }
                                          }}
                                          className="w-full rounded border border-stroke dark:border-strokedark p-1.5 bg-transparent font-black font-mono text-right outline-none focus:border-primary text-xs"
                                        />
                                        {((isTile || allowLoose) && pcsPerBox > 1) && (
                                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 select-none uppercase">
                                            /{bulkUnitLabel}
                                          </span>
                                        )}
                                      </div>

                                      {/* Loose Unit Price Editable Input */}
                                      {((isTile || allowLoose) && pcsPerBox > 1) && (
                                        <div className="flex items-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded px-1.5 py-0.5">
                                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                            /{looseUnitLabel}:
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            onKeyDown={blockInvalidChar}
                                            value={(() => {
                                              const currentRate = Number(item.rate || 0);
                                              const lPrice = Number((currentRate / pcsPerBox).toFixed(2));
                                              return isNaN(lPrice) ? '' : lPrice;
                                            })()}
                                            onChange={(e) => {
                                              const enteredLoosePrice = Math.max(0, Number(e.target.value) || 0);
                                              const newBulkRate = Number((enteredLoosePrice * pcsPerBox).toFixed(2));
                                              setFieldValue(`items.${idx}.rate`, newBulkRate);
                                              const cost = (Number(item.qty) || 0) * newBulkRate;
                                              if (Number(item.discountPer) > 0) {
                                                setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                              }
                                            }}
                                            placeholder="0"
                                            className="w-full bg-transparent font-mono font-bold text-[11px] text-right text-emerald-700 dark:text-emerald-400 outline-none"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Discount Columns */}
                                  {values.showDiscount && (
                                    <>
                                      <td className="p-3 w-24 min-w-[90px] bg-amber-50/30 dark:bg-amber-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.discountPer`}
                                          value={item.discountPer ?? 0}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.discountPer`, rawVal);
                                            const dPer = Number(rawVal);
                                            if (!isNaN(dPer) && dPer >= 0) {
                                              const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                              setFieldValue(`items.${idx}.discountAmt`, Number(((gross * dPer) / 100).toFixed(2)));
                                            }
                                          }}
                                          placeholder="0"
                                          className="w-full text-center font-bold font-mono text-amber-700 bg-white dark:bg-boxdark border border-amber-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                      <td className="p-3 w-32 min-w-[110px] bg-amber-50/30 dark:bg-amber-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.discountAmt`}
                                          value={item.discountAmt ?? 0}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.discountAmt`, rawVal);
                                            const dAmt = Number(rawVal);
                                            if (!isNaN(dAmt) && dAmt >= 0) {
                                              const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                              const per = gross > 0 ? (dAmt / gross) * 100 : 0;
                                              setFieldValue(`items.${idx}.discountPer`, Number(per.toFixed(2)));
                                            }
                                          }}
                                          placeholder="0"
                                          className="w-full text-right font-bold font-mono text-amber-700 bg-white dark:bg-boxdark border border-amber-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                    </>
                                  )}

                                  {/* GST Columns */}
                                  {values.applyTax && (
                                    <>
                                      <td className="p-3 w-24 min-w-[90px] bg-emerald-50/30 dark:bg-emerald-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.gstRate`}
                                          value={item.gstRate ?? 18}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.gstRate`, rawVal);
                                            const r = Number(rawVal);
                                            if (!isNaN(r) && r >= 0) {
                                              const cost = (Number(item.qty) || 0) * (Number(item.rate) || 0) - (Number(item.discountAmt) || 0);
                                              setFieldValue(`items.${idx}.gstAmt`, Number(((cost * r) / 100).toFixed(2)));
                                            }
                                          }}
                                          className="w-full text-center font-bold font-mono text-emerald-700 bg-white dark:bg-boxdark border border-emerald-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                      <td className="p-3 w-32 min-w-[110px] bg-emerald-50/30 dark:bg-emerald-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.gstAmt`}
                                          value={item.gstAmt ?? 0}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.gstAmt`, rawVal);
                                          }}
                                          className="w-full text-right font-bold font-mono text-emerald-700 bg-white dark:bg-boxdark border border-emerald-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                    </>
                                  )}

                                  {/* Net Line Total */}
                                  <td className="p-3 text-right pr-4 text-emerald-600 dark:text-emerald-400 font-black font-mono">
                                    Rs. {lineTotals.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>

                                  {/* Delete Row */}
                                  <td className="p-3 text-center">
                                    {values.items.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (isEditMode && item.itemName) {
                                            // Pre-deletion stock check
                                            let qtyToReverse = Number(item.qty || 0);
                                            
                                            // Check GRN if this purchase is linked to one
                                            let grnItems = [];
                                            if (editData?.metadata?.grn_id) {
                                              const { data: gi } = await supabase.from('grn_items').select('*').eq('grn_id', editData.metadata.grn_id);
                                              if (gi) {
                                                const gItem = gi.find(g => String(g.product_name || '').toLowerCase() === String(item.itemName).toLowerCase());
                                                if (gItem) qtyToReverse = Number(gItem.accepted_qty ?? 0);
                                                else qtyToReverse = 0;
                                              }
                                            }

                                            if (qtyToReverse > 0) {
                                              const currentStock = await getAvailableStock(item.itemName, item.warehouse);
                                              if (currentStock < qtyToReverse) {
                                                toast.error(`Error: You currently only have ${currentStock} in ${item.warehouse}. Cannot delete this entry as it would cause negative stock.`, { duration: 5000 });
                                                return; // Block removal
                                              }
                                            }
                                          }
                                          remove(idx);
                                        }}
                                        className="text-gray-400 hover:text-danger transition cursor-pointer"
                                      >
                                        <FiTrash2 size={14} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        )}
                      </FieldArray>
                    </table>
                  </div>

                  <div className="p-3 bg-gray-50/50 dark:bg-meta-4/10 border-t border-stroke dark:border-strokedark">
                    <FieldArray name="items">
                      {({ push }) => (
                        <button
                          type="button"
                          onClick={() => push({ itemName: '', skuCode: '', warehouse: locations[0]?.name || '', qty: 1, rate: 0, discountPer: 0, discountAmt: 0, gstRate: 18, gstAmt: 0 })}
                          className="inline-flex items-center gap-1 bg-primary text-white font-bold py-1.5 px-3.5 rounded text-xs hover:bg-opacity-90 transition cursor-pointer shadow-xs"
                        >
                          <FiPlus size={12} /> Add Row Line
                        </button>
                      )}
                    </FieldArray>
                  </div>
                </div>

                {/* ── DEDICATED TILE PURCHASES DYNAMIC CONTAINER ── */}
                {values.showTileSection && (
                  <div className={`border border-teal-400 dark:border-teal-800/80 bg-teal-50/20 dark:bg-teal-950/10 rounded-sm mt-6 relative ${activeTileSkuIndex !== null || activeTileProdIndex !== null ? 'z-30' : 'z-20'} overflow-x-auto pb-4`}>
                    <FieldArray name="tileItems">
                      {({ push, remove }) => {
                        const tileTotalSum = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalAmount || 0)), 0);
                        const totalBoxesCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.boxQty || 0)), 0);
                        const totalLoosePcsCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.loosePcs || 0)), 0);
                        const totalSqmCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalSqm || 0)), 0);
                        const tileProducts = productList.filter(p => isTileProduct(p));

                        return (
                          <div className="w-full min-w-[980px]">
                            {/* Header Bar */}
                            <div className="p-3 bg-teal-100/70 dark:bg-teal-900/40 border-b border-teal-300 dark:border-teal-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                                  Tiles
                                </span>
                                <span className="font-bold text-xs text-teal-950 dark:text-teal-200">
                                  Tile Purchases (Boxes, Loose Pieces & Sq. Mtr Inward)
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono font-bold text-teal-800 dark:text-teal-300">
                                <span>Boxes: <strong className="font-black text-black dark:text-white">{totalBoxesCount}</strong></span>
                                <span>Pcs: <strong className="font-black text-black dark:text-white">{totalLoosePcsCount}</strong></span>
                                <span>Total Sq.M: <strong className="font-black text-teal-950 dark:text-teal-100 bg-teal-200/80 dark:bg-teal-800/80 px-2 py-0.5 rounded shadow-sm">{totalSqmCount.toFixed(2)} m²</strong></span>
                                <span className="text-teal-950 dark:text-teal-100 font-black text-sm">
                                  Total Tiles: Rs. {tileTotalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Table */}
                            <table className="w-full table-auto border-collapse text-left">
                              <thead className="bg-teal-50/80 dark:bg-teal-950/60 text-[10px] font-black uppercase text-teal-950 dark:text-teal-300 border-b border-teal-200 dark:border-teal-800">
                                <tr>
                                  <th className="p-3 w-10 text-center">S#</th>
                                  <th className="p-3 w-44">Code (Search)</th>
                                  <th className="p-3 min-w-[240px]">Tile Product Description</th>
                                  <th className="p-3 w-44">Destination Warehouse</th>
                                  <th className="p-3 w-28 text-center">Arrived Boxes</th>
                                  <th className="p-3 w-24 text-center">Loose Pcs</th>
                                  <th className="p-3 w-32 text-right">Cost (Per Box)</th>
                                  <th className="p-3 w-32 text-right">Cost (Per Sq.M)</th>
                                  <th className="p-3 w-28 text-right">Cost (Per Pc)</th>
                                  <th className="p-3 w-36 text-right pr-4 font-mono">Line Total</th>
                                  <th className="p-3 w-10 text-center"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-teal-200 dark:divide-teal-800/40">
                                {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                                  const isCurrentSkuActive = activeTileSkuIndex === tIdx;
                                  const isCurrentProdActive = activeTileProdIndex === tIdx;

                                  const filteredTileSkus = tileProducts.filter(p => {
                                    if (!tItem.skuCode) return true;
                                    const q = (tItem.skuCode || '').toLowerCase().trim();
                                    const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                    const name = (p.product_name || '').toLowerCase();
                                    return sku.includes(q) || name.includes(q);
                                  });

                                  const filteredTileProds = tileProducts.filter(p => {
                                    if (!tItem.itemName) return true;
                                    const q = (tItem.itemName || '').toLowerCase().trim();
                                    const name = (p.product_name || '').toLowerCase();
                                    const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                    return name.includes(q) || sku.includes(q);
                                  });

                                  return (
                                    <tr
                                      key={tItem.id || tIdx}
                                      className={`text-xs transition ${
                                        isCurrentSkuActive || isCurrentProdActive
                                          ? 'relative z-50 bg-teal-100/50 dark:bg-teal-900/30'
                                          : 'relative z-10 bg-white/70 dark:bg-boxdark/70 hover:bg-teal-50/50 dark:hover:bg-teal-900/10'
                                      }`}
                                    >
                                      <td className="p-3 text-center text-teal-700 font-sans">{tIdx + 1}</td>

                                      {/* Tile Code SKU Search */}
                                      <td className="p-3 relative tile-sku-container">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            autoComplete="off"
                                            value={tItem.skuCode || ''}
                                            onFocus={() => {
                                              setActiveTileSkuIndex(tIdx);
                                              setActiveTileProdIndex(null);
                                              setHighlightedTileSkuIndex(0);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setHighlightedTileSkuIndex(prev => prev < filteredTileSkus.length - 1 ? prev + 1 : 0);
                                              } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setHighlightedTileSkuIndex(prev => prev > 0 ? prev - 1 : filteredTileSkus.length - 1);
                                              } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (filteredTileSkus[highlightedTileSkuIndex]) {
                                                  handleTileProductSelection(filteredTileSkus[highlightedTileSkuIndex], tIdx, tItem, setFieldValue);
                                                  setActiveTileSkuIndex(null);
                                                }
                                              } else if (e.key === 'Escape' || e.key === 'Tab') {
                                                setActiveTileSkuIndex(null);
                                              }
                                            }}
                                            onChange={(e) => {
                                              setFieldValue(`tileItems.${tIdx}.skuCode`, e.target.value);
                                              setActiveTileSkuIndex(tIdx);
                                              setActiveTileProdIndex(null);
                                              setHighlightedTileSkuIndex(0);
                                            }}
                                            placeholder="TYPE SKU..."
                                            className="w-full rounded border border-teal-300 dark:border-teal-700 p-2 text-xs bg-white dark:bg-boxdark font-mono font-bold outline-none text-black dark:text-white uppercase focus:border-teal-600"
                                          />
                                          {isCurrentSkuActive && (
                                            <div className="absolute left-0 top-full mt-1 z-[999999] w-72 max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-teal-300 dark:border-teal-700 rounded-lg shadow-2xl divide-y divide-teal-100 dark:divide-teal-900/40">
                                              {filteredTileSkus.length > 0 ? (
                                                filteredTileSkus.map((p: any, pIdx: number) => {
                                                  const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                                  return (
                                                    <div
                                                      key={p.id}
                                                      onMouseEnter={() => setHighlightedTileSkuIndex(pIdx)}
                                                      onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleTileProductSelection(p, tIdx, tItem, setFieldValue);
                                                        setActiveTileSkuIndex(null);
                                                      }}
                                                      className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                                        highlightedTileSkuIndex === pIdx
                                                          ? 'bg-teal-600 text-white font-bold'
                                                          : 'hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-800 dark:text-slate-100'
                                                      }`}
                                                    >
                                                      <div>
                                                        <span className="font-mono font-bold block">{displaySku}</span>
                                                        <span className="text-[10px] opacity-80 block truncate max-w-[180px]">{p.product_name}</span>
                                                      </div>
                                                      <div className="text-right">
                                                        <span className="font-mono font-bold block">Rs. {Number(p.purchase_price || 0).toLocaleString()}</span>
                                                        <span className="text-[10px] opacity-75">{p.sub_sub_category || 'Tile'}</span>
                                                      </div>
                                                    </div>
                                                  );
                                                })
                                              ) : (
                                                <div className="p-3 text-center text-xs text-slate-400 italic">No matching tile SKU found</div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Tile Product Description Search */}
                                      <td className="p-3 relative tile-prod-container min-w-[240px]">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            autoComplete="off"
                                            value={tItem.itemName || ''}
                                            onFocus={() => {
                                              setActiveTileProdIndex(tIdx);
                                              setActiveTileSkuIndex(null);
                                              setHighlightedTileProdIndex(0);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setHighlightedTileProdIndex(prev => prev < filteredTileProds.length - 1 ? prev + 1 : 0);
                                              } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setHighlightedTileProdIndex(prev => prev > 0 ? prev - 1 : filteredTileProds.length - 1);
                                              } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (filteredTileProds[highlightedTileProdIndex]) {
                                                  handleTileProductSelection(filteredTileProds[highlightedTileProdIndex], tIdx, tItem, setFieldValue);
                                                  setActiveTileProdIndex(null);
                                                }
                                              } else if (e.key === 'Escape' || e.key === 'Tab') {
                                                setActiveTileProdIndex(null);
                                              }
                                            }}
                                            onChange={(e) => {
                                              setFieldValue(`tileItems.${tIdx}.itemName`, e.target.value);
                                              setActiveTileProdIndex(tIdx);
                                              setActiveTileSkuIndex(null);
                                              setHighlightedTileProdIndex(0);
                                            }}
                                            placeholder="Search Tile Name / Category..."
                                            className="w-full rounded border border-teal-300 dark:border-teal-700 p-2 text-xs bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white focus:border-teal-600"
                                          />
                                          {isCurrentProdActive && (
                                            <div className="absolute left-0 top-full mt-1 z-[999999] w-80 max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-teal-300 dark:border-teal-700 rounded-lg shadow-2xl divide-y divide-teal-100 dark:divide-teal-900/40">
                                              {filteredTileProds.length > 0 ? (
                                                filteredTileProds.map((p: any, pIdx: number) => {
                                                  return (
                                                    <div
                                                      key={p.id}
                                                      onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                                      onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleTileProductSelection(p, tIdx, tItem, setFieldValue);
                                                        setActiveTileProdIndex(null);
                                                      }}
                                                      className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                                        highlightedTileProdIndex === pIdx
                                                          ? 'bg-teal-600 text-white font-bold'
                                                          : 'hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-800 dark:text-slate-100'
                                                      }`}
                                                    >
                                                      <div>
                                                        <span className="font-bold block">{p.product_name}</span>
                                                        <span className="text-[10px] opacity-80 block">{p.item_sr_no || `SKU-${p.id}`} • {p.sub_sub_category || p.category || 'Tile'}</span>
                                                      </div>
                                                      <div className="text-right">
                                                        <span className="font-mono font-bold block">Rs. {Number(p.purchase_price || 0).toLocaleString()}</span>
                                                        <span className="text-[10px] opacity-75">{p.pieces_per_box || 4} pcs/box</span>
                                                      </div>
                                                    </div>
                                                  );
                                                })
                                              ) : (
                                                <div className="p-3 text-center text-xs text-slate-400 italic">No matching tile products found</div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Destination Warehouse */}
                                      <td className="p-3 w-44">
                                        <select
                                          name={`tileItems.${tIdx}.warehouse`}
                                          value={tItem.warehouse || locations[0]?.name || 'Main Warehouse'}
                                          onChange={(e) => setFieldValue(`tileItems.${tIdx}.warehouse`, e.target.value)}
                                          className="w-full rounded border border-teal-300 dark:border-teal-700 p-2 text-xs bg-white dark:bg-boxdark font-bold text-black dark:text-white outline-none focus:border-teal-600"
                                        >
                                          {locations.map((loc) => (
                                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                                          ))}
                                        </select>
                                      </td>

                                      {/* Arrived Boxes */}
                                      <td className="p-3 w-28 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          value={tItem.boxQty ?? 0}
                                          onChange={(e) => updateTileRowCalcs('boxQty', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)}
                                          className="w-full text-center font-black font-mono bg-white dark:bg-boxdark border border-teal-300 dark:border-teal-700 rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-teal-600"
                                        />
                                      </td>

                                      {/* Loose Pcs */}
                                      <td className="p-3 w-24 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          value={tItem.loosePcs ?? 0}
                                          onChange={(e) => updateTileRowCalcs('loosePcs', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)}
                                          className="w-full text-center font-black font-mono bg-white dark:bg-boxdark border border-teal-300 dark:border-teal-700 rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-teal-600"
                                        />
                                      </td>

                                      {/* Cost Price Per Box */}
                                      <td className="p-3 w-32 text-right">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          value={tItem.costPricePerBox ?? 0}
                                          onChange={(e) => updateTileRowCalcs('costPricePerBox', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)}
                                          className="w-full text-right font-black font-mono bg-white dark:bg-boxdark border border-teal-300 dark:border-teal-700 rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-teal-600"
                                        />
                                      </td>

                                      {/* Cost Price Per Sq.M */}
                                      <td className="p-3 w-32 text-right">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          value={tItem.costPricePerSqm ?? 0}
                                          onChange={(e) => updateTileRowCalcs('costPricePerSqm', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)}
                                          className="w-full text-right font-black font-mono bg-white dark:bg-boxdark border border-teal-300 dark:border-teal-700 rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-teal-600"
                                        />
                                      </td>

                                      {/* Cost Price Per Piece */}
                                      <td className="p-3 w-28 text-right">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          value={tItem.costPricePerPiece ?? 0}
                                          onChange={(e) => updateTileRowCalcs('costPricePerPiece', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)}
                                          className="w-full text-right font-black font-mono bg-white dark:bg-boxdark border border-teal-300 dark:border-teal-700 rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-teal-600"
                                        />
                                      </td>

                                      {/* Line Total */}
                                      <td className="p-3 text-right pr-4 text-teal-700 dark:text-teal-400 font-black font-mono">
                                        Rs. {Number(tItem.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>

                                      {/* Delete */}
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => remove(tIdx)}
                                          className="text-gray-400 hover:text-danger transition cursor-pointer"
                                        >
                                          <FiTrash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* Append Tile Row Button */}
                            <div className="p-3 bg-teal-100/40 dark:bg-teal-900/20 border-t border-teal-200 dark:border-teal-800 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => push({
                                  id: `tile-${Date.now()}`,
                                  itemName: '',
                                  skuCode: '',
                                  warehouse: locations[0]?.name || 'Main Warehouse',
                                  boxQty: 1,
                                  loosePcs: 0,
                                  totalSqm: 0,
                                  costPricePerBox: 0,
                                  costPricePerPiece: 0,
                                  costPricePerSqm: 0,
                                  totalAmount: 0,
                                  piecesPerBox: 4,
                                  sqmPerBox: 1.44
                                })}
                                className="inline-flex items-center gap-1 bg-teal-600 text-white font-bold py-1.5 px-3.5 rounded text-xs hover:bg-teal-700 transition cursor-pointer shadow-xs"
                              >
                                <FiPlus size={12} /> Append Tile Row
                              </button>
                              <span className="text-[11px] text-teal-700 dark:text-teal-400 italic">
                                * Cross-calculates boxes, loose pieces & sq.m automatically with your tile box specifications
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    </FieldArray>
                  </div>
                )}

                {/* ── BOTTOM SETTLEMENT BAR: CASH / BANK / SPLIT SWITCHER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 border border-stroke dark:border-strokedark p-5 rounded-sm bg-slate-50/40 dark:bg-meta-4/5 mt-6">

                  {/* Left: Payment Method Controls */}
                  <div className="w-full md:w-1/2 space-y-4">
                    <div>
                      <span className="font-bold text-gray-500 block mb-1">Payment Method / Settlement Mode: *</span>
                      <select
                        name="settlementMode"
                        value={values.settlementMode}
                        onChange={(e) => {
                          handleChange(e);
                          if (e.target.value === 'Cash') {
                            setFieldValue('selectedBankTitle', '');
                            setFieldValue('bankAmountPaid', 0);
                          } else if (e.target.value === 'Bank') {
                            setFieldValue('cashAmountPaid', 0);
                          }
                        }}
                        className="w-full border rounded border-stroke dark:border-strokedark p-2 text-xs bg-white dark:bg-boxdark font-black outline-none text-black dark:text-white focus:border-primary"
                      >
                        <option value="Cash">Cash Only</option>
                        <option value="Bank">Bank Transfer Only</option>
                        <option value="Split">Cash & Bank Combined (Split)</option>
                      </select>
                    </div>

                    {/* Bank Selection Profile */}
                    {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Corporate Source Vault Bank: *</span>
                        <select
                          name="selectedBankTitle"
                          value={values.selectedBankTitle}
                          onChange={handleChange}
                          className={`w-full border rounded p-2 text-xs bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white ${hasAttempted && errors.selectedBankTitle ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'}`}
                        >
                          <option value="">-- Choose Corporate Bank --</option>
                          {bankAccountsList.map(b => (
                            <option key={b.id} value={b.bankName}>{b.bankName} - {b.accountTitle} ({b.accountNumber || '-'})</option>
                          ))}
                        </select>
                        {hasAttempted && errors.selectedBankTitle && <p className="text-red-500 text-[10px] font-bold mt-1">{String(errors.selectedBankTitle)}</p>}
                      </div>
                    )}

                    {/* Amount Inputs */}
                    <div className={values.settlementMode === 'Split' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'w-full'}>
                      {(values.settlementMode === 'Cash' || values.settlementMode === 'Split') && (
                        <div>
                          <span className="font-bold text-rose-600 block mb-1">Cash Payment Amount (PKR):</span>
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            name="cashAmountPaid"
                            value={values.cashAmountPaid === 0 ? '' : values.cashAmountPaid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValue('cashAmountPaid', val === '' ? 0 : Math.max(0, Number(val) || 0));
                            }}
                            placeholder="0"
                            className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark text-right font-black font-mono text-rose-600 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      )}

                      {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
                        <div>
                          <span className="font-bold text-primary block mb-1">Bank Payment Amount (PKR):</span>
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            name="bankAmountPaid"
                            value={values.bankAmountPaid === 0 ? '' : values.bankAmountPaid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValue('bankAmountPaid', val === '' ? 0 : Math.max(0, Number(val) || 0));
                            }}
                            placeholder="0"
                            className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark text-right font-black font-mono text-primary text-sm outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-gray-500 block mb-1">Remarks:</span>
                      <input
                        type="text"
                        name="remarks"
                        value={values.remarks}
                        onChange={handleChange}
                        placeholder="e.g. Factory restock shipment, consignment bill #889"
                        className="w-full border border-stroke dark:border-strokedark rounded p-2 text-xs bg-white dark:bg-boxdark outline-none focus:border-primary font-medium"
                      />
                    </div>
                  </div>

                  {/* Right: Net Summary & Action Buttons */}
                  <div className="w-full md:w-1/2 flex flex-col justify-between self-stretch bg-white dark:bg-boxdark p-5 rounded-xl border border-stroke dark:border-strokedark shadow-xs">
                    <div className="space-y-3 font-mono">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-sans font-bold">Total Bill Value:</span>
                        <strong className="text-black dark:text-white font-black text-base">
                          Rs. {totalBillAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      {values.showTileSection && tileTotalSum > 0 && (
                        <div className="flex justify-between items-center text-xs text-teal-700 dark:text-teal-400">
                          <span className="font-sans font-bold">Tile Purchases Total:</span>
                          <strong className="font-mono font-bold">Rs. {tileTotalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                        </div>
                      )}

                      {values.showAdditionalCharges && (
                        <div className="flex justify-between items-center text-sm text-blue-600 dark:text-blue-400">
                          <span className="font-sans font-bold text-xs">Freight Charges:</span>
                          <input
                            type="number"
                            min="0"
                            name="additionalCharges"
                            value={values.additionalCharges}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="w-28 text-right font-black bg-blue-50/40 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700 rounded p-1 text-xs outline-none focus:border-blue-500 text-blue-700 dark:text-blue-300"
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm text-emerald-600">
                        <span className="font-sans font-bold">Paid Upfront:</span>
                        <strong className="font-black text-base">
                          Rs. {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-sm text-rose-600 pt-2 border-t border-stroke dark:border-strokedark">
                        <span className="font-sans font-bold">Remaining Vendor Payable:</span>
                        <strong className="font-black text-base">
                          Rs. {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      {totalPaid > totalBillAmount + 0.01 && (
                        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
                          <span className="text-[11px] font-black text-red-600 dark:text-red-400">
                            ⚠ Overpayment of Rs. {(totalPaid - totalBillAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} — Cannot save!
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-strokedark">
                      <button
                        type="button"
                        onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`)}
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmitAction('print');
                          setHasAttempted(true);
                          submitForm();
                        }}
                        disabled={loading}
                        className="rounded-xl bg-teal-600 hover:bg-teal-700 py-3 px-6 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                      >
                        <FiPrinter size={15} /> <span>Save & Print</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmitAction('save');
                          setHasAttempted(true);
                          submitForm();
                        }}
                        disabled={loading}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                      >
                        {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <><FiCheckCircle size={15} /> <span>{isEditMode ? 'Update Purchase' : 'Save & Restock'}</span></>}
                      </button>
                    </div>
                  </div>

                </div>

              </Form>
            );
          }}
        </Formik>

      </div>
    </div>
  );
};

export default AddPurchases;
