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

export interface ChainedStockPart {
  uom: string;
  qty: number;
  isBase: boolean;
}

/**
 * Decomposes a fractional base stock value (e.g. 2.45 DRUMS) into its exact chained parts:
 * e.g. 2 DRUM + 45 LTR + 0 ML
 */
export const decomposeStockIntoChain = (
  baseQty: number,
  baseUom: string,
  product: any
): { parts: ChainedStockPart[]; formattedText: string; hasLoose: boolean } => {
  const bUom = String(baseUom || product?.uom || 'Unit').trim().toUpperCase();
  const isNegative = baseQty < 0;
  let remainingBase = Math.abs(Number(baseQty) || 0);

  const multiTiers: LooseTierItem[] =
    product?.multi_loose_units || product?.looseTiers || [];
  const primaryLooseUom = String(
    product?.loose_uom || product?.looseUom || multiTiers[0]?.uom || ''
  )
    .trim()
    .toUpperCase();
  const primaryRatio = Number(
    product?.loose_conversion_ratio ||
      product?.looseConversionRatio ||
      multiTiers[0]?.ratio ||
      0
  );

  // If no loose configuration, return single base unit
  if (!primaryLooseUom || primaryRatio <= 0) {
    return {
      parts: [{ uom: bUom, qty: baseQty, isBase: true }],
      formattedText: `${baseQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${bUom}`,
      hasLoose: false,
    };
  }

  // Build the list of step tiers: Tier 1 (Base -> Loose1), Tier 2 (Loose1 -> Loose2), etc.
  interface TierStep {
    uom: string;
    stepRatio: number; // Ratio of this unit per 1 of the immediate previous unit
  }

  const steps: TierStep[] = [
    { uom: primaryLooseUom, stepRatio: primaryRatio },
  ];

  if (Array.isArray(multiTiers) && multiTiers.length > 0) {
    multiTiers.forEach(t => {
      const u = String(t.uom || '').trim().toUpperCase();
      const r = Number(t.ratio) || 0;
      if (u && r > 0 && u !== primaryLooseUom && !steps.some(s => s.uom === u)) {
        steps.push({ uom: u, stepRatio: r });
      }
    });
  }

  // Calculate smallest unit multiplier: e.g. 1 Base = 100 LTR = 100,000 ML -> totalSmallestPerBase = 100,000
  let totalSmallestPerBase = 1;
  steps.forEach(s => {
    totalSmallestPerBase *= s.stepRatio;
  });

  // Convert entire base quantity into smallest integer units to prevent floating point inaccuracies
  let smallestUnits = Math.round(remainingBase * totalSmallestPerBase);

  // Now decompose from highest (base) to lowest unit
  const resultParts: ChainedStockPart[] = [];

  // 1. Base unit
  const wholeBase = Math.floor(smallestUnits / totalSmallestPerBase);
  resultParts.push({ uom: bUom, qty: isNegative ? -wholeBase : wholeBase, isBase: true });
  smallestUnits %= totalSmallestPerBase;

  // 2. Intermediate tiers
  let currentUnitMultiplier = totalSmallestPerBase;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    currentUnitMultiplier /= step.stepRatio;

    if (i === steps.length - 1) {
      // Smallest unit gets whatever remainder is left
      if (smallestUnits > 0 || wholeBase === 0) {
        resultParts.push({ uom: step.uom, qty: smallestUnits, isBase: false });
      }
    } else {
      const count = Math.floor(smallestUnits / currentUnitMultiplier);
      if (count > 0 || smallestUnits > 0) {
        resultParts.push({ uom: step.uom, qty: count, isBase: false });
      }
      smallestUnits %= currentUnitMultiplier;
    }
  }

  // Filter out zero intermediate parts unless everything is 0
  const activeParts = resultParts.filter(
    (p, idx) => idx === 0 || p.qty > 0
  );

  const textComponents = activeParts.map((p, idx) => {
    const prefix = idx > 0 ? '+ ' : '';
    return `${prefix}${p.qty.toLocaleString()} ${p.uom}`;
  });

  return {
    parts: activeParts,
    formattedText: textComponents.join(' '),
    hasLoose: true,
  };
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
  return products;
};

export const LooseChainBadge: React.FC<LooseChainBadgeProps> = ({
  product,
  chainText,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const text = chainText || (product ? getProductLooseChainText(product) : '');

  if (!text) return null;

  // Split chain parts: e.g. ["1 PCS", "100 LTR", "100,000 ML", "100,000,000 .ML"]
  const parts = text.split(' = ').map(s => s.trim()).filter(Boolean);
  const hasMultipleTiers = parts.length > 2;
  
  // Compact preview summary: e.g. "1 PCS = 100 LTR (+2 sub-units)"
  const firstTier = parts.slice(0, 2).join(' = ');
  const remainingCount = parts.length - 2;

  return (
    <div
      onClick={(e) => {
        if (hasMultipleTiers) {
          e.stopPropagation();
          setIsExpanded(prev => !prev);
        }
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/20 border border-primary/25 dark:border-primary/40 text-primary text-[10px] font-mono font-bold tracking-tight select-none shadow-2xs transition-all no-underline w-max ${
        isExpanded ? 'whitespace-normal max-w-[320px]' : 'whitespace-nowrap'
      } ${
        hasMultipleTiers ? 'cursor-pointer hover:bg-primary/15 dark:hover:bg-primary/30 hover:border-primary/40' : ''
      } ${className}`}
      title={hasMultipleTiers ? (isExpanded ? 'Click to collapse units' : 'Click to expand all cascading units') : `Loose Hierarchy: ${text}`}
    >
      <span className="text-[9px] text-primary font-sans shrink-0">🔗</span>
      
      {isExpanded || !hasMultipleTiers ? (
        <span className={isExpanded ? 'leading-snug text-[10px]' : 'whitespace-nowrap leading-none text-[10px]'}>
          {text}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 whitespace-nowrap leading-none text-[10px]">
          <span className="whitespace-nowrap">{firstTier}</span>
          <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-primary/15 dark:bg-primary/30 text-primary whitespace-nowrap leading-none">
            +{remainingCount} more
          </span>
        </span>
      )}

      {hasMultipleTiers && (
        <span
          className={`text-[8px] text-primary shrink-0 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      )}
    </div>
  );
};

/**
 * Checks whether a given product belongs to Tiles category or packaging
 */
export const isTileProductItem = (p: any): boolean => {
  if (!p) return false;
  if (p.isTileItem) return true;
  const parent = String(p.sub_sub_category || p.parent_category || p.parentCat || '').toLowerCase().trim();
  if (parent.includes('tile')) return true;
  const cat = String(p.category || '').toLowerCase().trim();
  if (cat.includes('tile')) return true;
  const subCat = String(p.sub_category || p.subCategory || '').toLowerCase().trim();
  if (subCat.includes('tile')) return true;
  const name = String(p.product_name || p.itemName || p.name || '').toLowerCase().trim();
  if (name.includes('tile')) return true;
  return false;
};

/**
 * Checks whether a catalog product list contains any tile products
 */
export const catalogHasTileProducts = (productList: any[] = []): boolean => {
  if (!Array.isArray(productList) || productList.length === 0) return false;
  return productList.some(p => isTileProductItem(p));
};

export default LooseChainBadge;
