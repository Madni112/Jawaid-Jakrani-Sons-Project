import { supabase } from '../Context/supabaseClient';

export interface PosOrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  product_code: string;
  barcode?: string;
  image_url?: string;
  category: string;
  uom: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
}

export interface PosOrder {
  id: string;
  tenant_id?: string;
  order_number: string;
  shift_id?: string;
  cashier_id?: string;
  cashier_name: string;
  customer_id?: string;
  customer_name: string;
  customer_tier: 'VIP' | 'Regular' | 'Retail' | string;
  terminal_code: string;
  fulfillment_type: 'In-Store Bag' | 'Takeaway' | 'Delivery' | string;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  voucher_code?: string;
  total_amount: number;
  payment_method: 'Cash' | 'Card' | 'Digital' | 'Split' | string;
  cash_tendered: number;
  change_due: number;
  status: 'Completed' | 'Voided' | 'Refunded';
  notes?: string;
  items: PosOrderItem[];
  created_at: string;
}

export interface PosShift {
  id: string;
  tenant_id?: string;
  terminal_code: string;
  cashier_id?: string;
  cashier_name: string;
  session_number: number;
  opened_at: string;
  closed_at?: string;
  opening_float: number;
  cash_sales: number;
  card_sales: number;
  digital_sales: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  actual_counted_cash?: number;
  variance?: number;
  status: 'Open' | 'Closed';
  closing_notes?: string;
}

export interface PosHeldOrder {
  id: string;
  tenant_id?: string;
  ticket_label: string;
  ticket_number: string;
  cashier_name: string;
  items: PosOrderItem[];
  subtotal: number;
  customer_name?: string;
  customer_tier?: string;
  created_at: string;
}

export interface PosSettings {
  id?: string;
  terminal_name: string;
  store_title: string;
  store_address: string;
  store_phone: string;
  tax_id: string;
  receipt_paper_size: '80mm' | '58mm';
  show_logo: boolean;
  footer_message: string;
  theme_accent_color: string;
  sync_erp_theme: boolean;
  default_fulfillment: string;
  default_customer_name: string;
  default_tax_rate: number;
  barcode_auto_add: boolean;
  sound_effects_enabled: boolean;
}

export interface PosProductItem {
  id: string;
  product_name: string;
  item_sr_no?: string;
  barcode?: string;
  barcode_locked?: boolean;
  category: string;
  sub_category?: string;
  retail_price: number;
  purchase_price?: number;
  uom: string;
  image_url?: string;
  show_in_pos: boolean;
}

export interface PosCategoryItem {
  id: string;
  name: string;
  image_url?: string;
  icon_name?: string;
  show_in_pos: boolean;
  item_count?: number;
}

// Local storage storage keys

const STORAGE_PRODUCT_META = 'uj_pos_product_meta_v2';

interface PosProductMeta {
  show_in_pos: boolean;
  image_url?: string;
  barcode?: string;
  barcode_locked?: boolean;
}

const getStoredProductMeta = (): Record<string, PosProductMeta> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCT_META);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredProductMeta = (metaMap: Record<string, PosProductMeta>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCT_META, JSON.stringify(metaMap));
  }
};

const STORAGE_ORDERS = 'uj_pos_orders_v1';
const STORAGE_SHIFTS = 'uj_pos_shifts_v1';
const STORAGE_HELD = 'uj_pos_held_v1';
const STORAGE_SETTINGS = 'uj_pos_settings_v1';
const STORAGE_VISIBILITY = 'uj_pos_visibility_v1';

export const DEFAULT_POS_SETTINGS: PosSettings = {
  terminal_name: 'Register 01',
  store_title: 'Uzair Jibran Cloth',
  store_address: 'Cloth Market, Hyderabad, Sindh',
  store_phone: '+92 300 1234567',
  tax_id: 'NTN-786110',
  receipt_paper_size: '80mm',
  show_logo: true,
  footer_message: 'Thank you for shopping with us! Exchange allowed within 7 days with original receipt.',
  theme_accent_color: '#06B6D4',
  sync_erp_theme: true,
  default_fulfillment: 'In-Store Bag',
  default_customer_name: 'Walk-in Customer',
  default_tax_rate: 0,
  barcode_auto_add: true,
  sound_effects_enabled: true
};

