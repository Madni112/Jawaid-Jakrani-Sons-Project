import React, { useEffect, useState, useMemo } from 'react';
import TablePagination from '../../../components/TablePagination';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { DeliveryChallan, TransportOption, ProductMasterItem, InvoiceGroup, ChallanItem } from './queue/types/shopDispatchTypes';
import {
  fetchShopChallans,
  fetchTransportAndProducts,
  submitWarehouseApprovalAction,
  createSubsequentHoldChallanAction
} from './queue/services/shopDispatchService';
import { DispatchApprovalModal } from './queue/components/DispatchApprovalModal';
import { RemainingHoldModal } from './queue/components/RemainingHoldModal';
import { InvoiceGroupCard } from './queue/components/InvoiceGroupCard';

const ShopDispatchQueue: React.FC = () => {
  const { tenantId } = useAuth();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Warehouse Dispatch Approval
  const [selectedChallanForApproval, setSelectedChallanForApproval] = useState<DeliveryChallan | null>(null);
  const [transportList, setTransportList] = useState<TransportOption[]>([]);
  const [productsMaster, setProductsMaster] = useState<ProductMasterItem[]>([]);

  // Datatable layout state controllers
  const [searchTerm, setSearchTerm] = useState('');
  const [viewHoldModal, setViewHoldModal] = useState<InvoiceGroup | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const [challanList, transportAndProd] = await Promise.all([
        fetchShopChallans(),
        fetchTransportAndProducts()
      ]);
      setChallans(challanList);
      setTransportList(transportAndProd.transports);
      setProductsMaster(transportAndProd.products);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  };

  const reloadTransportList = async () => {
    try {
      const transportAndProd = await fetchTransportAndProducts();
      setTransportList(transportAndProd.transports);
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovalSubmit = async (params: {
    challan: DeliveryChallan;
    items: ChallanItem[];
    transportName: string;
    freightCharges: number | string;
    vehicleNo: string;
    driverName: string;
    remarks: string;
  }) => {
    try {
      const totalDispatched = await submitWarehouseApprovalAction(params);
      toast.success(
        `Challan #${params.challan.challan_no || params.challan.id} approved: Dispatched ${totalDispatched} pcs`
      );
      setSelectedChallanForApproval(null);
      const updatedChallans = await fetchShopChallans();
      setChallans(updatedChallans);
    } catch (err: any) {
      toast.error('Approval failed: ' + err.message);
      throw err;
    }
  };

  const handleCreateSubsequentHoldChallan = async (parentChallan: DeliveryChallan) => {
    try {
      setLoading(true);
      const { newDc, subChallanNo, whQty } = await createSubsequentHoldChallanAction(parentChallan, challans);
      toast.success(`New Delivery Challan ${subChallanNo} created for remaining ${whQty} hold items!`);
      const updatedChallans = await fetchShopChallans();
      setChallans(updatedChallans);
      if (newDc) {
        setSelectedChallanForApproval(newDc);
      }
    } catch (err: any) {
      toast.error('Failed to create subsequent challan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Live filter query rule logic
  const filteredChallans = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return challans.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(term) ||
        c.challan_no?.toLowerCase().includes(term) ||
        c.invoice_no?.toLowerCase().includes(term) ||
        c.vehicle_no?.toLowerCase().includes(term) ||
        c.dispatch_warehouse?.toLowerCase().includes(term)
    );
  }, [challans, searchTerm]);

  // Group Challans by Linked Invoice
  const groupedInvoices = useMemo(() => {
    const groups: Record<string, InvoiceGroup> = {};

    filteredChallans.forEach((c) => {
      const invKey = c.invoice_no || `MANUAL-${c.id}`;
      if (!groups[invKey]) {
        groups[invKey] = {
          invoice_no: c.invoice_no || 'Direct DC',
          customer_name: c.customer_name || 'Walk-in',
          dispatch_warehouse: c.dispatch_warehouse || 'Main Warehouse',
          challans: [],
          totalOrdered: 0,
          totalDispatched: 0,
          totalHold: 0
        };
      }
      groups[invKey].challans.push(c);
    });

    // Compute totals per invoice group
    Object.values(groups).forEach((g) => {
      g.challans.forEach((c) => {
        (c.items || []).forEach((item) => {
          g.totalOrdered += Number(item.orderQty ?? item.qty ?? 0);
          g.totalDispatched += Number(item.dispatchedQty ?? (c.status === 'Dispatched' ? item.qty : 0) ?? 0);
          g.totalHold += Number(item.holdQty ?? 0);
        });
      });
    });

    return Object.values(groups);
  }, [filteredChallans]);

  // Pagination bounds based on grouped invoices
  const totalEntries = groupedInvoices.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedInvoices = groupedInvoices.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 relative">
      {/* ── POPUP MODAL: WAREHOUSE MANAGER DISPATCH APPROVAL ── */}
      {selectedChallanForApproval && (
        <DispatchApprovalModal
          challan={selectedChallanForApproval}
          transportList={transportList}
          onClose={() => setSelectedChallanForApproval(null)}
          onSubmit={handleApprovalSubmit}
          onTransporterAdded={reloadTransportList}
        />
      )}

      {/* ── POPUP: REMAINING HOLD BREAKDOWN ── */}
      {viewHoldModal && (
        <RemainingHoldModal
          group={viewHoldModal}
          productsMaster={productsMaster}
          onClose={() => setViewHoldModal(null)}
        />
      )}

      {/* Top Header Controls row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-black dark:text-white">Shop Dispatch Queue (SDQ)</h4>
          <p className="text-xs text-gray-500 mt-0.5">Manage shop counter handovers and pending deliveries</p>
        </div>
      </div>

      {/* Datatable Filters Wrapper */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm font-medium text-black dark:text-white"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size} className="dark:bg-boxdark">
                {size}
              </option>
            ))}
          </select>
          <span>invoices</span>
        </div>

        <div className="flex items-center gap-2 text-sm w-full sm:w-auto text-gray-500 dark:text-gray-400">
          <span>Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice, customer, challan..."
            className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm text-black dark:text-white"
          />
        </div>
      </div>

      {/* Core Table Layout: Grouped by Invoice with Nested Sub-Challan Entries */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center bg-white dark:bg-boxdark rounded-xl border border-stroke">
            <Spinner />
          </div>
        ) : paginatedInvoices.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-boxdark rounded-xl border border-stroke">
            No matching transit record entries found.
          </div>
        ) : (
          paginatedInvoices.map((group, groupIdx) => (
            <InvoiceGroupCard
              key={groupIdx}
              group={group}
              index={startIndex + groupIdx + 1}
              productsMaster={productsMaster}
              tenantId={tenantId}
              onOpenApprovalModal={(c) => setSelectedChallanForApproval(c)}
              onViewHoldModal={(g) => setViewHoldModal(g)}
              onCreateSubsequentHoldChallan={handleCreateSubsequentHoldChallan}
            />
          ))
        )}
      </div>

      {/* Footer statistics logic pagination arrays mapping */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setCurrentPage}
        itemName="entries"
      />
    </div>
  );
};

export default ShopDispatchQueue;
