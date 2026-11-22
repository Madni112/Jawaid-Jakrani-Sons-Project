import { supabase } from '../Context/supabaseClient';

export interface BomItem {
  id?: string;
  bom_id?: string;
  item_id?: string;
  item_name: string;
  item_code?: string;
  item_type?: 'Chemical' | 'Packaging'; // "Raw Chemical / Ingredient" or "Packaging Material"
  quantity: number;
  uom: string;
  unit_cost: number;
  wastage_percentage: number;
  total_cost: number;
  notes?: string;
}

export interface BomHeader {
  id: string;
  tenant_id?: string;
  bom_number: string;
  finished_product_id?: string;
  finished_product_name: string;
  finished_product_code?: string;
  category: string;
  batch_quantity: number;
  uom: string;
  raw_material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  packaging_cost: number;
  total_cost: number;
  unit_cost: number;
  target_selling_price: number;
  margin_percentage: number;
  status: 'Active' | 'Trial' | 'Draft' | 'Archived' | string;
  notes?: string;
  items: BomItem[];
  created_at?: string;
  updated_at?: string;
}

const STORAGE_KEY = 'uj_manufacturing_boms_v1';

// Initial preloaded global sample templates for FMCG / Chemical & Personal Care
const DEFAULT_SAMPLE_BOMS: BomHeader[] = [
  {
    id: 'bom-sample-001',
    tenant_id: 'Jawaid Jakwani & Sons',
    bom_number: 'BOM-FMCG-0001',
    finished_product_name: 'Perfume Jasmine Phenyl 600ml Bottle',
    finished_product_code: 'PHN-JAS-600ML',
    category: 'Home Care Chemicals',
    batch_quantity: 1000,
    uom: 'Bottles',
    raw_material_cost: 48500,
    labor_cost: 6000,
    overhead_cost: 3500,
    packaging_cost: 22000,
    total_cost: 80000,
    unit_cost: 80,
    target_selling_price: 130,
    margin_percentage: 38.46,
    status: 'Active',
    notes: 'Commercial 1,000 bottle run (600 Liters net bulk volume) with concentrated Jasmine essential fragrance & pine oil disinfectant.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [
      {
        id: 'item-1-1',
        item_name: 'Pine Oil Concentrate (85% Pure)',
        item_code: 'CHEM-PINE-85',
        item_type: 'Chemical',
        quantity: 60,
        uom: 'Liters',
        unit_cost: 320,
        wastage_percentage: 2,
        total_cost: 19584,
        notes: 'Active disinfectant agent'
      },
      {
        id: 'item-1-2',
        item_name: 'Castor Emulsifier / OP-9',
        item_code: 'CHEM-EMUL-OP',
        item_type: 'Chemical',
        quantity: 35,
        uom: 'Kg',
        unit_cost: 290,
        wastage_percentage: 1.5,
        total_cost: 10302,
        notes: 'White milky emulsion stabilizer'
      },
      {
        id: 'item-1-3',
        item_name: 'Concentrated Jasmine Fragrance Oil',
        item_code: 'FRAG-JAS-CONC',
        item_type: 'Chemical',
        quantity: 8,
        uom: 'Liters',
        unit_cost: 1450,
        wastage_percentage: 1,
        total_cost: 11716,
        notes: 'Top notes aroma'
      },
      {
        id: 'item-1-4',
        item_name: 'DM Purified Water Base',
        item_code: 'RAW-DM-WATER',
        item_type: 'Chemical',
        quantity: 500,
        uom: 'Liters',
        unit_cost: 3,
        wastage_percentage: 0,
        total_cost: 1500,
        notes: 'Reverse osmosis filtered water'
      },
      {
        id: 'item-1-5',
        item_name: '600ml HDPE Translucent Bottle',
        item_code: 'PKG-BTL-600ML',
        item_type: 'Packaging',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 14,
        wastage_percentage: 2,
        total_cost: 14280,
        notes: 'Rigid grade blow-molded bottles'
      },
      {
        id: 'item-1-6',
        item_name: '28mm Ribbed Screw Cap with Plug',
        item_code: 'PKG-CAP-28MM',
        item_type: 'Packaging',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 3.5,
        wastage_percentage: 1,
        total_cost: 3535,
        notes: 'Leak-proof seal cap'
      },
      {
        id: 'item-1-7',
        item_name: 'Jasmine Phenyl Laminated Label Stickers',
        item_code: 'PKG-LBL-JAS600',
        item_type: 'Packaging',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 4,
        wastage_percentage: 2,
        total_cost: 4080,
        notes: 'Waterproof self-adhesive front & back'
      }
    ]
  },
  {
    id: 'bom-sample-002',
    tenant_id: 'Jawaid Jakwani & Sons',
    bom_number: 'BOM-FMCG-0002',
    finished_product_name: 'Apple Green Antibacterial Handwash 500ml Pump',
    finished_product_code: 'HW-APL-500ML',
    category: 'Personal Care',
    batch_quantity: 500,
    uom: 'Bottles',
    raw_material_cost: 36000,
    labor_cost: 4500,
    overhead_cost: 2500,
    packaging_cost: 16500,
    total_cost: 59500,
    unit_cost: 119,
    target_selling_price: 195,
    margin_percentage: 38.97,
    status: 'Active',
    notes: 'Gentle moisturizing handwash with Green Apple aroma, SLES foaming blend, Pearlizing agent & high-viscosity thickener.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      {
        id: 'item-2-1',
        item_name: 'Sodium Lauryl Ether Sulfate (SLES 70%)',
        item_code: 'CHEM-SLES-70',
        item_type: 'Chemical',
        quantity: 35,
        uom: 'Kg',
        unit_cost: 260,
        wastage_percentage: 1.5,
        total_cost: 9237,
        notes: 'Primary surfactant foaming agent'
      },
      {
        id: 'item-2-2',
        item_name: 'Cocamidopropyl Betaine (CAPB)',
        item_code: 'CHEM-CAPB-30',
        item_type: 'Chemical',
        quantity: 15,
        uom: 'Kg',
        unit_cost: 280,
        wastage_percentage: 1,
        total_cost: 4242,
        notes: 'Foam booster and skin conditioner'
      },
      {
        id: 'item-2-3',
        item_name: 'Glycerin (Cosmetic Grade 99.5%)',
        item_code: 'CHEM-GLYC-COS',
        item_type: 'Chemical',
        quantity: 8,
        uom: 'Kg',
        unit_cost: 340,
        wastage_percentage: 1,
        total_cost: 2747,
        notes: 'Moisturizer & humectant'
      },
      {
        id: 'item-2-4',
        item_name: 'Cosmetic Green Apple Fragrance & Dye',
        item_code: 'FRAG-APL-GRN',
        item_type: 'Chemical',
        quantity: 3.5,
        uom: 'Liters',
        unit_cost: 1850,
        wastage_percentage: 1,
        total_cost: 6540,
        notes: 'Crisp green apple scent + CI 19140/42090 shade'
      },
      {
        id: 'item-2-5',
        item_name: '500ml Clear Boston Round PET Bottle',
        item_code: 'PKG-PET-500ML',
        item_type: 'Packaging',
        quantity: 500,
        uom: 'Pcs',
        unit_cost: 18,
        wastage_percentage: 2,
        total_cost: 9180,
        notes: 'Food & cosmetic grade PET clear'
      },
      {
        id: 'item-2-6',
        item_name: '24/410 Luxury Lotion Dispenser Pump',
        item_code: 'PKG-PMP-24410',
        item_type: 'Packaging',
        quantity: 500,
        uom: 'Pcs',
        unit_cost: 12.5,
        wastage_percentage: 1.5,
        total_cost: 6344,
        notes: 'Smooth dispensing 2cc dose lock-down pump'
      }
    ]
  }
];

