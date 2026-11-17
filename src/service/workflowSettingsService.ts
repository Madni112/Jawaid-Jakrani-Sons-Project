import { supabase } from '../Context/supabaseClient';

export interface WorkflowSettings {
  require_inward_challan: boolean;
  require_delivery_challan: boolean;
  require_manual_gatepass_sale: boolean;
  require_manual_gatepass_purchase: boolean;
  require_manual_challan_sales_return: boolean;
  require_manual_challan_purchase_return: boolean;

  // Selected locations that strictly require 2-step Inward / Delivery challans (Unselected / New locations run 1-step direct counter)
  inward_challan_locations: string[];
  delivery_challan_locations: string[];

  // Selected locations that strictly require manual physical booklet slips (Unselected / New locations run automatically)
  manual_gatepass_locations_sale: string[];
  manual_gatepass_locations_purchase: string[];
  manual_challan_locations_sales_return: string[];
  manual_challan_locations_purchase_return: string[];

  // Negative Stock Governance (when false, overselling, excess returns, and stock-negative deletions are strictly blocked)
  allow_negative_stock: boolean;

  // Duplicate Challan & Gate Pass Governance (when false, duplicate manual slip numbers are strictly blocked)
  allow_duplicate_challan_purchase: boolean;
  allow_duplicate_challan_sale: boolean;
  allow_duplicate_challan_purchase_return: boolean;
  allow_duplicate_challan_sales_return: boolean;
}

const STORAGE_KEY = 'jakwani_workflow_settings_v1';

export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  require_inward_challan: false,
  require_delivery_challan: false,
  require_manual_gatepass_sale: false,
  require_manual_gatepass_purchase: false,
  require_manual_challan_sales_return: false,
  require_manual_challan_purchase_return: false,

  inward_challan_locations: [],
  delivery_challan_locations: [],
  manual_gatepass_locations_sale: [],
  manual_gatepass_locations_purchase: [],
  manual_challan_locations_sales_return: [],
  manual_challan_locations_purchase_return: [],

  allow_negative_stock: true,

  allow_duplicate_challan_purchase: true,
  allow_duplicate_challan_sale: true,
  allow_duplicate_challan_purchase_return: true,
  allow_duplicate_challan_sales_return: true,
};

export const getLocalWorkflowSettings = (): WorkflowSettings => {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOW_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKFLOW_SETTINGS;
    return { ...DEFAULT_WORKFLOW_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_WORKFLOW_SETTINGS;
  }
};

