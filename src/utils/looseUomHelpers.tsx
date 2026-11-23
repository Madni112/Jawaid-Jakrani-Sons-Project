import React from 'react';

export interface LooseTierItem {
  id?: string;
  uom: string;
  ratio: number | string;
  costPrice?: number | string;
  salePrice?: number | string;
}

/**
 * Generates a clean text string describing the loose chain hierarchy.
 * E.g., "1 PCS = 100 LTR = 100,000 ML"
 */
export const getLooseChainSummary = (
  baseUom?: string,
  primaryLooseUom?: string,
  primaryRatio?: number | string,
  multiTiers?: LooseTierItem[]
): string => {
  const base = String(baseUom || 'Unit').trim().toUpperCase();
  const loose1 = String(primaryLooseUom || '').trim().toUpperCase();
  const ratio1 = Number(primaryRatio) || 0;

  if (!loose1 || ratio1 <= 0) return '';

  const parts: string[] = [`1 ${base} = ${ratio1.toLocaleString()} ${loose1}`];

  if (Array.isArray(multiTiers) && multiTiers.length > 0) {
    let accumulatedRatio = ratio1;
    multiTiers.forEach(t => {
      const tierUom = String(t.uom || '').trim().toUpperCase();
      const tierRatio = Number(t.ratio) || 0;
      if (tierUom && tierRatio > 0) {
        accumulatedRatio = accumulatedRatio * tierRatio;
        parts.push(`${accumulatedRatio.toLocaleString()} ${tierUom}`);
      }
    });
  }

  return parts.join(' = ');
};

/**
 * Formats line item compound quantities for printing.
 * E.g., if tier_quantities is { PCS: 1, LTR: 25 }, returns "1 PCS + 25 LTR"
 */
export const formatCompoundQtyForPrint = (
  baseQty: number | string,
  baseUom: string,
  tierQuantities?: Record<string, number | string>
): string => {
  if (tierQuantities && typeof tierQuantities === 'object') {
    const parts: string[] = [];
    Object.entries(tierQuantities).forEach(([uom, q]) => {
      const num = Number(q) || 0;
      if (num > 0) {
        parts.push(`${num} ${uom.toUpperCase()}`);
      }
    });
    if (parts.length > 0) {
      return parts.join(' + ');
    }
  }
  return `${baseQty || 0} ${baseUom || 'PCS'}`;
};
export const getProductLooseChainText = (product: any): string => {
  if (!product) return '';
  const allowLoose = product.allow_loose_sales || product.allow_loose || false;
  const multiTiers: LooseTierItem[] = product.multi_loose_units || product.looseTiers || [];

  if (!allowLoose && (!Array.isArray(multiTiers) || multiTiers.length === 0)) {
    return '';
  }

  const baseUom = product.uom || product.unit || 'PCS';
  const looseUom = product.loose_uom || product.looseUom || (multiTiers[0]?.uom || '');
  const looseRatio = product.loose_conversion_ratio || product.looseConversionRatio || (multiTiers[0]?.ratio || 1);

  // If multiTiers already includes tier 1, pass the rest
  const remainingTiers = multiTiers.filter(t => t.uom && t.uom.toUpperCase() !== looseUom.toUpperCase());

  return getLooseChainSummary(baseUom, looseUom, looseRatio, remainingTiers.length > 0 ? remainingTiers : multiTiers.slice(1));
};

interface LooseChainBadgeProps {
  product?: any;
  chainText?: string;
  className?: string;
}

/**
 * Subtle, high-visibility UI badge showing product loose hierarchy
 */
export const enrichProductsWithCachedLoose = <T extends any>(products: T[]): T[] => {
  if (!Array.isArray(products) || products.length === 0) return products;
  try {
    const raw = localStorage.getItem('jj_multi_loose_units');
    if (!raw) return products;
    const multiMap = JSON.parse(raw);
    if (!multiMap || typeof multiMap !== 'object' || Object.keys(multiMap).length === 0) return products;

    return products.map((p: any) => {
      if (!p) return p;
      const cached =
        (p.id && multiMap[p.id]) ||
        (p.item_sr_no && multiMap[p.item_sr_no]) ||
        (p.product_name && multiMap[p.product_name]) ||
        (p.product_name && multiMap[String(p.product_name).trim()]);

      if (Array.isArray(cached) && cached.length > 0) {
        return {
          ...p,
          allow_loose_sales: true,
          multi_loose_units: cached,
          loose_uom: p.loose_uom || cached[0]?.uom,
          loose_conversion_ratio: p.loose_conversion_ratio || cached[0]?.ratio,
          loose_sale_price: p.loose_sale_price || cached[0]?.salePrice,
          loose_purchase_price: p.loose_purchase_price || cached[0]?.costPrice,
        };
      }
      return p;
    });
  } catch {
    return products;
  }
};

export const LooseChainBadge: React.FC<LooseChainBadgeProps> = ({
  product,
  chainText,
  className = ''
}) => {
  const text = chainText || (product ? getProductLooseChainText(product) : '');

  if (!text) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold tracking-tight select-none shadow-2xs ${className}`}
      title="Pack breakdown: Loose Units Chain"
    >
      <span className="text-emerald-600 dark:text-emerald-400">🔗</span>
      <span>{text}</span>
    </div>
  );
};

export default LooseChainBadge;
