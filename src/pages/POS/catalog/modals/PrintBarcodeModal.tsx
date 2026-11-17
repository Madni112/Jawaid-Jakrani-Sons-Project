import React from 'react';
import { createPortal } from 'react-dom';
import Barcode from 'react-barcode';
import { LuPrinter, LuX } from 'react-icons/lu';
import { IoBarcodeOutline } from 'react-icons/io5';
import { PosProductItem } from '../../../../service/posService';

export interface PrintBarcodeModalProps {
  product: PosProductItem | null;
  onClose: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const PrintBarcodeModal: React.FC<PrintBarcodeModalProps> = ({
  product,
  onClose,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!product || !product.barcode) return null;

  return createPortal(
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <IoBarcodeOutline className="text-primary" />
                <span>Barcode Thermal Sticker Preview</span>
              </h3>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Thermal Label Card */}
            <div className="bg-white text-black p-4 rounded-lg shadow-sm border border-slate-300 font-sans space-y-1 mx-auto max-w-[260px]">
              <span className="block text-[11px] font-extrabold uppercase tracking-tight truncate">
                {product.product_name}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">
                {product.item_sr_no || 'SKU'}
              </span>

              <div className="flex justify-center py-2">
                <Barcode
                  value={product.barcode}
                  width={1.4}
                  height={45}
                  fontSize={11}
                  margin={0}
                />
              </div>

              <div className="text-sm font-black font-mono pt-1 border-t border-dashed border-slate-300">
                Rs. {product.retail_price.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText,
                  border: isAccentWhite ? '1px solid #cbd5e1' : undefined
                }}
              >
                <LuPrinter size={14} />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>,
    document.body
  );
};

export default PrintBarcodeModal;
