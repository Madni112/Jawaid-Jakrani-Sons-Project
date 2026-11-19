import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import Spinner from '../../ui/Spinner';
import { getBrandConfig } from '../../utils/brand';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';
import {
  MdDashboard,
  MdPeople,
  MdAddBusiness,
  MdSecurity,
  MdCheckCircle,
  MdLaunch,
  MdRefresh,
  MdLock,
  MdStorage,
  MdCloudDone,
  MdVpnKey,
  MdLockOutline,
  MdPowerSettingsNew,
  MdContentCopy,
  MdEdit,
  MdCheck,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdAdminPanelSettings,
  MdLogout,
  MdLayers,
  MdBusiness,
  MdAddCircle,
  MdAccountBalance,
  MdLocationOn,
  MdVpnLock,
  MdBadge,
  MdHistory,
  MdVisibility,
  MdClose,
  MdSearch,
  MdFilterList,
  MdPerson,
  MdCode,
  MdInfoOutline,
  MdLink,
  MdGroup,
  MdSwapHoriz,
  MdDelete,
  MdAdd,
  MdTune,
} from 'react-icons/md';
import { ROLE_PRESETS, RolePreset, getModulesForRole } from '../../constant/roles';
import {
  getModulePermissions,
  setModulePermissions,
  isReadOnlyModule,
  cleanBaseModuleId,
  PermissionAction,
  PermissionLevel,
} from '../../utils/permissionUtils';
import {
  fetchSystemMasterConfig,
  saveSystemMasterConfig,
  SystemMasterConfig,
  DEFAULT_SYSTEM_CONFIG,
} from '../../utils/systemPermissions';

import { OverviewTab } from './tabs/OverviewTab';
import { EmployeesTab } from './tabs/EmployeesTab';
import { SalesmenTab } from './tabs/SalesmenTab';
import { CreateEmployeeTab } from './tabs/CreateEmployeeTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { EditEmployeeModal } from './modals/EditEmployeeModal';
import { AuditLogDetailsModal } from './modals/AuditLogDetailsModal';
import { LinkSalesmanModal } from './modals/LinkSalesmanModal';
import { AssignLoginModal } from './modals/AssignLoginModal';

export interface PermissionSubNode {
  id: string;
  label: string;
}

export interface PermissionNode {
  id: string;
  label: string;
  children?: PermissionSubNode[];
}