const getLocalBoms = (): BomHeader[] => {
  if (typeof window === 'undefined') return DEFAULT_SAMPLE_BOMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_BOMS));
      return DEFAULT_SAMPLE_BOMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SAMPLE_BOMS;
  } catch (err) {
    console.warn('Error reading local BOMs:', err);
    return DEFAULT_SAMPLE_BOMS;
  }
};

const setLocalBoms = (boms: BomHeader[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boms));
  } catch (err) {
    console.warn('Error saving local BOMs:', err);
  }
};

export const bomService = {
  // Fetch all BOM recipes (with Supabase fallback to local storage)
  async getAll(): Promise<BomHeader[]> {
    try {
      const { data: headers, error: hError } = await supabase
        .from('bom_headers')
        .select('*')
        .order('created_at', { ascending: false });

      if (hError || !headers) {
        return getLocalBoms();
      }

      const { data: items, error: iError } = await supabase
        .from('bom_items')
        .select('*');

      const itemsByBom: Record<string, BomItem[]> = {};
      (items || []).forEach((it: any) => {
        const bid = String(it.bom_id);
        if (!itemsByBom[bid]) itemsByBom[bid] = [];
        itemsByBom[bid].push({
          id: it.id,
          bom_id: it.bom_id,
          item_id: it.item_id,
          item_name: it.item_name,
          item_code: it.item_code,
          quantity: Number(it.quantity) || 0,
          uom: it.uom || 'PCS',
          unit_cost: Number(it.unit_cost) || 0,
          wastage_percentage: Number(it.wastage_percentage) || 0,
          total_cost: Number(it.total_cost) || 0,
          notes: it.notes || ''
        });
      });

      const combined: BomHeader[] = headers.map((h: any) => ({
        id: String(h.id),
        tenant_id: h.tenant_id,
        bom_number: h.bom_number,
        finished_product_id: h.finished_product_id,
        finished_product_name: h.finished_product_name,
        finished_product_code: h.finished_product_code,
        category: h.category || 'General',
        batch_quantity: Number(h.batch_quantity) || 1,
        uom: h.uom || 'PCS',
        raw_material_cost: Number(h.raw_material_cost) || 0,
        labor_cost: Number(h.labor_cost) || 0,
        overhead_cost: Number(h.overhead_cost) || 0,
        packaging_cost: Number(h.packaging_cost) || 0,
        total_cost: Number(h.total_cost) || 0,
        unit_cost: Number(h.unit_cost) || 0,
        target_selling_price: Number(h.target_selling_price) || 0,
        margin_percentage: Number(h.margin_percentage) || 0,
        status: h.status || 'Active',
        notes: h.notes || '',
        created_at: h.created_at,
        updated_at: h.updated_at,
        items: itemsByBom[String(h.id)] || []
      }));

      // Cache locally for fast offline access
      setLocalBoms(combined);
      return combined;
    } catch {
      return getLocalBoms();
    }
  },

  // Fetch single BOM recipe by ID
  async getById(id: string): Promise<BomHeader | null> {
    const all = await this.getAll();
    return all.find(b => String(b.id) === String(id) || b.bom_number === id) || null;
  },

  // Save or update BOM
  async save(bom: Partial<BomHeader> & { items: BomItem[] }): Promise<BomHeader> {
    const isEdit = Boolean(bom.id);
    const id = bom.id || `bom-${Date.now()}`;
    const now = new Date().toISOString();

    const fullBom: BomHeader = {
      id,
      tenant_id: bom.tenant_id || 'uzair',
      bom_number: bom.bom_number || `BOM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      finished_product_id: bom.finished_product_id || '',
      finished_product_name: bom.finished_product_name || 'Custom Assembly Product',
      finished_product_code: bom.finished_product_code || '',
      category: bom.category || 'General',
      batch_quantity: Number(bom.batch_quantity) || 1,
      uom: bom.uom || 'PCS',
      raw_material_cost: Number(bom.raw_material_cost) || 0,
      labor_cost: Number(bom.labor_cost) || 0,
      overhead_cost: Number(bom.overhead_cost) || 0,
      packaging_cost: Number(bom.packaging_cost) || 0,
      total_cost: Number(bom.total_cost) || 0,
      unit_cost: Number(bom.unit_cost) || 0,
      target_selling_price: Number(bom.target_selling_price) || 0,
      margin_percentage: Number(bom.margin_percentage) || 0,
      status: bom.status || 'Active',
      notes: bom.notes || '',
      created_at: bom.created_at || now,
      updated_at: now,
      items: (bom.items || []).map((it, idx) => ({
        ...it,
        id: it.id || `item-${Date.now()}-${idx}`,
        bom_id: id
      }))
    };

    // 1. Try Supabase save
    try {
      const headerRow = {
        bom_number: fullBom.bom_number,
        finished_product_id: fullBom.finished_product_id,
        finished_product_name: fullBom.finished_product_name,
        finished_product_code: fullBom.finished_product_code,
        category: fullBom.category,
        batch_quantity: fullBom.batch_quantity,
        uom: fullBom.uom,
        raw_material_cost: fullBom.raw_material_cost,
        labor_cost: fullBom.labor_cost,
        overhead_cost: fullBom.overhead_cost,
        packaging_cost: fullBom.packaging_cost,
        total_cost: fullBom.total_cost,
        unit_cost: fullBom.unit_cost,
        target_selling_price: fullBom.target_selling_price,
        margin_percentage: fullBom.margin_percentage,
        status: fullBom.status,
        notes: fullBom.notes,
        updated_at: now
      };

      if (isEdit) {
        await supabase.from('bom_headers').update(headerRow).eq('id', id);
        await supabase.from('bom_items').delete().eq('bom_id', id);
      } else {
        await supabase.from('bom_headers').insert([{ ...headerRow, id, created_at: now }]);
      }

      if (fullBom.items.length > 0) {
        const itemRows = fullBom.items.map(it => ({
          bom_id: id,
          item_id: it.item_id,
          item_name: it.item_name,
          item_code: it.item_code,
          quantity: it.quantity,
          uom: it.uom,
          unit_cost: it.unit_cost,
          wastage_percentage: it.wastage_percentage,
          total_cost: it.total_cost,
          notes: it.notes
        }));
        await supabase.from('bom_items').insert(itemRows);
      }
    } catch {
      // Supabase tables might not exist yet; gracefully fallback
    }

    // 2. Always persist locally
    const existing = getLocalBoms();
    let updated: BomHeader[];
    if (isEdit) {
      updated = existing.map(b => (b.id === id ? fullBom : b));
    } else {
      updated = [fullBom, ...existing];
    }
    setLocalBoms(updated);

    return fullBom;
  },

  // Delete BOM
  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from('bom_headers').delete().eq('id', id);
    } catch {
      // fallback
    }
    const existing = getLocalBoms();
    const filtered = existing.filter(b => b.id !== id);
    setLocalBoms(filtered);
    return true;
  },

  // Generate next sequential BOM number
  async getNextBomNumber(): Promise<string> {
    const all = await this.getAll();
    const year = new Date().getFullYear();
    const prefix = `BOM-${year}-`;
    const nums = all
      .filter(b => b.bom_number.startsWith(prefix))
      .map(b => parseInt(b.bom_number.replace(prefix, ''), 10))
      .filter(n => !isNaN(n));

    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const next = max + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
};
