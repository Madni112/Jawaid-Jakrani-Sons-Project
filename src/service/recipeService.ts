import { supabase } from '../Context/supabaseClient';
import { BomItem } from './bomService';

export interface DedicatedRecipe {
  id: string;
  tenant_id?: string;
  recipe_name: string;
  finished_product_name: string;
  finished_product_code?: string;
  finished_product_id?: string;
  category?: string;
  sub_category?: string;
  sub_sub_category?: string;
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
  status: string;
  notes?: string;
  raw_materials: BomItem[];
  created_at?: string;
  updated_at?: string;
}

const STORAGE_KEY = 'uj_dedicated_bom_recipes_v1';

export const SAMPLE_RECIPES: DedicatedRecipe[] = [
  {
    id: 'rec-001',
    tenant_id: 'uzair',
    recipe_name: 'Summer Lawn 80/80 Embroidered Suit',
    finished_product_name: 'Summer Lawn 80/80 Embroidered Suit (Finished)',
    finished_product_code: 'SL-8080-01',
    category: 'Fabrics & Garments',
    sub_category: 'Suits',
    sub_sub_category: 'Unstitched',
    batch_quantity: 50,
    uom: 'Suits',
    raw_material_cost: 65000,
    labor_cost: 15000,
    overhead_cost: 4000,
    packaging_cost: 3500,
    total_cost: 87500,
    unit_cost: 1750,
    target_selling_price: 2850,
    margin_percentage: 38.6,
    status: 'Active',
    notes: 'Standard 50-suit summer lawn run. Includes 4.5m grey fabric per suit plus zari motif embroidery.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    raw_materials: [
      {
        id: 'rm-1',
        item_name: '80/80 Cotton Lawn Grey Fabric',
        item_code: 'FAB-LWN-80',
        quantity: 235,
        uom: 'Meters',
        unit_cost: 210,
        wastage_percentage: 3,
        total_cost: 50830.5,
        notes: '4.5 meters per suit plus cutting allowance'
      },
      {
        id: 'rm-2',
        item_name: 'Metallic Zari Embroidery Thread',
        item_code: 'THR-ZAR-01',
        quantity: 15,
        uom: 'Spools',
        unit_cost: 550,
        wastage_percentage: 2,
        total_cost: 8415,
        notes: 'Neckline & border motifs'
      },
      {
        id: 'rm-3',
        item_name: 'Fancy Mother-of-Pearl Buttons',
        item_code: 'ACC-BTN-MOP',
        quantity: 400,
        uom: 'Pcs',
        unit_cost: 14,
        wastage_percentage: 0,
        total_cost: 5600,
        notes: '8 buttons per suit'
      }
    ]
  },
  {
    id: 'rec-002',
    tenant_id: 'uzair',
    recipe_name: 'Premium Boski Gents Shalwar Kameez',
    finished_product_name: 'Premium Boski Gents Suit (Finished)',
    finished_product_code: 'BSK-PREM-02',
    category: 'Fabrics & Garments',
    sub_category: 'Suits',
    sub_sub_category: 'Silk & Boski',
    batch_quantity: 30,
    uom: 'Suits',
    raw_material_cost: 72000,
    labor_cost: 12000,
    overhead_cost: 3000,
    packaging_cost: 3000,
    total_cost: 90000,
    unit_cost: 3000,
    target_selling_price: 5200,
    margin_percentage: 42.3,
    status: 'Active',
    notes: 'Premium silk blend Boski suit batch. Elegant custom gift packaging.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    raw_materials: [
      {
        id: 'rm-2-1',
        item_name: 'Pure Boski Raw Fabric 8-Pound',
        item_code: 'FAB-BSK-08',
        quantity: 125,
        uom: 'Meters',
        unit_cost: 520,
        wastage_percentage: 2,
        total_cost: 66300,
        notes: '4 meters per suit with collar and cuff cut'
      },
      {
        id: 'rm-2-2',
        item_name: 'Fusing Collar & Cuff Buckram (German)',
        item_code: 'BCK-GER-01',
        quantity: 30,
        uom: 'Meters',
        unit_cost: 140,
        wastage_percentage: 1,
        total_cost: 4242,
        notes: '1 meter per suit for hard collar and cuffs'
      },
      {
        id: 'rm-2-3',
        item_name: 'Signature Boski Horn Buttons',
        item_code: 'ACC-BTN-HRN',
        quantity: 240,
        uom: 'Pcs',
        unit_cost: 6,
        wastage_percentage: 0,
        total_cost: 1440,
        notes: '8 buttons per suit'
      }
    ]
  }
];

const getLocalRecipes = (): DedicatedRecipe[] => {
  if (typeof window === 'undefined') return SAMPLE_RECIPES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RECIPES));
      return SAMPLE_RECIPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_RECIPES;
  } catch {
    return SAMPLE_RECIPES;
  }
};

const setLocalRecipes = (recipes: DedicatedRecipe[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.warn('Could not save local recipes:', e);
  }
};

