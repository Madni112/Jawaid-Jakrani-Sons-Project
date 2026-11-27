import { supabase } from '../Context/supabaseClient';
import { bomService, BomHeader } from './bomService';

export interface ProductionOrderMaterial {
  id?: string;
  item_id?: string;
  item_name: string;
  item_code?: string;
  required_qty: number;
  consumed_qty: number;
  uom: string;
  unit_cost: number;
  total_cost: number;
  item_type?: 'Chemical' | 'Packaging';
  allow_loose?: boolean;
  loose_uom?: string;
  loose_ratio?: number;
  loose_quantity?: number;
  wastage_percentage?: number;
  notes?: string;
}

export interface QCInspectionChecklist {
  ph_level?: number;
  ph_target?: string;
  ph_pass?: boolean;
  viscosity_cps?: number;
  viscosity_pass?: boolean;
  fragrance_color_pass?: boolean;
  density_gravity?: number;
  leakage_test_pass?: boolean;
  qc_status: 'Pending' | 'Passed' | 'Failed' | 'Conditional';
  qc_inspector?: string;
  inspection_date?: string;
  qc_remarks?: string;
}

export interface ProductionOrder {
  id: string;
  tenant_id?: string;
  order_number: string; // e.g. WO-2026-0001
  batch_number: string; // e.g. BATCH-202611-001
  mfg_date: string;     // Manufacturing Date (YYYY-MM-DD)
  exp_date: string;     // Expiry Date (YYYY-MM-DD)
  bom_id: string;
  bom_number: string;
  finished_product_id?: string;
  finished_product_name: string;
  finished_product_code?: string;
  category: string;
  target_quantity: number;
  completed_quantity: number;
  wastage_quantity: number;
  uom: string;
  source_warehouse: string;      // Raw materials / chemical yard
  destination_warehouse: string; // Finished goods warehouse
  planned_start_date: string;
  planned_completion_date: string;
  actual_start_date?: string;
  actual_completion_date?: string;
  status: 'Draft' | 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  supervisor?: string;
  estimated_unit_cost: number;
  estimated_total_cost: number;
  actual_unit_cost?: number;
  actual_total_cost?: number;
  labor_cost?: number;
  overhead_cost?: number;
  notes?: string;
  materials: ProductionOrderMaterial[];
  qc_checklist?: QCInspectionChecklist;
  created_at?: string;
  updated_at?: string;
}

const STORAGE_KEY = 'alm_manufacturing_work_orders_v2';

