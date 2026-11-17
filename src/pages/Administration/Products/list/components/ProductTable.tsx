import React from 'react';
import Spinner from '../../../../../ui/Spinner';
import { ProductCatalogItem, SortConfig } from '../types/productListTypes';
import { ProductTableRow } from './ProductTableRow';

interface ProductTableProps {
  loading: boolean;
  paginatedProducts: ProductCatalogItem[];
  startIndex: number;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onOpenBreakdown: (p: ProductCatalogItem) => void;
  onOpenQuickView: (p: ProductCatalogItem) => void;
  onDeleteProduct: (id: string | number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  loading,
  paginatedProducts,
  startIndex,
  sortConfig,
  onSort,
  onOpenBreakdown,
  onOpenQuickView,
  onDeleteProduct,
}) => {
  const isTileProduct = (p: ProductCatalogItem) => {
    const parent = String(p.sub_sub_category || '').trim().toLowerCase();
    if (parent) {
      return parent.includes('tile');
    }
    const cat = String(p.category || '').trim().toLowerCase();
    const sub = String(p.sub_category || '').trim().toLowerCase();
    const scn = String(p.scenario_name || '').trim().toLowerCase();
    return cat.includes('tile') || sub.includes('tile') || scn.includes('tile');
  };

  const tileItems = paginatedProducts.filter((p) => isTileProduct(p) && p.item_type !== 'service');
  const goodsItems = paginatedProducts.filter((p) => !isTileProduct(p) && (p.item_type || 'goods') === 'goods');
  const serviceItems = paginatedProducts.filter((p) => p.item_type === 'service');

  const renderSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) return <span className="opacity-0">↑</span>;
    return <span>{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="max-w-full overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <th className="py-3.5 px-4 w-16 whitespace-nowrap">S#</th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('item_sr_no')}
            >
              Code {renderSortIndicator('item_sr_no')}
            </th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('product_name')}
            >
              Description {renderSortIndicator('product_name')}
            </th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('category')}
            >
              Category {renderSortIndicator('category')}
            </th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('sub_category')}
            >
              Sub Cat {renderSortIndicator('sub_category')}
            </th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('sub_sub_category')}
            >
              Parent Cat {renderSortIndicator('sub_sub_category')}
            </th>
            <th className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap" onClick={() => onSort('bin')}>
              Brand {renderSortIndicator('bin')}
            </th>
            <th
              className="py-3.5 px-4 w-24 text-center cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('uom')}
            >
              UOM {renderSortIndicator('uom')}
            </th>
            <th
              className="py-3.5 px-4 text-right cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('retail_price')}
            >
              Sale Price {renderSortIndicator('retail_price')}
            </th>
            <th
              className="py-3.5 px-4 text-center w-36 cursor-pointer select-none whitespace-nowrap"
              onClick={() => onSort('current_stock')}
            >
              Available Stock {renderSortIndicator('current_stock')}
            </th>
            <th className="py-3.5 px-4 w-24 text-center whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={11} className="text-center py-12 text-sm">
                <Spinner />
              </td>
            </tr>
          ) : paginatedProducts.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-12 text-xs text-slate-400 italic">
                No product items registered.
              </td>
            </tr>
          ) : (
            <>
              {tileItems.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={11}
                      className="py-2 px-4 bg-amber-50 dark:bg-amber-950/30 border-y border-amber-200/60 dark:border-amber-900/60"
                    >
                      <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        🏛️ Tiles Items <span className="font-normal opacity-60">({tileItems.length})</span>
                      </span>
                    </td>
                  </tr>
                  {tileItems.map((product, idx) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      serialNumber={startIndex + idx + 1}
                      onOpenBreakdown={onOpenBreakdown}
                      onOpenQuickView={onOpenQuickView}
                      onDeleteProduct={onDeleteProduct}
                    />
                  ))}
                </>
              )}
              {goodsItems.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={11}
                      className="py-2 px-4 bg-emerald-50 dark:bg-emerald-950/30 border-y border-emerald-200/60 dark:border-emerald-900/60"
                    >
                      <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        📦 Goods Items <span className="font-normal opacity-60">({goodsItems.length})</span>
                      </span>
                    </td>
                  </tr>
                  {goodsItems.map((product, idx) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      serialNumber={startIndex + tileItems.length + idx + 1}
                      onOpenBreakdown={onOpenBreakdown}
                      onOpenQuickView={onOpenQuickView}
                      onDeleteProduct={onDeleteProduct}
                    />
                  ))}
                </>
              )}
              {serviceItems.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={11}
                      className="py-2 px-4 bg-indigo-50 dark:bg-indigo-950/30 border-y border-indigo-200/60 dark:border-indigo-900/60"
                    >
                      <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        🛠️ Service Items <span className="font-normal opacity-60">({serviceItems.length})</span>
                      </span>
                    </td>
                  </tr>
                  {serviceItems.map((product, idx) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      serialNumber={startIndex + tileItems.length + goodsItems.length + idx + 1}
                      onOpenBreakdown={onOpenBreakdown}
                      onOpenQuickView={onOpenQuickView}
                      onDeleteProduct={onDeleteProduct}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};
