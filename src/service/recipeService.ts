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
    tenant_id: 'Jawaid Jakwani & Sons',
    recipe_name: 'Perfume Jasmine Phenyl 600ml Bottle',
    finished_product_name: 'Perfume Jasmine White Phenyl 600ml (Finished Bottle)',
    finished_product_code: 'PHN-JAS-600',
    category: 'Home Care & Disinfectants',
    sub_category: 'Phenyl',
    sub_sub_category: 'Perfumed Floor Cleaner',
    batch_quantity: 1000,
    uom: 'Bottles',
    raw_material_cost: 67500,
    labor_cost: 8000,
    overhead_cost: 4500,
    packaging_cost: 32000,
    total_cost: 112000,
    unit_cost: 112,
    target_selling_price: 180,
    margin_percentage: 37.78,
    status: 'Active',
    notes: 'Standard 1,000-bottle batch (600 Liters bulk). Thick milky emulsion with long-lasting Jasmine fragrance.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    raw_materials: [
      {
        id: 'rm-1',
        item_name: 'Pine Oil 85% Grade A',
        item_code: 'CHM-PIN-85',
        quantity: 45,
        uom: 'Liters',
        unit_cost: 480,
        wastage_percentage: 1,
        total_cost: 21816,
        item_type: 'Chemical',
        notes: 'Active disinfectant concentrate'
      },
      {
        id: 'rm-2',
        item_name: 'Emulsifier Nonylphenol Ethoxylate (OP-9)',
        item_code: 'CHM-EMU-09',
        quantity: 25,
        uom: 'Kg',
        unit_cost: 650,
        wastage_percentage: 1.5,
        total_cost: 16493.75,
        item_type: 'Chemical',
        notes: 'White milky emulsion stabilizer'
      },
      {
        id: 'rm-3',
        item_name: 'Jasmine Concentrated Fragrance Oil',
        item_code: 'CHM-FRG-JAS',
        quantity: 6,
        uom: 'Kg',
        unit_cost: 3200,
        wastage_percentage: 0.5,
        total_cost: 19296,
        item_type: 'Chemical',
        notes: 'High tenacity aroma'
      },
      {
        id: 'rm-4',
        item_name: 'De-ionized / DM Water',
        item_code: 'CHM-DMW-01',
        quantity: 530,
        uom: 'Liters',
        unit_cost: 3,
        wastage_percentage: 2,
        total_cost: 1621.8,
        item_type: 'Chemical',
        notes: 'Treated water for clear batch'
      },
      {
        id: 'rm-5',
        item_name: '600ml HDPE Ribbed White Bottle',
        item_code: 'PKG-BOT-600',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 18,
        wastage_percentage: 2,
        total_cost: 18360,
        item_type: 'Packaging',
        notes: 'Primary leakproof bottle'
      },
      {
        id: 'rm-6',
        item_name: '28mm Tamper-Evident Screw Cap with Liner',
        item_code: 'PKG-CAP-28',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 4.5,
        wastage_percentage: 1,
        total_cost: 4545,
        item_type: 'Packaging',
        notes: 'Seal lock cap'
      },
      {
        id: 'rm-7',
        item_name: 'Self-Adhesive UV Gloss Laminated Label Set',
        item_code: 'PKG-LBL-JAS',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 5.5,
        wastage_percentage: 3,
        total_cost: 5665,
        item_type: 'Packaging',
        notes: 'Front & back water resistant labels'
      },
      {
        id: 'rm-8',
        item_name: 'Master Corrugated Carton (24x600ml)',
        item_code: 'PKG-CTN-24',
        quantity: 42,
        uom: 'Pcs',
        unit_cost: 80,
        wastage_percentage: 0,
        total_cost: 3360,
        item_type: 'Packaging',
        notes: '5-ply shipping shipper'
      }
    ]
  },
  {
    id: 'rec-002',
    tenant_id: 'Jawaid Jakwani & Sons',
    recipe_name: 'Apple Green Antibacterial Handwash 500ml Pump',
    finished_product_name: 'Apple Green Antibacterial Handwash 500ml (Finished Bottle)',
    finished_product_code: 'HND-APP-500',
    category: 'Personal Care & Hygiene',
    sub_category: 'Handwash',
    sub_sub_category: 'Liquid Hand Soap',
    batch_quantity: 1000,
    uom: 'Bottles',
    raw_material_cost: 95000,
    labor_cost: 10000,
    overhead_cost: 6000,
    packaging_cost: 45000,
    total_cost: 156000,
    unit_cost: 156,
    target_selling_price: 240,
    margin_percentage: 35,
    status: 'Active',
    notes: 'Premium antibacterial formula with skin moisturizer, balanced pH 5.5 - 6.5, crisp Green Apple scent.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    raw_materials: [
      {
        id: 'rm-2-1',
        item_name: 'Sodium Laureth Sulfate (SLES 70%)',
        item_code: 'CHM-SLES-70',
        quantity: 90,
        uom: 'Kg',
        unit_cost: 340,
        wastage_percentage: 1,
        total_cost: 30906,
        item_type: 'Chemical',
        notes: 'Primary surfactant and rich lathering foaming agent'
      },
      {
        id: 'rm-2-2',
        item_name: 'Cocoamidopropyl Betaine (CAPB 30%)',
        item_code: 'CHM-CAPB-30',
        quantity: 35,
        uom: 'Kg',
        unit_cost: 390,
        wastage_percentage: 1,
        total_cost: 13786.5,
        item_type: 'Chemical',
        notes: 'Secondary amphoteric surfactant, skin conditioning agent'
      },
      {
        id: 'rm-2-3',
        item_name: 'Refined Vegetable Glycerin 99.5%',
        item_code: 'CHM-GLY-99',
        quantity: 15,
        uom: 'Kg',
        unit_cost: 420,
        wastage_percentage: 0.5,
        total_cost: 6331.5,
        item_type: 'Chemical',
        notes: 'Skin humectant & softness moisturizer'
      },
      {
        id: 'rm-2-4',
        item_name: 'Green Apple Fragrance Oil',
        item_code: 'CHM-FRG-APP',
        quantity: 4,
        uom: 'Kg',
        unit_cost: 3600,
        wastage_percentage: 0,
        total_cost: 14400,
        item_type: 'Chemical',
        notes: 'Aromatic cosmetic perfume oil'
      },
      {
        id: 'rm-2-5',
        item_name: 'Apple Green CI 19140/42090 Color Solution',
        item_code: 'CHM-CLR-GRN',
        quantity: 1,
        uom: 'Kg',
        unit_cost: 1800,
        wastage_percentage: 0,
        total_cost: 1800,
        item_type: 'Chemical',
        notes: 'Cosmetic dye'
      },
      {
        id: 'rm-2-6',
        item_name: 'De-ionized Purified Water',
        item_code: 'CHM-DMW-01',
        quantity: 370,
        uom: 'Liters',
        unit_cost: 3,
        wastage_percentage: 1.5,
        total_cost: 1126.65,
        item_type: 'Chemical',
        notes: 'Purified base solvent'
      },
      {
        id: 'rm-2-7',
        item_name: '500ml Clear Transparent PET Bottle',
        item_code: 'PKG-BOT-PET500',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 22,
        wastage_percentage: 1.5,
        total_cost: 22330,
        item_type: 'Packaging',
        notes: 'Crystal clear Boston round bottle'
      },
      {
        id: 'rm-2-8',
        item_name: '28/410 White Smooth Lotion Dispenser Pump',
        item_code: 'PKG-PMP-28',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 16,
        wastage_percentage: 1,
        total_cost: 16160,
        item_type: 'Packaging',
        notes: '2ml dosage spring loaded dispensing pump'
      },
      {
        id: 'rm-2-9',
        item_name: 'Metallic BOPP Waterproof Label Front/Back',
        item_code: 'PKG-LBL-APP500',
        quantity: 1000,
        uom: 'Pcs',
        unit_cost: 6,
        wastage_percentage: 2,
        total_cost: 6120,
        item_type: 'Packaging',
        notes: 'Waterproof self-adhesive wrap labels'
      }
    ]
  }
];

const getLocalRecipes = (): DedicatedRecipe[] => {
  return [];
};

const setLocalRecipes = (_recipes: DedicatedRecipe[]) => {
  // No-op: Recipes are persisted in Supabase bom_recipes
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

  // Save new recipe or update existing in Supabase
  async save(recipe: Partial<DedicatedRecipe> & { recipe_name: string; raw_materials: BomItem[] }): Promise<DedicatedRecipe> {
    const isEdit = Boolean(recipe.id && !String(recipe.id).startsWith('rec-'));
    const now = new Date().toISOString();

    const payload: any = {
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
      updated_at: now
    };

    if (isEdit) {
      const { data, error } = await supabase
        .from('bom_recipes')
        .update(payload)
        .eq('id', recipe.id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update recipe: ${error.message}`);
      return { ...payload, id: String(data.id), tenant_id: data.tenant_id, created_at: data.created_at };
    } else {
      const { data, error } = await supabase
        .from('bom_recipes')
        .insert([{ ...payload, created_at: now }])
        .select()
        .single();
      if (error) throw new Error(`Failed to save recipe: ${error.message}`);
      return { ...payload, id: String(data.id), tenant_id: data.tenant_id, created_at: data.created_at };
    }
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

