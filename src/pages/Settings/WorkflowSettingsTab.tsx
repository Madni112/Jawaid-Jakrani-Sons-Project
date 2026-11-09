import React, { useState, useEffect } from 'react';
import { LuSlidersHorizontal, LuPackage, LuCheckCircle2 } from 'react-icons/lu';
import toast from 'react-hot-toast';
import {
  fetchWorkflowSettings,
  saveWorkflowSettings,
  WorkflowSettings,
  DEFAULT_WORKFLOW_SETTINGS
} from '../../service/workflowSettingsService';

interface WorkflowSettingsTabProps {
  isRTL?: boolean;
}

const WorkflowSettingsTab: React.FC<WorkflowSettingsTabProps> = ({ isRTL = false }) => {
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>(DEFAULT_WORKFLOW_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkflowSettings().then(setWorkflowSettings);
  }, []);

  const handleToggle = async (key: keyof WorkflowSettings, val: boolean) => {
    setSaving(true);
    try {
      const updated = await saveWorkflowSettings({ [key]: val });
      setWorkflowSettings(updated);
      toast.success(
        key === 'require_inward_challan'
          ? (val ? 'Inward Gate Pass Required: Purchases will await warehouse verification' : 'Direct Inward Mode: Purchases directly add stock to location')
          : (val ? 'Delivery Challan Required: Sales put items on Hold until warehouse dispatches' : 'Direct Dispatch Mode: Sales directly deduct stock from location')
      );
    } catch (err: any) {
      toast.error('Failed to save workflow setting: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <LuSlidersHorizontal size={14} />
              <span>Logistics & Inventory Flow</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isRTL ? 'گیٹ پاس اور ورک فلو کنٹرولز' : 'Gate Pass & Inventory Workflow Controls'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              {isRTL
                ? 'طے کریں کہ خریداری اور فروخت پر اسٹاک براہ راست اپ ڈیٹ ہو یا گودام کے انووارڈ/ڈلیوری چالان کی تصدیق کے بعد۔'
                : 'Configure 1-Step (Direct Counter Add/Deduct) versus 2-Step (Warehouse Gate Pass & Inspection) workflow for purchases and sales.'}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold shrink-0">
            Cloud Synced
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Option 1: Inward Challan for Purchases */}
        <div
          className={`rounded-2xl border transition-all duration-200 p-6 shadow-sm flex flex-col justify-between ${
            workflowSettings.require_inward_challan
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold shadow-inner">
                <LuPackage />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={workflowSettings.require_inward_challan}
                  onChange={(e) => handleToggle('require_inward_challan', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Require Inward Challan (Purchases)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                When enabled, saving a supplier purchase does <strong>not</strong> immediately add stock. Instead, it generates a <strong>Pending Inward Challan</strong>. The warehouse manager inspects the batch and marks <strong>Accepted / Rejected / Hold</strong> quantities. <em>Only accepted pieces officially enter the location's available stock.</em>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1.5 font-medium">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className={`w-2 h-2 rounded-full ${workflowSettings.require_inward_challan ? 'bg-blue-600' : 'bg-slate-400'}`}></span>
                <span>Current mode: <strong>{workflowSettings.require_inward_challan ? '2-Step (Inspect & Approve)' : '1-Step (Direct Counter Add)'}</strong></span>
              </div>
              <div className="text-slate-400">
                Action Page: <strong>Purchase &rarr; Inward Challan</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Option 2: Delivery Challan for Sales */}
        <div
          className={`rounded-2xl border transition-all duration-200 p-6 shadow-sm flex flex-col justify-between ${
            workflowSettings.require_delivery_challan
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shadow-inner">
                <LuCheckCircle2 />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={workflowSettings.require_delivery_challan}
                  onChange={(e) => handleToggle('require_delivery_challan', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Require Delivery Challan (Sales)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                When enabled, creating a sales invoice places ordered goods on <strong>Hold</strong> and creates a <strong>Pending Delivery Challan</strong>. Stock remains reserved and is only deducted from the warehouse when the dispatch officer enters <strong>Sending Now</strong> and approves the gate-pass.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1.5 font-medium">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className={`w-2 h-2 rounded-full ${workflowSettings.require_delivery_challan ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                <span>Current mode: <strong>{workflowSettings.require_delivery_challan ? '2-Step (Warehouse Gate Pass & Dispatch)' : '1-Step (Direct Counter Sale)'}</strong></span>
              </div>
              <div className="text-slate-400">
                Action Page: <strong>Sales &rarr; Delivery Challan</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkflowSettingsTab;

