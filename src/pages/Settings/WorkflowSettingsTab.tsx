import React, { useState, useEffect } from 'react';
import { 
  LuSlidersHorizontal, 
  LuPackage, 
  LuCheckCircle2, 
  LuFileSignature, 
  LuFileText, 
  LuUndo2, 
  LuRotateCcw
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import { supabase } from '../../Context/supabaseClient';
import {
  fetchWorkflowSettings,
  saveWorkflowSettings,
  WorkflowSettings,
  DEFAULT_WORKFLOW_SETTINGS
} from '../../service/workflowSettingsService';
import { getNegativeStockProducts } from '../../utils/stockCalculator';
import {
  checkDuplicateChallans,
  ChallanModule,
  DuplicateChallanInfo
} from '../../utils/challanValidation';

import { LocationItem } from './workflow/components/LocationChipsSelector';
import { WorkflowNegativeStockCard } from './workflow/components/WorkflowNegativeStockCard';
import { WorkflowOptionCard } from './workflow/components/WorkflowOptionCard';
import { NegativeStockModal } from './workflow/components/NegativeStockModal';
import { DuplicateChallanModal, DuplicateModalData } from './workflow/components/DuplicateChallanModal';

interface WorkflowSettingsTabProps {
  isRTL?: boolean;
}

const WorkflowSettingsTab: React.FC<WorkflowSettingsTabProps> = ({ isRTL = false }) => {
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>(DEFAULT_WORKFLOW_SETTINGS);
  const [locationsList, setLocationsList] = useState<LocationItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [checkingNegativeStock, setCheckingNegativeStock] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);
  const [negativeProductsList, setNegativeProductsList] = useState<any[]>([]);

  // Duplicate Challan Governance State
  const [checkingDuplicateModule, setCheckingDuplicateModule] = useState<ChallanModule | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [duplicateModalData, setDuplicateModalData] = useState<DuplicateModalData | null>(null);

  useEffect(() => {
    fetchWorkflowSettings().then(setWorkflowSettings);
    supabase.from('inventory_locations').select('id, name, location_type').order('id', { ascending: true }).then(({ data }) => {
      if (data) setLocationsList(data);
    });
  }, []);

  const handleToggle = async (key: keyof WorkflowSettings, val: boolean) => {
    // If disabling allow_negative_stock, pre-validate all products in stock
    if (key === 'allow_negative_stock' && val === false) {
      setCheckingNegativeStock(true);
      try {
        const negProds = await getNegativeStockProducts();
        if (negProds && negProds.length > 0) {
          setNegativeProductsList(negProds);
          setShowNegativeModal(true);
          setCheckingNegativeStock(false);
          return;
        }
      } catch (err: any) {
        toast.error('Failed to verify inventory stock balances: ' + err.message);
        setCheckingNegativeStock(false);
        return;
      }
      setCheckingNegativeStock(false);
    }

    setSaving(true);
    try {
      const updated = await saveWorkflowSettings({ [key]: val });
      setWorkflowSettings(updated);
      let toastMsg = '';
      if (key === 'allow_negative_stock') {
        toastMsg = val
          ? 'Allow Negative Stock Enabled: Transactions can proceed when stock is zero or negative.'
          : 'Strict Stock Governance Enabled: Negative stock is strictly prohibited across Sales, Returns, and Inflow Deletions.';
      } else if (key === 'require_inward_challan') {
        toastMsg = val ? 'Inward Gate Pass Required: Purchases will await warehouse verification' : 'Direct Inward Mode: Purchases directly add stock to location';
      } else if (key === 'require_delivery_challan') {
        toastMsg = val ? 'Delivery Challan Required: Sales put items on Hold until warehouse dispatches' : 'Direct Dispatch Mode: Sales directly deduct stock from location';
      } else if (key === 'require_manual_gatepass_sale') {
        toastMsg = val ? 'Manual Gate Pass # in Sales: Location controls enabled' : 'Automatic Gate Pass Sequencing enabled for Sales';
      } else if (key === 'require_manual_gatepass_purchase') {
        toastMsg = val ? 'Manual Gate Pass # in Purchases: Location controls enabled' : 'Automatic Inward/GRN Sequencing enabled for Purchases';
      } else if (key === 'require_manual_challan_sales_return') {
        toastMsg = val ? 'Manual Return Challan # in Sales Return: Location controls enabled' : 'Automatic Return Challan Sequencing enabled for Sales Return';
      } else if (key === 'require_manual_challan_purchase_return') {
        toastMsg = val ? 'Manual Return Challan # in Purchase Return: Location controls enabled' : 'Automatic Return Challan Sequencing enabled for Purchase Return';
      }
      toast.success(toastMsg);
    } catch (err: any) {
      toast.error('Failed to save workflow setting: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLocation = async (
    field: 'inward_challan_locations' | 'delivery_challan_locations' | 'manual_gatepass_locations_sale' | 'manual_gatepass_locations_purchase' | 'manual_challan_locations_sales_return' | 'manual_challan_locations_purchase_return',
    locName: string
  ) => {
    const currentLocs = workflowSettings[field] || [];
    const nextLocs = currentLocs.includes(locName)
      ? currentLocs.filter(l => l !== locName)
      : [...currentLocs, locName];

    const updated = await saveWorkflowSettings({ [field]: nextLocs });
    setWorkflowSettings(updated);
    toast.success(`Updated location rules for ${locName}`);
  };

  const handleToggleDuplicateGovernance = async (
    module: ChallanModule,
    key: 'allow_duplicate_challan_purchase' | 'allow_duplicate_challan_sale' | 'allow_duplicate_challan_purchase_return' | 'allow_duplicate_challan_sales_return',
    val: boolean,
    moduleDisplayName: string
  ) => {
    // If switching to Strict Unique Mode (val === false), audit database for existing duplicates
    if (val === false) {
      setCheckingDuplicateModule(module);
      try {
        const duplicates = await checkDuplicateChallans(module);
        if (duplicates && duplicates.length > 0) {
          setDuplicateModalData({
            module,
            title: `Cannot Enable Strict Unique Mode (${moduleDisplayName})`,
            moduleName: moduleDisplayName,
            duplicates
          });
          setShowDuplicateModal(true);
          setCheckingDuplicateModule(null);
          return;
        }
      } catch (err: any) {
        toast.error(`Failed to audit duplicate challan numbers: ${err.message}`);
        setCheckingDuplicateModule(null);
        return;
      }
      setCheckingDuplicateModule(null);
    }

    setSaving(true);
    try {
      const updated = await saveWorkflowSettings({ [key]: val });
      setWorkflowSettings(updated);
      if (val) {
        toast.success(`Duplicate Slip Numbers Allowed: ${moduleDisplayName} now operates in Permissive Mode.`);
      } else {
        toast.success(`Strict Unique Slip Protection Enabled: Duplicate challan/slip numbers are now blocked in ${moduleDisplayName}.`);
      }
    } catch (err: any) {
      toast.error('Failed to update duplicate challan setting: ' + err.message);
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
                : 'Configure 1-Step (Direct Counter Add/Deduct) versus 2-Step (Warehouse Gate Pass & Inspection) workflow for purchases, sales, and returns.'}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold shrink-0">
            Cloud Synced
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 0: Allow Negative Stock / Stock Governance */}
        <WorkflowNegativeStockCard
          workflowSettings={workflowSettings}
          saving={saving}
          checkingNegativeStock={checkingNegativeStock}
          onToggle={(val) => handleToggle('allow_negative_stock', val)}
        />

        {/* Option 1: Inward Challan for Purchases */}
        <WorkflowOptionCard
          icon={<LuPackage />}
          iconBgClass="bg-blue-500/10"
          iconTextClass="text-blue-600 dark:text-blue-400"
          activeBgClass="bg-blue-50/50 dark:bg-blue-950/20"
          activeBorderClass="border-blue-200 dark:border-blue-800"
          toggleBgClass="peer-checked:bg-blue-600"
          title="Require Inward Challan (Purchases)"
          description="When enabled, purchases for selected warehouses do not immediately add stock. Instead, they generate a Pending Inward Challan for physical inspection. Unchecked locations add stock directly (1-step)."
          enabled={workflowSettings.require_inward_challan}
          saving={saving}
          onToggleMain={(val) => handleToggle('require_inward_challan', val)}
          locationChipsProps={{
            locationsList,
            selectedLocations: workflowSettings.inward_challan_locations || [],
            onToggleLocation: (name) => handleToggleLocation('inward_challan_locations', name),
            accentColor: 'blue',
            labelTitle: 'Warehouses requiring 2-Step Inward Inspection Challan:',
            helperNote: '* Checked locations generate Pending Inward Challans. Unchecked (and newly added) locations immediately add stock upon purchase save.'
          }}
          statusText={
            workflowSettings.require_inward_challan
              ? `2-Step (Inspect & Approve) for ${(workflowSettings.inward_challan_locations || []).length} locations`
              : '1-Step (Direct Counter Add)'
          }
          actionPageText="Purchase → Inward Challan"
        />

        {/* Option 2: Delivery Challan for Sales */}
        <WorkflowOptionCard
          icon={<LuCheckCircle2 />}
          iconBgClass="bg-emerald-500/10"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
          activeBgClass="bg-emerald-50/50 dark:bg-emerald-950/20"
          activeBorderClass="border-emerald-200 dark:border-emerald-800"
          toggleBgClass="peer-checked:bg-emerald-600"
          title="Require Delivery Challan (Sales)"
          description="When enabled, sales for selected warehouses place ordered goods on Hold and create a Pending Delivery Challan. Unchecked locations deduct stock immediately (1-step counter sale)."
          enabled={workflowSettings.require_delivery_challan}
          saving={saving}
          onToggleMain={(val) => handleToggle('require_delivery_challan', val)}
          locationChipsProps={{
            locationsList,
            selectedLocations: workflowSettings.delivery_challan_locations || [],
            onToggleLocation: (name) => handleToggleLocation('delivery_challan_locations', name),
            accentColor: 'emerald',
            labelTitle: 'Warehouses requiring 2-Step Gate Pass & Delivery Challan:',
            helperNote: '* Checked locations place ordered items on Hold until warehouse dispatches. Unchecked (and newly added) locations deduct stock immediately upon invoice save.'
          }}
          statusText={
            workflowSettings.require_delivery_challan
              ? `2-Step (Warehouse Gate Pass & Dispatch) for ${(workflowSettings.delivery_challan_locations || []).length} locations`
              : '1-Step (Direct Counter Sale)'
          }
          actionPageText="Sales → Delivery Challan"
        />

        {/* Option 3: Manual Gate Pass # in Sales Bill */}
        <WorkflowOptionCard
          icon={<LuFileSignature />}
          iconBgClass="bg-amber-500/10"
          iconTextClass="text-amber-600 dark:text-amber-400"
          activeBgClass="bg-amber-50/50 dark:bg-amber-950/20"
          activeBorderClass="border-amber-200 dark:border-amber-800"
          toggleBgClass="peer-checked:bg-amber-600"
          title="Require Gate Pass # in Sale Bill"
          description="When enabled, the Sale Bill will show location-wise Gate Pass inputs to enter manual physical booklet slip numbers for selected warehouses. Unchecked locations run automatically."
          enabled={workflowSettings.require_manual_gatepass_sale}
          saving={saving}
          onToggleMain={(val) => handleToggle('require_manual_gatepass_sale', val)}
          locationChipsProps={{
            locationsList,
            selectedLocations: workflowSettings.manual_gatepass_locations_sale || [],
            onToggleLocation: (name) => handleToggleLocation('manual_gatepass_locations_sale', name),
            accentColor: 'amber'
          }}
          duplicateGovernanceProps={{
            module: 'sale',
            isPermissive: workflowSettings.allow_duplicate_challan_sale !== false,
            isAuditing: checkingDuplicateModule === 'sale',
            moduleDisplayName: 'Sales Bills & Delivery Challans',
            onToggleDuplicate: (val) =>
              handleToggleDuplicateGovernance('sale', 'allow_duplicate_challan_sale', val, 'Sales Bills & Delivery Challans')
          }}
          statusText={
            workflowSettings.require_manual_gatepass_sale
              ? `Manual Entry for ${(workflowSettings.manual_gatepass_locations_sale || []).length} locations`
              : 'Automatic Gate Pass Sequence'
          }
          actionPageText="Sales → New Sale Bill"
        />

        {/* Option 4: Manual Gate Pass / Inward # in Purchase Bill */}
        <WorkflowOptionCard
          icon={<LuFileText />}
          iconBgClass="bg-purple-500/10"
          iconTextClass="text-purple-600 dark:text-purple-400"
          activeBgClass="bg-purple-50/50 dark:bg-purple-950/20"
          activeBorderClass="border-purple-200 dark:border-purple-800"
          toggleBgClass="peer-checked:bg-purple-600"
          title="Require Gate Pass # in Purchase Bill"
          description="When enabled, the Purchase Bill will show location-wise Inward / Gate Pass inputs to enter supplier delivery challan or physical receiving slip numbers for selected receiving warehouses."
          enabled={workflowSettings.require_manual_gatepass_purchase}
          saving={saving}
          onToggleMain={(val) => handleToggle('require_manual_gatepass_purchase', val)}
          locationChipsProps={{
            locationsList,
            selectedLocations: workflowSettings.manual_gatepass_locations_purchase || [],
            onToggleLocation: (name) => handleToggleLocation('manual_gatepass_locations_purchase', name),
            accentColor: 'purple'
          }}
          duplicateGovernanceProps={{
            module: 'purchase',
            isPermissive: workflowSettings.allow_duplicate_challan_purchase !== false,
            isAuditing: checkingDuplicateModule === 'purchase',
            moduleDisplayName: 'Purchase Bills & Inward Slips',
            onToggleDuplicate: (val) =>
              handleToggleDuplicateGovernance('purchase', 'allow_duplicate_challan_purchase', val, 'Purchase Bills & Inward Slips')
          }}
          statusText={
            workflowSettings.require_manual_gatepass_purchase
              ? `Manual Entry for ${(workflowSettings.manual_gatepass_locations_purchase || []).length} locations`
              : 'Automatic GRN Sequence'
          }
          actionPageText="Purchase → Add Purchase Bill"
        />

        {/* Option 5: Manual Return Challan / Gate Pass # in Sales Return */}
        <WorkflowOptionCard
          icon={<LuUndo2 />}
          iconBgClass="bg-rose-500/10"
          iconTextClass="text-rose-600 dark:text-rose-400"
          activeBgClass="bg-rose-50/50 dark:bg-rose-950/20"
          activeBorderClass="border-rose-200 dark:border-rose-800"
          toggleBgClass="peer-checked:bg-rose-600"
          title="Require Return Challan # in Sales Return"
          description="When enabled, saving a Customer Sales Return requires entering the physical booklet return slip / gate pass # for selected warehouses. Unchecked locations run automatically."
          enabled={workflowSettings.require_manual_challan_sales_return}
          saving={saving}
          onToggleMain={(val) => handleToggle('require_manual_challan_sales_return', val)}
          locationChipsProps={{
            locationsList,
            selectedLocations: workflowSettings.manual_challan_locations_sales_return || [],
            onToggleLocation: (name) => handleToggleLocation('manual_challan_locations_sales_return', name),
            accentColor: 'rose'
          }}
          duplicateGovernanceProps={{
            module: 'sales_return',
            isPermissive: workflowSettings.allow_duplicate_challan_sales_return !== false,
            isAuditing: checkingDuplicateModule === 'sales_return',
            moduleDisplayName: 'Sales Returns',
            onToggleDuplicate: (val) =>
              handleToggleDuplicateGovernance('sales_return', 'allow_duplicate_challan_sales_return', val, 'Sales Returns')
          }}
          statusText={
            workflowSettings.require_manual_challan_sales_return
              ? `Manual Inward Slip for ${(workflowSettings.manual_challan_locations_sales_return || []).length} locations`
              : 'Automatic Sequence (Optional)'
          }
          actionPageText="Sales → Sales Return"
        />

        {/* Option 6: Manual Return Challan / Gate Pass # in Purchase Return */}
        <WorkflowOptionCard
          icon={<LuRotateCcw />}
          iconBgClass="bg-orange-500/10"
          iconTextClass="text-orange-600 dark:text-orange-400"
          activeBgClass="bg-orange-50/50 dark:bg-orange-950/20"
          activeBorderClass="border-orange-200 dark:border-orange-800"
          toggleBgClass="peer-checked:bg-orange-600"
          title="Require Return Challan # in Purchase Return"
          description="When enabled, dispatching a Supplier Purchase Return requires entering the physical outward gate pass / return delivery challan # for selected warehouses."
          enabled={workflowSettings.require_manual_challan_purchase_return}
          saving={saving}
          onToggleMain={(val) => handleToggle('require_manual_challan_purchase_return', val)}
          locationChipsProps={{
            locationsList,
            selectedLocations: workflowSettings.manual_challan_locations_purchase_return || [],
            onToggleLocation: (name) => handleToggleLocation('manual_challan_locations_purchase_return', name),
            accentColor: 'orange'
          }}
          duplicateGovernanceProps={{
            module: 'purchase_return',
            isPermissive: workflowSettings.allow_duplicate_challan_purchase_return !== false,
            isAuditing: checkingDuplicateModule === 'purchase_return',
            moduleDisplayName: 'Purchase Returns',
            onToggleDuplicate: (val) =>
              handleToggleDuplicateGovernance('purchase_return', 'allow_duplicate_challan_purchase_return', val, 'Purchase Returns')
          }}
          statusText={
            workflowSettings.require_manual_challan_purchase_return
              ? `Manual Outward Slip for ${(workflowSettings.manual_challan_locations_purchase_return || []).length} locations`
              : 'Automatic Outward Sequence'
          }
          actionPageText="Purchase → Purchase Return"
        />
      </div>

      {/* Modal: Negative Stock Warning */}
      <NegativeStockModal
        isOpen={showNegativeModal}
        onClose={() => setShowNegativeModal(false)}
        negativeProductsList={negativeProductsList}
      />

      {/* Modal: Duplicate Challan Warning */}
      <DuplicateChallanModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        data={duplicateModalData}
      />
    </div>
  );
};

export default WorkflowSettingsTab;
