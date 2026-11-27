import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdPrecisionManufacturing,
  MdAdd,
  MdSearch,
  MdFilterList,
  MdPlayArrow,
  MdCheckCircle,
  MdPrint,
  MdDelete,
  MdRefresh,
  MdTimeline,
  MdDoneAll,
  MdPendingActions,
  MdAttachMoney,
  MdEdit
} from 'react-icons/md';
import {
  productionOrderService,
  ProductionOrder
} from '../../../service/productionOrderService';
import { CompleteOrderModal } from './modals/CompleteOrderModal';
import { JobCardPrintModal } from './modals/JobCardPrintModal';
import Spinner from '../../../ui/Spinner';

const ProductionOrderList: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [orderToComplete, setOrderToComplete] = useState<ProductionOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<ProductionOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await productionOrderService.getAll();
      setOrders(data);
    } catch (err: any) {
      toast.error('Failed to load work orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = String(o.order_number || '').toLowerCase().includes(q);
        const matchProduct = String(o.finished_product_name || '').toLowerCase().includes(q);
        const matchBom = String(o.bom_number || '').toLowerCase().includes(q);
        const matchSup = String(o.supervisor || '').toLowerCase().includes(q);
        if (!matchNo && !matchProduct && !matchBom && !matchSup) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const inProgress = orders.filter(o => o.status === 'In Progress').length;
    const planned = orders.filter(o => o.status === 'Planned').length;
    const completed = orders.filter(o => o.status === 'Completed').length;
    const totalManufacturedUnits = orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + (o.completed_quantity || o.target_quantity || 0), 0);
    const totalValue = orders.reduce((sum, o) => sum + (o.estimated_total_cost || 0), 0);

    return {
      activeRuns: inProgress + planned,
      inProgress,
      completed,
      totalManufacturedUnits,
      totalValue
    };
  }, [orders]);

  // Quick Action Handlers
  const handleStartOrder = async (order: ProductionOrder) => {
    try {
      await productionOrderService.updateStatus(order.id, 'In Progress');
      toast.success(`Production run started for ${order.order_number}`);
      await fetchOrders();
    } catch (err: any) {
      toast.error('Failed to start run: ' + err.message);
    }
  };

  const handleConfirmCompletion = async (data: {
    completed_quantity: number;
    wastage_quantity: number;
    notes: string;
    qc_checklist?: any;
  }) => {
    if (!orderToComplete) return;
    try {
      await productionOrderService.updateStatus(orderToComplete.id, 'Completed', data);
      toast.success(`Work Order ${orderToComplete.order_number} marked completed! Finished goods added to ${orderToComplete.destination_warehouse}.`);
      await fetchOrders();
    } catch (err: any) {
      toast.error('Failed to complete order: ' + err.message);
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete Work Order ${orderNumber}?`)) return;
    try {
      await productionOrderService.delete(id);
      toast.success(`Work Order ${orderNumber} removed`);
      await fetchOrders();
    } catch (err: any) {
      toast.error('Failed to delete order: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border-blue-300 dark:border-blue-800 animate-pulse';
      case 'Planned':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500 text-white font-black';
      case 'High':
        return 'bg-amber-500 text-white font-bold';
      case 'Normal':
        return 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className={orderToPrint ? 'print:hidden space-y-6' : 'space-y-6'}>
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-default">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            <span>Manufacturing Execution</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">Shop Floor Jobs</span>
          </div>
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2.5">
            <MdPrecisionManufacturing className="text-emerald-600 text-3xl" />
            <span>Production & Work Orders</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Schedule batches, issue raw materials, track job progress & deposit finished inventory into warehouses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 transition cursor-pointer shadow-xs"
            title="Refresh Orders"
          >
            <MdRefresh className="text-lg" />
          </button>
          <button
            onClick={() => navigate('/Manufacturing/production-orders/add')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <MdAdd className="text-lg" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-default">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Run Queue</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-base">
              <MdPendingActions />
            </div>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">
            {kpis.activeRuns}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
            <span className="text-blue-600 font-bold">{kpis.inProgress} In-Progress</span>
            <span>•</span>
            <span>{kpis.activeRuns - kpis.inProgress} Planned</span>
          </div>
        </div>

        <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-default">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Finished Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-base">
              <MdDoneAll />
            </div>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">
            {kpis.completed}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Deposited into saleable inventory</p>
        </div>

        <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-default">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Manufactured Output</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center text-base">
              <MdTimeline />
            </div>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">
            {kpis.totalManufacturedUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Total finished boxes/units yielded</p>
        </div>

        <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-default">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Batch Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center text-base">
              <MdAttachMoney />
            </div>
          </div>
          <div className="text-2xl font-black text-black dark:text-white font-mono">
            Rs. {(kpis.totalValue / 1000).toFixed(1)}k
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Materials + direct production labor</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-default flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-96">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Work Order #, product name, BOM #..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/30 text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'In Progress', 'Planned', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-meta-4/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Production Orders Table */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-default overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="w-8 h-8" />
            <span className="text-xs font-bold text-gray-500 font-mono">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
              <MdPrecisionManufacturing />
            </div>
            <h3 className="font-bold text-black dark:text-white text-base">No Work Orders Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Create your first production run from your BOM recipes to schedule factory batches and track live inventory.
            </p>
            <button
              onClick={() => navigate('/Manufacturing/production-orders/add')}
              className="mt-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <MdAdd /> Create First Work Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-sans">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 font-black text-[10px] uppercase text-gray-500 tracking-wider">
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Finished Product</th>
                  <th className="py-3 px-4 text-center">Batch Target</th>
                  <th className="py-3 px-4">Routing Warehouses</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {filteredOrders.map(order => {
                  const percentComplete = order.status === 'Completed'
                    ? 100
                    : order.target_quantity > 0
                    ? Math.min(100, Math.round((order.completed_quantity / order.target_quantity) * 100))
                    : 0;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-meta-4/10 transition">
                      {/* Order info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-black dark:text-white text-xs">
                            {order.order_number}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${getPriorityBadge(order.priority)}`}>
                            {order.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono mt-0.5">
                          <span>BOM: {order.bom_number}</span>
                          {order.batch_number && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              {order.batch_number}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Finished Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-black dark:text-white">
                          {order.finished_product_name}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {order.category}
                        </div>
                      </td>

                      {/* Target Quantity & Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-black text-black dark:text-white text-sm">
                          {order.target_quantity.toLocaleString()} {order.uom}
                        </div>
                        {order.status === 'In Progress' && (
                          <div className="w-24 mx-auto mt-1">
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-meta-4 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                            </div>
                            <span className="text-[9px] text-blue-600 font-bold">In Firing</span>
                          </div>
                        )}
                        {order.status === 'Completed' && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center justify-center gap-1">
                            <MdCheckCircle className="text-xs" />
                            <span>{order.completed_quantity} Yielded</span>
                          </div>
                        )}
                      </td>

                      {/* Warehouses */}
                      <td className="py-3.5 px-4 text-[11px] font-mono">
                        <div className="text-gray-500">
                          RM: <span className="font-semibold text-gray-700 dark:text-gray-300">{order.source_warehouse}</span>
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          FG: <span className="font-bold text-emerald-700 dark:text-emerald-400">{order.destination_warehouse}</span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                        <div>Start: {order.planned_start_date}</div>
                        <div className="text-gray-400 text-[10px]">Due: {order.planned_completion_date}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Start action for planned orders */}
                          {order.status === 'Planned' && (
                            <button
                              onClick={() => handleStartOrder(order)}
                              title="Start Production Run"
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-900/40 transition cursor-pointer"
                            >
                              <MdPlayArrow className="text-sm" />
                              <span>Start</span>
                            </button>
                          )}

                          {/* Complete action for in-progress orders */}
                          {order.status === 'In Progress' && (
                            <button
                              onClick={() => setOrderToComplete(order)}
                              title="Finish Run & Deposit Stock"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/40 transition cursor-pointer"
                            >
                              <MdCheckCircle className="text-sm" />
                              <span>Finish</span>
                            </button>
                          )}

                          {/* Print Job Card */}
                          <button
                            onClick={() => setOrderToPrint(order)}
                            title="Print Shop Floor Job Card"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
                          >
                            <MdPrint className="text-base" />
                          </button>

                          {/* Edit order */}
                          {order.status !== 'Completed' && (
                            <button
                              onClick={() => navigate(`/Manufacturing/production-orders/edit/${order.id}`)}
                              title="Edit Work Order"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-meta-4 transition cursor-pointer"
                            >
                              <MdEdit className="text-base" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(order.id, order.order_number)}
                            title="Delete Order"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-meta-4 transition cursor-pointer"
                          >
                            <MdDelete className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Completion Modal */}
      <CompleteOrderModal
        order={orderToComplete}
        isOpen={Boolean(orderToComplete)}
        onClose={() => setOrderToComplete(null)}
        onConfirm={handleConfirmCompletion}
      />

      {/* Job Card Slip Modal */}
      <JobCardPrintModal
        order={orderToPrint}
        isOpen={Boolean(orderToPrint)}
        onClose={() => setOrderToPrint(null)}
      />
    </div>
  );
};

export default ProductionOrderList;
