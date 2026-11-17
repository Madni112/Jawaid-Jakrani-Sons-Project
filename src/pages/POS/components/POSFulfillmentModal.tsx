import React from 'react';
import {
  LuShoppingBag,
  LuPackage,
  LuTruck,
  LuX,
  LuCheck,
} from 'react-icons/lu';

interface POSFulfillmentModalProps {
  isOpen: boolean;
  fulfillmentType: string;
  onSelectFulfillment: (type: string) => void;
  onClose: () => void;
}

export const POSFulfillmentModal: React.FC<POSFulfillmentModalProps> = ({
  isOpen,
  fulfillmentType,
  onSelectFulfillment,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LuShoppingBag size={24} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                Select Packaging & Handover Mode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose how this order will be handed over to the customer. Press <kbd className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">1</kbd>, <kbd className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">2</kbd>, or <kbd className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">3</kbd> to quick-select.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close (Esc) - Remains unselected"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Modal Body: 3 Interactive Option Cards HORIZONTALLY */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: In-Store Bag */}
          <button
            type="button"
            onClick={() => onSelectFulfillment('In-Store Bag')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
              fulfillmentType === 'In-Store Bag'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-emerald-500/60 hover:bg-emerald-500/5'
            }`}
          >
            {/* Top Row: Hotkey Tag & Active Indicator */}
            <div className="flex items-center justify-between w-full mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Key</span> [ 1 ]
              </span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  fulfillmentType === 'In-Store Bag'
                    ? 'border-emerald-500 bg-emerald-500 text-white scale-110 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 group-hover:border-emerald-400'
                }`}
              >
                {fulfillmentType === 'In-Store Bag' && <LuCheck size={14} className="stroke-[3]" />}
              </div>
            </div>

            {/* Center Icon */}
            <div className="my-2">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 ${
                  fulfillmentType === 'In-Store Bag'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                }`}
              >
                <LuShoppingBag size={28} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  In-Store Bag
                </h4>
                {fulfillmentType === 'In-Store Bag' && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Boutique shopping bag handed over immediately to walk-in customer.
              </p>
            </div>

            {/* Bottom Action Hint */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
              <span className={fulfillmentType === 'In-Store Bag' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}>
                {fulfillmentType === 'In-Store Bag' ? '✓ Currently Selected' : 'Press 1 or Click'}
              </span>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* Option 2: Takeaway / Shop Pickup */}
          <button
            type="button"
            onClick={() => onSelectFulfillment('Takeaway')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
              fulfillmentType === 'Takeaway'
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-amber-500/60 hover:bg-amber-500/5'
            }`}
          >
            {/* Top Row: Hotkey Tag & Active Indicator */}
            <div className="flex items-center justify-between w-full mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Key</span> [ 2 ]
              </span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  fulfillmentType === 'Takeaway'
                    ? 'border-amber-500 bg-amber-500 text-white scale-110 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 group-hover:border-amber-400'
                }`}
              >
                {fulfillmentType === 'Takeaway' && <LuCheck size={14} className="stroke-[3]" />}
              </div>
            </div>

            {/* Center Icon */}
            <div className="my-2">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 ${
                  fulfillmentType === 'Takeaway'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                }`}
              >
                <LuPackage size={28} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Takeaway / Pickup
                </h4>
                {fulfillmentType === 'Takeaway' && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Packed parcel or boxed suit reserved for customer pickup or takeaway.
              </p>
            </div>

            {/* Bottom Action Hint */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
              <span className={fulfillmentType === 'Takeaway' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-500 transition-colors'}>
                {fulfillmentType === 'Takeaway' ? '✓ Currently Selected' : 'Press 2 or Click'}
              </span>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* Option 3: Delivery / Courier */}
          <button
            type="button"
            onClick={() => onSelectFulfillment('Delivery')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
              fulfillmentType === 'Delivery'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-primary/60 hover:bg-primary/5'
            }`}
          >
            {/* Top Row: Hotkey Tag & Active Indicator */}
            <div className="flex items-center justify-between w-full mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-primary/15 text-primary dark:text-primary-light border border-primary/30 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Key</span> [ 3 ]
              </span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  fulfillmentType === 'Delivery'
                    ? 'border-primary bg-primary text-white scale-110 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 group-hover:border-primary/60'
                }`}
              >
                {fulfillmentType === 'Delivery' && <LuCheck size={14} className="stroke-[3]" />}
              </div>
            </div>

            {/* Center Icon */}
            <div className="my-2">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 ${
                  fulfillmentType === 'Delivery'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                }`}
              >
                <LuTruck size={28} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Delivery / Courier
                </h4>
                {fulfillmentType === 'Delivery' && (
                  <span className="text-[10px] font-bold text-primary dark:text-primary-light bg-primary/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Dispatched by rider, bike delivery, or courier service with tracking details.
              </p>
            </div>

            {/* Bottom Action Hint */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
              <span className={fulfillmentType === 'Delivery' ? 'text-primary dark:text-primary-light' : 'text-slate-400 group-hover:text-primary transition-colors'}>
                {fulfillmentType === 'Delivery' ? '✓ Currently Selected' : 'Press 3 or Click'}
              </span>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c1017] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">Keyboard Hotkeys:</span>
            <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400">[1] Bag</span>
            <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-amber-600 dark:text-amber-400">[2] Takeaway</span>
            <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-primary">[3] Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            {fulfillmentType && (
              <button
                type="button"
                onClick={() => onSelectFulfillment('')}
                className="px-3 py-1.5 rounded-xl font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                title="Clear current packaging mode back to Unselected"
              >
                Clear (Unselected)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              Close (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
