import React from 'react';
import {
  LuUser,
  LuTruck,
  LuPackage,
  LuShoppingBag,
  LuArrowRightLeft,
  LuUnlock,
  LuLock,
  LuReceipt,
  LuMinus,
  LuPlus,
  LuTrash2,
  LuPauseCircle,
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { PosOrderItem } from '../../../service/posService';

interface POSCartDrawerProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  activeShift: any;
  ticketNumber: string;
  fulfillmentType: string;
  onOpenFulfillmentModal: () => void;
  onOpenDrawerModal: () => void;
  cartItems: PosOrderItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  subtotal: number;
  discountPercent: number;
  setDiscountPercent: (val: number) => void;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  onOpenPayment: () => void;
  onOpenHoldModal: () => void;
  onClearCart: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const POSCartDrawer: React.FC<POSCartDrawerProps> = ({
  customerName,
  setCustomerName,
  activeShift,
  ticketNumber,
  fulfillmentType,
  onOpenFulfillmentModal,
  onOpenDrawerModal,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  subtotal,
  discountPercent,
  setDiscountPercent,
  discountAmount,
  taxPercent,
  taxAmount,
  grandTotal,
  onOpenPayment,
  onOpenHoldModal,
  onClearCart,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  return (
    <aside className="w-80 lg:w-96 bg-white dark:bg-[#111622] border-l border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 shadow-sm z-10">
      {/* 1. Ticket Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 space-y-2.5">
        {/* Customer Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LuUser size={15} />
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none truncate flex-1"
            />
          </div>
        </div>

        {/* Order Meta: Order Number & Fulfillment Handover Pill */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Order:</span>
            {activeShift && ticketNumber ? (
              <span
                className="font-mono font-black text-[11px] text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[190px]"
                title={ticketNumber}
              >
                {ticketNumber}
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">
                Day Closed
              </span>
            )}
          </div>

          <div className="shrink-0 ml-auto">
            {activeShift ? (
              fulfillmentType ? (
                <button
                  type="button"
                  onClick={onOpenFulfillmentModal}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs hover:border-primary/60 bg-white dark:bg-[#161D2B] border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 group active:scale-95"
                  title="Click to change order handover mode"
                >
                  {fulfillmentType === 'Delivery' ? (
                    <span className="w-4 h-4 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <LuTruck size={11} />
                    </span>
                  ) : fulfillmentType === 'Takeaway' ? (
                    <span className="w-4 h-4 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <LuPackage size={11} />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <LuShoppingBag size={11} />
                    </span>
                  )}
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 truncate max-w-[80px]">
                    {fulfillmentType}
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary dark:text-primary-light bg-primary/10 px-1 py-0.5 rounded-md group-hover:bg-primary group-hover:text-white transition-colors">
                    <LuArrowRightLeft size={8} />
                    <span>Change</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenFulfillmentModal}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold border border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-150 cursor-pointer shadow-2xs group"
                  title="Packaging not selected. Click to choose handover mode."
                >
                  <LuShoppingBag size={12} className="text-amber-500 animate-bounce shrink-0" />
                  <span className="text-[11px]">Handover</span>
                  <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-md group-hover:scale-105 transition-transform shrink-0">
                    Unselected
                  </span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onOpenDrawerModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
              >
                <LuUnlock size={11} />
                <span>Open Day</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Scrollable Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {!activeShift ? (
          <div
            onClick={onOpenDrawerModal}
            className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl transition"
            title="Click to open the cash drawer and business day session"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <LuLock size={26} />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Day Session is Closed
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              No business date active. Please open the cash drawer to generate an Order ID and start taking sales.
            </p>
            <button
              type="button"
              onClick={onOpenDrawerModal}
              className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <LuUnlock size={13} />
              <span>Open Day Session</span>
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <LuReceipt size={26} />
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No items in order
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Tap products from the catalog or scan barcodes to begin sale.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product_id}
              className="rounded-xl p-2.5 bg-slate-50 dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between gap-2.5"
            >
              {/* Item Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                    {item.product_name.slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Title & Unit Price */}
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={item.product_name}>
                  {item.product_name}
                </h5>
                <span className="text-[11px] text-slate-400 font-mono">
                  Rs. {Number(item.unit_price || 0).toLocaleString()}
                </span>
              </div>

              {/* Stepper Buttons [- 1 +] */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#111622] rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.product_id, -1)}
                  className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-rose-500 transition cursor-pointer"
                >
                  <LuMinus size={11} />
                </button>
                <span className="w-6 text-center font-bold text-xs text-slate-800 dark:text-white font-mono">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.product_id, 1)}
                  className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition cursor-pointer"
                >
                  <LuPlus size={11} />
                </button>
              </div>

              {/* Line Total & Delete */}
              <div className="text-right shrink-0">
                <span className="block font-bold text-xs text-slate-900 dark:text-white font-mono">
                  Rs. {Number(item.line_total || 0).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.product_id)}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition cursor-pointer inline-flex items-center gap-0.5"
                >
                  <LuTrash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Ticket Calculations & Checkout Footer */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E131E] space-y-3">
        {/* Subtotal, Discount & Tax */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              Rs. {Number(subtotal || 0).toLocaleString()}
            </span>
          </div>

          {/* Discount Row */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span>Discount</span>
              <button
                type="button"
                onClick={() => {
                  const input = prompt('Enter discount percentage (0 - 50):', String(discountPercent));
                  if (input !== null) {
                    const val = Math.min(50, Math.max(0, Number(input) || 0));
                    setDiscountPercent(val);
                  }
                }}
                className="text-[10px] font-bold text-primary underline cursor-pointer"
              >
                ({discountPercent}% edit)
              </button>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              - Rs. {Number(discountAmount || 0).toLocaleString()}
            </span>
          </div>

          {/* Tax Row */}
          {taxPercent > 0 && (
            <div className="flex justify-between">
              <span>Tax ({taxPercent}%)</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                + Rs. {Number(taxAmount || 0).toLocaleString()}
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Total
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              Rs. {Number(grandTotal || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons: Hold, Clear & Place Order */}
        <div className="space-y-2">
          {!activeShift ? (
            <button
              type="button"
              onClick={onOpenDrawerModal}
              className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
            >
              <LuLock size={16} />
              <span>Please Open Drawer First</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={onOpenPayment}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-98"
              style={{
                backgroundColor: accentColor,
                color: contrastText,
                border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
              }}
            >
              <MdPointOfSale size={18} />
              <span>Place Order [F9] • Rs. {Number(grandTotal || 0).toLocaleString()}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={onOpenHoldModal}
              className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <LuPauseCircle size={14} />
              <span>Hold Order [F4]</span>
            </button>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={onClearCart}
              className="py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <LuTrash2 size={14} />
              <span>Clear Order</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