export const fetchWorkflowSettings = async (): Promise<WorkflowSettings> => {
  try {
    const { data, error } = await supabase
      .from('workflow_settings')
      .select('feature_key, is_enabled, config');

    if (!error && Array.isArray(data) && data.length > 0) {
      const settings: WorkflowSettings = { ...DEFAULT_WORKFLOW_SETTINGS };
      data.forEach((row: any) => {
        const locations = Array.isArray(row.config?.locations) ? row.config.locations : [];
        if (row.feature_key === 'require_inward_challan') {
          settings.require_inward_challan = Boolean(row.is_enabled);
          settings.inward_challan_locations = locations;
        } else if (row.feature_key === 'require_delivery_challan') {
          settings.require_delivery_challan = Boolean(row.is_enabled);
          settings.delivery_challan_locations = locations;
        } else if (row.feature_key === 'require_manual_gatepass_sale') {
          settings.require_manual_gatepass_sale = Boolean(row.is_enabled);
          settings.manual_gatepass_locations_sale = locations;
        } else if (row.feature_key === 'require_manual_gatepass_purchase') {
          settings.require_manual_gatepass_purchase = Boolean(row.is_enabled);
          settings.manual_gatepass_locations_purchase = locations;
        } else if (row.feature_key === 'require_manual_challan_sales_return') {
          settings.require_manual_challan_sales_return = Boolean(row.is_enabled);
          settings.manual_challan_locations_sales_return = locations;
        } else if (row.feature_key === 'require_manual_challan_purchase_return') {
          settings.require_manual_challan_purchase_return = Boolean(row.is_enabled);
          settings.manual_challan_locations_purchase_return = locations;
        } else if (row.feature_key === 'allow_negative_stock') {
          settings.allow_negative_stock = Boolean(row.is_enabled);
        } else if (row.feature_key === 'allow_duplicate_challan_purchase') {
          settings.allow_duplicate_challan_purchase = Boolean(row.is_enabled);
        } else if (row.feature_key === 'allow_duplicate_challan_sale') {
          settings.allow_duplicate_challan_sale = Boolean(row.is_enabled);
        } else if (row.feature_key === 'allow_duplicate_challan_purchase_return') {
          settings.allow_duplicate_challan_purchase_return = Boolean(row.is_enabled);
        } else if (row.feature_key === 'allow_duplicate_challan_sales_return') {
          settings.allow_duplicate_challan_sales_return = Boolean(row.is_enabled);
        }
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }
      return settings;
    }
  } catch (e) {
    console.warn('Failed to load workflow settings from cloud, falling back to local:', e);
  }
  return getLocalWorkflowSettings();
};

export const saveWorkflowSettings = async (settings: Partial<WorkflowSettings>): Promise<WorkflowSettings> => {
  const current = getLocalWorkflowSettings();
  const updated: WorkflowSettings = { ...current, ...settings };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('workflow_settings_updated', { detail: updated }));
  }

  try {
    const keysToSync: (keyof WorkflowSettings)[] = [];
    if (settings.require_inward_challan !== undefined || settings.inward_challan_locations !== undefined) keysToSync.push('require_inward_challan');
    if (settings.require_delivery_challan !== undefined || settings.delivery_challan_locations !== undefined) keysToSync.push('require_delivery_challan');
    if (settings.require_manual_gatepass_sale !== undefined || settings.manual_gatepass_locations_sale !== undefined) keysToSync.push('require_manual_gatepass_sale');
    if (settings.require_manual_gatepass_purchase !== undefined || settings.manual_gatepass_locations_purchase !== undefined) keysToSync.push('require_manual_gatepass_purchase');
    if (settings.require_manual_challan_sales_return !== undefined || settings.manual_challan_locations_sales_return !== undefined) keysToSync.push('require_manual_challan_sales_return');
    if (settings.require_manual_challan_purchase_return !== undefined || settings.manual_challan_locations_purchase_return !== undefined) keysToSync.push('require_manual_challan_purchase_return');
    if (settings.allow_negative_stock !== undefined) keysToSync.push('allow_negative_stock');
    if (settings.allow_duplicate_challan_purchase !== undefined) keysToSync.push('allow_duplicate_challan_purchase');
    if (settings.allow_duplicate_challan_sale !== undefined) keysToSync.push('allow_duplicate_challan_sale');
    if (settings.allow_duplicate_challan_purchase_return !== undefined) keysToSync.push('allow_duplicate_challan_purchase_return');
    if (settings.allow_duplicate_challan_sales_return !== undefined) keysToSync.push('allow_duplicate_challan_sales_return');

    const getLocationConfig = (key: string): any => {
      if (key === 'require_inward_challan') return { locations: updated.inward_challan_locations || [] };
      if (key === 'require_delivery_challan') return { locations: updated.delivery_challan_locations || [] };
      if (key === 'require_manual_gatepass_sale') return { locations: updated.manual_gatepass_locations_sale || [] };
      if (key === 'require_manual_gatepass_purchase') return { locations: updated.manual_gatepass_locations_purchase || [] };
      if (key === 'require_manual_challan_sales_return') return { locations: updated.manual_challan_locations_sales_return || [] };
      if (key === 'require_manual_challan_purchase_return') return { locations: updated.manual_challan_locations_purchase_return || [] };
      return {};
    };

    for (const key of keysToSync) {
      const { data: existing } = await supabase
        .from('workflow_settings')
        .select('id')
        .eq('feature_key', key)
        .maybeSingle();

      const configData = getLocationConfig(key);

      if (existing?.id) {
        await supabase
          .from('workflow_settings')
          .update({
            is_enabled: Boolean(updated[key]),
            config: configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('workflow_settings')
          .insert([{
            feature_key: key,
            is_enabled: Boolean(updated[key]),
            config: configData,
            updated_at: new Date().toISOString()
          }]);
      }
    }
  } catch (e) {
    console.warn('Could not sync workflow settings to cloud database:', e);
  }

  return updated;
};

