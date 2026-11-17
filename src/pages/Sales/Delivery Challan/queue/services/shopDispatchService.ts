import { supabase } from '../../../../../Context/supabaseClient';
import { DeliveryChallan, TransportOption, ProductMasterItem, ChallanItem } from '../types/shopDispatchTypes';

export const fetchTransportAndProducts = async (): Promise<{
  transports: TransportOption[];
  products: ProductMasterItem[];
}> => {
  const { data: transports } = await supabase
    .from('logistics_transportation')
    .select('*')
    .order('name');

  const { data: prods } = await supabase
    .from('products')
    .select('product_name, pieces_per_box, pcs_per_box, pieces_per_packing, category, scenario_name');

  return {
    transports: transports || [],
    products: prods || []
  };
};

export const fetchShopChallans = async (): Promise<DeliveryChallan[]> => {
  // 1. Fetch location types to identify all Sale Points (Shops/Showrooms)
  const { data: locs } = await supabase.from('inventory_locations').select('name, location_type');
  const shopNames = new Set(
    (locs || [])
      .filter((l) => {
        const t = String(l.location_type || '').toLowerCase();
        return t.includes('sale') || t.includes('shop') || t.includes('showroom') || t.includes('counter');
      })
      .map((l) => String(l.name || '').trim().toLowerCase())
  );

  const { data, error } = await supabase
    .from('delivery_challans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter to only include Shop / Showroom / Sale Point locations
  const shopOnly = (data || []).filter((dc) => {
    const whName = String(dc.dispatch_warehouse || '').trim().toLowerCase();
    if (whName === 'shop' || whName.includes('showroom') || whName.includes('shop')) return true;
    if (shopNames.has(whName)) return true;
    return false;
  });

  return shopOnly;
};

export const deleteChallan = async (id: string | number): Promise<void> => {
  const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
  if (error) throw error;
};

export interface SubmitWarehouseApprovalParams {
  challan: DeliveryChallan;
  items: ChallanItem[];
  transportName: string;
  freightCharges: number | string;
  vehicleNo: string;
  driverName: string;
  remarks: string;
}

export const submitWarehouseApprovalAction = async (params: SubmitWarehouseApprovalParams): Promise<number> => {
  const { challan, items, transportName, freightCharges, vehicleNo, driverName, remarks } = params;

  const totalDispatchedQty = items.reduce((sum, i) => sum + (Number(i.dispatchedQty) || 0), 0);
  if (totalDispatchedQty <= 0) {
    throw new Error('Cannot confirm dispatch with 0 quantity. Please specify at least 1 item in "Sending Now" to approve dispatch.');
  }

  const totalOrderQty = items.reduce((sum, i) => sum + Number(i.orderQty || 0), 0);
  const totalHoldQty = items.reduce((sum, i) => sum + (Number(i.holdQty) || 0), 0);

  const baseAmount = items.reduce((acc, i) => acc + (Number(i.rate || 0) * (Number(i.dispatchedQty) || 0)), 0);
  const totalDisc = items.reduce((acc, i) => acc + (Number(i.disAmt || 0)), 0);
  const netAmount = baseAmount - totalDisc;

  const finalStatus = (totalHoldQty > 0 || totalDispatchedQty < totalOrderQty)
    ? 'Partially Dispatched'
    : 'Dispatched';

  const freightNum = Number(freightCharges) || 0;

  const processedApprovalItems = items.map((i) => ({
    ...i,
    qty: Number(i.dispatchedQty || 0),
    dispatchedQty: Number(i.dispatchedQty || 0),
    orderQty: Number(i.orderQty || 0),
    holdQty: Number(i.holdQty || 0)
  }));

  const { error } = await supabase
    .from('delivery_challans')
    .update({
      transport_name: transportName,
      transportation: transportName,
      freight_charges: freightNum,
      freight_payment_status: freightNum > 0 ? 'Pending Approval' : 'Free / Direct',
      vehicle_no: vehicleNo.trim() || 'Counter Delivery',
      driver_name: driverName.trim() || 'Direct Handover',
      remarks: remarks.trim() || `Approved by Warehouse Manager (Dispatched ${totalDispatchedQty} pcs)`,
      total_quantity: totalDispatchedQty,
      total_amount: baseAmount,
      total_discount: totalDisc,
      total_net_amount: netAmount,
      status: finalStatus,
      items: processedApprovalItems
    })
    .eq('id', challan.id);

  if (error) throw error;
  return totalDispatchedQty;
};

export const createSubsequentHoldChallanAction = async (
  parentChallan: DeliveryChallan,
  existingChallans: DeliveryChallan[]
): Promise<{ newDc: any; subChallanNo: string; whQty: number }> => {
  const holdItems = (parentChallan.items || [])
    .filter((i) => Number(i.holdQty || 0) > 0)
    .map((i) => ({
      ...i,
      orderQty: Number(i.holdQty),
      dispatchedQty: Number(i.holdQty),
      holdQty: 0,
      qty: Number(i.holdQty)
    }));

  if (holdItems.length === 0) {
    throw new Error('No items on hold for this challan.');
  }

  // Calculate dynamic next sequence suffix (DC-0005-B, DC-0005-C, etc.)
  const baseCode = (parentChallan.challan_no || `DC-${String(parentChallan.id).padStart(4, '0')}`).replace(/-[A-Z]+$/, '');
  const existingSubCount = existingChallans.filter((c) => (c.challan_no || '').startsWith(baseCode)).length;

  let nextLetter = '';
  if (existingSubCount < 26) {
    nextLetter = String.fromCharCode(65 + existingSubCount); // 1 existing -> B, 2 existing -> C, etc.
  } else {
    nextLetter = String.fromCharCode(65 + (existingSubCount % 26)).repeat(Math.floor(existingSubCount / 26) + 1);
  }
  const subChallanNo = `${baseCode}-${nextLetter}`;

  const whQty = holdItems.reduce((acc, i) => acc + Number(i.orderQty || 0), 0);
  const whBaseAmt = holdItems.reduce((acc, i) => acc + (Number(i.rate || 0) * Number(i.orderQty || 0)), 0);

  const { data: newDc, error } = await supabase.from('delivery_challans').insert([{
    challan_no: subChallanNo,
    invoice_no: parentChallan.invoice_no,
    customer_name: parentChallan.customer_name,
    challan_date: new Date().toISOString().split('T')[0],
    dispatch_warehouse: parentChallan.dispatch_warehouse,
    transport_name: parentChallan.transport_name || 'By Road Transport',
    transportation: parentChallan.transportation || 'By Road Transport',
    po_no: parentChallan.po_no || '',
    vehicle_no: 'Pending Dispatch',
    remarks: `Remaining hold items from ${parentChallan.challan_no || parentChallan.id}`,
    total_quantity: whQty,
    total_amount: whBaseAmt,
    total_discount: 0,
    total_net_amount: whBaseAmt,
    status: 'Pending Approval',
    items: holdItems
  }]).select().single();

  if (error) throw error;

  // Update parent challan: mark hold items as transferred to new sub-challan
  const updatedParentItems = (parentChallan.items || []).map((i) => ({
    ...i,
    holdQty: 0
  }));

  await supabase.from('delivery_challans').update({
    items: updatedParentItems,
    remarks: `${parentChallan.remarks || ''} (Remaining hold items moved to ${subChallanNo})`
  }).eq('id', parentChallan.id);

  return { newDc, subChallanNo, whQty };
};

export const addNewTransporter = async (name: string): Promise<void> => {
  const { error } = await supabase.from('logistics_transportation').insert([{
    name,
    status: 'Active'
  }]);
  if (error) throw error;
};
