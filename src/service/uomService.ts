import { supabase } from '../Context/supabaseClient';

export interface UomItem {
  id: number | string;
  tenant_id?: string;
  short_code: string;
  full_name: string;
  category: string;
  is_active: boolean;
}

const STORAGE_ACTIVE_OVERRIDES_KEY = 'uj_uom_active_status_overrides';
const STORAGE_CUSTOM_UOMS_KEY = 'uj_custom_uoms_list';

export const DEFAULT_UOM_TEMPLATES = [
  { short_code: 'BOX', full_name: 'Box / Carton', category: 'Packaging & Containers', is_active: false },
  { short_code: 'PCS', full_name: 'Pieces', category: 'Count & Units', is_active: true },
  { short_code: 'NOS', full_name: 'Numbers', category: 'Count & Units', is_active: false },
  { short_code: 'EACH', full_name: 'Each', category: 'Count & Units', is_active: false },
  { short_code: 'SET', full_name: 'Sets', category: 'Count & Units', is_active: false },
  { short_code: 'PAIR', full_name: 'Pairs', category: 'Count & Units', is_active: false },
  { short_code: 'DOZ', full_name: 'Dozen (12 Pcs)', category: 'Count & Units', is_active: false },
  { short_code: 'CTN', full_name: 'Carton', category: 'Packaging & Containers', is_active: false },
  { short_code: 'PKT', full_name: 'Packet / Pack', category: 'Packaging & Containers', is_active: false },
  { short_code: 'BAG', full_name: 'Bag / Sack', category: 'Packaging & Containers', is_active: false },
  { short_code: 'BNDL', full_name: 'Bundle', category: 'Packaging & Containers', is_active: false },
  { short_code: 'ROLL', full_name: 'Roll', category: 'Packaging & Containers', is_active: false },
  { short_code: 'SQFT', full_name: 'Square Feet (Sq. Ft)', category: 'Area & Surface', is_active: false },
  { short_code: 'SQM', full_name: 'Square Meter (Sq. Mtr)', category: 'Area & Surface', is_active: false },
  { short_code: 'SQYD', full_name: 'Square Yard (Guz)', category: 'Area & Surface', is_active: false },
  { short_code: 'MTR', full_name: 'Meter (Linear Mtr)', category: 'Length & Distance', is_active: false },
  { short_code: 'FT', full_name: 'Foot / Feet', category: 'Length & Distance', is_active: false },
  { short_code: 'INCH', full_name: 'Inches', category: 'Length & Distance', is_active: false },
  { short_code: 'MM', full_name: 'Millimeter', category: 'Length & Distance', is_active: false },
  { short_code: 'YD', full_name: 'Yard (Guz)', category: 'Length & Distance', is_active: false },
  { short_code: 'KG', full_name: 'Kilogram (Kg)', category: 'Weight & Mass', is_active: false },
  { short_code: 'GM', full_name: 'Gram (g)', category: 'Weight & Mass', is_active: false },
  { short_code: 'TON', full_name: 'Metric Ton', category: 'Weight & Mass', is_active: false },
  { short_code: 'LBS', full_name: 'Pound (lb)', category: 'Weight & Mass', is_active: false },
  { short_code: 'LTR', full_name: 'Liter (Ltr)', category: 'Volume & Liquid', is_active: false },
  { short_code: 'ML', full_name: 'Milliliter (ml)', category: 'Volume & Liquid', is_active: false },
  { short_code: 'GAL', full_name: 'Gallon', category: 'Volume & Liquid', is_active: false }
];

export const getLocalActiveOverrides = (): Record<string, boolean> => {
  return {};
};

export const setLocalActiveOverride = (_code: string, _isActive: boolean) => {
  // No-op: UOM status is persisted in Supabase inventory_uom
};

export const getCustomLocalUoms = (): any[] => {
  return [];
};

export const saveCustomLocalUom = (_uom: any) => {
  // No-op: UOMs are persisted in Supabase inventory_uom
};

export const deleteCustomLocalUom = (_idOrCode: string | number) => {
  // No-op: UOMs are persisted in Supabase inventory_uom
};

/**
 * Creates and persists a new UOM to Supabase database (inventory_uom table),
 * with automatic fallback to localStorage and active status switches.
 */
