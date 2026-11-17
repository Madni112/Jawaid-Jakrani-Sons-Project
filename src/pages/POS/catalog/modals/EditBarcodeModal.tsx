import React from 'react';
import { createPortal } from 'react-dom';
import Barcode from 'react-barcode';
import { LuScan, LuSparkles, LuLock, LuSave, LuX } from 'react-icons/lu';
import { posService, PosProductItem } from '../../../../service/posService';

export interface EditBarcodeModalProps {
  item: PosProductItem | null;
  onClose: () => void;
  customBarcodeVal: string;
  setCustomBarcodeVal: (val: string) => void;
  customBarcodeLock: boolean;
  setCustomBarcodeLock: (lock: boolean) => void;
  onSave: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const EditBarcodeModal: React.FC<EditBarcodeModalProps> = ({
  item,
  onClose,
  customBarcodeVal,
  setCustomBarcodeVal,
  customBarcodeLock,
  setCustomBarcodeLock,
  onSave,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!item) return null;

  return createPortal(
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <LuScan className="text-primary" />
                  <span>Custom Barcode & Scanner Setup</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Product: <strong className="text-slate-800 dark:text-slate-200">{item.product_name}</strong>
                  {item.item_sr_no && <span className="ml-1 font-mono text-[10px]">({item.item_sr_no})</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <LuX size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Barcode / Tag Code:
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomBarcodeVal(posService.generateUniqueBarcode(item))}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LuSparkles size={11} />
                    <span>Generate Unique</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={customBarcodeVal}
                    onChange={(e) => setCustomBarcodeVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSave();
                      }
                    }}
                    placeholder="Scan with barcode gun or type custom code..."
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary pl-9"
                  />
                  <LuScan className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tip: Connect your USB / Bluetooth handheld barcode scanner and scan directly into this field.
                </p>
              </div>

              {/* Live Barcode Graphic Preview */}
              {customBarcodeVal.trim() && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Live Barcode Preview
                  </span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs max-w-full overflow-hidden flex justify-center">
                    <Barcode
                      value={customBarcodeVal.trim()}
                      format="CODE128"
                      width={1.6}
                      height={40}
                      fontSize={11}
                      margin={0}
                    />
                  </div>
                </div>
              )}

              {/* Lock Barcode Option */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customBarcodeLock}
                  onChange={(e) => setCustomBarcodeLock(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <LuLock size={12} className="text-amber-500" />
                    <span>Lock Barcode</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Prevents accidental re-generation or overrides during quick store operations. Can be unlocked anytime using the unlock button.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText,
                  border: isAccentWhite ? '1px solid #cbd5e1' : undefined
                }}
              >
                <LuSave size={15} />
                <span>Save Barcode</span>
              </button>
            </div>
          </div>
        </div>,
    document.body
  );
};

export default EditBarcodeModal;
