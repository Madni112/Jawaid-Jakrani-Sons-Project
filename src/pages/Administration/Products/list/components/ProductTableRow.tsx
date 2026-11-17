import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdWarning } from 'react-icons/md';
import TableActions from '../../../../../ui/TableActions';
import { ProductCatalogItem } from '../types/productListTypes';

interface ProductTableRowProps {
  product: ProductCatalogItem;
  serialNumber: number;
  onOpenBreakdown: (p: ProductCatalogItem) => void;
  onOpenQuickView: (p: ProductCatalogItem) => void;
  onDeleteProduct: (id: string | number) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  serialNumber,
  onOpenBreakdown,
  onOpenQuickView,
  onDeleteProduct,
}) => {
  const navigate = useNavigate();

  const currentStock = Number(product.current_stock || 0);
  const minAlert = Number(product.min_stock_alert ?? product.min_stock ?? 0);
  const isZeroStock = currentStock <= 0;
  const isLowStock = minAlert > 0 && currentStock <= minAlert && !isZeroStock;

  const isBoxItem =
    String(product.uom || '').toLowerCase().includes('box') ||
    String(product.category || '').toLowerCase().includes('tile') ||
    String(product.scenario_name || '').toLowerCase().includes('tile');

  const rawPcs = Number(
    product.loose_conversion_ratio ||
      product.pieces_per_box ||
      product.pcs_per_box ||
      product.pieces_per_packing ||
      0
  );
  const pcsPerBox = rawPcs > 1 ? rawPcs : isBoxItem ? 4 : 1;
  const hasLooseConversion = isBoxItem && pcsPerBox > 1;

  const isNegative = currentStock < 0;
  const absStock = Math.abs(currentStock);
  let tileBoxes = 0;
  let tileLoosePcs = 0;
  if (hasLooseConversion) {
    const totalPieces = Math.round(absStock * pcsPerBox);
    tileBoxes = Math.floor(totalPieces / pcsPerBox);
    tileLoosePcs = totalPieces % pcsPerBox;
  }

  let badgeClass =
    'bg-green-500/15 text-green-600 dark:bg-green-950/40 dark:text-green-400 border border-green-500/30';
  if (isZeroStock) {
    badgeClass =
      'bg-red-600/20 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-600/40 font-black';
  } else if (isLowStock) {
    badgeClass =
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold';
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 duration-150 text-xs">
      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{serialNumber}</td>
      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
        {product.item_sr_no || '-'}
      </td>
      <td
        className="py-3.5 px-4 font-bold text-slate-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors cursor-pointer hover:underline"
        onClick={() => onOpenQuickView(product)}
      >
        {product.product_name}
      </td>
      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{product.category || '-'}</td>
      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{product.sub_category || '-'}</td>
      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500 text-[11px]">
        {product.sub_sub_category || '-'}
      </td>
      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{product.bin || '-'}</td>
      <td className="py-3.5 px-4 text-center">
        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
          {product.uom}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
        {Number(product.retail_price || product.mrp || 0).toFixed(2)}
      </td>
      <td className="py-3.5 px-4 text-center">
        <div className="inline-flex flex-col items-center">
          <span
            className={`font-black text-xs px-2.5 py-1 ${
              hasLooseConversion && tileLoosePcs > 0 ? 'rounded-xl' : 'rounded-full'
            } inline-flex items-center gap-1 ${badgeClass}`}
          >
            {hasLooseConversion ? (
              <span className="flex flex-col items-center leading-tight">
                {tileBoxes === 0 && tileLoosePcs > 0 ? (
                  <span>
                    {isNegative ? '-' : ''}
                    {tileLoosePcs} pcs
                  </span>
                ) : (
                  <>
                    <span>
                      {isNegative ? '-' : ''}
                      {tileBoxes.toLocaleString()} {tileBoxes === 1 ? 'Box' : 'Boxes'}
                    </span>
                    {tileLoosePcs > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {isNegative ? '-' : '+'} {tileLoosePcs} pcs
                      </span>
                    )}
                  </>
                )}
              </span>
            ) : (
              <span>
                {currentStock.toLocaleString()} {product.uom || 'PCS'}
              </span>
            )}
            {isLowStock && <MdWarning size={14} className="text-amber-600 dark:text-amber-400 inline shrink-0" />}
          </span>
          <button
            onClick={() => onOpenBreakdown(product)}
            className="text-[9px] font-sans text-green-600 dark:text-green-400 hover:underline cursor-pointer block mx-auto mt-0.5"
          >
            View Breakdown
          </button>
        </div>
      </td>
      <td className="py-3.5 px-4 text-center">
        <TableActions
          onEdit={() => navigate('/Administration/Products/Add', { state: { product } })}
          onDelete={() => onDeleteProduct(product.id)}
          editTitle="Edit Product"
          deleteTitle="Delete Product"
        />
      </td>
    </tr>
  );
};