export const recipeService = {
  // Fetch all recipes from Supabase (fallback to local storage)
  async getAll(): Promise<DedicatedRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('bom_recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return getLocalRecipes();
      }

      return data.map((r: any) => ({
        id: String(r.id),
        tenant_id: r.tenant_id,
        recipe_name: r.recipe_name,
        finished_product_name: r.finished_product_name || '',
        finished_product_code: r.finished_product_code || '',
        finished_product_id: r.finished_product_id || '',
        category: r.category || 'General',
        sub_category: r.sub_category || '',
        sub_sub_category: r.sub_sub_category || '',
        batch_quantity: Number(r.batch_quantity) || 1,
        uom: r.uom || 'PCS',
        raw_material_cost: Number(r.raw_material_cost) || 0,
        labor_cost: Number(r.labor_cost) || 0,
        overhead_cost: Number(r.overhead_cost) || 0,
        packaging_cost: Number(r.packaging_cost) || 0,
        total_cost: Number(r.total_cost) || 0,
        unit_cost: Number(r.unit_cost) || 0,
        target_selling_price: Number(r.target_selling_price) || 0,
        margin_percentage: Number(r.margin_percentage) || 0,
        status: r.status || 'Active',
        notes: r.notes || '',
        raw_materials: Array.isArray(r.raw_materials) ? r.raw_materials : [],
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
    } catch {
      return getLocalRecipes();
    }
  },

  // Save new recipe or update existing in Supabase + Local Storage
  async save(recipe: Partial<DedicatedRecipe> & { recipe_name: string; raw_materials: BomItem[] }): Promise<DedicatedRecipe> {
    const isEdit = Boolean(recipe.id && !recipe.id.startsWith('rec-new-'));
    const id = isEdit ? (recipe.id as string) : `rec-${Date.now()}`;
    const now = new Date().toISOString();

    const fullRecipe: DedicatedRecipe = {
      id,
      tenant_id: recipe.tenant_id || 'uzair',
      recipe_name: recipe.recipe_name.trim(),
      finished_product_name: recipe.finished_product_name || recipe.recipe_name,
      finished_product_code: recipe.finished_product_code || '',
      finished_product_id: recipe.finished_product_id || '',
      category: recipe.category || 'General',
      sub_category: recipe.sub_category || '',
      sub_sub_category: recipe.sub_sub_category || '',
      batch_quantity: Number(recipe.batch_quantity) || 1,
      uom: recipe.uom || 'PCS',
      raw_material_cost: Number(recipe.raw_material_cost) || 0,
      labor_cost: Number(recipe.labor_cost) || 0,
      overhead_cost: Number(recipe.overhead_cost) || 0,
      packaging_cost: Number(recipe.packaging_cost) || 0,
      total_cost: Number(recipe.total_cost) || 0,
      unit_cost: Number(recipe.unit_cost) || 0,
      target_selling_price: Number(recipe.target_selling_price) || 0,
      margin_percentage: Number(recipe.margin_percentage) || 0,
      status: recipe.status || 'Active',
      notes: recipe.notes || '',
      raw_materials: (recipe.raw_materials || []).map((m, idx) => ({
        ...m,
        id: m.id || `rm-${Date.now()}-${idx}`
      })),
      created_at: recipe.created_at || now,
      updated_at: now
    };

    // 1. Try Supabase insert/update
    try {
      const payload: any = {
        recipe_name: fullRecipe.recipe_name,
        finished_product_name: fullRecipe.finished_product_name,
        finished_product_code: fullRecipe.finished_product_code,
        finished_product_id: fullRecipe.finished_product_id,
        category: fullRecipe.category,
        sub_category: fullRecipe.sub_category,
        sub_sub_category: fullRecipe.sub_sub_category,
        batch_quantity: fullRecipe.batch_quantity,
        uom: fullRecipe.uom,
        raw_material_cost: fullRecipe.raw_material_cost,
        labor_cost: fullRecipe.labor_cost,
        overhead_cost: fullRecipe.overhead_cost,
        packaging_cost: fullRecipe.packaging_cost,
        total_cost: fullRecipe.total_cost,
        unit_cost: fullRecipe.unit_cost,
        target_selling_price: fullRecipe.target_selling_price,
        margin_percentage: fullRecipe.margin_percentage,
        status: fullRecipe.status,
        notes: fullRecipe.notes,
        raw_materials: fullRecipe.raw_materials,
        updated_at: now
      };

      if (isEdit) {
        await supabase.from('bom_recipes').update(payload).eq('id', id);
      } else {
        await supabase.from('bom_recipes').insert([{ ...payload, id, created_at: now }]);
      }
    } catch (dbErr) {
      console.warn('Database recipe save note (using local storage backup):', dbErr);
    }

    // 2. Always persist locally for offline/resilience
    const localList = getLocalRecipes();
    let updatedList: DedicatedRecipe[];
    if (isEdit) {
      updatedList = localList.map(r => (r.id === id ? fullRecipe : r));
    } else {
      updatedList = [fullRecipe, ...localList.filter(r => r.id !== id)];
    }
    setLocalRecipes(updatedList);

    return fullRecipe;
  },

  // Delete recipe
  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from('bom_recipes').delete().eq('id', id);
    } catch (e) {
      console.warn('DB delete notice:', e);
    }
    const current = getLocalRecipes();
    setLocalRecipes(current.filter(r => r.id !== id));
    return true;
  },

  // Generate deterministic snapshot for dirty-checking
  generateSnapshot(data: {
    batchQuantity: number;
    uom: string;
    laborCost: number;
    overheadCost: number;
    packagingCost: number;
    targetSellingPrice: number;
    items: BomItem[];
    notes?: string;
  }): string {
    const cleanItems = (data.items || []).map(i => ({
      name: (i.item_name || '').trim().toLowerCase(),
      code: (i.item_code || '').trim(),
      qty: Number(i.quantity) || 0,
      uom: (i.uom || '').trim().toUpperCase(),
      unitCost: Number(i.unit_cost) || 0,
      waste: Number(i.wastage_percentage) || 0
    }));

    return JSON.stringify({
      batch: Number(data.batchQuantity) || 1,
      uom: (data.uom || '').trim().toUpperCase(),
      labor: Number(data.laborCost) || 0,
      overhead: Number(data.overheadCost) || 0,
      packaging: Number(data.packagingCost) || 0,
      price: Number(data.targetSellingPrice) || 0,
      notes: (data.notes || '').trim(),
      items: cleanItems
    });
  }
};