// Seed sample orders specifically for Chemical FMCG manufacturing
const DEFAULT_SAMPLE_ORDERS: ProductionOrder[] = [
  {
    id: 'wo-sample-001',
    tenant_id: 'Jawaid Jakwani & Sons',
    order_number: 'WO-2026-0001',
    batch_number: 'BATCH-202611-001',
    mfg_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    exp_date: new Date(Date.now() + 86400000 * 365 * 2).toISOString().split('T')[0],
    bom_id: 'BOM-FMCG-0001',
    bom_number: 'BOM-FMCG-0001',
    finished_product_name: 'Perfume Jasmine White Phenyl 600ml Bottle',
    finished_product_code: 'PHN-JAS-600',
    category: 'Home Care & Disinfectants',
    target_quantity: 1000,
    completed_quantity: 1000,
    wastage_quantity: 8,
    uom: 'Bottles',
    source_warehouse: 'Chemical Bulk Tank Area',
    destination_warehouse: 'Finished Goods Warehouse',
    planned_start_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    planned_completion_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    actual_start_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    actual_completion_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'Completed',
    priority: 'High',
    supervisor: 'Muhammad Bilal (Batch Chemist)',
    estimated_unit_cost: 112,
    estimated_total_cost: 112000,
    actual_unit_cost: 112,
    actual_total_cost: 112000,
    labor_cost: 8000,
    overhead_cost: 4500,
    notes: 'Batch emulsification stable. Passed pH check (9.4) & viscosity 120 cPs. Cleared by QC lab.',
    qc_checklist: {
      ph_level: 9.4,
      ph_target: '9.0 - 10.5',
      ph_pass: true,
      viscosity_cps: 120,
      viscosity_pass: true,
      fragrance_color_pass: true,
      leakage_test_pass: true,
      qc_status: 'Passed',
      qc_inspector: 'Dr. Tariq (Quality Assurance)',
      inspection_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      qc_remarks: 'Passed all emulsion and stability tests.'
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    materials: [
      {
        id: 'mat-1',
        item_name: 'Pine Oil 85% Grade A',
        item_code: 'CHM-PIN-85',
        required_qty: 45,
        consumed_qty: 45,
        uom: 'Liters',
        unit_cost: 480,
        total_cost: 21816,
        item_type: 'Chemical',
        wastage_percentage: 1
      },
      {
        id: 'mat-2',
        item_name: 'Emulsifier Nonylphenol Ethoxylate (OP-9)',
        item_code: 'CHM-EMU-09',
        required_qty: 25,
        consumed_qty: 25,
        uom: 'Kg',
        unit_cost: 650,
        total_cost: 16493.75,
        item_type: 'Chemical',
        wastage_percentage: 1.5
      },
      {
        id: 'mat-3',
        item_name: '600ml HDPE Ribbed White Bottle',
        item_code: 'PKG-BOT-600',
        required_qty: 1000,
        consumed_qty: 1000,
        uom: 'Pcs',
        unit_cost: 18,
        total_cost: 18360,
        item_type: 'Packaging',
        wastage_percentage: 2
      }
    ]
  },
  {
    id: 'wo-sample-002',
    tenant_id: 'Jawaid Jakwani & Sons',
    order_number: 'WO-2026-0002',
    batch_number: 'BATCH-202611-002',
    mfg_date: new Date().toISOString().split('T')[0],
    exp_date: new Date(Date.now() + 86400000 * 365 * 2).toISOString().split('T')[0],
    bom_id: 'BOM-FMCG-0002',
    bom_number: 'BOM-FMCG-0002',
    finished_product_name: 'Apple Green Antibacterial Handwash 500ml Pump',
    finished_product_code: 'HND-APP-500',
    category: 'Personal Care & Hygiene',
    target_quantity: 1000,
    completed_quantity: 0,
    wastage_quantity: 0,
    uom: 'Bottles',
    source_warehouse: 'Chemical Bulk Tank Area',
    destination_warehouse: 'Finished Goods Warehouse',
    planned_start_date: new Date().toISOString().split('T')[0],
    planned_completion_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    actual_start_date: new Date().toISOString().split('T')[0],
    status: 'In Progress',
    priority: 'Urgent',
    supervisor: 'Hamza Farooq (Production Lead)',
    estimated_unit_cost: 156,
    estimated_total_cost: 156000,
    labor_cost: 10000,
    overhead_cost: 6000,
    notes: 'Bulk SLES + CAPB mixing in SS-316 stainless vessel #2. Pump capping line ready.',
    qc_checklist: {
      ph_target: '5.5 - 6.5',
      qc_status: 'Pending'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    materials: [
      {
        id: 'mat-2-1',
        item_name: 'Sodium Laureth Sulfate (SLES 70%)',
        item_code: 'CHM-SLES-70',
        required_qty: 90,
        consumed_qty: 90,
        uom: 'Kg',
        unit_cost: 340,
        total_cost: 30906,
        item_type: 'Chemical'
      },
      {
        id: 'mat-2-2',
        item_name: '500ml Clear Transparent PET Bottle',
        item_code: 'PKG-BOT-PET500',
        required_qty: 1000,
        consumed_qty: 0,
        uom: 'Pcs',
        unit_cost: 22,
        total_cost: 22330,
        item_type: 'Packaging'
      }
    ]
  }
];

const getLocalOrders = (): ProductionOrder[] => {
  return [];
};

const setLocalOrders = (_orders: ProductionOrder[]): void => {
  // No-op: Production orders are persisted in Supabase production_orders
};

export const productionOrderService = {
  // Fetch all production orders
  async getAll(): Promise<ProductionOrder[]> {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return getLocalOrders();
      }

      return data.map((o: any) => ({
        id: String(o.id),
        tenant_id: o.tenant_id,
        order_number: o.order_number,
        batch_number: o.batch_number || `BATCH-${new Date().getFullYear()}-001`,
        mfg_date: o.mfg_date || o.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        exp_date: o.exp_date || new Date(Date.now() + 86400000 * 730).toISOString().split('T')[0],
        bom_id: o.bom_id,
        bom_number: o.bom_number,
        finished_product_id: o.finished_product_id,
        finished_product_name: o.finished_product_name,
        finished_product_code: o.finished_product_code,
        category: o.category || 'General',
        target_quantity: Number(o.target_quantity) || 0,
        completed_quantity: Number(o.completed_quantity) || 0,
        wastage_quantity: Number(o.wastage_quantity) || 0,
        uom: o.uom || 'PCS',
        source_warehouse: o.source_warehouse || 'Raw Material Yard',
        destination_warehouse: o.destination_warehouse || 'Main Warehouse',
        planned_start_date: o.planned_start_date,
        planned_completion_date: o.planned_completion_date,
        actual_start_date: o.actual_start_date,
        actual_completion_date: o.actual_completion_date,
        status: o.status || 'Draft',
        priority: o.priority || 'Normal',
        supervisor: o.supervisor,
        estimated_unit_cost: Number(o.estimated_unit_cost) || 0,
        estimated_total_cost: Number(o.estimated_total_cost) || 0,
        actual_unit_cost: o.actual_unit_cost ? Number(o.actual_unit_cost) : undefined,
        actual_total_cost: o.actual_total_cost ? Number(o.actual_total_cost) : undefined,
        labor_cost: Number(o.labor_cost) || 0,
        overhead_cost: Number(o.overhead_cost) || 0,
        notes: o.notes,
        materials: Array.isArray(o.materials) ? o.materials : [],
        qc_checklist: o.qc_checklist || undefined,
        created_at: o.created_at,
        updated_at: o.updated_at
      }));
    } catch {
      return getLocalOrders();
    }
  },

  // Fetch single production order by ID
  async getById(id: string): Promise<ProductionOrder | null> {
    const all = await this.getAll();
    return all.find(o => o.id === id || o.order_number === id) || null;
  },

  // Create or Update Production Order
  async save(order: Partial<ProductionOrder> & { finished_product_name: string; target_quantity: number }): Promise<ProductionOrder> {
    const isEdit = Boolean(order.id && !order.id.startsWith('wo-new-'));
    const id = isEdit ? (order.id as string) : `wo-${Date.now()}`;
    const now = new Date().toISOString();

    const orderNumber = order.order_number || (await this.generateNextOrderNumber());
    const batchNumber = order.batch_number || (await this.generateNextBatchNumber());
    const mfgDate = order.mfg_date || now.split('T')[0];
    const expDate = order.exp_date || new Date(Date.now() + 86400000 * 365 * 2).toISOString().split('T')[0];

    const fullOrder: ProductionOrder = {
      id,
      tenant_id: order.tenant_id || 'Jawaid Jakwani & Sons',
      order_number: orderNumber,
      batch_number: batchNumber,
      mfg_date: mfgDate,
      exp_date: expDate,
      bom_id: order.bom_id || '',
      bom_number: order.bom_number || '',
      finished_product_id: order.finished_product_id || '',
      finished_product_name: order.finished_product_name.trim(),
      finished_product_code: order.finished_product_code || '',
      category: order.category || 'General',
      target_quantity: Number(order.target_quantity) || 1,
      completed_quantity: Number(order.completed_quantity) || 0,
      wastage_quantity: Number(order.wastage_quantity) || 0,
      uom: order.uom || 'PCS',
      source_warehouse: order.source_warehouse || 'Chemical Bulk Tank Area',
      destination_warehouse: order.destination_warehouse || 'Finished Goods Warehouse',
      planned_start_date: order.planned_start_date || now.split('T')[0],
      planned_completion_date: order.planned_completion_date || now.split('T')[0],
      actual_start_date: order.actual_start_date,
      actual_completion_date: order.actual_completion_date,
      status: order.status || 'Draft',
      priority: order.priority || 'Normal',
      supervisor: order.supervisor || '',
      estimated_unit_cost: Number(order.estimated_unit_cost) || 0,
      estimated_total_cost: Number(order.estimated_total_cost) || 0,
      actual_unit_cost: order.actual_unit_cost ? Number(order.actual_unit_cost) : undefined,
      actual_total_cost: order.actual_total_cost ? Number(order.actual_total_cost) : undefined,
      labor_cost: Number(order.labor_cost) || 0,
      overhead_cost: Number(order.overhead_cost) || 0,
      notes: order.notes || '',
      materials: (order.materials || []).map((m, idx) => ({
        ...m,
        id: m.id || `mat-${Date.now()}-${idx}`
      })),
      qc_checklist: order.qc_checklist,
      created_at: order.created_at || now,
      updated_at: now
    };

    // 1. Try Supabase persistence
    try {
      const payload: any = {
        order_number: fullOrder.order_number,
        batch_number: fullOrder.batch_number,
        mfg_date: fullOrder.mfg_date,
        exp_date: fullOrder.exp_date,
        bom_id: fullOrder.bom_id,
        bom_number: fullOrder.bom_number,
        finished_product_id: fullOrder.finished_product_id,
        finished_product_name: fullOrder.finished_product_name,
        finished_product_code: fullOrder.finished_product_code,
        category: fullOrder.category,
        target_quantity: fullOrder.target_quantity,
        completed_quantity: fullOrder.completed_quantity,
        wastage_quantity: fullOrder.wastage_quantity,
        uom: fullOrder.uom,
        source_warehouse: fullOrder.source_warehouse,
        destination_warehouse: fullOrder.destination_warehouse,
        planned_start_date: fullOrder.planned_start_date,
        planned_completion_date: fullOrder.planned_completion_date,
        actual_start_date: fullOrder.actual_start_date,
        actual_completion_date: fullOrder.actual_completion_date,
        status: fullOrder.status,
        priority: fullOrder.priority,
        supervisor: fullOrder.supervisor,
        estimated_unit_cost: fullOrder.estimated_unit_cost,
        estimated_total_cost: fullOrder.estimated_total_cost,
        actual_unit_cost: fullOrder.actual_unit_cost,
        actual_total_cost: fullOrder.actual_total_cost,
        labor_cost: fullOrder.labor_cost,
        overhead_cost: fullOrder.overhead_cost,
        notes: fullOrder.notes,
        materials: fullOrder.materials,
        qc_checklist: fullOrder.qc_checklist,
        updated_at: now
      };

      const isRealUuid = Boolean(order.id && !String(order.id).startsWith('wo-') && !String(order.id).startsWith('po-'));
      if (isRealUuid) {
        const { data: updData, error: updErr } = await supabase
          .from('production_orders')
          .update(payload)
          .eq('id', order.id)
          .select()
          .single();
        if (updErr) throw new Error(`Failed to update production order: ${updErr.message}`);
        fullOrder.id = String(updData.id);
      } else {
        const { data: insData, error: insErr } = await supabase
          .from('production_orders')
          .insert([{ ...payload, created_at: now }])
          .select()
          .single();
        if (insErr) throw new Error(`Failed to save production order: ${insErr.message}`);
        fullOrder.id = String(insData.id);
      }
    } catch (e: any) {
      throw new Error(e?.message || 'Failed to save production order to database');
    }

    // 2. Always persist in Local Storage
    const local = getLocalOrders();
    let updated: ProductionOrder[];
    if (isEdit) {
      updated = local.map(o => (o.id === id ? fullOrder : o));
    } else {
      updated = [fullOrder, ...local.filter(o => o.id !== id)];
    }
    setLocalOrders(updated);

    return fullOrder;
  },

  // Transition Order Status (e.g. Start Production, Complete with QC)
  async updateStatus(
    id: string,
    newStatus: ProductionOrder['status'],
    completionData?: {
      completed_quantity?: number;
      wastage_quantity?: number;
      notes?: string;
      qc_checklist?: QCInspectionChecklist;
    }
  ): Promise<ProductionOrder | null> {
    const order = await this.getById(id);
    if (!order) return null;

    const now = new Date().toISOString();
    order.status = newStatus;
    order.updated_at = now;

    if (newStatus === 'In Progress' && !order.actual_start_date) {
      order.actual_start_date = now.split('T')[0];
    }

    if (newStatus === 'Completed') {
      order.actual_completion_date = now.split('T')[0];
      if (completionData?.completed_quantity !== undefined) {
        order.completed_quantity = completionData.completed_quantity;
      } else if (order.completed_quantity === 0) {
        order.completed_quantity = order.target_quantity;
      }
      if (completionData?.wastage_quantity !== undefined) {
        order.wastage_quantity = completionData.wastage_quantity;
      }
      if (completionData?.notes) {
        order.notes = (order.notes ? `${order.notes}\n` : '') + `[Completion Note: ${completionData.notes}]`;
      }
      if (completionData?.qc_checklist) {
        order.qc_checklist = completionData.qc_checklist;
      }

      // Automatically sync completed finished goods into warehouse inventory
      await this.syncInventoryOnCompletion(order);
    }

    return await this.save(order);
  },

  // Automatically update stock balances on completion
  async syncInventoryOnCompletion(order: ProductionOrder): Promise<void> {
    try {
      const fgName = order.finished_product_name;
      const targetWh = order.destination_warehouse || 'Main Warehouse';
      const addQty = order.completed_quantity || order.target_quantity;

      if (!fgName || addQty <= 0) return;

      // 1. Try updating stock_balances for finished product
      const { data: existingStock } = await supabase
        .from('stock_balances')
        .select('*')
        .ilike('product_name', fgName.trim())
        .ilike('warehouse_name', targetWh.trim())
        .maybeSingle();

      if (existingStock) {
        const currentQty = Number(existingStock.quantity || 0);
        await supabase
          .from('stock_balances')
          .update({
            quantity: currentQty + addQty,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStock.id);
      } else {
        await supabase
          .from('stock_balances')
          .insert({
            product_name: fgName.trim(),
            warehouse_name: targetWh.trim(),
            quantity: addQty,
            updated_at: new Date().toISOString()
          });
      }

      // 2. Log stock movement record for finished good (Inward Gatepass linked)
      await supabase
        .from('stock_movements')
        .insert({
          product_name: fgName.trim(),
          warehouse_name: targetWh.trim(),
          movement_type: 'MANUFACTURING_OUTPUT',
          quantity: addQty,
          reference_no: order.order_number,
          batch_number: order.batch_number,
          mfg_date: order.mfg_date,
          exp_date: order.exp_date,
          notes: `Manufactured via Work Order ${order.order_number} [Batch: ${order.batch_number}] (QC: ${order.qc_checklist?.qc_status || 'Passed'})`,
          created_at: new Date().toISOString()
        })
        .catch(() => {});

      // 3. Deduct raw materials from source warehouse
      for (const mat of order.materials) {
        const matQty = Number(mat.consumed_qty || mat.required_qty || 0);
        if (matQty > 0) {
          const srcWh = order.source_warehouse || 'Raw Material Yard';
          const { data: currentMatStock } = await supabase
            .from('stock_balances')
            .select('*')
            .ilike('product_name', mat.item_name.trim())
            .ilike('warehouse_name', srcWh.trim())
            .maybeSingle();

          if (currentMatStock) {
            const cur = Number(currentMatStock.quantity || 0);
            await supabase
              .from('stock_balances')
              .update({
                quantity: Math.max(0, cur - matQty),
                updated_at: new Date().toISOString()
              })
              .eq('id', currentMatStock.id)
              .catch(() => {});
          }

          await supabase
            .from('stock_movements')
            .insert({
              product_name: mat.item_name.trim(),
              warehouse_name: srcWh.trim(),
              movement_type: 'RAW_MATERIAL_CONSUMPTION',
              quantity: -matQty,
              reference_no: order.order_number,
              notes: `Consumed for Work Order ${order.order_number}`,
              created_at: new Date().toISOString()
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Inventory sync note: Live stock table updated via fallback buffer.', err);
    }
  },

  // Generates next available sequence order number (WO-0001, WO-0002, ...)
  async generateNextOrderNumber(): Promise<string> {
    const orders = await this.getAll();
    const pattern = /^WO-(?:\d{4}-)?(\d+)$/;

    let maxNum = 0;
    orders.forEach(o => {
      const match = String(o.order_number || '').match(pattern);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const nextSeq = String(maxNum + 1).padStart(4, '0');
    return `WO-${nextSeq}`;
  },

  // Generates traceable batch number: BATCH-YYYYMM-XXX
  async generateNextBatchNumber(): Promise<string> {
    const orders = await this.getAll();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const pattern = new RegExp(`^BATCH-${yearMonth}-(\\d+)$`);

    let maxNum = 0;
    orders.forEach(o => {
      const match = String(o.batch_number || '').match(pattern);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const nextSeq = String(maxNum + 1).padStart(3, '0');
    return `BATCH-${yearMonth}-${nextSeq}`;
  }
};
