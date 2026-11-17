import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowLeft,
  LuShoppingBag,
  LuDownload,
  LuBoxes,
  LuLayers,
  LuStore,
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';

export interface POSCatalogHeaderProps {
  activeTab: 'products' | 'categories';
  setActiveTab: (tab: 'products' | 'categories') => void;
  productsCount: number;
  categoriesCount: number;
  embedded?: boolean;
  onBack?: () => void;
  onOpenErpImport: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const POSCatalogHeader: React.FC<POSCatalogHeaderProps> = ({
  activeTab,
  setActiveTab,
  productsCount,
  categoriesCount,
  embedded,
  onBack,
  onOpenErpImport,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Banner & Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => { if (onBack) onBack(); else navigate('/pos/terminal'); }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Return to POS Terminal"
          >
            <LuArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <LuShoppingBag className="text-primary" />
              <span>POS Store Catalog & Visibility</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select which items & categories appear on the POS counter, upload display images, and generate immutable barcodes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Button: Get from ERP Product List */}
          <button
            type="button"
            onClick={onOpenErpImport}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 bg-indigo-600 hover:bg-indigo-700"
            title="Import products from main ERP product list"
          >
            <LuDownload size={16} />
            <span>Get from ERP Product List</span>
          </button>

          <button
            type="button"
            onClick={() => { if (onBack) onBack(); else navigate('/pos/terminal'); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined
            }}
          >
            <MdPointOfSale size={16} />
            <span>{embedded ? 'Back to Cashier Register' : 'Launch POS Terminal'}</span>
          </button>
        </div>
      </div>

      {/* Tabs: Products vs Categories */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          style={
            activeTab === 'products'
              ? { backgroundColor: accentColor, color: contrastText }
              : undefined
          }
        >
          <LuStore size={15} />
          <span>Products & Barcodes ({productsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          style={
            activeTab === 'categories'
              ? { backgroundColor: accentColor, color: contrastText }
              : undefined
          }
        >
          <LuLayers size={15} />
          <span>Category Visibility & Covers ({categoriesCount})</span>
        </button>
      </div>
    </>
  );
};

export default POSCatalogHeader;
