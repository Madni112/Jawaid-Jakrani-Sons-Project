import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../Context/Auth';
import { useModal } from '../../../Context/Modal';
import { logActivity } from '../../../service/auditLogger';
import TablePagination from '../../../components/TablePagination';
import DeliveryChallanProcessedHistory from './DeliveryChallanProcessedHistory';

import {
  DeliveryChallanRecord,
  GroupedInvoiceData
} from './types/deliveryChallanTypes';
import {
  getPakistanDate,
  resolvePcsPerBox
} from './utils/deliveryChallanHelpers';
import { WarehouseDispatchApprovalModal } from './modals/WarehouseDispatchApprovalModal';
import { ViewHoldSummaryModal } from './modals/ViewHoldSummaryModal';
import { DeliveryChallanHeaderControls } from './components/DeliveryChallanHeaderControls';
import { PurchaseReturnsDispatchTable } from './components/PurchaseReturnsDispatchTable';
import { InvoiceChallanGroupList } from './components/InvoiceChallanGroupList';
import { printDeliveryChallanSlip } from './utils/printDeliveryChallanSlip';

const DeliveryChallanHistory: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, userLocationName, user } = useAuth();
  const { showModal, hideModal } = useModal();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASE_RETURNS'>('SALES');
  const [viewScope, setViewScope] = useState<'PENDING' | 'ALL'>('PENDING');
  const [challans, setChallans] = useState<DeliveryChallanRecord[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsMaster, setProductsMaster] = useState<any[]>([]);

  // Modal State for Warehouse Dispatch Approval
  const [selectedChallanForApproval, setSelectedChallanForApproval] = useState<any | null>(null);
  const [approvalItems, setApprovalItems] = useState<any[]>([]);
  const [transportList, setTransportList] = useState<any[]>([]);
  const [approvalTransportName, setApprovalTransportName] = useState('Customer\'s Own Transport');
  const [approvalTransportSearch, setApprovalTransportSearch] = useState('');
  const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
  const [approvalFreightCharges, setApprovalFreightCharges] = useState<number | string>(0);
  const [approvalVehicle, setApprovalVehicle] = useState('');
  const [approvalDriver, setApprovalDriver] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isManualDriver, setIsManualDriver] = useState(false);

  // Modal State for View Hold Details
  const [viewHoldModalData, setViewHoldModalData] = useState<GroupedInvoiceData | null>(null);

  // Datatable layout state controllers
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchChallans();
    fetchPurchaseReturns();
    fetchTransportList();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await fetchAllPages(supabase.from('products').select('product_name, category, pcs_per_box, pieces_per_box, pieces_per_packing, scenario_name'));
      setProductsMaster(data || []);
    } catch (_) { }
  };

  const fetchTransportList = async () => {
    try {
      const { data } = await supabase.from('logistics_transportation').select('*').order('name');
      setTransportList(data || []);
    } catch (_) { }
  };

  const fetchChallans = async () => {
    setLoading(true);
    try {
      let query = supabase.from('delivery_challans').select('*');

      if (userLocationName) {
        query = query.eq('dispatch_warehouse', userLocationName);
      }

      const { data, error } = await fetchAllPages(query.order('created_at', { ascending: false }));
      if (error) throw error;

      const warehouseOnly = (data || []).filter(dc => {
        const hasHoldItems = (dc.items || []).some((i: any) => Number(i.holdQty || 0) > 0);
        if (hasHoldItems) return true;

        const isPending = !dc.status || dc.status === 'Pending' || dc.status === 'Pending Approval' || dc.status === 'Pending Dispatch' || dc.status === 'Partially Dispatched';
        if (isPending) return true;

        const isAuto1Step = String(dc.remarks || '').startsWith('[AUTOMATIC]');
        if (isAuto1Step && (dc.status === 'Dispatched' || dc.status === 'Fully Dispatched')) return false;
        return true;
      });

      setChallans(warehouseOnly);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseReturns = async () => {
    try {
      let query = supabase.from('purchase_returns').select('*').order('created_at', { ascending: false });
      if (userLocationName) {
        query = query.or(`source_warehouse.eq.${userLocationName},warehouse_name.eq.${userLocationName}`);
      }
      const { data, error } = await fetchAllPages(query);
      if (error) throw error;
      const normalized = (data || []).map((r: any) => ({
        ...r,
        gate_pass_no: r.gate_pass_no || r.metadata?.gate_pass_no || ''
      }));
      setPurchaseReturns(normalized);
    } catch (err: any) {
      console.error('Failed to load purchase returns:', err);
    }
  };

  const handlePrintClick = async (challan: any) => {
    try {
      if (!challan.is_printed) {
        await supabase.from('delivery_challans').update({ is_printed: true }).eq('id', challan.id);
        fetchChallans();
      }
    } catch (err) {
      console.error('Failed to mark as printed', err);
    }
    printDeliveryChallanSlip(challan, productsMaster, false);
  };

  const openProcessedHistoryModal = () => {
    showModal(
      <DeliveryChallanProcessedHistory
        locationFilter={userLocationName}
        isPurchaseReturn={activeTab === 'PURCHASE_RETURNS'}
        productsMaster={productsMaster}
        onPrint={(rec) => {
          printDeliveryChallanSlip(rec, productsMaster, activeTab === 'PURCHASE_RETURNS');
        }}
        onClose={() => hideModal()}
      />,
      activeTab === 'PURCHASE_RETURNS' ? 'Processed Purchase Return Outwards' : 'Processed Delivery Challans & Gate Passes',
      undefined,
      'max-w-[96vw] xl:max-w-[1440px]'
    );
  };

  const openApprovalModal = (challan: any) => {
    setSelectedChallanForApproval(challan);
    const parsedItems = (challan.items || []).map((item: any) => {
      const orderQty = Number(item.orderQty ?? item.qty ?? 0);
      const prevDispatched = Number(item.dispatchedQty ?? 0);
      const availableToDispatch = orderQty - prevDispatched;
      const initialSend = availableToDispatch > 0 ? availableToDispatch : orderQty;

      return {
        ...item,
        orderQty: orderQty,
        dispatchedQty: initialSend,
        holdQty: Math.max(0, orderQty - initialSend),
        rate: Number(item.rate || 0)
      };
    });

    setApprovalItems(parsedItems);
    setApprovalTransportName(challan.transport_name || challan.transportation || (challan.isPurchaseReturn ? 'Supplier Return Vehicle' : 'Customer\'s Own Transport'));
    setApprovalTransportSearch('');
    setIsTransportDropdownOpen(false);
    setApprovalFreightCharges(challan.freight_charges !== undefined && challan.freight_charges !== null ? Number(challan.freight_charges) : 0);
    setApprovalVehicle(challan.vehicle_no && challan.vehicle_no !== 'Pending Dispatch' ? challan.vehicle_no : '');
    setApprovalDriver(challan.driver_name && challan.driver_name !== 'Pending Dispatch' ? challan.driver_name : '');
    setApprovalRemarks(challan.gate_remarks || '');
    setIsManualDriver(false);
    setIsSubmittingApproval(false);
  };

  const submitWarehouseApproval = async () => {
    if (!selectedChallanForApproval) return;

    const totalDispatchedQty = approvalItems.reduce((sum, i) => sum + (Number(i.dispatchedQty) || 0), 0);
    if (totalDispatchedQty <= 0) {
      toast.error('Cannot confirm dispatch with 0 quantity. Please specify at least 1 item in "Sending Now" to approve dispatch.', {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }

    setIsSubmittingApproval(true);

    try {
      const totalOrderQty = approvalItems.reduce((sum, i) => sum + Number(i.orderQty || 0), 0);
      const totalHoldQty = approvalItems.reduce((sum, i) => sum + (Number(i.holdQty) || 0), 0);

      const baseAmount = approvalItems.reduce((acc, i) => acc + (Number(i.rate || 0) * (Number(i.dispatchedQty) || 0)), 0);
      const totalDisc = approvalItems.reduce((acc, i) => acc + (Number(i.disAmt || 0)), 0);
      const netAmount = baseAmount - totalDisc;

      let finalStatus = 'Dispatched';
      if (totalHoldQty > 0 || totalDispatchedQty < totalOrderQty) {
        finalStatus = 'Partially Dispatched';
      } else {
        finalStatus = 'Dispatched';
      }

      const freightNum = Number(approvalFreightCharges) || 0;

      const processedApprovalItems = approvalItems.map(i => ({
        ...i,
        qty: Number(i.dispatchedQty || 0),
        dispatchedQty: Number(i.dispatchedQty || 0),
        orderQty: Number(i.orderQty || 0),
        holdQty: Number(i.holdQty || 0)
      }));

      if (selectedChallanForApproval.isPurchaseReturn) {
        const { error } = await supabase
          .from('purchase_returns')
          .update({
            status: finalStatus,
            items: processedApprovalItems,
            metadata: {
              ...(selectedChallanForApproval.metadata || {}),
              transport_name: approvalTransportName,
              freight_charges: freightNum,
              vehicle_no: approvalVehicle.trim() || 'Direct Handover',
              driver_name: approvalDriver.trim() || 'Supplier Rep',
              remarks: approvalRemarks.trim(),
              dispatched_qty: totalDispatchedQty,
              hold_qty: totalHoldQty
            }
          })
          .eq('id', selectedChallanForApproval.id);

        if (error) throw error;

        toast.success(`Purchase Return #${selectedChallanForApproval.return_no || selectedChallanForApproval.id} approved: Dispatched ${totalDispatchedQty} items`);
        setSelectedChallanForApproval(null);
        fetchPurchaseReturns();
        return;
      }

      const cleanDispStr = Math.abs(totalDispatchedQty - Math.round(totalDispatchedQty)) > 0.0001
        ? String(Math.round(totalDispatchedQty * 100) / 100)
        : String(Math.round(totalDispatchedQty));

      const { error } = await supabase
        .from('delivery_challans')
        .update({
          transport_name: approvalTransportName,
          transportation: approvalTransportName,
          freight_charges: freightNum,
          freight_payment_status: freightNum > 0 ? 'Pending Approval' : 'Free / Direct',
          vehicle_no: approvalVehicle.trim() || 'Counter Delivery',
          driver_name: approvalDriver.trim() || 'Direct Handover',
          remarks: approvalRemarks.trim() || `Approved by Warehouse Manager (Dispatched ${cleanDispStr} units)`,
          total_quantity: Math.round(totalDispatchedQty * 1000) / 1000,
          total_amount: baseAmount,
          total_discount: totalDisc,
          total_net_amount: netAmount,
          status: finalStatus,
          items: processedApprovalItems
        })
        .eq('id', selectedChallanForApproval.id);

      if (error) throw error;

      toast.success(`Challan #${selectedChallanForApproval.challan_no || selectedChallanForApproval.id} approved: Dispatched ${cleanDispStr} units`);
      setSelectedChallanForApproval(null);
      fetchChallans();
    } catch (err: any) {
      toast.error('Approval failed: ' + err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const createSubsequentHoldChallan = async (parentChallan: any) => {
    const holdItems = (parentChallan.items || [])
      .filter((i: any) => Number(i.holdQty || 0) > 0)
      .map((i: any) => ({
        ...i,
        orderQty: Number(i.holdQty),
        dispatchedQty: 0,
        holdQty: 0,
        qty: Number(i.holdQty)
      }));

    if (holdItems.length === 0) {
      toast.error('No items on hold for this challan.');
      return;
    }

    if (parentChallan.isPurchaseReturn) {
      try {
        setLoading(true);
        const baseCode = (parentChallan.return_no || `PR-${String(parentChallan.id).padStart(4, '0')}`).replace(/-[A-Z]+$/, '');
        const existingSubCount = purchaseReturns.filter(r => (r.return_no || '').startsWith(baseCode)).length;

        let nextLetter = '';
        if (existingSubCount < 26) {
          nextLetter = String.fromCharCode(65 + existingSubCount);
        } else {
          nextLetter = String.fromCharCode(65 + (existingSubCount % 26)).repeat(Math.floor(existingSubCount / 26) + 1);
        }
        const subReturnNo = `${baseCode}-${nextLetter}`;

        const whQty = holdItems.reduce((acc: number, i: any) => acc + Number(i.orderQty || 0), 0);
        const whBaseAmt = holdItems.reduce((acc: number, i: any) => acc + (Number(i.rate || 0) * Number(i.orderQty || 0)), 0);

        const { data: newRet, error } = await supabase.from('purchase_returns').insert([{
          return_no: subReturnNo,
          purchase_no: parentChallan.purchase_no,
          vendor_name: parentChallan.vendor_name,
          return_date: getPakistanDate(),
          source_warehouse: parentChallan.source_warehouse,
          warehouse_name: parentChallan.warehouse_name,
          payment_term: parentChallan.payment_term || 'On Credit',
          remarks: `Remaining hold items from ${parentChallan.return_no || parentChallan.id}`,
          total_amount: whBaseAmt,
          status: 'Pending',
          items: holdItems,
          metadata: {
            ...(parentChallan.metadata || {}),
            parent_return_id: parentChallan.id,
            parent_return_no: parentChallan.return_no,
            gate_pass_no: `${subReturnNo}-GP`
          }
        }]).select().single();

        if (error) throw error;

        const updatedParentItems = (parentChallan.items || []).map((i: any) => ({
          ...i,
          holdQty: 0,
          orderQty: Number(i.dispatchedQty || 0),
          qty: Number(i.dispatchedQty || 0)
        }));

        await supabase.from('purchase_returns').update({
          status: 'Dispatched',
          items: updatedParentItems,
          remarks: `${parentChallan.remarks || ''} (Remaining hold items moved to ${subReturnNo})`
        }).eq('id', parentChallan.id);

        toast.success(`New Outward Gate Pass #${subReturnNo} created for remaining ${whQty} hold items!`);
        await fetchPurchaseReturns();
        if (newRet) openApprovalModal({ ...newRet, isPurchaseReturn: true });
      } catch (err: any) {
        toast.error('Failed to create subsequent return: ' + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);

      const baseCode = (parentChallan.challan_no || `DC-${String(parentChallan.id).padStart(4, '0')}`).replace(/-[A-Z]+$/, '');
      const existingSubCount = challans.filter(c => (c.challan_no || '').startsWith(baseCode)).length;

      let nextLetter = '';
      if (existingSubCount < 26) {
        nextLetter = String.fromCharCode(65 + existingSubCount);
      } else {
        nextLetter = String.fromCharCode(65 + (existingSubCount % 26)).repeat(Math.floor(existingSubCount / 26) + 1);
      }
      const subChallanNo = `${baseCode}-${nextLetter}`;

      const whQty = holdItems.reduce((acc: number, i: any) => acc + Number(i.orderQty || 0), 0);
      const whBaseAmt = holdItems.reduce((acc: number, i: any) => acc + (Number(i.rate || 0) * Number(i.orderQty || 0)), 0);

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

      const updatedParentItems = (parentChallan.items || []).map((i: any) => ({
        ...i,
        holdQty: 0,
        orderQty: Number(i.dispatchedQty || 0),
        qty: Number(i.dispatchedQty || 0)
      }));

      await supabase.from('delivery_challans').update({
        status: 'Dispatched',
        items: updatedParentItems,
        remarks: `${parentChallan.remarks || ''} (Remaining hold items moved to ${subChallanNo})`
      }).eq('id', parentChallan.id);

      toast.success(`New Delivery Challan ${subChallanNo} created for remaining ${whQty} hold items!`);
      await fetchChallans();
      if (newDc) openApprovalModal(newDc);
    } catch (err: any) {
      toast.error('Failed to create subsequent challan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallans = useMemo(() => {
    return challans.filter(c =>
      c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.challan_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehicle_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dispatch_warehouse?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [challans, searchTerm]);

  // Group Challans by Linked Invoice
  const allGroupedInvoices: GroupedInvoiceData[] = useMemo(() => {
    try {
      const groups: Record<string, GroupedInvoiceData> = {};

      filteredChallans.forEach(c => {
        const invKey = c.invoice_no || `MANUAL-${c.id}`;
        if (!groups[invKey]) {
          groups[invKey] = {
            invoice_no: c.invoice_no || 'Direct DC',
            customer_name: c.customer_name || 'Walk-in',
            dispatch_warehouse: c.dispatch_warehouse || 'Main Warehouse',
            challans: [],
            totalOrdered: 0,
            totalOrderBoxes: 0,
            totalOrderPcs: 0,
            totalDispatched: 0,
            totalDispatchedBoxes: 0,
            totalDispatchedPcs: 0,
            totalHold: 0,
            totalHoldBoxes: 0,
            totalHoldPcs: 0
          };
        }
        groups[invKey].challans.push(c);
      });

      Object.values(groups).forEach(g => {
        g.challans.forEach(c => {
          (c.items || []).forEach((item: any) => {
            const orderQty = Number(item.orderQty ?? item.qty ?? 0);
            const dispQty = Number(item.dispatchedQty ?? (c.status === 'Dispatched' ? item.qty : 0) ?? 0);
            const holdQty = Number(item.holdQty ?? 0);

            g.totalOrdered += orderQty;
            g.totalDispatched += dispQty;
            g.totalHold += holdQty;

            const prodName = String(item.pDescription || item.itemName || '').trim().toLowerCase();
            const prod = productsMaster.find(p => String(p?.product_name || '').trim().toLowerCase() === prodName);
            const pcsPerBox = resolvePcsPerBox(prod, orderQty || dispQty || holdQty);

            if (pcsPerBox > 1) {
              g.totalOrderBoxes += Math.floor(Math.round(orderQty * pcsPerBox) / pcsPerBox);
              g.totalOrderPcs += Math.round(orderQty * pcsPerBox) % pcsPerBox;

              g.totalDispatchedBoxes += Math.floor(Math.round(dispQty * pcsPerBox) / pcsPerBox);
              g.totalDispatchedPcs += Math.round(dispQty * pcsPerBox) % pcsPerBox;

              g.totalHoldBoxes += Math.floor(Math.round(holdQty * pcsPerBox) / pcsPerBox);
              g.totalHoldPcs += Math.round(holdQty * pcsPerBox) % pcsPerBox;
            } else {
              g.totalOrderBoxes += Math.round(orderQty);
              g.totalDispatchedBoxes += Math.round(dispQty);
              g.totalHoldBoxes += Math.round(holdQty);
            }
          });
        });
      });

      return Object.values(groups);
    } catch (e: any) {
      console.error('CRASH IN USEMEMO:', e);
      return [];
    }
  }, [filteredChallans, productsMaster]);

  const pendingGroupedInvoices = useMemo(() => {
    return allGroupedInvoices.filter(g => {
      const hasHold = Number(g.totalHold || 0) > 0;
      const hasPendingStatus = g.challans.some(c =>
        !c.status ||
        c.status === 'Pending' ||
        c.status === 'Pending Approval' ||
        c.status === 'Pending Dispatch' ||
        c.status === 'Partially Dispatched'
      );
      return hasHold || hasPendingStatus;
    });
  }, [allGroupedInvoices]);

  const displayedGroupedInvoices = useMemo(() => {
    return viewScope === 'PENDING' ? pendingGroupedInvoices : allGroupedInvoices;
  }, [viewScope, pendingGroupedInvoices, allGroupedInvoices]);

  const pendingPurchaseReturns = useMemo(() => {
    return purchaseReturns.filter(pr => {
      const items = Array.isArray(pr.items) ? pr.items : [];
      const hasHold = items.some((i: any) => Number(i.holdQty || 0) > 0);
      const isPending = !pr.status || pr.status === 'Pending' || pr.status === 'Pending Approval' || pr.status === 'Pending Outward';
      const isPartial = pr.status === 'Partially Dispatched' || pr.status === 'Partial';

      return isPending || (isPartial && hasHold);
    });
  }, [purchaseReturns]);

  const displayedPurchaseReturns = useMemo(() => {
    return viewScope === 'PENDING' ? pendingPurchaseReturns : purchaseReturns;
  }, [viewScope, pendingPurchaseReturns, purchaseReturns]);

  const filteredPurchaseReturns = useMemo(() => {
    return displayedPurchaseReturns.filter(pr => {
      const q = searchTerm.toLowerCase();
      const matchesGeneral =
        String(pr.return_no || '').toLowerCase().includes(q) ||
        String(pr.vendor_name || '').toLowerCase().includes(q) ||
        String(pr.purchase_no || '').toLowerCase().includes(q) ||
        String(pr.source_warehouse || pr.warehouse_name || '').toLowerCase().includes(q);
      const matchesItems = Array.isArray(pr.items) && pr.items.some((it: any) =>
        String(it.itemName || it.product_name || '').toLowerCase().includes(q)
      );
      return matchesGeneral || matchesItems;
    });
  }, [displayedPurchaseReturns, searchTerm]);

  const isSalesTab = activeTab === 'SALES';
  const totalEntries = isSalesTab ? displayedGroupedInvoices.length : filteredPurchaseReturns.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedInvoices = displayedGroupedInvoices.slice(startIndex, startIndex + pageSize);
  const paginatedPurchaseReturns = filteredPurchaseReturns.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, activeTab]);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 relative">
      {/* ── POPUP MODAL: WAREHOUSE MANAGER DISPATCH APPROVAL ── */}
      {selectedChallanForApproval && (
        <WarehouseDispatchApprovalModal
          challan={selectedChallanForApproval}
          approvalItems={approvalItems}
          setApprovalItems={setApprovalItems}
          productsMaster={productsMaster}
          transportList={transportList}
          fetchTransportList={fetchTransportList}
          approvalTransportName={approvalTransportName}
          setApprovalTransportName={setApprovalTransportName}
          approvalTransportSearch={approvalTransportSearch}
          setApprovalTransportSearch={setApprovalTransportSearch}
          isTransportDropdownOpen={isTransportDropdownOpen}
          setIsTransportDropdownOpen={setIsTransportDropdownOpen}
          approvalFreightCharges={approvalFreightCharges}
          setApprovalFreightCharges={setApprovalFreightCharges}
          approvalVehicle={approvalVehicle}
          setApprovalVehicle={setApprovalVehicle}
          approvalDriver={approvalDriver}
          setApprovalDriver={setApprovalDriver}
          approvalRemarks={approvalRemarks}
          setApprovalRemarks={setApprovalRemarks}
          isManualDriver={isManualDriver}
          setIsManualDriver={setIsManualDriver}
          isSubmittingApproval={isSubmittingApproval}
          onSubmitApproval={submitWarehouseApproval}
          onClose={() => setSelectedChallanForApproval(null)}
        />
      )}

      {/* VIEW HOLD SUMMARY MODAL */}
      {viewHoldModalData && (
        <ViewHoldSummaryModal
          data={viewHoldModalData}
          productsMaster={productsMaster}
          onClose={() => setViewHoldModalData(null)}
        />
      )}

      {/* Top Header Controls row */}
      <DeliveryChallanHeaderControls
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setCurrentPage(1); }}
        viewScope={viewScope}
        setViewScope={(scope) => { setViewScope(scope); setCurrentPage(1); }}
        displayedGroupedInvoicesCount={displayedGroupedInvoices.length}
        pendingGroupedInvoicesCount={pendingGroupedInvoices.length}
        allGroupedInvoicesCount={allGroupedInvoices.length}
        purchaseReturnsCount={purchaseReturns.length}
        pendingPurchaseReturnsCount={pendingPurchaseReturns.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenProcessedHistoryModal={openProcessedHistoryModal}
      />

      {activeTab === 'PURCHASE_RETURNS' ? (
        <PurchaseReturnsDispatchTable
          loading={loading}
          paginatedPurchaseReturns={paginatedPurchaseReturns}
          onApproveItems={(ret) => openApprovalModal({ ...ret, isPurchaseReturn: true })}
          onEditDispatch={(ret) => openApprovalModal({ ...ret, isPurchaseReturn: true })}
          onDispatchRemaining={(ret) => createSubsequentHoldChallan({ ...ret, isPurchaseReturn: true })}
          onPrintGatePass={(ret) => printDeliveryChallanSlip(ret, productsMaster, true)}
        />
      ) : (
        <InvoiceChallanGroupList
          loading={loading}
          paginatedInvoices={paginatedInvoices}
          startIndex={startIndex}
          productsMaster={productsMaster}
          onOpenApprovalModal={openApprovalModal}
          onCreateSubsequentHoldChallan={createSubsequentHoldChallan}
          onPrintClick={handlePrintClick}
          onOpenHoldDetails={(group) => setViewHoldModalData(group)}
        />
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setCurrentPage}
        itemName={activeTab === 'PURCHASE_RETURNS' ? 'returns' : 'invoices'}
      />
    </div>
  );
};

export default DeliveryChallanHistory;
