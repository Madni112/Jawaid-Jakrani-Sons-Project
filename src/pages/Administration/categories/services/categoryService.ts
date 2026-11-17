import { supabase } from '../../../../Context/supabaseClient';
import { InventoryCategory } from '../types/categoryTypes';

export const fetchInventoryCategories = async (): Promise<InventoryCategory[]> => {
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createParentCategory = async (
  name: string,
  tenantId?: string | null
): Promise<InventoryCategory> => {
  const payload: any = { name, parent_id: null };
  if (tenantId) payload.tenant_id = tenantId;

  const { data, error } = await supabase
    .from('inventory_categories')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createSubCategory = async (
  name: string,
  parentId: string | number,
  tenantId?: string | null
): Promise<InventoryCategory> => {
  const payload: any = { name, parent_id: Number(parentId) };
  if (tenantId) payload.tenant_id = tenantId;

  const { data, error } = await supabase
    .from('inventory_categories')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategoryName = async (
  id: string | number,
  name: string
): Promise<void> => {
  const { error } = await supabase
    .from('inventory_categories')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
};

export const deleteCategoryById = async (id: string | number): Promise<void> => {
  const { error } = await supabase.from('inventory_categories').delete().eq('id', id);
  if (error) throw error;
};

export const saveBottomCategory = async (
  name: string,
  parentId: string | number,
  editId?: string | number | null,
  tenantId?: string | null
): Promise<void> => {
  const payload: any = { name, parent_id: parentId };
  if (tenantId) payload.tenant_id = tenantId;

  if (editId) {
    const { error } = await supabase
      .from('inventory_categories')
      .update(payload)
      .eq('id', editId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('inventory_categories')
      .insert([payload]);
    if (error) throw error;
  }
};