// Initial Sample Boutique Products matching the user's reference layout
export const SAMPLE_POS_PRODUCTS: PosProductItem[] = [
  {
    id: 'prod-001',
    product_name: 'Noise-Cancelling Headphones',
    item_sr_no: 'AUD-NCH-01',
    barcode: '890100000001',
    barcode_locked: true,
    category: 'Audio & Tech',
    retail_price: 149,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-002',
    product_name: 'Merino Wool Beanie',
    item_sr_no: 'APP-WBL-02',
    barcode: '890100000002',
    barcode_locked: true,
    category: 'Apparel',
    retail_price: 32,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-003',
    product_name: 'Minimalist Ceramic Mug',
    item_sr_no: 'HOM-CRM-03',
    barcode: '890100000003',
    barcode_locked: true,
    category: 'Home',
    retail_price: 24,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-004',
    product_name: 'Leather Card Wallet',
    item_sr_no: 'ACC-WLT-04',
    barcode: '890100000004',
    barcode_locked: true,
    category: 'Accessories',
    retail_price: 45,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-005',
    product_name: 'Polarized Sunglasses',
    item_sr_no: 'EYE-SGL-05',
    barcode: '890100000005',
    barcode_locked: true,
    category: 'Accessories',
    retail_price: 89,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-006',
    product_name: 'Matte Stainless Bottle',
    item_sr_no: 'LIV-BTL-06',
    barcode: '890100000006',
    barcode_locked: true,
    category: 'Home',
    retail_price: 28,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-007',
    product_name: 'Linen Overshirt Jacket',
    item_sr_no: 'APP-LNN-07',
    barcode: '890100000007',
    barcode_locked: true,
    category: 'Apparel',
    retail_price: 68,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-008',
    product_name: 'Canvas Daypack Backpack',
    item_sr_no: 'BAG-DAY-08',
    barcode: '890100000008',
    barcode_locked: true,
    category: 'Accessories',
    retail_price: 55,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-009',
    product_name: 'Scented Soy Wax Candle',
    item_sr_no: 'HOM-CND-09',
    barcode: '890100000009',
    barcode_locked: true,
    category: 'Home',
    retail_price: 22,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-010',
    product_name: 'Mechanical Keyboard (TKL)',
    item_sr_no: 'AUD-KBD-10',
    barcode: '890100000010',
    barcode_locked: true,
    category: 'Audio & Tech',
    retail_price: 64,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-011',
    product_name: 'Organic Cotton Socks (3-Pack)',
    item_sr_no: 'APP-SCK-11',
    barcode: '890100000011',
    barcode_locked: true,
    category: 'Apparel',
    retail_price: 16,
    uom: 'Pack',
    image_url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80',
    show_in_pos: true
  },
  {
    id: 'prod-012',
    product_name: 'Brass Desk Valet Tray',
    item_sr_no: 'LIV-TRY-12',
    barcode: '890100000012',
    barcode_locked: true,
    category: 'Home',
    retail_price: 38,
    uom: 'PCS',
    image_url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=400&q=80',
    show_in_pos: true
  }
];

