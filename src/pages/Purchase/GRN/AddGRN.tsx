import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import Spinner from '../../../ui/Spinner';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import { MdInventory, MdArrowBack } from 'react-icons/md';
import { getWarehouseAvailableStock, fetchStockDataset } from '../../../utils/stockCalculator';

// Searchable Location/Warehouse Selector showing live stock
interface WarehouseSelectProps {
  locations: any[];
  selectedWarehouse: string;
  onSelect: (whName: string) => void;
  productName?: string;
  getLocationStock: (prodName: string, whName: string) => number;
  uom?: string;
}

const WarehouseSelect: React.FC<WarehouseSelectProps> = ({
  locations,
  selectedWarehouse,
  onSelect,
  productName = '',
  getLocationStock,
  uom = 'Nos'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const query = (isOpen ? search : '').toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!query) return locations;
    return locations.filter(l => String(l.name || '').toLowerCase().includes(query));
  }, [locations, query]);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={isOpen ? search : (selectedWarehouse || '')}
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
            setHighlightedIndex(0);
          }}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex(prev => prev < filtered.length - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex(prev => prev > 0 ? prev - 1 : filtered.length - 1);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered[highlightedIndex]) {
                onSelect(filtered[highlightedIndex].name);
                setIsOpen(false);
                setSearch('');
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
              setSearch('');
            }
          }}
          placeholder="Search warehouse..."
          className="w-full rounded border border-stroke dark:border-strokedark p-2 pr-6 bg-white dark:bg-boxdark font-bold text-xs outline-none focus:border-primary shadow-xs"
        />
        <span
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) {
              setSearch('');
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 cursor-pointer select-none"
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-[999999] min-w-[260px] w-full max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-xl shadow-2xl divide-y divide-stroke dark:divide-strokedark">
          {filtered.length > 0 ? (
            filtered.map((l, lIdx) => {
              const stock = productName ? getLocationStock(productName, l.name) : 0;
              const isSelected = l.name === selectedWarehouse;
              const isHighlighted = highlightedIndex === lIdx;
              return (
                <div
                  key={l.name || lIdx}
                  onMouseEnter={() => setHighlightedIndex(lIdx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(l.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-2.5 cursor-pointer text-xs flex items-center justify-between transition ${
                    isHighlighted || isSelected
                      ? 'bg-primary/10 border-l-4 border-primary text-black dark:text-white font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold block truncate">{l.name}</span>
                    {l.location_type && (
                      <span className="text-[9px] text-gray-400 uppercase">{l.location_type}</span>
                    )}
                  </div>
                  {productName && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-300 shrink-0">
                      Stock: {stock}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 italic">No warehouses found</div>
          )}
        </div>
      )}
    </div>
  );
};

const AddGRN = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prefLoc = searchParams.get('prefLoc');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [openDropdownRowIndex, setOpenDropdownRowIndex] = useState<number | null>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState(0);
  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [highlightedSkuIndex, setHighlightedSkuIndex] = useState(0);
  const [activeTileSkuIndex, setActiveTileSkuIndex] = useState<number | null>(null);
  const [highlightedTileSkuIndex, setHighlightedTileSkuIndex] = useState(0);
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.vendor-search-container')) {
        setIsVendorDropdownOpen(false);
      }
      if (!target.closest('.sku-container')) {
        setActiveSkuIndex(null);
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

  const isTileProduct = (p: any) => {
    if (!p) return false;
    const cat = String(p.category || '').toLowerCase().trim();
    const sub = String(p.sub_category || '').toLowerCase().trim();
    const subsub = String(p.sub_sub_category || '').toLowerCase().trim();
    const scn = String(p.scenario_name || '').toLowerCase().trim();
    const desc = String(p.product_description || '').toLowerCase().trim();
    const name = String(p.product_name || '').toLowerCase().trim();
    const uom = String(p.uom || '').toUpperCase().trim();

    const isNonTile = /jalli|drain|grate|grating|waste|strainer|trap|pipe|pvc|sanitary|faucet|mixer|basin|commode|tap|sink|hardware|grout|bond/i.test(name) ||
                      /sanitary|plumbing|hardware|accessories|cp fittings/i.test(cat);
    if (isNonTile) return false;

    return (
      subsub.includes('tile') ||
      cat.includes('tile') ||
      sub.includes('tile') ||
      scn.includes('tile') ||
      desc.includes('thickness:') ||
      desc.includes('area/box:') ||
      name.includes('tile') ||
      name.includes('matt') ||
      name.includes('gloss') ||
      uom === 'BOX' ||
      /\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?/.test(name)
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
      const dimMatch = String(`${p.sub_category || ''} ${p.product_description || ''} ${p.item_sr_no || ''} ${p.product_name || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
      if (dimMatch) {
        const h = Number(dimMatch[1]) || 60;
        const w = Number(dimMatch[2]) || 60;
        sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
      }
    }

    const bQty = Number(currentTileItem.boxQty || 1);
    const lPcs = Number(currentTileItem.loosePcs || 0);
    const totalSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));

    setFieldValue(`tileItems.${tIdx}.itemName`, p.product_name);
    setFieldValue(`tileItems.${tIdx}.skuCode`, p.item_sr_no || `SKU-${p.id}`);
    setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
    setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
    setFieldValue(`tileItems.${tIdx}.totalSqm`, totalSqm);
    if (!currentTileItem.warehouseName && locations[0]?.name) {
      setFieldValue(`tileItems.${tIdx}.warehouseName`, locations[0].name);
    }
  };

  const formInitialValues = React.useMemo(() => {
    return {
      grnNo: '',
      vendorName: '',
      receiptDate: new Date().toISOString().split('T')[0],
      status: 'Confirm',
      remarks: '',
      showTileSection: false,
      tileItems: [] as any[],
      items: [{ itemName: '', skuCode: '', qty: 1, uom: 'Nos', warehouseName: '' }]
    };
  }, []);

  const [initialValues, setInitialValues] = useState(formInitialValues);
  const [originalGrn, setOriginalGrn] = useState<any>(null);
  const [stockDataset, setStockDataset] = useState<any>(null);

  const getLocationStock = (productName: string, warehouseName: string): number => {
    if (!productName || !warehouseName) return 0;
    if (stockDataset) {
      return getWarehouseAvailableStock(productName, warehouseName, stockDataset);
    }
    const p = productList.find((pr: any) => (pr.product_name || '').toLowerCase() === productName.toLowerCase());
    return Number(p?.current_stock || 0);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);
        const [venRes, prodRes, locRes, grnCountRes, ds] = await Promise.all([
          supabase.from('vendors').select('vendor_name').order('vendor_name'),
          fetchAllPages(supabase.from('products').select('id, product_name, uom, item_sr_no, category, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, current_stock, purchase_price').order('product_name')),
          supabase.from('inventory_locations').select('name, location_type').order('name'),
          supabase.from('grn_receipts').select('*', { count: 'exact', head: true }),
          fetchStockDataset().catch(() => null)
        ]);

        if (ds) setStockDataset(ds);

        if (venRes.data) setVendors(venRes.data);
        if (prodRes.data) setProductList(prodRes.data);
        if (locRes.data) {
          setLocations(locRes.data);
          let defaultWhName = "";
          if (prefLoc === 'SHOP') {
            const shopLoc = locRes.data.find((l: any) => String(l.name).toUpperCase().includes('SHOP'));
            defaultWhName = shopLoc ? shopLoc.name : (locRes.data[0]?.name || '');
          } else if (prefLoc === 'WAREHOUSE') {
            const whLoc = locRes.data.find((l: any) => !String(l.name).toUpperCase().includes('SHOP'));
            defaultWhName = whLoc ? whLoc.name : (locRes.data[0]?.name || '');
          } else {
            defaultWhName = locRes.data[0]?.name || '';
          }
          if (!id && defaultWhName) {
            setInitialValues(prev => ({
              ...prev,
              items: prev.items.map(it => ({ ...it, warehouseName: it.warehouseName || defaultWhName }))
            }));
          }
        }

        if (id) {
          const { data: grn, error: grnErr } = await supabase.from('grn_receipts').select('*').eq('id', id).single();
          if (grnErr) throw grnErr;
          
          const { data: items, error: itemsErr } = await supabase.from('grn_items').select('*').eq('grn_id', id);
          if (itemsErr) throw itemsErr;
          
          setOriginalGrn({ ...grn, grn_items: items });

          const loadedTileItems: any[] = [];
          const loadedStandardItems: any[] = [];

          (items || []).forEach((i: any, itIdx: number) => {
            const matchedProd = prodRes.data?.find((p: any) => p.product_name === i.product_name);
            const name = String(i.product_name || '').toLowerCase();
            const uom = String(i.uom || matchedProd?.uom || '').toUpperCase();
            const desc = String(matchedProd?.product_description || '').toLowerCase();
            const hasTileDimensions =
              /\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?/.test(name) ||
              /\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?/.test(desc);

            const isTile =
              hasTileDimensions ||
              uom === 'BOX' ||
              uom === 'SQM' ||
              uom === 'SQ.M' ||
              name.includes('tile') ||
              name.includes('matt') ||
              name.includes('gloss');

            if (isTile) {
              let pcsPerBox = Number(matchedProd?.pieces_per_box || matchedProd?.pcs_per_box || 4);
              if (pcsPerBox <= 1) pcsPerBox = 4;
              let sqmPerBox = 1.44;
              const dimMatch = String(`${matchedProd?.product_description || ''} ${i.product_name || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
              if (dimMatch) {
                const h = Number(dimMatch[1]) || 60;
                const w = Number(dimMatch[2]) || 60;
                sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
              }

              const totalQty = Number(i.qty || 1);
              let boxQty = totalQty;
              let loosePcs = 0;
              if (totalQty % 1 !== 0 && pcsPerBox > 1) {
                boxQty = Math.floor(totalQty);
                loosePcs = Math.round((totalQty - boxQty) * pcsPerBox);
              }
              const totalSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));

              loadedTileItems.push({
                id: i.id || `tile-${itIdx}`,
                itemName: i.product_name,
                skuCode: matchedProd ? (matchedProd.item_sr_no || `SKU-${matchedProd.id}`) : '',
                warehouseName: i.warehouse_name || '',
                boxQty: boxQty,
                loosePcs: loosePcs,
                totalSqm: totalSqm,
                piecesPerBox: pcsPerBox,
                sqmPerBox: sqmPerBox,
                accepted_qty: i.accepted_qty,
                rejected_qty: i.rejected_qty,
                hold_qty: i.hold_qty,
                reject_reason: i.reject_reason
              });
            } else {
              loadedStandardItems.push({
                id: i.id,
                itemName: i.product_name,
                skuCode: matchedProd ? (matchedProd.item_sr_no || `SKU-${matchedProd.id}`) : '',
                qty: i.qty,
                uom: i.uom,
                warehouseName: i.warehouse_name,
                accepted_qty: i.accepted_qty,
                rejected_qty: i.rejected_qty,
                hold_qty: i.hold_qty,
                reject_reason: i.reject_reason
              });
            }
          });

          setInitialValues({
            grnNo: grn.grn_no,
            vendorName: grn.vendor_name,
            receiptDate: grn.receipt_date,
            status: grn.status,
            remarks: grn.remarks || '',
            showTileSection: loadedTileItems.length > 0,
            tileItems: loadedTileItems,
            items: loadedStandardItems.length > 0
              ? loadedStandardItems
              : (loadedTileItems.length > 0 ? [] : [{ itemName: '', skuCode: '', qty: 1, uom: 'Nos', warehouseName: '' }])
          });
        } else {
          const nextGrnNo = `GRN-${String((grnCountRes.count || 0) + 1).padStart(4, '0')}`;
          setInitialValues(prev => ({ ...prev, grnNo: nextGrnNo }));
        }
      } catch (err) {
        toast.error('Failed to load data.');
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchMetadata();
  }, [id]);

  const validationSchema = Yup.object().shape({
    grnNo: Yup.string().required('GRN # is mandatory'),
    vendorName: Yup.string().required('Vendor is mandatory'),
    receiptDate: Yup.string().required('Date is mandatory')
  });

  if (metadataLoading) return <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl text-black dark:text-bodydark text-xs pb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <MdInventory className="text-primary" size={24} />
          {id ? 'Edit Goods Receipt Note (GRN)' : 'Create Goods Receipt Note (GRN)'}
        </h2>
        <button
          onClick={() => navigate('/Purchase/GRN/List')}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <MdArrowBack /> Back to List
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            setLoading(true);
            try {
              let finalStatus = values.status;
              
              // Smart Routing: Check if any selected warehouse is a Storage Point
              if (finalStatus === 'Confirm') {
                const hasStoragePoint = values.items.some(item => {
                  const loc = locations.find(l => l.name === item.warehouseName);
                  return loc && loc.location_type === 'Storage Point';
                });
                
                if (hasStoragePoint) {
                  finalStatus = 'Pending Inward';
                }
              }

              let grnIdToUse = '';

              if (id) {
                // EDIT MODE
                // 1. Revert Old Inventory if original was Confirm
                if (originalGrn?.status === 'Confirm') {
                  // warehouse_inventory retired — formula-based stock is source of truth
                }

                // 2. Update Header
                const { error: updateErr } = await supabase
                  .from('grn_receipts')
                  .update({
                    grn_no: values.grnNo,
                    vendor_name: values.vendorName,
                    receipt_date: values.receiptDate,
                    status: finalStatus,
                    remarks: values.remarks
                  })
                  .eq('id', id);

                if (updateErr) throw updateErr;
                grnIdToUse = id;

                // 3. Delete Old Items
                await supabase.from('grn_items').delete().eq('grn_id', id);

              } else {
                // CREATE MODE
                const { data: grnData, error: grnError } = await supabase
                  .from('grn_receipts')
                  .insert([{
                    grn_no: values.grnNo,
                    vendor_name: values.vendorName,
                    receipt_date: values.receiptDate,
                    status: finalStatus,
                    remarks: values.remarks
                  }])
                  .select()
                  .single();

                if (grnError) throw grnError;
                grnIdToUse = grnData.id;
              }

              // 4. Insert New Items
              const validStd = (values.items || []).filter((it: any) => it.itemName && Number(it.qty || 0) > 0);
              const validTiles = values.showTileSection 
                ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0))
                : [];

              if (validStd.length === 0 && validTiles.length === 0) {
                toast.error('Please enter at least one standard item or tile item before saving.');
                setLoading(false);
                return;
              }

              const itemsToInsert: any[] = [];
              validStd.forEach((item: any) => {
                itemsToInsert.push({
                  grn_id: grnIdToUse,
                  product_name: item.itemName,
                  warehouse_name: item.warehouseName || (locations && locations[0]?.name) || '',
                  qty: Number(item.qty),
                  uom: item.uom || 'Nos',
                  accepted_qty: item.accepted_qty ?? null,
                  rejected_qty: Number(item.rejected_qty || 0),
                  hold_qty: item.accepted_qty != null ? Number(item.hold_qty || 0) : Number(item.qty),
                  reject_reason: item.reject_reason || null
                });
              });

              validTiles.forEach((tile: any) => {
                const bQty = Number(tile.boxQty || 0);
                const lPcs = Number(tile.loosePcs || 0);
                const ppb = Number(tile.piecesPerBox || 4);
                const totalQty = Number((bQty + (lPcs / ppb)).toFixed(3));
                itemsToInsert.push({
                  grn_id: grnIdToUse,
                  product_name: tile.itemName,
                  warehouse_name: tile.warehouseName || (locations && locations[0]?.name) || '',
                  qty: totalQty,
                  uom: 'BOX',
                  accepted_qty: tile.accepted_qty ?? null,
                  rejected_qty: Number(tile.rejected_qty || 0),
                  hold_qty: tile.accepted_qty != null ? Number(tile.hold_qty || 0) : totalQty,
                  reject_reason: tile.reject_reason || null
                });
              });

              const { error: itemsError } = await supabase.from('grn_items').insert(itemsToInsert);
              if (itemsError) throw itemsError;

              // warehouse_inventory retired — formula-based stock is source of truth

              if (finalStatus === 'Confirm') {
                toast.success(`GRN ${id ? 'Updated' : 'Confirmed'}! Stock updated instantly.`);
              } else if (finalStatus === 'Pending Inward') {
                toast.success(`GRN ${id ? 'Updated' : 'Saved'}! Sent to Warehouse "Inward Challan" for QC Verification.`);
              } else {
                toast.success(`GRN ${id ? 'Updated' : 'Saved'} as Draft.`);
              }
              navigate('/Purchase/GRN/List');
            } catch (err: any) {
              toast.error('Transaction Failed: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ values, errors, touched, setFieldValue, handleChange }) => (
            <Form className="p-6.5 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">GRN #: *</label>
                  <input 
                    type="text" 
                    name="grnNo"
                    value={values.grnNo} 
                    readOnly
                    className={`w-full border rounded p-2 bg-gray-50 dark:bg-meta-4 text-gray-500 font-bold font-mono outline-none cursor-not-allowed ${touched.grnNo && errors.grnNo ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} 
                  />
                </div>

                <div className="md:col-span-2 relative vendor-search-container">
                  <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Vendor Profile: *</label>
                  <input
                    type="text"
                    name="vendorName"
                    value={values.vendorName}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setFieldValue('vendorName', e.target.value);
                      setIsVendorDropdownOpen(true);
                      setHighlightedVendorIndex(0);
                    }}
                    onFocus={() => { setIsVendorDropdownOpen(true); setHighlightedVendorIndex(0); }}
                    onKeyDown={(e) => {
                      const filtered = vendors.filter(v => (v.vendor_name || '').toLowerCase().includes(String(values.vendorName || '').toLowerCase()));
                      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedVendorIndex(prev => prev < filtered.length - 1 ? prev + 1 : 0); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedVendorIndex(prev => prev > 0 ? prev - 1 : filtered.length - 1); }
                      else if (e.key === 'Enter' && filtered.length > 0) {
                        e.preventDefault();
                        setFieldValue('vendorName', filtered[highlightedVendorIndex]?.vendor_name || filtered[0].vendor_name);
                        setIsVendorDropdownOpen(false);
                      } else if (e.key === 'Tab' || e.key === 'Escape') { setIsVendorDropdownOpen(false); }
                    }}
                    placeholder="Search Supply Vendor..."
                    className={`w-full rounded border p-2 bg-transparent dark:bg-boxdark outline-none font-bold focus:border-primary ${touched.vendorName && errors.vendorName ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                  />
                  {isVendorDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 z-[99999] w-full max-h-64 overflow-y-auto bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-xl divide-y divide-stroke dark:divide-strokedark rounded-lg">
                      {(() => {
                        const filtered = vendors.filter(v => (v.vendor_name || '').toLowerCase().includes(String(values.vendorName || '').toLowerCase()));
                        return filtered.length > 0 ? filtered.map((v, vIdx) => (
                          <div
                            key={v.vendor_name}
                            onMouseEnter={() => setHighlightedVendorIndex(vIdx)}
                            onMouseDown={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              setFieldValue('vendorName', v.vendor_name);
                              setIsVendorDropdownOpen(false);
                            }}
                            className={`p-2.5 cursor-pointer text-xs font-semibold ${highlightedVendorIndex === vIdx ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-meta-4/30'}`}
                          >
                            {v.vendor_name}
                          </div>
                        )) : <div className="p-4 text-center italic text-gray-400">No vendors found</div>;
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Receipt Date: *</label>
                  <input type="date" name="receiptDate" value={values.receiptDate} onChange={handleChange} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none font-bold focus:border-primary" />
                </div>
              </div>

              {/* TOP TOGGLE BUTTON FOR TILES */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const next = !values.showTileSection;
                    setFieldValue('showTileSection', next);
                    if (next && (!values.tileItems || values.tileItems.length === 0)) {
                      setFieldValue('tileItems', [{
                        id: `tile-0-${Date.now()}`,
                        itemName: '',
                        skuCode: '',
                        warehouseName: locations[0]?.name || '',
                        boxQty: 1,
                        loosePcs: 0,
                        totalSqm: 1.44,
                        piecesPerBox: 4,
                        sqmPerBox: 1.44
                      }]);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-xs flex items-center gap-1.5 border cursor-pointer ${
                    values.showTileSection
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-200 border-stroke dark:border-strokedark hover:border-primary'
                  }`}
                >
                  {values.showTileSection ? '✓ Tiles Enabled' : '+ Receive Tiles'}
                </button>
              </div>

              {/* DEDICATED TILE ITEMS DYNAMIC CONTAINER */}
              {values.showTileSection && (
                <div className={`border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-sm mb-6 relative ${activeTileSkuIndex !== null || activeTileProdIndex !== null ? 'z-30' : 'z-20'} overflow-visible pb-4 shadow-xs`}>
                  <FieldArray name="tileItems">
                    {({ push, remove }) => {
                      const totalBoxesCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.boxQty || 0)), 0);
                      const totalLoosePcsCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.loosePcs || 0)), 0);
                      const totalSqmCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalSqm || 0)), 0);
                      const tileProducts = productList.filter(p => isTileProduct(p));

                      return (
                        <div className="w-full min-w-[980px]">
                          {/* Header Bar */}
                          <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                                Tiles
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                Tile Receipts (Boxes, Loose Pieces & Sq. Mtr Inward)
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                              <span>Boxes: <strong className="font-black text-black dark:text-white">{totalBoxesCount}</strong></span>
                              <span>Pcs: <strong className="font-black text-black dark:text-white">{totalLoosePcsCount}</strong></span>
                              <span>Total Sq.M: <strong className="font-black text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded shadow-xs">{totalSqmCount.toFixed(2)} m²</strong></span>
                            </div>
                          </div>

                          {/* Table */}
                          <table className="w-full table-auto border-collapse text-left">
                            <thead className="bg-gray-100 dark:bg-meta-4/40 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 border-b border-stroke dark:border-strokedark">
                              <tr>
                                <th className="p-3 w-10 text-center">S#</th>
                                <th className="p-3 min-w-[280px]">Tile Code / Description</th>
                                <th className="p-3 w-48">Receiving Warehouse</th>
                                <th className="p-3 w-28 text-center">Arrived Boxes</th>
                                <th className="p-3 w-24 text-center">Loose Pcs</th>
                                <th className="p-3 w-32 text-center">Total Sq.M</th>
                                <th className="p-3 w-12 text-center">X</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                                const ppb = Number(tItem.piecesPerBox || 4);
                                const spb = Number(tItem.sqmPerBox || 1.44);

                                const filteredTileProds = tileProducts.filter((p: any) => {
                                  if (!tItem.itemName) return true;
                                  const q = String(tItem.itemName || '').toLowerCase().trim();
                                  const sku = String(p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                  const pName = String(p.product_name || '').toLowerCase();
                                  const cat = String(p.category || '').toLowerCase();
                                  return sku.includes(q) || pName.includes(q) || cat.includes(q);
                                });

                                return (
                                  <tr key={tItem.id || tIdx} className="border-b border-stroke dark:border-strokedark relative hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                    <td className="p-3 text-center text-gray-500 font-mono text-xs">{tIdx + 1}</td>

                                    {/* Merged Tile Code / Description Searchable Dropdown */}
                                    <td className="p-3 relative tile-prod-container min-w-[280px]">
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
                                            setHighlightedTileProdIndex(0);
                                          }}
                                          placeholder="Search by code or tile description..."
                                          className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark font-bold text-xs outline-none focus:border-primary shadow-xs"
                                        />
                                        {tItem.skuCode && (
                                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                            Code: <span className="font-bold text-slate-600 dark:text-slate-300">{tItem.skuCode}</span>
                                          </div>
                                        )}
                                        {activeTileProdIndex === tIdx && filteredTileProds.length > 0 && (
                                          <div className="absolute left-0 top-full mt-1 z-[999999] min-w-[340px] max-w-[440px] max-h-56 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-xl shadow-2xl divide-y divide-stroke dark:divide-strokedark">
                                            {filteredTileProds.map((prod: any, pIdx: number) => {
                                              const displaySku = prod.item_sr_no || `SKU-${prod.id}`;
                                              const isHighlighted = highlightedTileProdIndex === pIdx;
                                              return (
                                                <div
                                                  key={prod.id}
                                                  onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleTileProductSelection(prod, tIdx, tItem, setFieldValue);
                                                    setActiveTileProdIndex(null);
                                                  }}
                                                  className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                                    isHighlighted ? 'bg-primary/10 border-l-4 border-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                  }`}
                                                >
                                                  <div className="min-w-0 pr-2">
                                                    <div className="font-bold text-black dark:text-white truncate max-w-[210px]">{prod.product_name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">Code: {displaySku} • {prod.product_description || ''}</div>
                                                  </div>
                                                  <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                      Stock: {prod.current_stock || 0}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </td>

                                    {/* Receiving Warehouse */}
                                    <td className="p-3 w-48">
                                      <WarehouseSelect
                                        locations={locations}
                                        selectedWarehouse={tItem.warehouseName || (locations[0]?.name || '')}
                                        onSelect={(wh) => setFieldValue(`tileItems.${tIdx}.warehouseName`, wh)}
                                        productName={tItem.itemName}
                                        getLocationStock={getLocationStock}
                                      />
                                    </td>

                                    {/* Arrived Boxes */}
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={tItem.boxQty}
                                        onChange={(e) => {
                                          const bVal = Math.max(0, parseInt(e.target.value, 10) || 0);
                                          const lPcs = Number(tItem.loosePcs || 0);
                                          const lineSqm = Number(((bVal * spb) + ((lPcs / ppb) * spb)).toFixed(2));
                                          setFieldValue(`tileItems.${tIdx}.boxQty`, bVal);
                                          setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
                                        }}
                                        className="w-full text-center rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark font-bold font-mono text-xs outline-none focus:border-primary shadow-xs"
                                      />
                                    </td>

                                    {/* Loose Pieces */}
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={tItem.loosePcs}
                                        onChange={(e) => {
                                          const rawLoose = Math.max(0, parseInt(e.target.value, 10) || 0);
                                          let finalBoxes = Number(tItem.boxQty || 0);
                                          let remLoose = rawLoose;
                                          if (ppb > 1 && rawLoose >= ppb) {
                                            const additionalBoxes = Math.floor(rawLoose / ppb);
                                            finalBoxes += additionalBoxes;
                                            remLoose = rawLoose % ppb;
                                          }
                                          const lineSqm = Number(((finalBoxes * spb) + ((remLoose / ppb) * spb)).toFixed(2));
                                          setFieldValue(`tileItems.${tIdx}.boxQty`, finalBoxes);
                                          setFieldValue(`tileItems.${tIdx}.loosePcs`, remLoose);
                                          setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
                                        }}
                                        className="w-full text-center rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark font-bold font-mono text-xs outline-none focus:border-primary shadow-xs"
                                      />
                                    </td>

                                    {/* Total Sq.M */}
                                    <td className="p-3 text-center">
                                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-1 rounded shadow-xs">
                                        {Number(tItem.totalSqm || 0).toFixed(2)} m²
                                      </span>
                                    </td>

                                    {/* Delete Row */}
                                    <td className="p-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => remove(tIdx)}
                                        className="text-gray-400 hover:text-danger p-1"
                                        title="Delete Row"
                                      >
                                        <FiTrash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => push({
                                id: `tile-${Date.now()}`,
                                itemName: '',
                                skuCode: '',
                                warehouseName: locations[0]?.name || '',
                                boxQty: 1,
                                loosePcs: 0,
                                totalSqm: 1.44,
                                piecesPerBox: 4,
                                sqmPerBox: 1.44
                              })}
                              className="inline-flex items-center gap-1 bg-slate-900 dark:bg-slate-700 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-slate-800 dark:hover:bg-slate-600 transition cursor-pointer shadow-xs"
                            >
                              <FiPlus size={12} /> Append Tile Row
                            </button>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              * Auto-computes boxes, loose pieces & sq.m for incoming tiles
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  </FieldArray>
                </div>
              )}

              <div className="border border-stroke dark:border-strokedark rounded-sm overflow-visible pb-4">
                <table className="w-full table-auto border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                      <th className="p-3 w-10 text-center">S#</th>
                      <th className="p-3 min-w-[280px]">Product Code / Description</th>
                      <th className="p-3 w-48">Receiving Warehouse</th>
                      <th className="p-3 w-36 text-right">Quantity</th>
                      <th className="p-3 w-24 text-center">UOM</th>
                      <th className="p-3 w-12 text-center">X</th>
                    </tr>
                  </thead>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <tbody>
                        {values.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-stroke dark:border-strokedark relative">
                            <td className="p-3 text-center text-gray-500">{idx + 1}</td>

                            {/* Merged Product Code / Description Combobox */}
                            <td className="p-3 relative prod-name-container min-w-[280px]">
                              {(() => {
                                const query = (item.itemName || '').toLowerCase().trim();
                                const filtered = productList.filter((p: any) => {
                                  if (!query) return true;
                                  const name = String(p.product_name || '').toLowerCase();
                                  const sku = String(p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                  return name.includes(query) || sku.includes(query);
                                });

                                return (
                                  <div className="relative">
                                    <input
                                      type="text"
                                      name={`items.${idx}.itemName`}
                                      value={item.itemName}
                                      autoComplete="off"
                                      onChange={(e) => {
                                        const typed = e.target.value;
                                        setFieldValue(`items.${idx}.itemName`, typed);
                                        setOpenDropdownRowIndex(idx);
                                        setHighlightedProductIndex(0);

                                        const matched = productList.find(
                                          p => (p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase()) ||
                                               (p.item_sr_no && p.item_sr_no.toLowerCase() === typed.trim().toLowerCase())
                                        );
                                        if (matched) {
                                          setFieldValue(`items.${idx}.itemName`, matched.product_name);
                                          setFieldValue(`items.${idx}.skuCode`, matched.item_sr_no || `SKU-${matched.id}`);
                                          setFieldValue(`items.${idx}.uom`, matched.uom || 'Nos');
                                        }
                                      }}
                                      onFocus={() => {
                                        setOpenDropdownRowIndex(idx);
                                        setHighlightedProductIndex(0);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'ArrowDown') {
                                          e.preventDefault();
                                          setHighlightedProductIndex(prev => prev < filtered.length - 1 ? prev + 1 : 0);
                                        } else if (e.key === 'ArrowUp') {
                                          e.preventDefault();
                                          setHighlightedProductIndex(prev => prev > 0 ? prev - 1 : filtered.length - 1);
                                        } else if (e.key === 'Enter' && filtered.length > 0) {
                                          e.preventDefault();
                                          const p = filtered[highlightedProductIndex] || filtered[0];
                                          setFieldValue(`items.${idx}.itemName`, p.product_name);
                                          setFieldValue(`items.${idx}.skuCode`, p.item_sr_no || `SKU-${p.id}`);
                                          setFieldValue(`items.${idx}.uom`, p.uom || 'Nos');
                                          setOpenDropdownRowIndex(null);
                                        } else if (e.key === 'Tab' || e.key === 'Escape') {
                                          setOpenDropdownRowIndex(null);
                                        }
                                      }}
                                      placeholder="Search by code or product description..."
                                      className={`w-full rounded border p-2 bg-transparent font-bold outline-none focus:border-primary ${touched.items?.[idx]?.itemName && (errors.items as any)?.[idx]?.itemName ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                    />
                                    {item.skuCode && (
                                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        Code: <span className="font-bold text-slate-600 dark:text-slate-300">{item.skuCode}</span>
                                      </div>
                                    )}
                                    {openDropdownRowIndex === idx && filtered.length > 0 && (
                                      <div className="absolute left-0 top-full mt-1 z-[999999] min-w-[340px] max-w-[440px] max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark shadow-xl divide-y divide-stroke dark:divide-strokedark rounded-xl">
                                        {filtered.map((p: any, pIdx: number) => {
                                          const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                          const isHighlighted = highlightedProductIndex === pIdx;
                                          return (
                                            <div
                                              key={p.id || p.product_name}
                                              onMouseEnter={() => setHighlightedProductIndex(pIdx)}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setFieldValue(`items.${idx}.itemName`, p.product_name);
                                                setFieldValue(`items.${idx}.skuCode`, displaySku);
                                                setFieldValue(`items.${idx}.uom`, p.uom || 'Nos');
                                                setOpenDropdownRowIndex(null);
                                              }}
                                              className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                                isHighlighted ? 'bg-primary/10 border-l-4 border-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                              }`}
                                            >
                                              <div className="min-w-0 pr-2">
                                                <div className="font-bold text-black dark:text-white truncate max-w-[210px]">{p.product_name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">Code: {displaySku} • {p.category || 'Product'}</div>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                  Stock: {p.current_stock || 0}
                                                </span>
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

                            {/* Receiving Warehouse */}
                            <td className="p-3 w-48">
                              <WarehouseSelect
                                locations={locations}
                                selectedWarehouse={item.warehouseName || (locations[0]?.name || '')}
                                onSelect={(wh) => setFieldValue(`items.${idx}.warehouseName`, wh)}
                                productName={item.itemName}
                                getLocationStock={getLocationStock}
                              />
                            </td>

                            <td className="p-3">
                              {(() => {
                                const selectedProd = productList.find(p => p.product_name === item.itemName);
                                const isTile = String(selectedProd?.category || '').toLowerCase() === 'tiles';
                                const rawPcs = Number(selectedProd?.pieces_per_box || selectedProd?.pcs_per_box || selectedProd?.pieces_per_packing || 0);
                                const pcsPerBox = rawPcs > 1 ? rawPcs : (isTile ? 4 : 1);

                                if (isTile && pcsPerBox > 1) {
                                  return (
                                    <div className="flex items-center gap-1 p-1 rounded bg-slate-50 dark:bg-slate-800 border border-stroke dark:border-strokedark">
                                      {/* BOXES */}
                                      <div className="flex-1 flex items-center bg-white dark:bg-boxdark rounded px-1 focus-within:border-primary shadow-sm border border-stroke dark:border-strokedark">
                                        <input
                                          type="text"
                                          inputMode="numeric"
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
                                          }}
                                          onKeyDown={(e) => { if (!/[0-9BackspaceTabEnterArrowLeftArrowRight]/.test(e.key)) e.preventDefault(); }}
                                          className="w-full bg-transparent text-center font-bold text-sm text-primary outline-none min-w-[28px] py-1"
                                        />
                                        <span className="text-[10px] font-bold text-gray-400 select-none pr-1">Box</span>
                                      </div>
                                      <span className="text-gray-400 font-bold text-xs">+</span>
                                      {/* PCS */}
                                      <div className="flex-1 flex items-center bg-white dark:bg-boxdark rounded px-1 focus-within:border-emerald-500 shadow-sm border border-stroke dark:border-strokedark">
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={(() => {
                                            const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                            return currentLoose === 0 ? '' : currentLoose;
                                          })()}
                                          placeholder={`${pcsPerBox}`}
                                          onChange={(e) => {
                                            const val = e.target.value.trim();
                                            const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                            const currentBoxes = Math.floor(Number(item.qty || 0));
                                            
                                            const extraBoxes = Math.floor(enteredLoose / pcsPerBox);
                                            const remLoose = enteredLoose % pcsPerBox;
                                            const finalBoxes = currentBoxes + extraBoxes;
                                            const combinedQty = remLoose > 0
                                              ? Number((finalBoxes + remLoose / pcsPerBox).toFixed(3))
                                              : finalBoxes;
                                            setFieldValue(`items.${idx}.qty`, combinedQty);
                                          }}
                                          onKeyDown={(e) => { if (!/[0-9BackspaceTabEnterArrowLeftArrowRight]/.test(e.key)) e.preventDefault(); }}
                                          className="w-full bg-transparent text-center font-bold text-sm text-emerald-600 outline-none min-w-[28px] py-1"
                                        />
                                        <span className="text-[10px] font-bold text-gray-400 select-none pr-1">Pcs</span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <input
                                    type="number" 
                                    min="0" 
                                    step={['kg', 'ltr', 'cm', 'mm', 'yd', 'm', 'g', 'ml', 'ton', 'sqm', 'sqft', 'cbm'].includes(String(item.uom).toLowerCase()) ? '0.01' : '1'}
                                    name={`items.${idx}.qty`}
                                    value={item.qty}
                                    onKeyDown={(e) => {
                                      const decimalUoms = ['kg', 'ltr', 'cm', 'mm', 'yd', 'm', 'g', 'ml', 'ton', 'sqm', 'sqft', 'cbm'];
                                      const isDecimalAllowed = decimalUoms.includes(String(item.uom).toLowerCase());
                                      if (!isDecimalAllowed && e.key === '.') {
                                        e.preventDefault();
                                      }
                                    }}
                                    onChange={(e) => {
                                      const decimalUoms = ['kg', 'ltr', 'cm', 'mm', 'yd', 'm', 'g', 'ml', 'ton', 'sqm', 'sqft', 'cbm'];
                                      const isDecimalAllowed = decimalUoms.includes(String(item.uom).toLowerCase());
                                      let valStr = e.target.value;
                                      if (!isDecimalAllowed && valStr.includes('.')) {
                                        valStr = valStr.split('.')[0];
                                      }
                                      setFieldValue(`items.${idx}.qty`, Math.max(0, Number(valStr) || 0));
                                    }}
                                    className={`w-full text-right rounded border p-2 bg-transparent font-bold font-mono outline-none focus:border-primary ${touched.items?.[idx]?.qty && (errors.items as any)?.[idx]?.qty ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                  />
                                );
                              })()}
                            </td>

                            <td className="p-3 font-mono text-center">
                              {(() => {
                                const selectedProd = productList.find(p => p.product_name === item.itemName);
                                const isTile = String(selectedProd?.category || '').toLowerCase() === 'tiles';
                                const rawPcs = Number(selectedProd?.pieces_per_box || selectedProd?.pcs_per_box || selectedProd?.pieces_per_packing || 0);
                                const pcsPerBox = rawPcs > 1 ? rawPcs : (isTile ? 4 : 1);
                                if (isTile && pcsPerBox > 1) {
                                  return (
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-bold">{item.uom || 'BOX'}</span>
                                      <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap">({pcsPerBox} Pcs/Box)</span>
                                    </div>
                                  );
                                }
                                return <span className="text-xs font-bold">{item.uom || 'Nos'}</span>;
                              })()}
                            </td>

                            <td className="p-3 text-center">
                              {values.items.length > 1 && (
                                <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-danger">
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={7} className="p-3 text-left">
                            <button
                              type="button"
                              onClick={() => push({ itemName: '', skuCode: '', qty: 1, uom: 'Nos', warehouseName: '' })}
                              className="text-primary font-bold hover:underline"
                            >
                              + Add Item Line
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </FieldArray>
                </table>
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Remarks (Optional):</label>
                <textarea
                  name="remarks"
                  value={values.remarks}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none focus:border-primary"
                  placeholder="e.g. Received via transport #XYZ"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-stroke dark:border-strokedark">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white font-bold rounded shadow hover:bg-opacity-90 disabled:bg-gray-400"
                >
                  {loading ? 'Saving GRN...' : 'Confirm Goods Received'}
                </button>
              </div>

            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddGRN;
