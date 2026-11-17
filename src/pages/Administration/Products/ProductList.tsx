import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import TablePagination from '../../../components/TablePagination';
import { getDetailedBreakdown } from '../../../utils/stockCalculator';
import { useAuth } from '../../../Context/Auth';
import { ProductCatalogItem, SortConfig } from './list/types/productListTypes';
import {
  fetchInventoryProductsLegacy,
  loadServerPage,
  deleteProductCatalogEntry,
} from './list/services/productListService';
import { ProductStockBreakdownModal } from './list/components/ProductStockBreakdownModal';
import { ProductQuickViewModal } from './list/components/ProductQuickViewModal';
import { ProductTable } from './list/components/ProductTable';

const ProductList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStockBreakdown, setSelectedStockBreakdown] = useState<ProductCatalogItem | null>(null);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<ProductCatalogItem | null>(null);
  const [selectedModalWarehouse, setSelectedModalWarehouse] = useState<string>('ALL');
  const [masterLocations, setMasterLocations] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Server-side pagination mode
  const [serverMode, setServerMode] = useState(false);
  const [serverBalances, setServerBalances] = useState<any[] | null>(null);
  const [serverTotalEntries, setServerTotalEntries] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadLegacyProducts = async () => {
    try {
      setLoading(true);
      const unified = await fetchInventoryProductsLegacy(setMasterLocations);
      setProducts(unified);
    } catch (err: any) {
      toast.error('Data Fetching Failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServerProducts = async () => {
    if (!serverMode) return;
    try {
      setLoading(true);
      const { total, products: serverRows } = await loadServerPage(
        debouncedSearch,
        sortConfig,
        currentPage,
        pageSize,
        serverBalances
      );
      setServerTotalEntries(total);
      setProducts(serverRows);
    } catch (err: any) {
      toast.error('Data Fetching Failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initListMode = async () => {
      try {
        const probe = await supabase
          .from('stock_balances')
          .select('product_name, warehouse_name, quantity')
          .limit(1);

        if (!probe.error && probe.data && probe.data.length > 0) {
          const { data: rows } = await supabase
            .from('stock_balances')
            .select('product_name, warehouse_name, quantity');
          if (rows && rows.length > 0) {
            const { data: locMaster } = await supabase.from('inventory_locations').select('name');
            if (locMaster) setMasterLocations(locMaster.map((l: any) => String(l.name).trim()));
            setServerBalances(rows);
            setServerMode(true);
            return;
          }
        }
      } catch {
        /* stock_balances missing → legacy mode */
      }
      setServerMode(false);
      loadLegacyProducts();
    };
    initListMode();
  }, []);

  useEffect(() => {
    if (serverMode) {
      loadServerProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMode, currentPage, pageSize, debouncedSearch, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, pageSize, sortConfig]);

  const handleOpenBreakdown = async (product: ProductCatalogItem) => {
    setSelectedModalWarehouse('ALL');
    if (!serverMode) {
      setSelectedStockBreakdown(product);
      return;
    }
    setSelectedStockBreakdown({ ...product, _loading: true });
    try {
      const detail = await getDetailedBreakdown(product.product_name, product.item_sr_no);
      setSelectedStockBreakdown({
        ...product,
        breakdown: detail.breakdown,
        warehouseBreakdowns: detail.warehouseBreakdowns,
        _loading: false,
      });
    } catch (err: any) {
      toast.error('Breakdown load failed: ' + err.message);
      setSelectedStockBreakdown({ ...product, _loading: false });
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!window.confirm('Are you certain you want to delete this product catalog entry?')) return;
    try {
      const targetProd = products.find((p) => String(p.id) === String(id));
      await deleteProductCatalogEntry(id, targetProd, user);
      toast.success('Product removed from database catalog successfully.');
      if (serverMode) {
        const remainingOnPage = products.length - 1;
        if (remainingOnPage === 0 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        } else {
          loadServerProducts();
        }
      } else {
        loadLegacyProducts();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Legacy filtering & sorting
  let filteredProducts = serverMode
    ? products
    : products.filter((p) => {
        return (
          p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.item_sr_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.product_description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

  if (!serverMode && sortConfig !== null) {
    filteredProducts.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (['purchase_price', 'retail_price', 'mrp', 'current_stock'].includes(sortConfig.key)) {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalEntries = serverMode ? serverTotalEntries : filteredProducts.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedProducts = serverMode
    ? filteredProducts
    : filteredProducts.slice(startIndex, startIndex + pageSize);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Product Stock Inventory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Master item catalog, stock availability & pricing ledger
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/Administration/Products/Add')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] p-5 sm:p-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Catalog Inventory Overview</span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
            {serverMode ? totalEntries : products.length} Products Registered
          </span>
        </div>

        {/* Page size & Search bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-emerald-600 text-xs font-bold text-slate-800 dark:text-white transition"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size} className="dark:bg-slate-800">
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, category, code, brand..."
              className="w-full sm:w-72 rounded-xl border border-slate-200 py-2 px-3.5 bg-slate-50/50 dark:bg-slate-800/60 dark:border-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-800 dark:text-white transition"
            />
          </div>
        </div>

        {/* Product Table */}
        <ProductTable
          loading={loading}
          paginatedProducts={paginatedProducts}
          startIndex={startIndex}
          sortConfig={sortConfig}
          onSort={handleSort}
          onOpenBreakdown={handleOpenBreakdown}
          onOpenQuickView={setSelectedQuickViewProduct}
          onDeleteProduct={handleDeleteProduct}
        />

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={totalEntries}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          itemName="entries"
        />
      </div>

      {/* Stock Breakdown Modal */}
      <ProductStockBreakdownModal
        selectedStockBreakdown={selectedStockBreakdown}
        onClose={() => setSelectedStockBreakdown(null)}
        selectedModalWarehouse={selectedModalWarehouse}
        setSelectedModalWarehouse={setSelectedModalWarehouse}
        masterLocations={masterLocations}
      />

      {/* Quick View Modal */}
      <ProductQuickViewModal
        selectedQuickViewProduct={selectedQuickViewProduct}
        onClose={() => setSelectedQuickViewProduct(null)}
      />
    </div>
  );
};

export default ProductList;