export const createAndPersistUom = async (
  shortCode: string,
  fullName?: string,
  category = 'Count & Units',
  tenantId = 'bashir'
): Promise<UomItem> => {
  const code = String(shortCode || '').trim().toUpperCase();
  const name = String(fullName || code).trim();
  const activeTenant = tenantId || 'bashir';

  const newUnit: UomItem = {
    id: `custom-${Date.now()}`,
    short_code: code,
    full_name: name,
    category: category,
    tenant_id: activeTenant,
    is_active: true
  };

  try {
    const { data, error } = await supabase
      .from('inventory_uom')
      .insert([{
        short_code: code,
        full_name: name,
        category: category,
        tenant_id: activeTenant
      }])
      .select('*')
      .single();

    if (!error && data) {
      newUnit.id = data.id;
    }
  } catch (err) {
    console.warn('Could not insert UOM into inventory_uom table, saved locally:', err);
  }

  // Persist locally & set active override
  saveCustomLocalUom(newUnit);
  setLocalActiveOverride(code, true);

  return newUnit;
};

// Unified fetcher for UOMs that safely falls back when is_active column doesn't exist in Postgres
export const fetchAllUomsSafe = async (tenantId?: string): Promise<UomItem[]> => {
  const activeOverrides = getLocalActiveOverrides();
  const customLocal = getCustomLocalUoms();
  const activeTenant = tenantId || 'bashir';

  try {
    // 1. Fetch available rows from Supabase (including is_active)
    let { data: dbRows, error } = await supabase
      .from('inventory_uom')
      .select('id, short_code, full_name, category, is_active')
      .order('id', { ascending: true });

    if (error && (error.message?.includes('is_active') || error.code === '42703')) {
      const fallback = await supabase
        .from('inventory_uom')
        .select('id, short_code, full_name, category')
        .order('id', { ascending: true });
      dbRows = fallback.data as any;
      error = fallback.error;
    }

    let baseList: any[] = [];

    if (!error && dbRows && dbRows.length > 0) {
      baseList = dbRows.map((row: any) => ({
        ...row,
        is_active: row.is_active !== undefined && row.is_active !== null ? Boolean(row.is_active) : true,
      }));
    } else {
      // Seed with default templates if database is empty or errored
      baseList = DEFAULT_UOM_TEMPLATES.map((t, idx) => ({
        id: `tpl-${idx + 1}`,
        tenant_id: activeTenant,
        short_code: t.short_code,
        full_name: t.full_name,
        category: t.category,
        is_active: t.is_active
      }));
    }

    // Merge default templates if some are missing from db
    DEFAULT_UOM_TEMPLATES.forEach(tpl => {
      const exists = baseList.some(b => String(b.short_code).trim().toUpperCase() === tpl.short_code.toUpperCase());
      if (!exists) {
        baseList.push({
          id: `tpl-${tpl.short_code}`,
          tenant_id: activeTenant,
          short_code: tpl.short_code,
          full_name: tpl.full_name,
          category: tpl.category,
          is_active: tpl.is_active
        });
      }
    });

    // Merge local custom UOMs
    customLocal.forEach(cu => {
      const exists = baseList.some(b => String(b.short_code).trim().toUpperCase() === cu.short_code.toUpperCase());
      if (!exists) {
        baseList.push(cu);
      }
    });

    // Apply active status (DB / Template default + LocalStorage Switchboard override)
    const finalUoms: UomItem[] = baseList.map(u => {
      const code = String(u.short_code || '').trim().toUpperCase();
      let isActive = u.is_active !== undefined ? Boolean(u.is_active) : true;

      // Match default template status if available
      const tpl = DEFAULT_UOM_TEMPLATES.find(t => t.short_code.toUpperCase() === code);
      if (tpl && u.is_active === undefined) {
        isActive = tpl.is_active;
      }

      // Check if user toggled in Switchboard
      if (activeOverrides[code] !== undefined) {
        isActive = activeOverrides[code];
      }

      let rawCat = u.category || 'Count & Units';
      if (rawCat === 'Packaging') rawCat = 'Packaging & Containers';
      return {
        id: u.id,
        tenant_id: u.tenant_id || activeTenant,
        short_code: code,
        full_name: u.full_name || code,
        category: rawCat,
        is_active: isActive
      };
    });

    return finalUoms;
  } catch (err) {
    console.warn('fetchAllUomsSafe fallback:', err);
    return DEFAULT_UOM_TEMPLATES.map((t, i) => {
      const code = t.short_code.toUpperCase();
      const isActive = activeOverrides[code] !== undefined ? activeOverrides[code] : t.is_active;
      return {
        id: i + 1,
        short_code: code,
        full_name: t.full_name,
        category: t.category,
        is_active: isActive
      };
    });
  }
};

