import React from 'react';

interface QuotationActionToolbarProps {
  showDiscount: boolean;
  setShowDiscount: React.Dispatch<React.SetStateAction<boolean>>;
  showTileSection: boolean;
  setShowTileSection: React.Dispatch<React.SetStateAction<boolean>>;
  tileItemsCount: number;
  onAppendTileRow: () => void;
}

export const QuotationActionToolbar: React.FC<QuotationActionToolbarProps> = ({
  showDiscount,
  setShowDiscount,
  showTileSection,
  setShowTileSection,
  tileItemsCount,
  onAppendTileRow,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark rounded-2xl">
      <div className="flex items-center gap-3">
        {/* Discounts Pill Selector */}
        <button
          type="button"
          onClick={() => setShowDiscount(prev => !prev)}
          className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center gap-1.5 border shadow-2xs ${
            showDiscount
              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              : 'bg-white text-slate-600 border-stroke dark:bg-boxdark dark:text-slate-300 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
          }`}
        >
          <span>{showDiscount ? '✓ Discounts' : '+ Discounts'}</span>
        </button>

        {/* Tile Quotation Pill Selector */}
        <button
          type="button"
          onClick={() => {
            setShowTileSection(prev => {
              const next = !prev;
              if (next && tileItemsCount === 0) {
                onAppendTileRow();
              }
              return next;
            });
          }}
          className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center gap-1.5 border shadow-2xs ${
            showTileSection
              ? 'bg-[var(--color-primary,#800020)] text-white border-[var(--color-primary,#800020)]'
              : 'bg-white text-slate-700 border-stroke dark:bg-boxdark dark:text-slate-200 dark:border-strokedark hover:border-[var(--color-primary,#800020)]/50 hover:text-[var(--color-primary,#800020)]'
          }`}
        >
          <span>{showTileSection ? '✓ Tiles Enabled' : '+ Add Tile Quotation'}</span>
        </button>
      </div>
    </div>
  );
};