export const PERMISSION_TREE: PermissionNode[] = [
  {
    id: 'dashboards',
    label: 'Home & Core Dashboards',
    children: [
      { id: '/', label: 'Home (Operations & Quick Launchpad)' },
      { id: '/dashboard', label: 'Executive BI & Deep Analytics' },
      { id: '/Dashboard/Salesman', label: 'Salesman Dashboard' },
      { id: '/Dashboard/Warehouse', label: 'Warehouse (Location) Dashboard' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Customer Inquiries',
    children: [
      { id: '/crm/leads', label: 'Leads & Demand Capture' },
      { id: '/crm/quotations', label: 'Quotations' },
      { id: '/Sales/Customers/List', label: 'Customers Directory' },
      { id: '/Sales/Salesman/List', label: 'Salesmen Ledger' },
      { id: '/crm/due-list', label: 'Customer Due List' },
      { id: '/crm/follow-ups', label: 'Follow-ups' },
      { id: '/crm/recovery-history', label: 'Recovery History' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales Operations',
    children: [
      { id: '/Sales/Invoice/List', label: 'Sales Invoices' },
      { id: '/sales/orders', label: 'Sales Orders' },
      { id: '/sales/price-lists', label: 'Customer Price Lists' },
      { id: '/Sales/Delivery-Challan/List', label: 'Delivery Challan' },
      { id: '/Sales/Sales-Return/List', label: 'Sales Returns' },
      { id: '/Sales-Return/Debit-Notes/List', label: 'Debit Notes' },
      { id: '/Sales/Sales-Return-Receipt/List', label: 'Sales Return Receipts' },
      { id: '/Registration/InvoiceReceipt/List', label: 'Invoice Receipts' },
    ],
  },
  {
    id: 'purchase',
    label: 'Purchase & Vendor Procurement',
    children: [
      { id: '/Purchase/Purchases/List', label: 'Supplier Purchases (PO & Invoices)' },
      { id: '/purchase/orders', label: 'Purchase Orders' },
      { id: '/purchase/quotations', label: 'Supplier Quotations' },
      { id: '/Purchase/GRN/List', label: 'Goods Receiving Note (GRN)' },
      { id: '/Purchase/Inward-Challan/List', label: 'Inward Challan' },
      { id: '/Purchase/Purchase-Return/List', label: 'Purchase Returns' },
      { id: '/Purchase/Purchase-Return-Receipt/List', label: 'Purchase Return Receipts' },
      { id: '/Purchase/Purchase-Receipt/List', label: 'Vendor Payment Receipts' },
      { id: '/purchase/vendor-ledger', label: 'Vendor Ledger' },
      { id: '/Purchase/Vendor/List', label: 'Suppliers / Vendors Directory' },
    ],
  },
  {
    id: 'pos',
    label: 'POS (Point of Sale)',
    children: [
      { id: '/pos/terminal', label: 'POS Terminal' },
      { id: '/pos/register', label: 'POS Shift Register' },
      { id: '/pos/hold-orders', label: 'Hold Orders Queue' },
      { id: '/pos/barcode-generator', label: 'Barcode Generator' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory, Stock & Warehouses',
    children: [
      { id: '/inventory/warehouse-terminal', label: 'Warehouse Terminal' },
      { id: '/Administration/Products/List', label: 'Item Master / Products' },
      { id: '/Administration/Products/Bulk-Upload', label: 'Bulk Product Upload' },
      { id: '/Administration/StockTransfer/List', label: 'Inter-Warehouse Stock Transfers' },
      { id: '/inventory/stock-adjustments', label: 'Stock Adjustments' },
      { id: '/inventory/stock-audits', label: 'Stock Audits & Reconciliation' },
      { id: '/inventory/adjustment-types', label: 'Adjustment Reason Codes' },
      { id: '/inventory/stock-ledger', label: 'Stock Movement Ledger' },
      { id: '/inventory/scheduled-valuations', label: 'Scheduled Valuations' },
      { id: '/Warehouse/Return-Challan', label: 'A-39 Customer Return Challans' },
      { id: '/Inventory/OpeningStock/List', label: 'Opening Stock Balance' },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts & Finance',
    children: [
      { id: '/Registration/Chart-of-Account/List', label: 'Chart of Accounts' },
      { id: '/Registration/Vouchers/List', label: 'Financial Vouchers' },
      { id: '/registration/journal-vouchers', label: 'Journal Vouchers (JV)' },
      { id: '/Registration/Bank-Account/BankAccountList', label: 'Bank Accounts' },
      { id: '/registration/bank-reconciliation', label: 'Bank Reconciliation (BRS)' },
      { id: '/registration/trial-balance', label: 'Trial Balance' },
      { id: '/Registration/Multi-Invoice-Receipt/Add', label: 'Multi-Invoice Receipt' },
    ],
  },
  {
    id: 'locations_group',
    label: 'Locations & Logistics',
    children: [
      { id: '/Administration/Locations/List', label: 'Assigned Locations / Warehouses' },
      { id: '/Administration/StockTransfer/List', label: 'Inter-Warehouse Stock Transfers' },
      { id: '/Administration/Transportation/List', label: 'Transportation & Fleet' },
      { id: '/Sales/Delivery-Challan/List', label: 'Delivery Challan' },
      { id: '/Purchase/Inward-Challan/List', label: 'Inward Challan' },
    ],
  },
  {
    id: 'administration',
    label: 'Classification & Settings',
    children: [
      { id: '/Administration/Categories/List', label: 'Categories' },
      { id: '/administration/subcategories', label: 'Sub-Categories' },
      { id: '/Administration/Surface-Finish', label: 'Brand' },
      { id: '/administration/tile-dimensions', label: 'Tile Dimensions Matrix' },
      { id: '/Administration/UOM/List', label: 'Units of Measure (UOM)' },
      { id: '/administration/drivers', label: 'Drivers & Fleet Directory' },
      { id: '/company', label: 'Company Profile' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    children: [
      { id: '/Reports/Reports-Dashboard', label: 'Reports Dashboard' },
      { id: '/Reports/Sales-Report', label: 'Sales Reports' },
      { id: '/Reports/Purchase-Report', label: 'Purchase Reports' },
      { id: '/Reports/Stock-Report', label: 'Stock Reports' },
      { id: '/Reports/Holding-Report', label: 'Holding Reports' },
      { id: '/Reports/Account-Report', label: 'Account Ledger Reports' },
      { id: '/Reports/Balance-Sheet', label: 'Balance Sheet & P&L' },
    ],
  },
  {
    id: 'hr',
    label: 'Human Resources (HR)',
    children: [
      { id: '/Human-Resources/Employees', label: 'Employees Directory' },
      { id: '/Human-Resources/Attendance', label: 'Daily Attendance Sheet' },
      { id: '/Human-Resources/Salary-Sheet', label: 'Monthly Salary Sheet' },
      { id: '/Human-Resources/Salary-Structure', label: 'Salary Structure' },
      { id: '/Human-Resources/Pay-Heads', label: 'Pay Heads' },
      { id: '/Human-Resources/Leaves', label: 'Leave Policy & Approvals' },
      { id: '/Human-Resources/Loans', label: 'Employee Loans & Advances' },
    ],
  },
];

export const getAllPermissionIds = (): string[] => {
  const ids: string[] = [];
  PERMISSION_TREE.forEach(node => {
    ids.push(node.id);
    if (node.children) {
      node.children.forEach(child => ids.push(child.id));
    }
  });
  return ids;
};

export interface EmployeeAccount {
  id: string;
  name: string;
  slug: string;
  email?: string;
  role: string;
  allowed_modules: string[];
  location_id?: string | number | null;
  allowed_locations?: string[];
  allowed_settings?: string[];
  created_at: string;
}

export const SETTINGS_TAB_CONFIG: { id: string; label: string; desc: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', desc: 'Account credentials, name and security info', icon: '👤' },
  { id: 'security_devices', label: 'Login Devices & Security', desc: 'Active sessions, passkeys, and trusted devices', icon: '🛡️' },
  { id: 'theme', label: 'Theme & Appearance', desc: 'Workspace background, theme colors and studio controls', icon: '🎨' },
  { id: 'credit_limits', label: 'Customer Credit Limits', desc: 'Credit limits, customer balances, and limit thresholds', icon: '💳' },
  { id: 'sound_effects', label: 'Audio & Sound Effects', desc: 'Interactive UI sound chimes, alert tones and volume', icon: '🔊' },
  { id: 'backup', label: 'Data Backup & Export', desc: 'Download system database backups and CSV snapshots', icon: '💾' },
  { id: 'workflow_logistics', label: 'Gate Pass & Workflow', desc: 'Inward & Delivery challan 2-step warehouse approval workflow', icon: '📑' },
  { id: 'reports_visibility', label: 'Reports Visibility & Print Layouts', desc: 'Show/hide reports and customize table columns, designs & print layouts', icon: '📊' },
];

export const ALL_SETTING_TAB_IDS = [
  ...SETTINGS_TAB_CONFIG.map(t => t.id),
  'reports_visibility_basic',
  'reports_visibility_advance'
];

// Master Super Admin / Developer Credentials
const DEV_EMAIL = getBrandConfig().adminEmail;
const DEV_PASSWORD = 'admin123';
const BACKUP_DEV_EMAIL = 'developer@noorhorizontechnologies.com';
const BACKUP_DEV_PASSWORD = 'NoorHorizon@5923';

/**
 * Hierarchical Granular Permission Tree Selector Component
 * Supports: Untick (None), View Only, Full Access (Tick), and Custom (View, Add, Edit, Delete).
 * Read-only pages (Dashboards, Reports, Ledgers) stay as simple Enabled / Disabled toggles.
 */
const PermissionTreeEditor: React.FC<{
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  allowedLocations?: string[];
  onLocationsChange?: (locations: string[]) => void;
  availableLocations?: any[];
}> = ({ selectedIds, onChange, allowedLocations = [], onLocationsChange, availableLocations = [] }) => {
  const [openLocationPill, setOpenLocationPill] = useState<Record<string, boolean>>({});
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    dashboards: true,
    crm: true,
    sales: true,
    purchase: true,
    pos: true,
    inventory: true,
    accounts: true,
    administration: true,
    reports: true,
    hr: true,
  });

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleToggleParent = (node: PermissionNode) => {
    if (!node.children || node.children.length === 0) {
      const isSelected = selectedIds.some(id => cleanBaseModuleId(id) === node.id);
      onChange(isSelected ? selectedIds.filter(id => cleanBaseModuleId(id) !== node.id) : [...selectedIds, node.id]);
      return;
    }

    const childIds = node.children.map(c => c.id);
    const allFull = childIds.every(id => getModulePermissions(selectedIds, id).level === 'full');

    if (allFull) {
      // Remove all tokens for these children and the parent category
      const cleaned = selectedIds.filter(id => {
        const base = cleanBaseModuleId(id);
        return !childIds.includes(base) && base !== node.id;
      });
      onChange(cleaned);
    } else {
      // Grant full access to all children and the parent
      const cleaned = selectedIds.filter(id => {
        const base = cleanBaseModuleId(id);
        return !childIds.includes(base) && base !== node.id;
      });
      onChange(Array.from(new Set([...cleaned, node.id, ...childIds])));
    }
  };

  const handleLevelChange = (moduleId: string, parentNode: PermissionNode, level: PermissionLevel) => {
    let nextIds = setModulePermissions(selectedIds, moduleId, level, {
      view: true,
      add: false,
      edit: false,
      delete: false,
    });

    if (parentNode.children) {
      const anyActive = parentNode.children.some(c => {
        const baseClean = c.id.toLowerCase();
        return nextIds.some(id => cleanBaseModuleId(id).toLowerCase() === baseClean);
      });
      const parentIncluded = nextIds.some(id => cleanBaseModuleId(id).toLowerCase() === parentNode.id.toLowerCase());
      if (anyActive && !parentIncluded) {
        nextIds = [...nextIds, parentNode.id];
      } else if (!anyActive && parentIncluded) {
        nextIds = nextIds.filter(id => cleanBaseModuleId(id).toLowerCase() !== parentNode.id.toLowerCase());
      }
    }

    onChange(nextIds);
  };

  const handleCustomActionToggle = (
    moduleId: string,
    action: PermissionAction,
    currentPerm: ReturnType<typeof getModulePermissions>
  ) => {
    const nextActions = {
      view: currentPerm.canView,
      add: currentPerm.canAdd,
      edit: currentPerm.canEdit,
      delete: currentPerm.canDelete,
      [action]: !currentPerm[action === 'view' ? 'canView' : action === 'add' ? 'canAdd' : action === 'edit' ? 'canEdit' : 'canDelete'],
    };

    // If unchecking view while other actions are checked, keep view enabled
    if (!nextActions.view && (nextActions.add || nextActions.edit || nextActions.delete)) {
      nextActions.view = true;
    }

    const nextIds = setModulePermissions(selectedIds, moduleId, 'custom', nextActions);
    onChange(nextIds);
  };

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {PERMISSION_TREE.map(node => {
        const hasChildren = Boolean(node.children && node.children.length > 0);
        const isExpanded = expandedNodes[node.id];

        if (!hasChildren) {
          const perm = getModulePermissions(selectedIds, node.id);
          const isChecked = perm.hasAccess;
          return (
            <div
              key={node.id}
              onClick={() => handleToggleParent(node)}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                isChecked
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-600 dark:text-gray-400 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-black dark:text-white">{node.label}</span>
                <span className="text-[10px] text-gray-400">(General Overview)</span>
              </div>
              {isChecked ? (
                <MdCheckCircle className="text-emerald-600 dark:text-emerald-400 text-base" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stroke dark:border-strokedark" />
              )}
            </div>
          );
        }

        const childIds = node.children!.map(c => c.id);
        const activeChildrenCount = childIds.filter(id => getModulePermissions(selectedIds, id).hasAccess).length;
        const totalChildren = childIds.length;
        const allFull = childIds.every(id => getModulePermissions(selectedIds, id).level === 'full');
        const partiallyActive = activeChildrenCount > 0 && !allFull;

        return (
          <div
            key={node.id}
            className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark overflow-hidden shadow-xs"
          >
            {/* PARENT CATEGORY HEADER */}
            <div className="p-3 bg-gray-100 dark:bg-meta-4/40 flex items-center justify-between border-b border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="flex items-center gap-2 text-xs font-bold text-black dark:text-white hover:text-emerald-600 transition cursor-pointer"
              >
                {isExpanded ? (
                  <MdKeyboardArrowDown className="text-lg text-gray-500" />
                ) : (
                  <MdKeyboardArrowRight className="text-lg text-gray-500" />
                )}
                <span>{node.label}</span>
                <span className="text-[10px] bg-gray-200 dark:bg-meta-4 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-mono">
                  {activeChildrenCount} / {totalChildren} active
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleParent(node)}
                className={`text-[11px] px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                  allFull
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : partiallyActive
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-white dark:bg-boxdark text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border border-stroke dark:border-strokedark'
                }`}
              >
                {allFull ? (
                  <>
                    <MdCheckCircle className="text-xs text-emerald-600" /> All Full Access
                  </>
                ) : (
                  'Toggle All (Full)'
                )}
              </button>
            </div>

            {/* EXPANDED SUB-PAGES / CATEGORIES */}
            {isExpanded && (
              <div className="p-3 space-y-2.5 bg-gray-50/50 dark:bg-meta-4/10">
                {node.children!.map(child => {
                  const isReadOnly = isReadOnlyModule(child.id);
                  const perm = getModulePermissions(selectedIds, child.id);

                  if (isReadOnly) {
                    // Simple Enabled / Disabled Toggle for Read-Only items (Dashboards, Reports, Ledgers)
                    return (
                      <div
                        key={child.id}
                        className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                          perm.hasAccess
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60'
                            : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${perm.hasAccess ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                          <span className="text-xs font-semibold text-black dark:text-white truncate">
                            {child.label}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                            Read-Only
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLevelChange(child.id, node, perm.hasAccess ? 'none' : 'full')}
                          className={`text-xs px-3 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                            perm.hasAccess
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                              : 'bg-gray-100 dark:bg-meta-4 text-gray-500 hover:text-black dark:hover:text-white border border-stroke dark:border-strokedark'
                          }`}
                        >
                          {perm.hasAccess ? (
                            <>
                              <MdCheckCircle className="text-sm" /> Enabled
                            </>
                          ) : (
                            'Disabled'
                          )}
                        </button>
                      </div>
                    );
                  }

                  const isChallanModule = child.id === '/Sales/Delivery-Challan/List' || child.id === '/Purchase/Inward-Challan/List';
                  const isLocationDropdownOpen = Boolean(openLocationPill[child.id]);

                  // CRUD Module with 4-way granular selector: Unticked | View Only | Full Access | Custom
                  return (
                    <div
                      key={child.id}
                      className={`p-2.5 rounded-xl border transition space-y-2 ${
                        perm.level === 'full'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-300/80 dark:border-emerald-800/60'
                          : perm.level === 'view'
                          ? 'bg-sky-50/40 dark:bg-sky-950/15 border-sky-300/80 dark:border-sky-800/60'
                          : perm.level === 'custom'
                          ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-300/80 dark:border-amber-800/60'
                          : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Title & Status */}
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              perm.level === 'full'
                                ? 'bg-emerald-500'
                                : perm.level === 'view'
                                ? 'bg-sky-500'
                                : perm.level === 'custom'
                                ? 'bg-amber-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                          <span className="text-xs font-bold text-black dark:text-white truncate">
                            {child.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              perm.level === 'full'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : perm.level === 'view'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
                                : perm.level === 'custom'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-meta-4 dark:text-gray-400'
                            }`}
                          >
                            {perm.level === 'full'
                              ? 'Full Access'
                              : perm.level === 'view'
                              ? 'Only View'
                              : perm.level === 'custom'
                              ? 'Custom'
                              : 'No Access'}
                          </span>

                          {/* Location Dropdown Arrow for Challans */}
                          {isChallanModule && onLocationsChange && (
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setOpenLocationPill(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                  allowedLocations.length > 0
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                                title="Assign authorized branch locations for this challan"
                              >
                                <span>📍 {
                                  allowedLocations.length === 0
                                    ? 'All Locations'
                                    : allowedLocations.length === 1
                                    ? allowedLocations[0]
                                    : `Custom (${allowedLocations.length} Locations)`
                                }</span>
                                <MdKeyboardArrowDown className={`text-xs transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isLocationDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white dark:bg-boxdark rounded-xl shadow-xl border border-stroke dark:border-strokedark p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                                  <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-stroke dark:border-strokedark flex items-center justify-between">
                                    <span>Assigned Locations</span>
                                    <button
                                      type="button"
                                      onClick={() => onLocationsChange([])}
                                      className="text-emerald-600 hover:underline capitalize"
                                    >
                                      Reset (All)
                                    </button>
                                  </div>
                                  <div className="max-h-40 overflow-y-auto space-y-1 pt-1">
                                    {(availableLocations || []).map((loc: any) => {
                                      const lName = String(loc.name || '').trim();
                                      const isChecked = allowedLocations.includes(lName);
                                      return (
                                        <label
                                          key={loc.id || lName}
                                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-meta-4 cursor-pointer text-slate-700 dark:text-slate-200"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                onLocationsChange([...allowedLocations, lName]);
                                              } else {
                                                onLocationsChange(allowedLocations.filter(x => x !== lName));
                                              }
                                            }}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                          />
                                          <span className="font-semibold">{lName}</span>
                                          {loc.location_type && (
                                            <span className="text-[9px] text-gray-400 font-normal ml-auto">({loc.location_type})</span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3-Way Segmented Control: No Access | Only View | Full */}
                        <div className="inline-flex items-center p-0.5 bg-gray-100 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleLevelChange(child.id, node, 'none')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                              perm.level === 'none'
                                ? 'bg-white dark:bg-boxdark text-gray-800 dark:text-gray-200 shadow-xs'
                                : 'text-gray-500 hover:text-black dark:hover:text-white'
                            }`}
                            title="No access to this module"
                          >
                            No Access
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLevelChange(child.id, node, 'view')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              perm.level === 'view'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-gray-500 hover:text-sky-600 dark:hover:text-sky-400'
                            }`}
                            title="Can view list, but add/edit/delete disabled"
                          >
                            <MdVisibility className="text-xs" /> Only View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLevelChange(child.id, node, 'full')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              perm.level === 'full'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                            title="Full access (View, Add, Edit, Delete)"
                          >
                            <MdCheckCircle className="text-xs" /> Full
                          </button>
                        </div>
                      </div>

                      {/* Custom Sub-Bar: Visible only when Custom is chosen */}
                      {perm.level === 'custom' && (
                        <div className="pt-2 border-t border-dashed border-amber-200 dark:border-amber-900/50 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mr-1">
                            Actions:
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCustomActionToggle(child.id, 'view', perm)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition cursor-pointer border ${
                              perm.canView
                                ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                                : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-400 hover:border-sky-400'
                            }`}
                          >
                            <MdVisibility className="text-xs" />
                            <span>View</span>
                            {perm.canView && <MdCheck className="text-xs" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCustomActionToggle(child.id, 'add', perm)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition cursor-pointer border ${
                              perm.canAdd
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-400 hover:border-emerald-400'
                            }`}
                          >
                            <MdAdd className="text-xs" />
                            <span>Add / Create</span>
                            {perm.canAdd && <MdCheck className="text-xs" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCustomActionToggle(child.id, 'edit', perm)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition cursor-pointer border ${
                              perm.canEdit
                                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                                : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-400 hover:border-amber-400'
                            }`}
                          >
                            <MdEdit className="text-xs" />
                            <span>Edit / Update</span>
                            {perm.canEdit && <MdCheck className="text-xs" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCustomActionToggle(child.id, 'delete', perm)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition cursor-pointer border ${
                              perm.canDelete
                                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-400 hover:border-rose-400'
                            }`}
                          >
                            <MdDelete className="text-xs" />
                            <span>Delete</span>
                            {perm.canDelete && <MdCheck className="text-xs" />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Developer Session State
  const [isDevAuthorized, setIsDevAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem('nht_dev_auth_session') === 'authorized';
  });

  // Login Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'salesmen' | 'permissions' | 'create' | 'logs'>('overview');

  // Master System Permissions State
  const [systemConfig, setSystemConfig] = useState<SystemMasterConfig>(DEFAULT_SYSTEM_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [userWhitelistSearch, setUserWhitelistSearch] = useState('');

  // Password Management Tool State
  const [pwSelectedEmail, setPwSelectedEmail] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwUpdating, setPwUpdating] = useState(false);
  const [showPwText, setShowPwText] = useState(false);

  // Salesmen Linking State
  const [salesmenList, setSalesmenList] = useState<any[]>([]);
  const [salesmenLoading, setSalesmenLoading] = useState(false);
  const [selectedSalesmanToLink, setSelectedSalesmanToLink] = useState<any | null>(null);
  const [selectedPartnerNames, setSelectedPartnerNames] = useState<string[]>([]);
  const [syncBidirectional, setSyncBidirectional] = useState(true);
  const [savingLinks, setSavingLinks] = useState(false);

  // Salesman Login Assign Modal State
  const [salesmanToAssignLogin, setSalesmanToAssignLogin] = useState<any | null>(null);
  const [assignLoginEmail, setAssignLoginEmail] = useState('');
  const [assignLoginPassword, setAssignLoginPassword] = useState('');
  const [assignLoginRole, setAssignLoginRole] = useState('Salesman');
  const [isAssigningLogin, setIsAssigningLogin] = useState(false);

  const handleOpenAssignLoginModal = (salesman: any) => {
    setSalesmanToAssignLogin(salesman);
    const cleanPrefix = (salesman.name || 'salesman').toLowerCase().replace(/[^a-z0-9]/g, '');
    const suggestedEmail = salesman.email || `${cleanPrefix}@nhtenterprise.com`;
    setAssignLoginEmail(suggestedEmail);
    setAssignLoginPassword('');
    setAssignLoginRole('Salesman');
  };

  const handleSaveSalesmanLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesmanToAssignLogin || !assignLoginEmail || !assignLoginPassword) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setIsAssigningLogin(true);
      const cleanSlug = salesmanToAssignLogin.name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
      const roleModules = ROLE_PRESETS[assignLoginRole]?.modules || ROLE_PRESETS['Salesman'].modules;

      const secondaryAuthClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://niwzgfouutangmdskqql.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2xSHcWIOC9vRjSxv-QtjOA_AbHygGKl',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: authData, error: authError } = await secondaryAuthClient.auth.signUp({
        email: assignLoginEmail.trim(),
        password: assignLoginPassword,
        options: {
          data: {
            name: salesmanToAssignLogin.name.trim(),
            full_name: salesmanToAssignLogin.name.trim(),
            role: assignLoginRole,
            tenant_id: cleanSlug,
            business_name: 'ZOHAIB ALI AND COMPANY',
            allowed_modules: roleModules,
          },
        },
      });

      if (authError) throw authError;

      // Upsert into tenants table
      await supabase.from('tenants').upsert([
        {
          name: salesmanToAssignLogin.name.trim(),
          slug: cleanSlug,
          email: assignLoginEmail.trim(),
          business_activity: assignLoginRole,
          seller_address: 'ZOHAIB ALI AND COMPANY',
          allowed_modules: roleModules,
        },
      ], { onConflict: 'slug' });

      // Link user_id and email in salesmen table
      const userId = authData?.user?.id;
      const { error: smErr } = await supabase
        .from('salesmen')
        .update({
          user_id: userId,
          email: assignLoginEmail.trim()
        })
        .eq('id', salesmanToAssignLogin.id);

      if (smErr) throw smErr;

      toast.success(`Login credentials created & linked for "${salesmanToAssignLogin.name}"!`);
      setSalesmanToAssignLogin(null);
      await fetchSalesmenData();
      await fetchDevData();
    } catch (err: any) {
      toast.error('Failed to create login: ' + err.message);
    } finally {
      setIsAssigningLogin(false);
    }
  };

  const fetchSalesmenData = async () => {
    try {
      setSalesmenLoading(true);
      const { data, error } = await supabase
        .from('salesmen')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSalesmenList(data || []);
    } catch (err: any) {
      console.error('Failed to load salesmen:', err);
    } finally {
      setSalesmenLoading(false);
    }
  };

  const handleOpenLinkModal = (salesman: any) => {
    setSelectedSalesmanToLink(salesman);
    const existing = Array.isArray(salesman.linked_salesmen) ? salesman.linked_salesmen : [];
    setSelectedPartnerNames(existing);
  };

  const togglePartnerName = (name: string) => {
    setSelectedPartnerNames(prev => {
      if (prev.includes(name)) {
        return prev.filter(n => n !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const handleSaveSalesmanLinks = async () => {
    if (!selectedSalesmanToLink) return;
    try {
      setSavingLinks(true);
      const targetName = selectedSalesmanToLink.name;
      const targetId = selectedSalesmanToLink.id;
      const cleanPartners = selectedPartnerNames.filter(n => n && n !== targetName);

      // 1. Update the target salesman
      const { error: primaryErr } = await supabase
        .from('salesmen')
        .update({ linked_salesmen: cleanPartners })
        .eq('id', targetId);

      if (primaryErr) throw primaryErr;

      // 2. If syncBidirectional is true, update the linked partners as well
      if (syncBidirectional) {
        const fullGroup = Array.from(new Set([targetName, ...cleanPartners]));

        for (const partnerName of cleanPartners) {
          const otherMembers = fullGroup.filter(n => n !== partnerName);
          await supabase
            .from('salesmen')
            .update({ linked_salesmen: otherMembers })
            .ilike('name', partnerName.trim());
        }

        // Also clean up any unlinked partners that were previously linked
        const previouslyLinked = Array.isArray(selectedSalesmanToLink.linked_salesmen) ? selectedSalesmanToLink.linked_salesmen : [];
        const unlinked = previouslyLinked.filter((p: string) => !cleanPartners.includes(p));
        for (const unlinkedName of unlinked) {
          const { data: currentPartner } = await supabase
            .from('salesmen')
            .select('linked_salesmen')
            .ilike('name', unlinkedName.trim())
            .maybeSingle();
          if (currentPartner && Array.isArray(currentPartner.linked_salesmen)) {
            const updated = currentPartner.linked_salesmen.filter((n: string) => n !== targetName);
            await supabase
              .from('salesmen')
              .update({ linked_salesmen: updated })
              .ilike('name', unlinkedName.trim());
          }
        }
      }

      toast.success(`Linked partner salesmen for "${targetName}" updated successfully!`);
      await fetchSalesmenData();
      setSelectedSalesmanToLink(null);
    } catch (err: any) {
      toast.error('Failed to update salesman links: ' + err.message);
    } finally {
      setSavingLinks(false);
    }
  };

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');
  const [logFilterEmployee, setLogFilterEmployee] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [logPage, setLogPage] = useState<number>(1);
  const [selectedLogModal, setSelectedLogModal] = useState<any | null>(null);
  const [showRawJsonModal, setShowRawJsonModal] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Stats
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  // Employee Data
  const [employees, setEmployees] = useState<EmployeeAccount[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Newly Created Result
  const [createdResult, setCreatedResult] = useState<{ name: string; email: string; role: string } | null>(null);

  // Edit Permissions Modal State
  const [editingEmployee, setEditingEmployee] = useState<EmployeeAccount | null>(null);
  const [editModalTab, setEditModalTab] = useState<'details' | 'roles' | 'settings'>('roles');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Warehouse Manager');
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editAllowedLocations, setEditAllowedLocations] = useState<string[]>([]);
  const [editAllowedSettings, setEditAllowedSettings] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Create Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Warehouse Manager',
    location_id: '' as string | number,
    allowed_locations: [] as string[],
    modules: ROLE_PRESETS['Warehouse Manager'].modules,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isDevAuthorized) {
      fetchDevData();
      fetchAuditLogs();
      fetchSalesmenData();
      fetchSystemMasterConfig().then(cfg => {
        setSystemConfig(cfg);
      });
    }
  }, [isDevAuthorized]);

  useEffect(() => {
    if (isDevAuthorized && activeTab === 'logs') {
      fetchAuditLogs();
    }
    if (isDevAuthorized && activeTab === 'salesmen') {
      fetchSalesmenData();
    }
    if (isDevAuthorized && activeTab === 'permissions') {
      fetchSystemMasterConfig().then(cfg => {
        setSystemConfig(cfg);
      });
    }
  }, [isDevAuthorized, activeTab]);

  const handleToggleBackupGlobal = () => {
    setSystemConfig(prev => ({ ...prev, allow_backup_global: !prev.allow_backup_global }));
  };

  const handleToggleBackupSuperAdmin = () => {
    setSystemConfig(prev => ({ ...prev, allow_backup_super_admin: !prev.allow_backup_super_admin }));
  };

  const handleToggleCreditLimitSuperAdmin = () => {
    setSystemConfig(prev => ({ ...prev, allow_credit_limit_super_admin: !prev.allow_credit_limit_super_admin }));
  };

  const handleToggleUserBackupWhitelist = (email: string) => {
    const clean = email.trim().toLowerCase();
    setSystemConfig(prev => {
      const list = prev.backup_allowed_users || [];
      const exists = list.some(e => e.toLowerCase() === clean);
      return {
        ...prev,
        backup_allowed_users: exists ? list.filter(e => e.toLowerCase() !== clean) : [...list, clean],
      };
    });
  };

  const handleToggleUserCreditLimitWhitelist = (email: string) => {
    const clean = email.trim().toLowerCase();
    setSystemConfig(prev => {
      const list = prev.credit_limit_allowed_users || [];
      const exists = list.some(e => e.toLowerCase() === clean);
      return {
        ...prev,
        credit_limit_allowed_users: exists ? list.filter(e => e.toLowerCase() !== clean) : [...list, clean],
      };
    });
  };

  const handleSaveSystemConfig = async () => {
    try {
      setSavingConfig(true);
      const res = await saveSystemMasterConfig(systemConfig);
      if (res.success) {
        toast.success('System permissions & security policies updated successfully!');
      } else {
        toast.error('Failed to sync permissions: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      toast.error('Error saving permissions: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwSelectedEmail) {
      toast.error('Please select an employee user');
      return;
    }
    if (!pwNew || pwNew.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setPwUpdating(true);
      const secondaryAuthClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://niwzgfouutangmdskqql.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2xSHcWIOC9vRjSxv-QtjOA_AbHygGKl',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // Attempt to trigger password reset email via auth
      await secondaryAuthClient.auth.resetPasswordForEmail(pwSelectedEmail.trim());

      // Log action in audit logs
      await supabase.from('audit_logs').insert([{
        action_type: 'UPDATE',
        table_name: 'user_credentials',
        performed_by: 'Master Dev Console',
        details: {
          target_user: pwSelectedEmail,
          action: 'Password reset / change requested by Developer Console',
          timestamp: new Date().toISOString()
        }
      }]);

      toast.success(`Password reset link dispatched for "${pwSelectedEmail}" & logged in audit history!`);
      setPwNew('');
      setPwConfirm('');
    } catch (err: any) {
      toast.error('Failed to process password change: ' + err.message);
    } finally {
      setPwUpdating(false);
    }
  };

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const enteredEmail = emailInput.trim().toLowerCase();
    if (
      (enteredEmail === DEV_EMAIL.toLowerCase() && passwordInput === DEV_PASSWORD) ||
      (enteredEmail === BACKUP_DEV_EMAIL.toLowerCase() && passwordInput === BACKUP_DEV_PASSWORD)
    ) {
      sessionStorage.setItem('nht_dev_auth_session', 'authorized');
      setIsDevAuthorized(true);
      toast.success('Super Admin Console Access Granted');
    } else {
      setAuthError('Invalid administrator email or password.');
    }
  };

  const handleDevLogout = () => {
    sessionStorage.removeItem('nht_dev_auth_session');
    setIsDevAuthorized(false);
    setEmailInput('');
    setPasswordInput('');
    toast('Developer Session Terminated');
  };

  const fetchDevData = async () => {
    try {
      setLoading(true);

      const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      setTotalProducts(prodCount || 0);

      const { count: invCount } = await supabase.from('sales_invoices').select('*', { count: 'exact', head: true });
      setTotalInvoices(invCount || 0);

      // Fetch locations
      const { data: locData } = await supabase.from('inventory_locations').select('*');
      if (locData) setLocations(locData);

      // Fetch saved employee tenant accounts
      const { data: tenantData } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      
      let formattedEmployees: EmployeeAccount[] = [];
      if (tenantData && tenantData.length > 0) {
        formattedEmployees = tenantData.map((t: any) => {
          let modules = Array.isArray(t.allowed_modules) && t.allowed_modules.length > 0 ? t.allowed_modules : getAllPermissionIds();
          // If stored array is just category names or ["all"], expand to full permission IDs
          if (modules.includes('all') || modules.some((m: string) => !m.startsWith('/'))) {
            const expanded = new Set<string>();
            modules.forEach((m: string) => {
              if (m === 'all') {
                getAllPermissionIds().forEach(id => expanded.add(id));
              } else {
                expanded.add(m);
                // If it's a category id (e.g. "sales", "purchase"), add all its children
                const cat = PERMISSION_TREE.find(p => p.id === m);
                if (cat?.children) {
                  cat.children.forEach(c => expanded.add(c.id));
                }
              }
            });
            modules = Array.from(expanded);
          }
          return {
            id: t.id,
            name: t.name,
            slug: t.slug,
            email: t.email,
            role: t.role || t.business_activity || (t.name?.toLowerCase().includes('admin') ? 'Super Admin' : 'Staff'),
            allowed_modules: modules,
            location_id: t.location_id,
            allowed_locations: Array.isArray(t.allowed_locations) ? t.allowed_locations : [],
            allowed_settings: Array.isArray(t.allowed_settings) ? t.allowed_settings : ALL_SETTING_TAB_IDS,
            created_at: t.created_at || new Date().toISOString(),
          };
        });
      } else {
        formattedEmployees = [];
      }

      setEmployees(formattedEmployees);
      setTotalEmployees(formattedEmployees.length);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load employee access data');
    } finally {
      setLoading(false);
    }
  };

  const applyRolePresetToNew = (presetKey: string) => {
    const preset = ROLE_PRESETS[presetKey];
    if (preset) {
      setNewEmployee(prev => ({
        ...prev,
        role: presetKey,
        modules: preset.modules,
      }));
      toast.success(`Loaded "${preset.name}" permission template`);
    }
  };

  const applyRolePresetToEdit = (presetKey: string) => {
    const preset = ROLE_PRESETS[presetKey];
    if (preset) {
      setEditRole(presetKey);
      setEditModules(preset.modules);
      toast.success(`Applied "${preset.name}" permissions`);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast.error('Please fill in all required employee fields');
      return;
    }

    try {
      setIsCreating(true);
      const cleanSlug = newEmployee.name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');

      // 1. Create User in Supabase Auth with allowed modules and role
      // Create a secondary client so we don't log out the active session
      const secondaryAuthClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://niwzgfouutangmdskqql.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2xSHcWIOC9vRjSxv-QtjOA_AbHygGKl',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      
      const { data: authData, error: authError } = await secondaryAuthClient.auth.signUp({
        email: newEmployee.email.trim(),
        password: newEmployee.password,
        options: {
          data: {
            name: newEmployee.name.trim(),
            full_name: newEmployee.name.trim(),
            role: newEmployee.role,
            tenant_id: cleanSlug,
            business_name: 'ZOHAIB ALI AND COMPANY',
            allowed_modules: newEmployee.modules,
          },
        },
      });

      if (authError) throw authError;

      // 2. Record employee in tenants table
      try {
        const { error: tenantErr } = await supabase.from('tenants').upsert([
          {
            name: newEmployee.name.trim(),
            slug: cleanSlug,
            email: newEmployee.email.trim(),
            business_activity: newEmployee.role,
            seller_address: 'ZOHAIB ALI AND COMPANY',
            allowed_modules: newEmployee.modules,
            allowed_locations: newEmployee.allowed_locations,
            location_id: newEmployee.role === 'Warehouse Manager' && newEmployee.location_id ? Number(newEmployee.location_id) : null,
          },
        ], { onConflict: 'slug' });

        if (tenantErr) {
          console.warn('Upsert fallback to insert:', tenantErr);
          const { error: insertErr } = await supabase.from('tenants').insert([
            {
              name: newEmployee.name.trim(),
              slug: cleanSlug,
              email: newEmployee.email.trim(),
              business_activity: newEmployee.role,
              seller_address: 'ZOHAIB ALI AND COMPANY',
              allowed_modules: newEmployee.modules,
              allowed_locations: newEmployee.allowed_locations,
              location_id: newEmployee.role === 'Warehouse Manager' && newEmployee.location_id ? Number(newEmployee.location_id) : null,
            },
          ]);
          if (insertErr) {
            console.error('Tenants table insert error:', insertErr);
            toast.error(`Auth user created, but could not save profile to 'tenants' table: ${insertErr.message}`);
          }
        }
      } catch (err: any) {
        console.error('Tenants table upsert exception:', err);
        toast.error(`Profile record error: ${err.message || err}`);
      }

      // 3. Auto-link Salesman role to Salesmen directory
      if (newEmployee.role === 'Salesman' && authData?.user?.id) {
        try {
          await supabase.from('salesmen').insert({
            name: newEmployee.name.trim(),
            user_id: authData.user.id,
          });
        } catch (err) {
          console.warn('Salesmen table insert:', err);
        }
      }

      setCreatedResult({
        name: newEmployee.name.trim(),
        email: newEmployee.email.trim(),
        role: newEmployee.role,
      });

      toast.success(`Employee account "${newEmployee.name}" registered with role "${newEmployee.role}"!`);
      
      setNewEmployee({
        name: '',
        email: '',
        password: '',
        role: 'Warehouse Manager',
        location_id: '',
        modules: ROLE_PRESETS['Warehouse Manager'].modules,
      });

      await fetchDevData();
      setActiveTab('employees');
    } catch (err: any) {
      toast.error('Registration failed: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditModal = (emp: EmployeeAccount) => {
    setEditingEmployee(emp);
    setEditModalTab('details');
    setEditName(emp.name || '');
    setEditRole(emp.role || 'Warehouse Manager');
    setEditModules(emp.allowed_modules || getAllPermissionIds());
    setEditAllowedLocations(Array.isArray(emp.allowed_locations) ? emp.allowed_locations : []);
    const rawSettings = Array.isArray(emp.allowed_settings) && emp.allowed_settings.length > 0 ? emp.allowed_settings : ALL_SETTING_TAB_IDS;
    const migratedSettings = rawSettings.includes('reports_visibility') &&
      !rawSettings.includes('reports_visibility_basic') &&
      !rawSettings.includes('reports_visibility_advance')
        ? [...rawSettings, 'reports_visibility_basic', 'reports_visibility_advance']
        : rawSettings;
    setEditAllowedSettings(migratedSettings);
  };

  const handleSaveEmployeePermissions = async () => {
    if (!editingEmployee) return;

    // Allow customizing permissions for any employee user, including Super Admin accounts
    // (such as test@noorhorizontechnologies.com), so specific pages can be hidden or granted.

    try {
      setIsSavingEdit(true);
      
      // Attempt update with standard columns (business_activity, allowed_modules)
      const updatePayload: any = {
        name: editName.trim(),
        business_activity: editRole,
        allowed_modules: editModules,
        allowed_locations: editAllowedLocations,
        allowed_settings: editAllowedSettings,
      };

      const { error } = await supabase
        .from('tenants')
        .update(updatePayload)
        .eq('slug', editingEmployee.slug);

      if (error) {
        // Fallback update without crashing if specific column differs
        const { error: fallbackError } = await supabase
          .from('tenants')
          .update({ name: editName.trim(), business_activity: editRole })
          .eq('slug', editingEmployee.slug);
        
        if (fallbackError) {
          console.warn('Tenant record fallback:', fallbackError);
        }
      }

      // If they are a salesman, sync name to salesmen table
      if (editRole === 'Salesman' || editingEmployee.role === 'Salesman') {
        try {
          await supabase.from('salesmen').update({ name: editName.trim() }).eq('name', editingEmployee.name);
        } catch (err) {
          console.warn('Sync salesman name error:', err);
        }
      }

      // Also update local cache for immediate effect
      try {
        localStorage.setItem(`nht_modules_${editingEmployee.slug}`, JSON.stringify(editModules));
      } catch (_) {}

      toast.success(`Role & permissions for "${editingEmployee.name}" updated!`);
      setEditingEmployee(null);
      fetchDevData();
    } catch (e: any) {
      toast.error('Update failed: ' + e.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEmployee = async (emp: EmployeeAccount) => {
    if (!window.confirm(`Are you sure you want to delete employee "${emp.name}"?`)) {
      return;
    }
    try {
      const { error } = await supabase.from('tenants').delete().eq('id', emp.id);
      if (error) throw error;
      toast.success(`Employee account "${emp.name}" removed successfully.`);
      fetchDevData();
    } catch (err: any) {
      toast.error('Failed to delete employee: ' + err.message);
    }
  };

  // Resolve employee friendly name, role, and avatar from performed_by identifier
  const getEmployeeInfo = (performedBy?: any) => {
    const raw = String(performedBy || '').trim();
    if (!raw || raw.toLowerCase() === 'system') {
      return {
        name: 'System Automated',
        role: 'Background System',
        email: 'Automated Audit Daemon',
        initials: 'SYS',
        avatarBg: 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300',
        badgeColor: 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300 border-gray-300 dark:border-strokedark',
      };
    }
    const lower = raw.toLowerCase();
    if (
      lower.includes('admin') ||
      lower === 'system administrator' ||
      lower === DEV_EMAIL.toLowerCase() ||
      lower === BACKUP_DEV_EMAIL.toLowerCase()
    ) {
      return {
        name: getBrandConfig().fullName,
        role: 'Super Admin',
        email: lower.includes('@') ? raw : DEV_EMAIL,
        initials: getBrandConfig().code,
        avatarBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      };
    }

    const matched = (employees || []).find(
      e =>
        (e?.email && String(e.email).toLowerCase() === lower) ||
        (e?.name && String(e.name).toLowerCase() === lower) ||
        (e?.slug && String(e.slug).toLowerCase() === lower)
    );

    if (matched && matched.name) {
      const parts = String(matched.name).trim().split(' ').filter(Boolean);
      const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : (parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'EM');
      return {
        name: matched.name,
        role: matched.role || 'Staff Member',
        email: matched.email || raw,
        initials,
        avatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      };
    }

    if (raw.includes('@')) {
      const username = raw.split('@')[0] || 'User';
      const prettyName = username.charAt(0).toUpperCase() + username.slice(1);
      return {
        name: prettyName,
        role: 'Staff User',
        email: raw,
        initials: prettyName.slice(0, 2).toUpperCase(),
        avatarBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      };
    }

    const initials = raw.length > 1 ? raw.slice(0, 2).toUpperCase() : (raw.toUpperCase() || 'ST');
    return {
      name: raw,
      role: 'Staff Member',
      email: raw,
      initials,
      avatarBg: 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300',
      badgeColor: 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300 border-gray-300 dark:border-strokedark',
    };
  };

  // Plain-English Activity Formatter for Non-Technical Users
  const formatActivityEvent = (log: any) => {
    const action = (log.action_type || 'UNKNOWN').toUpperCase();
    const table = (log.table_name || '').toLowerCase();
    const details = log.details || {};

    if (action === 'LOGIN') {
      return {
        category: 'User Authentication',
        actionLabel: 'Logged In',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        icon: '🔐',
        title: 'Logged into ERP System',
        summary: details.email ? `User ${details.email} logged in` : 'Employee session started',
      };
    }
    if (action === 'LOGOUT') {
      return {
        category: 'User Authentication',
        actionLabel: 'Logged Out',
        badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        icon: '🚪',
        title: 'Signed Out of System',
        summary: details.email ? `User ${details.email} signed out` : 'Employee session ended',
      };
    }

    if (table.includes('system') || action === 'SYSTEM') {
      return {
        category: 'System Operations',
        actionLabel: 'System Notice',
        badgeClass: 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300 border-gray-300 dark:border-strokedark',
        icon: '⚙️',
        title: details.event || 'System Audit Initialized',
        summary: details.scope || 'System background audit stream active',
      };
    }

    if (table.includes('sales_invoice') && !table.includes('receipt')) {
      const invNo = details.invoice_number || (details.id ? `#${details.id}` : '');
      const cust = details.customer_name || details.customer || '';
      const total = details.total_amount ? `Rs. ${Number(details.total_amount).toLocaleString()}` : '';

      if (action === 'INSERT') {
        return {
          category: 'Sales & Invoicing',
          actionLabel: 'Created Invoice',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: '🧾',
          title: `Created Sales Invoice ${invNo}`,
          summary: [cust && `Customer: ${cust}`, total && `Total: ${total}`].filter(Boolean).join(' • ') || 'New sales invoice recorded',
        };
      }
      if (action === 'UPDATE') {
        return {
          category: 'Sales & Invoicing',
          actionLabel: 'Modified Invoice',
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: '✏️',
          title: `Modified Sales Invoice ${invNo}`,
          summary: [cust && `Customer: ${cust}`, total && `Total: ${total}`].filter(Boolean).join(' • ') || 'Sales invoice updated',
        };
      }
      if (action === 'DELETE') {
        return {
          category: 'Sales & Invoicing',
          actionLabel: 'Deleted Invoice',
          badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
          icon: '🗑️',
          title: `Deleted Sales Invoice ${invNo}`,
          summary: cust ? `Cancelled invoice for customer: ${cust}` : 'Sales invoice removed',
        };
      }
    }

    if (table.includes('receipt') || table.includes('invoice_receipt')) {
      const rcptNo = details.receipt_number || (details.id ? `#${details.id}` : '');
      const amt = details.received_amount || details.amount ? `Rs. ${Number(details.received_amount || details.amount).toLocaleString()}` : '';
      const cust = details.customer_name || '';

      if (action === 'INSERT') {
        return {
          category: 'Finance & Receipts',
          actionLabel: 'Payment Received',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: '💰',
          title: `Received Customer Payment ${rcptNo}`,
          summary: [cust && `From: ${cust}`, amt && `Amount: ${amt}`].filter(Boolean).join(' • ') || 'Payment receipt generated',
        };
      }
      return {
        category: 'Finance & Receipts',
        actionLabel: action === 'UPDATE' ? 'Updated Receipt' : 'Deleted Receipt',
        badgeClass: action === 'UPDATE' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300',
        icon: '💵',
        title: `${action === 'UPDATE' ? 'Modified' : 'Deleted'} Receipt ${rcptNo}`,
        summary: amt ? `Amount: ${amt}` : 'Payment receipt altered',
      };
    }

    if (table.includes('delivery_challan') || table.includes('challan')) {
      const chNo = details.challan_number || (details.id ? `#${details.id}` : '');
      const cust = details.customer_name || '';

      if (action === 'INSERT') {
        return {
          category: 'Warehouse & Logistics',
          actionLabel: 'Stock Dispatched',
          badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
          icon: '🚚',
          title: `Dispatched Delivery Challan ${chNo}`,
          summary: cust ? `Outward delivery to: ${cust}` : 'Goods dispatched from warehouse',
        };
      }
      return {
        category: 'Warehouse & Logistics',
        actionLabel: action === 'UPDATE' ? 'Updated Challan' : 'Deleted Challan',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
        icon: '📦',
        title: `${action === 'UPDATE' ? 'Modified' : 'Deleted'} Delivery Challan ${chNo}`,
        summary: 'Warehouse dispatch record changed',
      };
    }

    if (table.includes('return')) {
      const retNo = details.return_number || (details.id ? `#${details.id}` : '');
      return {
        category: 'Sales Returns',
        actionLabel: 'Sales Return',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        icon: '↩️',
        title: `Processed Sales Return ${retNo}`,
        summary: details.reason ? `Reason: ${details.reason}` : 'Returned item received into inventory',
      };
    }

    if (table.includes('stock_transfer') || table.includes('transfer')) {
      return {
        category: 'Warehouse Inventory',
        actionLabel: 'Stock Transfer',
        badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800',
        icon: '🔄',
        title: 'Inter-Warehouse Stock Transfer',
        summary: details.source_location && details.destination_location
          ? `Transferred from ${details.source_location} to ${details.destination_location}`
          : 'Stock movement recorded between locations',
      };
    }

    if (table.includes('purchase')) {
      const poNo = details.purchase_number || (details.id ? `#${details.id}` : '');
      const vendor = details.vendor_name || details.supplier || '';
      return {
        category: 'Purchase & Stock Inward',
        actionLabel: action === 'INSERT' ? 'New Purchase' : 'Purchase Record',
        badgeClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
        icon: '🛍️',
        title: `Supplier Purchase ${poNo}`,
        summary: vendor ? `Vendor: ${vendor}` : 'Purchase transaction registered',
      };
    }

    if (table.includes('opening_stock') || table.includes('opening_stocks')) {
      const stockNo = details.stock_no || details.stockNo || (details.id ? `#${details.id}` : '');
      const loc = details.location || '';
      const itemsCount = details.items_count ? `${details.items_count} Products` : (details.product_name ? details.product_name : '');
      const totalUnits = details.total_quantity || details.quantity || details.qty ? `${details.total_quantity || details.quantity || details.qty} Units` : '';

      return {
        category: 'Inventory & Opening Stock',
        actionLabel: action === 'INSERT' ? 'Opening Stock In' : action === 'UPDATE' ? 'Updated Stock' : 'Deleted Stock',
        badgeClass: action === 'INSERT'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
          : action === 'UPDATE'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
        icon: '📦',
        title: action === 'INSERT' ? `Initialized Opening Stock (${stockNo})` : action === 'UPDATE' ? `Updated Opening Stock (${stockNo})` : `Deleted Opening Stock (${stockNo})`,
        summary: [loc && `Location: ${loc}`, itemsCount, totalUnits].filter(Boolean).join(' • ') || 'Opening stock record processed',
      };
    }

    if (table.includes('product')) {
      const isBulk = Boolean(details.event?.toLowerCase().includes('bulk') || details.new_products_added !== undefined || details.file_name);
      if (isBulk) {
        const added = details.new_products_added ?? 0;
        const updated = details.existing_products_updated ?? 0;
        const skipped = details.skipped_duplicates ?? 0;
        return {
          category: 'Product Catalog',
          actionLabel: 'Bulk Product Upload',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: '📦',
          title: `Bulk Upload: ${added} New Products Added`,
          summary: `${added} added • ${updated} updated • ${skipped} duplicates skipped (${details.file_name || 'Excel'})`,
        };
      }

      return {
        category: 'Product Catalog',
        actionLabel: action === 'INSERT' ? 'Created Product' : action === 'UPDATE' ? 'Updated Product' : 'Deleted Product',
        badgeClass: action === 'INSERT'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
          : action === 'UPDATE'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
          : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300',
        icon: '🏷️',
        title: `${action === 'INSERT' ? 'Added' : action === 'UPDATE' ? 'Updated' : 'Removed'} Product: ${details.product_name || details.name || ''}`,
        summary: details.item_sr_no ? `Code: ${details.item_sr_no}` : (details.category ? `Category: ${details.category}` : 'Product catalog modified'),
      };
    }

    let friendlyAction = 'Activity Logged';
    let badgeClass = 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300 border-gray-300 dark:border-strokedark';
    if (action === 'INSERT') {
      friendlyAction = 'Created Record';
      badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
    } else if (action === 'UPDATE') {
      friendlyAction = 'Modified Record';
      badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
    } else if (action === 'DELETE') {
      friendlyAction = 'Deleted Record';
      badgeClass = 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300';
    }

    const cleanCategory = table ? table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'System';

    return {
      category: cleanCategory,
      actionLabel: friendlyAction,
      badgeClass,
      icon: '📝',
      title: `${friendlyAction} in ${cleanCategory}`,
      summary: details.id ? `Record ID #${details.id}` : (typeof details === 'string' ? details : JSON.stringify(details).slice(0, 70)),
    };
  };

  // Distinct list of employees for filter dropdown
  const employeeFilterOptions = React.useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const added = new Set<string>();

    (employees || []).forEach(emp => {
      if (emp?.name && !added.has(String(emp.name).toLowerCase())) {
        added.add(String(emp.name).toLowerCase());
        list.push({ key: emp.name, label: `${emp.name} (${emp.role || 'Staff'})` });
      }
    });

    (logs || []).forEach(log => {
      if (log) {
        const info = getEmployeeInfo(log.performed_by);
        if (info?.name && !added.has(String(info.name).toLowerCase())) {
          added.add(String(info.name).toLowerCase());
          list.push({ key: info.name, label: `${info.name} (${info.role})` });
        }
      }
    });

    return list;
  }, [employees, logs]);

  // Audit Logs computed filtering & pagination
  const filteredLogs = (logs || []).filter(log => {
    if (!log) return false;

    // Action filter
    if (logFilterAction !== 'ALL') {
      const act = String(log.action_type || '').toUpperCase();
      if (logFilterAction === 'AUTH') {
        if (act !== 'LOGIN' && act !== 'LOGOUT') return false;
      } else if (act !== logFilterAction) {
        return false;
      }
    }

    // Employee filter
    if (logFilterEmployee !== 'ALL') {
      const empInfo = getEmployeeInfo(log.performed_by);
      const target = logFilterEmployee.toLowerCase();
      const matchesName = String(empInfo.name || '').toLowerCase() === target;
      const matchesEmail = String(empInfo.email || '').toLowerCase() === target;
      const matchesRaw = String(log.performed_by || '').toLowerCase() === target;
      if (!matchesName && !matchesEmail && !matchesRaw) return false;
    }

    // Search query
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const empInfo = getEmployeeInfo(log.performed_by);
      const activity = formatActivityEvent(log);
      const matchAction = String(log.action_type || '').toLowerCase().includes(q);
      const matchCategory = String(activity.category || '').toLowerCase().includes(q);
      const matchTitle = String(activity.title || '').toLowerCase().includes(q);
      const matchSummary = String(activity.summary || '').toLowerCase().includes(q);
      const matchEmpName = String(empInfo.name || '').toLowerCase().includes(q);
      const matchEmpRole = String(empInfo.role || '').toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchAction || matchCategory || matchTitle || matchSummary || matchEmpName || matchEmpRole || matchDetails;
    }

    return true;
  });

  const pageSize = 15;
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((logPage - 1) * pageSize, logPage * pageSize);

  // IF NOT AUTHENTICATED AS DEVELOPER -> SHOW SECURE LOGIN FORM
  if (!isDevAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 text-body dark:bg-boxdark-2 dark:text-bodydark flex flex-col items-center justify-center p-6 font-sans transition-colors duration-200">
        
        <div className="absolute top-6 right-6">
          <ul className="flex items-center gap-2 list-none m-0">
            <DarkModeSwitcher />
          </ul>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-boxdark border border-stroke dark:border-strokedark p-8 sm:p-10 rounded-3xl shadow-default space-y-6 transition-colors duration-200">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center text-3xl shadow-xs">
              <MdSecurity />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black dark:text-white">Master Role & Dev Console</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Employee Access & Roles Control for ZOHAIB ALI AND COMPANY</p>
          </div>

          {authError && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-danger text-xs p-3 rounded-lg flex items-center gap-2">
              <MdLockOutline /> {authError}
            </div>
          )}

          <form onSubmit={handleDevLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">Master Developer Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="developer@noorhorizontechnologies.com"
                className="w-full bg-transparent dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">Master Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent dark:bg-form-input border border-stroke dark:border-form-strokedark rounded-xl p-3 text-xs text-black dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <MdVpnKey /> Authenticate Role Console
            </button>
          </form>

          <div className="pt-2 text-center">
            <a href="/" className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition">
              ← Return to Main Application
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-body dark:bg-boxdark-2 dark:text-bodydark font-sans p-6 md:p-10 flex flex-col items-center transition-colors duration-200">
      
      {/* HEADER */}
      <header className="w-full max-w-6xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl p-6 shadow-default flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-2xl">
            <MdAdminPanelSettings />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-black dark:text-white tracking-tight">ZOHAIB ALI AND COMPANY</h1>
              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Employee Role & Access Control
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              Admin & Role Console: <span className="text-black dark:text-gray-200 font-medium">{DEV_EMAIL}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TABS SWITCHER */}
          <div className="bg-gray-100 dark:bg-meta-4/30 p-1 rounded-xl border border-stroke dark:border-strokedark flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview' ? 'bg-white dark:bg-boxdark text-emerald-700 dark:text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MdDashboard /> Roles Overview
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'employees' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MdPeople /> Employee Accounts ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('salesmen')}
              className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'salesmen' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MdLink /> Merge / Link Salesmen ({salesmenList.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'create' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MdAddCircle /> Add Employee User
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MdHistory /> Logs {logs.length > 0 && `(${logs.length})`}
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'permissions' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MdSecurity /> System Permissions
            </button>
          </div>

          <ul className="flex items-center gap-2 list-none m-0">
            <DarkModeSwitcher />
          </ul>

          <button
            onClick={handleDevLogout}
            title="Sign Out of Console"
            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-danger border border-red-200 dark:border-red-500/30 transition cursor-pointer"
          >
            <MdLogout />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full max-w-6xl space-y-6">
        
        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <OverviewTab
            totalEmployees={totalEmployees}
            totalProducts={totalProducts}
            totalInvoices={totalInvoices}
            ROLE_PRESETS={ROLE_PRESETS}
            applyRolePresetToNew={applyRolePresetToNew}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ================= TAB 2: EMPLOYEES DIRECTORY ================= */}
        {activeTab === 'employees' && (
          <EmployeesTab
            employees={employees}
            setActiveTab={setActiveTab}
            handleOpenEditModal={handleOpenEditModal}
            handleDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {/* ================= TAB 2.5: SALESMEN LINKING MATRIX ================= */}
        {activeTab === 'salesmen' && (
          <SalesmenTab
            fetchSalesmenData={fetchSalesmenData}
            salesmenLoading={salesmenLoading}
            salesmenList={salesmenList}
            handleOpenAssignLoginModal={handleOpenAssignLoginModal}
            handleOpenLinkModal={handleOpenLinkModal}
          />
        )}

        {/* ================= TAB 3: CREATE NEW EMPLOYEE ================= */}
        {activeTab === 'create' && (
          <CreateEmployeeTab
            createdResult={createdResult}
            handleCreateEmployee={handleCreateEmployee}
            newEmployee={newEmployee}
            setNewEmployee={setNewEmployee}
            applyRolePresetToNew={applyRolePresetToNew}
            ROLE_PRESETS={ROLE_PRESETS}
            PermissionTreeEditor={PermissionTreeEditor}
            locations={locations}
            setActiveTab={setActiveTab}
            isCreating={isCreating}
          />
        )}

        {/* ================= TAB 4: AUDIT LOGS ================= */}
        {activeTab === 'logs' && (
          <AuditLogsTab
            logs={logs}
            filteredLogs={filteredLogs}
            paginatedLogs={paginatedLogs}
            logsLoading={logsLoading}
            logSearch={logSearch}
            setLogSearch={setLogSearch}
            logFilterAction={logFilterAction}
            setLogFilterAction={setLogFilterAction}
            logFilterEmployee={logFilterEmployee}
            setLogFilterEmployee={setLogFilterEmployee}
            logPage={logPage}
            setLogPage={setLogPage}
            pageSize={pageSize}
            totalPages={totalPages}
            employeeFilterOptions={employeeFilterOptions}
            fetchAuditLogs={fetchAuditLogs}
            getEmployeeInfo={getEmployeeInfo}
            formatActivityEvent={formatActivityEvent}
            setSelectedLogModal={setSelectedLogModal}
            setShowRawJsonModal={setShowRawJsonModal}
          />
        )}

        {/* TAB 6: SYSTEM PERMISSIONS & ACCESS GOVERNANCE */}
        {activeTab === 'permissions' && (
          <PermissionsTab
            systemConfig={systemConfig}
            savingConfig={savingConfig}
            handleSaveSystemConfig={handleSaveSystemConfig}
            handleToggleBackupGlobal={handleToggleBackupGlobal}
            handleToggleBackupSuperAdmin={handleToggleBackupSuperAdmin}
            handleToggleUserBackupWhitelist={handleToggleUserBackupWhitelist}
            handleToggleCreditLimitSuperAdmin={handleToggleCreditLimitSuperAdmin}
            handleToggleUserCreditLimitWhitelist={handleToggleUserCreditLimitWhitelist}
            employees={employees}
            pwSelectedEmail={pwSelectedEmail}
            setPwSelectedEmail={setPwSelectedEmail}
            pwNew={pwNew}
            setPwNew={setPwNew}
            pwConfirm={pwConfirm}
            setPwConfirm={setPwConfirm}
            showPwText={showPwText}
            setShowPwText={setShowPwText}
            pwUpdating={pwUpdating}
            handleUpdateUserPassword={handleUpdateUserPassword}
          />
        )}
      </main>

      {/* EDIT EMPLOYEE PERMISSIONS MODAL */}
      {editingEmployee && (
        <EditEmployeeModal
          editingEmployee={editingEmployee}
          setEditingEmployee={setEditingEmployee}
          editModules={editModules}
          setEditModules={setEditModules}
          editModalTab={editModalTab}
          setEditModalTab={setEditModalTab}
          editName={editName}
          setEditName={setEditName}
          editAllowedLocations={editAllowedLocations}
          setEditAllowedLocations={setEditAllowedLocations}
          editAllowedSettings={editAllowedSettings}
          setEditAllowedSettings={setEditAllowedSettings}
          ROLE_PRESETS={ROLE_PRESETS}
          applyRolePresetToEdit={applyRolePresetToEdit}
          PermissionTreeEditor={PermissionTreeEditor}
          locations={locations}
          SETTINGS_TAB_CONFIG={SETTINGS_TAB_CONFIG}
          isSavingEdit={isSavingEdit}
          handleSaveEmployeePermissions={handleSaveEmployeePermissions}
        />
      )}

      {/* DETAILS MODAL FOR LOG ENTRY */}
      {selectedLogModal && (
        <AuditLogDetailsModal
          selectedLogModal={selectedLogModal}
          setSelectedLogModal={setSelectedLogModal}
          showRawJsonModal={showRawJsonModal}
          setShowRawJsonModal={setShowRawJsonModal}
          getEmployeeInfo={getEmployeeInfo}
          formatActivityEvent={formatActivityEvent}
        />
      )}

      {/* 🌟 MODAL: LINK / MERGE PARTNER SALESMEN */}
      {selectedSalesmanToLink && (
        <LinkSalesmanModal
          selectedSalesmanToLink={selectedSalesmanToLink}
          setSelectedSalesmanToLink={setSelectedSalesmanToLink}
          salesmenList={salesmenList}
          selectedPartnerNames={selectedPartnerNames}
          setSelectedPartnerNames={setSelectedPartnerNames}
          togglePartnerName={togglePartnerName}
          syncBidirectional={syncBidirectional}
          setSyncBidirectional={setSyncBidirectional}
          handleSaveSalesmanLinks={handleSaveSalesmanLinks}
          savingLinks={savingLinks}
        />
      )}

      {/* MODAL: ASSIGN LOGIN CREDENTIALS TO SALESMAN */}
      {salesmanToAssignLogin && (
        <AssignLoginModal
          salesmanToAssignLogin={salesmanToAssignLogin}
          setSalesmanToAssignLogin={setSalesmanToAssignLogin}
          assignLoginEmail={assignLoginEmail}
          setAssignLoginEmail={setAssignLoginEmail}
          assignLoginPassword={assignLoginPassword}
          setAssignLoginPassword={setAssignLoginPassword}
          assignLoginRole={assignLoginRole}
          setAssignLoginRole={setAssignLoginRole}
          rolePresets={ROLE_PRESETS}
          handleSaveSalesmanLogin={handleSaveSalesmanLogin}
          isAssigningLogin={isAssigningLogin}
        />
      )}

    </div>
  );
};

export default DeveloperDashboard;
