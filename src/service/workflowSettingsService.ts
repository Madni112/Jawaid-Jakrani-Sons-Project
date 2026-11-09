import { supabase } from '../Context/supabaseClient';

export interface WorkflowSettings {
  require_inward_challan: boolean;
  require_delivery_challan: boolean;
}

const STORAGE_KEY = 'jakwani_workflow_settings_v1';

export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  require_inward_challan: false,
  require_delivery_challan: false,
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
      .select('require_inward_challan, require_delivery_challan')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      const settings: WorkflowSettings = {
        require_inward_challan: Boolean(data.require_inward_challan),
        require_delivery_challan: Boolean(data.require_delivery_challan),
      };
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
    await supabase.from('workflow_settings').upsert({
      id: 'default',
      require_inward_challan: updated.require_inward_challan,
      require_delivery_challan: updated.require_delivery_challan,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Could not sync workflow settings to cloud database:', e);
  }

  return updated;
};

