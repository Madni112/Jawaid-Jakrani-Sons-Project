import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { MdViewModule } from 'react-icons/md';
import { logActivity } from '../../../service/auditLogger';
import { fetchAllUomsSafe } from '../../../service/uomService';
import { saveNewProductColor } from '../../../utils/colorService';

// Extracted helpers & types
import {
  UomItem,
  ProductFormValues,
  getProductInitialValues,
  productValidationSchema
} from './product-form/utils/productFormHelpers';

// Extracted UI sections & modals
import { ProductCategoryIdentitySection } from './product-form/components/ProductCategoryIdentitySection';
import { ProductTileSpecsSection } from './product-form/components/ProductTileSpecsSection';
import { ProductPricingSection } from './product-form/components/ProductPricingSection';
import { DeletePrintConfirmModal } from './product-form/modals/DeletePrintConfirmModal';

const AddProduct = () => {
  const { tenantId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  // Master database lists
  const [categories, setCategories] = useState<any[]>([]);
  const [surfaceFinishes, setSurfaceFinishes] = useState<any[]>([]);
  const [groupedUoms, setGroupedUoms] = useState<{ [key: string]: UomItem[] }>({});
  const [activeUomList, setActiveUomList] = useState<string[]>([]);

  // Tile prints list & search dropdown state
  const [tilePrints, setTilePrints] = useState<{ id?: number | string; name: string; category_id?: number | null }[]>([]);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
  const [highlightedPrintIndex, setHighlightedPrintIndex] = useState(0);

  // Inline edit & delete state for tile prints dropdown
  const [editingPrintName, setEditingPrintName] = useState<string | null>(null);
  const [editPrintInput, setEditPrintInput] = useState<string>('');
  const [deletingPrintItem, setDeletingPrintItem] = useState<{ id?: number | string; name: string } | null>(null);

  // Dropdown UI states
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);
  const [highlightedUomIndex, setHighlightedUomIndex] = useState(0);

  const [isLooseUomDropdownOpen, setIsLooseUomDropdownOpen] = useState(false);
  const [highlightedLooseUomIndex, setHighlightedLooseUomIndex] = useState(0);
  const [editingUomItem, setEditingUomItem] = useState<{ id?: string | number; short_code: string; full_name?: string } | null>(null);
  const [editUomInput, setEditUomInput] = useState('');

  const [isBinDropdownOpen, setIsBinDropdownOpen] = useState(false);
  const [highlightedBinIndex, setHighlightedBinIndex] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.product;
  const isEditMode = !!editData;

  const fetchTilePrintsFromDb = async (parentCatName?: string) => {
    try {
      const parent = categories.find(
        (c: any) =>
          c.parent_id === null &&
          c.name?.trim().toLowerCase() === String(parentCatName || '').trim().toLowerCase()
      );
      let query = supabase.from('inventory_prints').select('*').order('name', { ascending: true });
      if (parent?.id) {
        query = query.or(`category_id.eq.${parent.id},category_id.is.null`);
      }
      const { data, error } = await query;
      if (!error && data) {
        setTilePrints(data);
        return;
      }
    } catch (e) {}

    // Fallback to localStorage if table not yet created
    try {
      const saved =
        localStorage.getItem('zac_tile_prints') || localStorage.getItem('zac_tile_prints');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTilePrints(parsed.map((p: any) => (typeof p === 'string' ? { name: p } : p)));
          return;
        }
      }
    } catch (e) {}
    setTilePrints([]);
  };

  const handleAddPrint = async (
    newPrintName: string,
    setFieldValue?: (f: string, v: any) => void,
    parentCatName?: string
  ) => {
    const clean = newPrintName.trim();
    if (!clean) {
      toast.error('Print name cannot be empty');
      return;
    }
    if (tilePrints.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
      toast.error('A print with this name already exists');
      return;
    }

    const parent = categories.find(
      (c: any) =>
        c.parent_id === null &&
        c.name?.trim().toLowerCase() === String(parentCatName || '').trim().toLowerCase()
    );
    let insertedItem: { id?: number | string; name: string; category_id?: number | null } = {
      name: clean
    };

    try {
      const { data, error } = await supabase
        .from('inventory_prints')
        .insert([{ name: clean, category_id: parent?.id || null }])
        .select()
        .single();
      if (!error && data) {
        insertedItem = data;
      }
    } catch (e) {}

    const updated = [...tilePrints, insertedItem];
    setTilePrints(updated);
    try {
      localStorage.setItem('zac_tile_prints', JSON.stringify(updated));
      localStorage.setItem('zac_tile_prints', JSON.stringify(updated));
    } catch (err) {}

    if (setFieldValue) {
      setFieldValue('tilePrint', clean);
    }
    toast.success(`Print "${clean}" added successfully!`);
  };

  const handleStartEditPrint = (e: React.MouseEvent, pName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPrintName(pName);
    setEditPrintInput(pName);
  };

  const handleSaveEditPrint = async (
    e: React.MouseEvent | React.KeyboardEvent,
    oldItem: { id?: number | string; name: string },
    setFieldValue?: (f: string, v: any) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = editPrintInput.trim();
    if (!clean) {
      toast.error('Print name cannot be empty');
      return;
    }
    if (
      clean.toLowerCase() !== oldItem.name.toLowerCase() &&
      tilePrints.some((p) => p.name.toLowerCase() === clean.toLowerCase())
    ) {
      toast.error('A print with this name already exists');
      return;
    }

    try {
      if (oldItem.id) {
        await supabase.from('inventory_prints').update({ name: clean }).eq('id', oldItem.id);
      } else {
        await supabase.from('inventory_prints').update({ name: clean }).eq('name', oldItem.name);
      }
    } catch (e) {}

    const updated = tilePrints.map((p) => (p.name === oldItem.name ? { ...p, name: clean } : p));
    setTilePrints(updated);
    try {
      localStorage.setItem('zac_tile_prints', JSON.stringify(updated));
      localStorage.setItem('zac_tile_prints', JSON.stringify(updated));
    } catch (err) {}

    if (setFieldValue) {
      setFieldValue('tilePrint', clean);
    }
    setEditingPrintName(null);
    setEditPrintInput('');
    toast.success(`Print updated to "${clean}"`);
  };

  const handleCancelEditPrint = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPrintName(null);
    setEditPrintInput('');
  };

  const handleStartDeletePrint = (
    e: React.MouseEvent,
    item: { id?: number | string; name: string }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPrintDropdownOpen(false);
    setDeletingPrintItem(item);
  };

  const handleConfirmDeletePrint = async (
    setFieldValue?: (f: string, v: any) => void,
    currentVal?: string
  ) => {
    if (!deletingPrintItem) return;
    const itemToDelete = deletingPrintItem;

    try {
      if (itemToDelete.id) {
        await supabase.from('inventory_prints').delete().eq('id', itemToDelete.id);
      } else {
        await supabase.from('inventory_prints').delete().eq('name', itemToDelete.name);
      }
    } catch (e) {}

    const updated = tilePrints.filter((p) => p.name !== itemToDelete.name);
    setTilePrints(updated);
    try {
      localStorage.setItem('zac_tile_prints', JSON.stringify(updated));
      localStorage.setItem('zac_tile_prints', JSON.stringify(updated));
    } catch (err) {}

    if (setFieldValue && currentVal === itemToDelete.name) {
      setFieldValue('tilePrint', '');
    }
    setDeletingPrintItem(null);
    toast.success(`Print "${itemToDelete.name}" deleted`);
  };

  useEffect(() => {
    const fetchAllMasterMetadata = async () => {
      try {
        setMetadataLoading(true);

        const { data: catData } = await supabase
          .from('inventory_categories')
          .select('id, name, code, parent_id')
          .order('name', { ascending: true });

        try {
          const { data: finishData } = await supabase
            .from('inventory_surface_finishes')
            .select('id, name')
            .order('name', { ascending: true });
          if (finishData && finishData.length > 0) {
            setSurfaceFinishes(finishData);
          } else {
            const local = localStorage.getItem('zac_surface_finishes');
            if (local) setSurfaceFinishes(JSON.parse(local));
          }
        } catch (e) {
          const local = localStorage.getItem('zac_surface_finishes');
          if (local) setSurfaceFinishes(JSON.parse(local));
        }

        const uomAll = await fetchAllUomsSafe(tenantId);
        const uomData = uomAll.filter((u) => u.is_active);
        const activeCodes = Array.from(
          new Set(uomData.map((u) => String(u.short_code || '').trim().toUpperCase()))
        ).filter(Boolean);
        setActiveUomList(activeCodes);

        if (catData) setCategories(catData);

        if (uomData && uomData.length > 0) {
          const groups = uomData.reduce((acc: { [key: string]: UomItem[] }, curr: any) => {
            const cat = curr.category || 'General';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(curr);
            return acc;
          }, {});
          setGroupedUoms(groups);
        }

        fetchTilePrintsFromDb();
      } catch (err: any) {
        console.error('Metadata aggregation error: ', err.message);
        toast.error('Failed to load setup configurations');
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchAllMasterMetadata();
  }, []);

  if (metadataLoading) {
    return (
      <div className="flex h-48 items-center justify-center bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 font-sans">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] overflow-hidden">
        {/* HEADER BAR */}
        <div className="border-b border-slate-100 py-4.5 px-6.5 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {isEditMode ? `Edit Product: ${editData.product_name}` : 'Add New Product Master Item'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select category to automatically load product or tile-specific dimension &amp; packaging fields
            </p>
          </div>
          <button
            onClick={() => navigate('/Administration/Products/List')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            ← Back to List
          </button>
        </div>

        <Formik
          initialValues={getProductInitialValues(editData, isEditMode)}
          enableReinitialize={true}
          validationSchema={productValidationSchema}
          onSubmit={async (values) => {
            setLoading(true);
            const isTileCategory = String(values.subSubCategory || '')
              .trim()
              .toLowerCase()
              .includes('tile');
            const computedProfit =
              (Number(values.retailPrice) || 0) +
              (values.itemType === 'service' ? Number(values.serviceCharges) || 0 : 0) -
              (Number(values.purchasePrice) || 0);

            let finalDescription = '';
            let finalUom = values.uom;
            let finalHsCode = values.hsCode?.trim() || '';
            let finalItemSrNo = values.itemSrNo?.trim() || '';
            const rawLooseRatio = Number(values.looseConversionRatio) || 0;
            const rawPcsBox = Number(values.piecesPerBox) || 0;
            const pcs = isTileCategory
              ? (rawPcsBox > 0 ? rawPcsBox : (rawLooseRatio > 0 ? rawLooseRatio : 4))
              : (values.allowLooseSales && rawLooseRatio > 0 ? rawLooseRatio : (rawPcsBox > 0 ? rawPcsBox : 1));

            if (isTileCategory) {
              const h = Number(values.tileHeight) || 0;
              const w = Number(values.tileWidth) || 0;
              if (h <= 0 || w <= 0 || pcs <= 0) {
                toast.error('Please enter valid Tile Height, Tile Width, and Pieces Per Box.');
                setLoading(false);
                return;
              }
              const unit = values.tileDimensionUnit || 'cm';
              let sqMetersPerTile = 0;
              let unitLabel = 'cm';
              if (unit === 'in') {
                unitLabel = 'in';
                sqMetersPerTile = h > 0 && w > 0 ? h * 0.025 * (w * 0.025) : 0;
              } else if (unit === 'm') {
                unitLabel = 'm';
                sqMetersPerTile = h > 0 && w > 0 ? h * w : 0;
              } else {
                unitLabel = 'cm';
                sqMetersPerTile = h > 0 && w > 0 ? (h * w) / 10000 : 0;
              }
              const totalSqMetersPerBox = sqMetersPerTile * pcs;
              const tileSizeFormatted = `${h} × ${w} ${unitLabel}`;

              finalDescription = `[TILE PRODUCT] Size: ${tileSizeFormatted} | Box: ${pcs} pcs (${totalSqMetersPerBox.toFixed(
                4
              )} sq.m / box) | Finish: ${values.finishType}${
                values.tilePrint ? ` | Print: ${values.tilePrint}` : ''
              }${values.color ? ` | Color: ${values.color.trim()}` : ''}${
                values.tileThickness ? ` | Thickness: ${values.tileThickness}` : ''
              }${values.weightPerBox ? ` | Wt: ${values.weightPerBox}kg` : ''}`;
              finalUom = values.uom || 'BOX';
              finalHsCode = values.hsCode?.trim() || '6907.2100';
              finalItemSrNo = values.itemSrNo?.trim() || tileSizeFormatted;
            } else {
              if (values.color && String(values.color).trim()) {
                finalDescription = `Color: ${String(values.color).trim()}`;
              }
            }

            if (values.color && String(values.color).trim()) {
              saveNewProductColor(String(values.color).trim()).catch(() => {});
            }

            const databasePayload = {
              item_type: values.itemType || 'goods',
              product_name: String(values.productName || '').replace(/\s+/g, ' ').trim(),
              category: values.category,
              sub_category: values.subCategory,
              sub_sub_category: values.subSubCategory,
              uom: finalUom || 'PCS',
              bin: values.finishType?.trim() || '',
              product_description: finalDescription,
              profit: computedProfit,
              purchase_price: Number(values.purchasePrice) || 0,
              scenario_name: values.scenarioName || (isTileCategory ? 'Tile Metric' : ''),
              mrp: Number(values.mrp) || Number(values.retailPrice) || 0,
              retail_price: Number(values.retailPrice) || 0,
              service_charges:
                values.itemType === 'service' ? Number(values.serviceCharges) || 0 : 0,
              min_stock_alert:
                values.minStockAlert !== '' && values.minStockAlert !== null
                  ? Number(values.minStockAlert)
                  : 0,
              pieces_per_box: pcs,
              pcs_per_box: pcs,
              pieces_per_packing: pcs,
              allow_loose_sales: isTileCategory ? true : Boolean(values.allowLooseSales),
              loose_uom: isTileCategory
                ? 'PCS'
                : values.allowLooseSales
                ? String(values.looseUom || 'PCS').trim().toUpperCase()
                : '',
              loose_conversion_ratio: isTileCategory
                ? pcs
                : values.allowLooseSales
                ? (rawLooseRatio > 0 ? rawLooseRatio : pcs)
                : 1,
              loose_purchase_price: isTileCategory
                ? pcs > 0
                ? Number(((Number(values.purchasePrice) || 0) / pcs).toFixed(2))
                  : 0
                : values.allowLooseSales && values.loosePurchasePrice
                ? Number(values.loosePurchasePrice)
                : 0,
              loose_sale_price: isTileCategory
                ? pcs > 0
                  ? Number(((Number(values.retailPrice) || 0) / pcs).toFixed(2))
                  : 0
                : values.allowLooseSales && values.looseSalePrice
                ? Number(values.looseSalePrice)
                : 0,
              multi_loose_units: isTileCategory
                ? [
                    {
                      id: 'tile-pc',
                      uom: 'PCS',
                      ratio: pcs,
                      costPrice: pcs > 0 ? Number(((Number(values.purchasePrice) || 0) / pcs).toFixed(2)) : 0,
                      salePrice: pcs > 0 ? Number(((Number(values.retailPrice) || 0) / pcs).toFixed(2)) : 0
                    }
                  ]
                : values.allowLooseSales
                ? (values.looseTiers && values.looseTiers.length > 0
                    ? values.looseTiers
                    : [
                        {
                          id: 'tier-1',
                          uom: String(values.looseUom || 'PCS').trim().toUpperCase(),
                          ratio: rawLooseRatio > 0 ? rawLooseRatio : pcs,
                          costPrice: values.loosePurchasePrice || 0,
                          salePrice: values.looseSalePrice || 0
                        }
                      ])
                : [],
              hs_code: finalHsCode,
              item_sr_no: finalItemSrNo,
              sro_schedule_no: values.sroScheduleNo?.trim() || ''
            };

            try {
              // SKU Uniqueness Validation: Prevent duplicate Codes
              if (finalItemSrNo) {
                let skuQuery = supabase
                  .from('products')
                  .select('id, product_name, item_sr_no')
                  .ilike('item_sr_no', finalItemSrNo.trim());

                if (isEditMode && editData?.id) {
                  skuQuery = skuQuery.neq('id', editData.id);
                }

                const { data: existingSku, error: skuCheckError } = await skuQuery;
                if (skuCheckError) console.warn('SKU Check warning:', skuCheckError);

                if (existingSku && existingSku.length > 0) {
                  toast.error(
                    `Code "${finalItemSrNo}" is already assigned to "${existingSku[0].product_name}". Each product must have a unique SKU!`,
                    { duration: 5000 }
                  );
                  setLoading(false);
                  return;
                }
              }

              if (isEditMode) {
                let { error } = await supabase
                  .from('products')
                  .update(databasePayload)
                  .eq('id', editData.id);

                if (
                  error &&
                  (error.message?.includes('multi_loose_units') ||
                    error.message?.includes('allow_loose_sales') ||
                    error.code === '42703' ||
                    error.message?.includes('schema cache'))
                ) {
                  // If multi_loose_units column does not exist yet in Supabase, strip it and retry
                  const {
                    multi_loose_units,
                    ...withoutMulti
                  } = databasePayload;

                  let retry = await supabase
                    .from('products')
                    .update(withoutMulti)
                    .eq('id', editData.id);

                  if (
                    retry.error &&
                    (retry.error.message?.includes('allow_loose_sales') ||
                      retry.error.code === '42703' ||
                      retry.error.message?.includes('schema cache'))
                  ) {
                    const {
                      allow_loose_sales,
                      loose_uom,
                      loose_conversion_ratio,
                      loose_purchase_price,
                      loose_sale_price,
                      ...cleanPayload
                    } = withoutMulti;
                    retry = await supabase
                      .from('products')
                      .update(cleanPayload)
                      .eq('id', editData.id);
                  }
                  error = retry.error;
                }

                if (error) throw error;

                logActivity({
                  action: 'UPDATE',
                  tableName: 'products',
                  details: {
                    product_name: values.productName,
                    item_code: finalItemSrNo,
                    category: values.category,
                    retail_price: values.retailPrice,
                    purchase_price: values.purchasePrice,
                    event: 'Updated Product Master'
                  },
                  performedBy: user?.name || user?.email || 'User'
                });

                // Cache multi-tier loose units locally for Jawaid Jakwani & Sons
                try {
                  const multiMap = JSON.parse(localStorage.getItem('jj_multi_loose_units') || '{}');
                  multiMap[editData.id] = databasePayload.multi_loose_units || [];
                  if (finalItemSrNo) multiMap[finalItemSrNo] = databasePayload.multi_loose_units || [];
                  localStorage.setItem('jj_multi_loose_units', JSON.stringify(multiMap));
                } catch (e) {}
                toast.success('Product updated successfully!');
              } else {
                let { error } = await supabase.from('products').insert([databasePayload]);

                if (
                  error &&
                  (error.message?.includes('multi_loose_units') ||
                    error.message?.includes('allow_loose_sales') ||
                    error.code === '42703' ||
                    error.message?.includes('schema cache'))
                ) {
                  // If multi_loose_units column does not exist yet in Supabase, strip it and retry
                  const {
                    multi_loose_units,
                    ...withoutMulti
                  } = databasePayload;

                  let retry = await supabase.from('products').insert([withoutMulti]);

                  if (
                    retry.error &&
                    (retry.error.message?.includes('allow_loose_sales') ||
                      retry.error.code === '42703' ||
                      retry.error.message?.includes('schema cache'))
                  ) {
                    const {
                      allow_loose_sales,
                      loose_uom,
                      loose_conversion_ratio,
                      loose_purchase_price,
                      loose_sale_price,
                      ...cleanPayload
                    } = withoutMulti;
                    retry = await supabase.from('products').insert([cleanPayload]);
                  }
                  error = retry.error;
                }

                if (error) throw error;

                logActivity({
                  action: 'INSERT',
                  tableName: 'products',
                  details: {
                    product_name: values.productName,
                    item_code: finalItemSrNo,
                    category: values.category,
                    retail_price: values.retailPrice,
                    purchase_price: values.purchasePrice,
                    event: 'Created Product Master'
                  },
                  performedBy: user?.name || user?.email || 'User'
                });

                toast.success('Product saved successfully!');
              }
              navigate('/Administration/Products/List');
            } catch (err: any) {
              toast.error('Database Operation Failure: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, errors, touched, setFieldValue }) => {
            const isTileCategory = String(values.subSubCategory || '')
              .trim()
              .toLowerCase()
              .includes('tile');

            // Tile Live Calculations
            const tileH = Number(values.tileHeight) || 0;
            const tileW = Number(values.tileWidth) || 0;
            const tilePcs = Number(values.piecesPerBox) || 0;
            const unit = values.tileDimensionUnit || 'cm';
            let sqMetersPerTile = 0;
            let unitSuffix = 'cm';
            if (unit === 'in') {
              unitSuffix = 'in';
              sqMetersPerTile = tileH > 0 && tileW > 0 ? tileH * 0.025 * (tileW * 0.025) : 0;
            } else if (unit === 'm') {
              unitSuffix = 'm';
              sqMetersPerTile = tileH > 0 && tileW > 0 ? tileH * tileW : 0;
            } else {
              unitSuffix = 'cm';
              sqMetersPerTile = tileH > 0 && tileW > 0 ? (tileH * tileW) / 10000 : 0;
            }
            const totalSqMetersPerBox = sqMetersPerTile * tilePcs;
            const tileSizeFormatted = tileH > 0 && tileW > 0 ? `${tileH} × ${tileW} ${unitSuffix}` : '—';

            const numSale = Number(values.retailPrice) || 0;
            const numPurchase = Number(values.purchasePrice) || 0;
            const numSqm = totalSqMetersPerBox > 0 ? totalSqMetersPerBox : 1;

            const salePerSqm = (numSale / numSqm).toFixed(2);
            const salePerPiece = (numSale / tilePcs).toFixed(2);
            const purchasePerSqm = (numPurchase / numSqm).toFixed(2);
            const purchasePerPiece = (numPurchase / tilePcs).toFixed(2);

            const numServiceCharges =
              values.itemType === 'service' ? Number(values.serviceCharges) || 0 : 0;
            const totalRevenue = numSale + numServiceCharges;
            const profit = totalRevenue - numPurchase;
            const profitMarginPercent =
              numPurchase > 0 ? ((profit / numPurchase) * 100).toFixed(1) : '0';

            useEffect(() => {
              setFieldValue('profit', profit.toFixed(2));
              if (isTileCategory && !values.uom) {
                setFieldValue('uom', 'BOX');
              }
            }, [numSale, numPurchase, isTileCategory, setFieldValue]);

            return (
              <Form className="p-6.5 text-xs text-slate-700 dark:text-slate-200 space-y-6">
                {/* ITEM TYPE TAB SWITCHER */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                  {(['goods', 'service'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFieldValue('itemType', type)}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                        values.itemType === type
                          ? type === 'goods'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-indigo-500 text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {type === 'goods' ? '📦 Goods Item' : '🛠️ Service Item'}
                    </button>
                  ))}
                </div>

                {/* 1. CORE PRODUCT ATTRIBUTES */}
                <ProductCategoryIdentitySection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  categories={categories}
                  isTileCategory={isTileCategory}
                  fetchTilePrintsFromDb={fetchTilePrintsFromDb}
                  tilePrints={tilePrints}
                  isPrintDropdownOpen={isPrintDropdownOpen}
                  setIsPrintDropdownOpen={setIsPrintDropdownOpen}
                  highlightedPrintIndex={highlightedPrintIndex}
                  setHighlightedPrintIndex={setHighlightedPrintIndex}
                  editingPrintName={editingPrintName}
                  editPrintInput={editPrintInput}
                  setEditPrintInput={setEditPrintInput}
                  handleStartEditPrint={handleStartEditPrint}
                  handleSaveEditPrint={handleSaveEditPrint}
                  handleCancelEditPrint={handleCancelEditPrint}
                  handleStartDeletePrint={handleStartDeletePrint}
                  handleAddPrint={handleAddPrint}
                  surfaceFinishes={surfaceFinishes}
                  isBinDropdownOpen={isBinDropdownOpen}
                  setIsBinDropdownOpen={setIsBinDropdownOpen}
                  highlightedBinIndex={highlightedBinIndex}
                  setHighlightedBinIndex={setHighlightedBinIndex}
                  activeUomList={activeUomList}
                  groupedUoms={groupedUoms}
                  isUomDropdownOpen={isUomDropdownOpen}
                  setIsUomDropdownOpen={setIsUomDropdownOpen}
                  highlightedUomIndex={highlightedUomIndex}
                  setHighlightedUomIndex={setHighlightedUomIndex}
                />

                {/* 2. DYNAMIC TILE SPECIFIC SECTION */}
                {isTileCategory && (
                  <ProductTileSpecsSection
                    values={values}
                    handleChange={handleChange}
                    tileSizeFormatted={tileSizeFormatted}
                    sqMetersPerTile={sqMetersPerTile}
                    totalSqMetersPerBox={totalSqMetersPerBox}
                  />
                )}

                {/* 4. PRICING SECTION */}
                <ProductPricingSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  isTileCategory={isTileCategory}
                  profit={profit}
                  profitMarginPercent={profitMarginPercent}
                  purchasePerPiece={purchasePerPiece}
                  purchasePerSqm={purchasePerSqm}
                  salePerPiece={salePerPiece}
                  salePerSqm={salePerSqm}
                  activeUomList={activeUomList}
                  setActiveUomList={setActiveUomList}
                  isLooseUomDropdownOpen={isLooseUomDropdownOpen}
                  setIsLooseUomDropdownOpen={setIsLooseUomDropdownOpen}
                  highlightedLooseUomIndex={highlightedLooseUomIndex}
                  setHighlightedLooseUomIndex={setHighlightedLooseUomIndex}
                  editingUomItem={editingUomItem}
                  setEditingUomItem={setEditingUomItem}
                  editUomInput={editUomInput}
                  setEditUomInput={setEditUomInput}
                />

                {/* FORM ACTIONS */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/Administration/Products/List')}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? <Spinner /> : <MdViewModule className="text-base" />}
                    <span>
                      {isEditMode
                        ? 'Update Product'
                        : isTileCategory
                        ? 'Save Tile Product'
                        : 'Save Product'}
                    </span>
                  </button>
                </div>

                {/* DELETE PRINT CONFIRMATION MODAL POPUP */}
                <DeletePrintConfirmModal
                  deletingPrintItem={deletingPrintItem}
                  onCancel={() => setDeletingPrintItem(null)}
                  onConfirm={() => handleConfirmDeletePrint(setFieldValue, values.tilePrint)}
                />
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default AddProduct;