export const posService = {
  // ── 1. SETTINGS ──
  getSettings(): PosSettings {
    if (typeof window === 'undefined') return DEFAULT_POS_SETTINGS;
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS);
      if (!raw) return DEFAULT_POS_SETTINGS;
      return { ...DEFAULT_POS_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_POS_SETTINGS;
    }
  },

  async saveSettings(settings: Partial<PosSettings>): Promise<PosSettings> {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(updated));
    }
    try {
      await supabase.from('pos_settings').upsert({
        id: 'default',
        ...updated,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not sync pos_settings with cloud DB:', e);
    }
    return updated;
  },

  // ── 2. SHIFTS / CASH REGISTER ──
  getActiveShift(): PosShift | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_SHIFTS);
      const list: PosShift[] = raw ? JSON.parse(raw) : [];
      return list.find(s => s.status === 'Open') || null;
    } catch {
      return null;
    }
  },

  getAllShifts(): PosShift[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_SHIFTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async openShift(cashierName: string, openingFloat: number, terminalCode: string = 'Register 01'): Promise<PosShift> {
    const existing = this.getActiveShift();
    if (existing) return existing;

    const all = this.getAllShifts();
    const nextSessionNum = all.length > 0 ? Math.max(...all.map(s => s.session_number || 400)) + 1 : 401;

    const newShift: PosShift = {
      id: `shift-${Date.now()}`,
      terminal_code: terminalCode,
      cashier_name: cashierName,
      session_number: nextSessionNum,
      opened_at: new Date().toISOString(),
      opening_float: Number(openingFloat) || 0,
      cash_sales: 0,
      card_sales: 0,
      digital_sales: 0,
      cash_in: 0,
      cash_out: 0,
      expected_cash: Number(openingFloat) || 0,
      status: 'Open'
    };

    const updated = [newShift, ...all];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SHIFTS, JSON.stringify(updated));
    }

    try {
      await supabase.from('pos_shifts').insert([newShift]);
    } catch (e) {
      console.warn('Could not persist shift to Supabase:', e);
    }

    return newShift;
  },

  async closeShift(shiftId: string, actualCountedCash: number, closingNotes?: string): Promise<PosShift> {
    const all = this.getAllShifts();
    const shift = all.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');

    const expected = Number(shift.opening_float) + Number(shift.cash_sales) + Number(shift.cash_in) - Number(shift.cash_out);
    const variance = Number(actualCountedCash) - expected;

    const updatedShift: PosShift = {
      ...shift,
      closed_at: new Date().toISOString(),
      expected_cash: expected,
      actual_counted_cash: Number(actualCountedCash),
      variance,
      status: 'Closed',
      closing_notes: closingNotes || ''
    };

    const updated = all.map(s => (s.id === shiftId ? updatedShift : s));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SHIFTS, JSON.stringify(updated));
    }

    try {
      await supabase.from('pos_shifts').update(updatedShift).eq('id', shiftId);
    } catch (e) {
      console.warn('Could not update shift in Supabase:', e);
    }

    return updatedShift;
  },

  recordCashMovement(shiftId: string, type: 'in' | 'out', amount: number) {
    const all = this.getAllShifts();
    const shift = all.find(s => s.id === shiftId);
    if (!shift) return;

    if (type === 'in') {
      shift.cash_in = (Number(shift.cash_in) || 0) + Number(amount);
    } else {
      shift.cash_out = (Number(shift.cash_out) || 0) + Number(amount);
    }
    shift.expected_cash = Number(shift.opening_float) + Number(shift.cash_sales) + Number(shift.cash_in) - Number(shift.cash_out);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SHIFTS, JSON.stringify(all));
    }
  },

  // ── 3. ORDERS & CHECKOUT ──
  getAllOrders(): PosOrder[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async createOrder(orderPayload: Omit<PosOrder, 'id' | 'order_number' | 'created_at'>): Promise<PosOrder> {
    const orders = this.getAllOrders();
    const nextTicketNum = `#RT-${1080 + orders.length + 1}`;
    const id = `order-${Date.now()}`;
    const now = new Date().toISOString();

    const fullOrder: PosOrder = {
      ...orderPayload,
      id,
      order_number: nextTicketNum,
      created_at: now
    };

    // Update active shift sales tallies
    const activeShift = this.getActiveShift();
    if (activeShift) {
      if (fullOrder.payment_method === 'Cash') {
        activeShift.cash_sales = (Number(activeShift.cash_sales) || 0) + Number(fullOrder.total_amount);
      } else if (fullOrder.payment_method === 'Card') {
        activeShift.card_sales = (Number(activeShift.card_sales) || 0) + Number(fullOrder.total_amount);
      } else {
        activeShift.digital_sales = (Number(activeShift.digital_sales) || 0) + Number(fullOrder.total_amount);
      }
      activeShift.expected_cash = Number(activeShift.opening_float) + Number(activeShift.cash_sales) + Number(activeShift.cash_in) - Number(activeShift.cash_out);

      const allShifts = this.getAllShifts().map(s => (s.id === activeShift.id ? activeShift : s));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SHIFTS, JSON.stringify(allShifts));
      }
    }

    const updated = [fullOrder, ...orders];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(updated));
    }

    // Try cloud persist
    try {
      const { items, ...header } = fullOrder;
      await supabase.from('pos_orders').insert([{ ...header }]);
      if (items.length > 0) {
        const itemRows = items.map(it => ({ ...it, order_id: id }));
        await supabase.from('pos_order_items').insert(itemRows);
      }
    } catch (e) {
      console.warn('Could not sync POS order with Supabase:', e);
    }

    return fullOrder;
  },

  // ── 4. PARKED / HELD ORDERS ──
  getHeldOrders(): PosHeldOrder[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_HELD);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  holdOrder(held: Omit<PosHeldOrder, 'id' | 'ticket_number' | 'created_at'>): PosHeldOrder {
    const list = this.getHeldOrders();
    const num = `#HOLD-${list.length + 1}`;
    const newHeld: PosHeldOrder = {
      ...held,
      id: `held-${Date.now()}`,
      ticket_number: num,
      created_at: new Date().toISOString()
    };
    const updated = [newHeld, ...list];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_HELD, JSON.stringify(updated));
    }
    return newHeld;
  },

  deleteHeldOrder(id: string) {
    const list = this.getHeldOrders();
    const updated = list.filter(h => h.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_HELD, JSON.stringify(updated));
    }
  },

  // ── 5. PRODUCTS & CATEGORIES VISIBILITY ──
  async getProducts(): Promise<PosProductItem[]> {
    return this.getPosProducts();
  },

  async getCategories(): Promise<PosCategoryItem[]> {
    // 1. Try reading from inventory_categories in Supabase
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: String(c.id),
          name: c.name || c.category_name || 'Category',
          image_url: c.image_url,
          icon_name: c.icon_name,
          show_in_pos: c.show_in_pos !== false
        }));
      }
    } catch (e) {
      console.warn('Could not read categories from DB:', e);
    }

    // 2. Fallback: extract distinct categories from products
    const products = await this.getProducts();
    const uniqueCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    if (uniqueCats.length > 0) {
      return uniqueCats.map((name, i) => ({
        id: `cat-${i + 1}`,
        name,
        show_in_pos: true
      }));
    }

    return [
      { id: 'cat-1', name: 'Audio & Tech', show_in_pos: true },
      { id: 'cat-2', name: 'Apparel', show_in_pos: true },
      { id: 'cat-3', name: 'Home', show_in_pos: true },
      { id: 'cat-4', name: 'Accessories', show_in_pos: true }
    ];
  },

  async updateCategoryVisibility(categoryId: string, show: boolean) {
    try {
      await supabase.from('inventory_categories').update({ show_in_pos: show }).eq('id', categoryId);
    } catch (e) {
      console.warn('Could not update category in DB:', e);
    }
  },

  async updateCategoryImage(categoryId: string, imageUrl: string) {
    try {
      await supabase.from('inventory_categories').update({ image_url: imageUrl }).eq('id', categoryId);
    } catch (e) {
      console.warn('Could not update category image in DB:', e);
    }
  },

  // ── Fetch Master ERP Products ──
  async getErpProducts(): Promise<PosProductItem[]> {
    const metaMap = getStoredProductMeta();

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, item_sr_no, category, sub_category, uom, retail_price, sales_price, price, current_stock')
        .order('category', { ascending: true })
        .order('product_name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((p: any) => {
          const strId = String(p.id);
          const meta = metaMap[strId] || {};
          const autoBarcode = meta.barcode || (p.item_sr_no ? `890${strId.padStart(9, '0')}` : this.generateUniqueBarcode({ id: strId }));

          return {
            id: strId,
            product_name: p.product_name || 'Unnamed Product',
            item_sr_no: p.item_sr_no || `SKU-${strId}`,
            barcode: autoBarcode,
            barcode_locked: meta.barcode_locked ?? false,
            category: p.category || 'General',
            sub_category: p.sub_category,
            retail_price: Number(p.retail_price ?? p.sales_price ?? p.price ?? 0),
            uom: p.uom || 'PCS',
            image_url: meta.image_url,
            show_in_pos: meta.show_in_pos ?? true
          };
        });
      }
    } catch (e) {
      console.warn('Could not read ERP products from Supabase:', e);
    }

    return SAMPLE_POS_PRODUCTS;
  },

  async getPosProducts(): Promise<PosProductItem[]> {
    const metaMap = getStoredProductMeta();

    // 1. Fetch ERP Products
    let erpList: PosProductItem[] = [];
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, item_sr_no, category, sub_category, uom, retail_price, sales_price, price, current_stock')
        .order('category', { ascending: true })
        .order('product_name', { ascending: true });

      if (!error && data && data.length > 0) {
        erpList = data.map((p: any) => {
          const strId = String(p.id);
          const meta = metaMap[strId] || {};
          const autoBarcode = meta.barcode || (p.item_sr_no ? `890${strId.padStart(9, '0')}` : this.generateUniqueBarcode({ id: strId }));

          return {
            id: strId,
            product_name: p.product_name || 'Unnamed Product',
            item_sr_no: p.item_sr_no || `SKU-${strId}`,
            barcode: autoBarcode,
            barcode_locked: meta.barcode_locked ?? false,
            category: p.category || 'General',
            sub_category: p.sub_category,
            retail_price: Number(p.retail_price ?? p.sales_price ?? p.price ?? 0),
            uom: p.uom || 'PCS',
            image_url: meta.image_url,
            show_in_pos: meta.show_in_pos ?? true
          };
        });
      }
    } catch (e) {
      console.warn('Reading products from database failed:', e);
    }

    // 2. Read custom local products (created directly in POS)
    let localCustom: PosProductItem[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uj_custom_pos_products');
      if (saved) {
        try {
          localCustom = JSON.parse(saved);
        } catch (_) {}
      }
    }

    if (erpList.length > 0) {
      const existingIds = new Set(erpList.map(p => p.id));
      const existingCodes = new Set(erpList.map(p => p.item_sr_no?.toLowerCase()).filter(Boolean));
      const unmerged = localCustom.filter(p => !existingIds.has(p.id) && (!p.item_sr_no || !existingCodes.has(p.item_sr_no.toLowerCase())));
      return [...unmerged, ...erpList];
    }

    if (localCustom.length > 0) {
      return localCustom;
    }

    return SAMPLE_POS_PRODUCTS;
  },

  async setProductsPosVisibility(enabledIds: string[], allTargetIds: string[]) {
    const metaMap = getStoredProductMeta();
    const enabledSet = new Set(enabledIds);

    for (const id of allTargetIds) {
      const current = metaMap[id] || { show_in_pos: true };
      metaMap[id] = {
        ...current,
        show_in_pos: enabledSet.has(id)
      };
    }

    saveStoredProductMeta(metaMap);

    // Try updating DB
    try {
      if (enabledIds.length > 0) {
        await supabase.from('products').update({ show_in_pos: true }).in('id', enabledIds);
      }
      const disabledIds = allTargetIds.filter(id => !enabledSet.has(id));
      if (disabledIds.length > 0) {
        await supabase.from('products').update({ show_in_pos: false }).in('id', disabledIds);
      }
    } catch (_) {}
  },

  async createProduct(productData: Omit<PosProductItem, 'id'>): Promise<PosProductItem> {
    const id = `prod-${Date.now()}`;
    const newProduct: PosProductItem = {
      id,
      product_name: productData.product_name,
      item_sr_no: productData.item_sr_no || `SKU-${Date.now().toString().slice(-6)}`,
      category: productData.category || 'Apparel',
      retail_price: Number(productData.retail_price) || 0,
      uom: productData.uom || 'PCS',
      image_url: productData.image_url,
      barcode: productData.barcode || this.generateUniqueBarcode({ id }),
      barcode_locked: productData.barcode_locked ?? true,
      show_in_pos: productData.show_in_pos ?? true
    };

    // 1. Try insert into Supabase products table
    try {
      const { data, error } = await supabase.from('products').insert([{
        product_name: newProduct.product_name,
        item_sr_no: newProduct.item_sr_no,
        category: newProduct.category,
        retail_price: newProduct.retail_price,
        sales_price: newProduct.retail_price,
        uom: newProduct.uom,
        image_url: newProduct.image_url,
        barcode: newProduct.barcode,
        barcode_locked: newProduct.barcode_locked,
        show_in_pos: newProduct.show_in_pos
      }]).select().single();

      if (!error && data) {
        newProduct.id = String(data.id);
      }
    } catch (e) {
      console.warn('Could not insert product into Supabase:', e);
    }

    // 2. Save into local products cache
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('uj_custom_pos_products');
        const list = raw ? JSON.parse(raw) : [...SAMPLE_POS_PRODUCTS];
        const updated = [newProduct, ...list.filter((p: any) => p.id !== newProduct.id)];
        localStorage.setItem('uj_custom_pos_products', JSON.stringify(updated));
      } catch (_) {}
    }

    return newProduct;
  },

  async toggleProductPosVisibility(productId: string, show: boolean) {
    const metaMap = getStoredProductMeta();
    metaMap[productId] = {
      ...(metaMap[productId] || { show_in_pos: true }),
      show_in_pos: show
    };
    saveStoredProductMeta(metaMap);

    try {
      await supabase.from('products').update({ show_in_pos: show }).eq('id', productId);
    } catch (e) {
      console.warn('Could not update show_in_pos in DB:', e);
    }
  },

  async updateProductImage(productId: string, imageUrl: string) {
    const metaMap = getStoredProductMeta();
    metaMap[productId] = {
      ...(metaMap[productId] || { show_in_pos: true }),
      image_url: imageUrl
    };
    saveStoredProductMeta(metaMap);

    try {
      await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId);
    } catch (e) {
      console.warn('Could not update image_url in DB:', e);
    }
  },

  // ── 6. BARCODE GENERATION & PERMANENT LOCK ──
  generateUniqueBarcode(product: { id: string; category?: string }): string {
    // Standard EAN-13 style: 890 (Pakistan prefix) + 9 digits + checksum
    const seed = `${Date.now()}`.slice(-8);
    const base9 = `${seed}${String(product.id || '1').replace(/\D/g, '').slice(-1)}`.padStart(9, '0').slice(0, 9);
    const candidate12 = `890${base9}`;

    // Calculate EAN-13 check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(candidate12[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${candidate12}${checkDigit}`;
  },

  async lockProductBarcode(productId: string, barcode: string) {
    const metaMap = getStoredProductMeta();
    metaMap[productId] = {
      ...(metaMap[productId] || { show_in_pos: true }),
      barcode,
      barcode_locked: true
    };
    saveStoredProductMeta(metaMap);

    try {
      await supabase
        .from('products')
        .update({ barcode, barcode_locked: true })
        .eq('id', productId);
    } catch (e) {
      console.warn('Could not lock barcode in DB:', e);
    }
  }
};

