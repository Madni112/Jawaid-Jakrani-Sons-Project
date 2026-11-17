export interface InventoryCategory {
  id: string | number;
  name: string;
  parent_id?: number | string | null;
  tenant_id?: string | null;
  created_at?: string;
}

export interface DeletingCategoryItem {
  id: string | number;
  name: string;
  type: 'Parent' | 'Sub' | 'Category';
}
