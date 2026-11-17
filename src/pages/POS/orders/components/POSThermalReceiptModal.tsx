import React from 'react';
import Barcode from 'react-barcode';
import { LuPrinter, LuX } from 'react-icons/lu';
import { PosOrder, PosSettings } from '../../../../service/posService';

interface POSThermalReceiptModalProps {
  order: PosOrder;
  posConfig: PosSettings;
  receiptSize: '80mm' | '58mm';
  setReceiptSize: (size: '80mm' | '58mm') => void;
  onClose: () => void;
}

export const POSThermalReceiptModal: React.FC<POSThermalReceiptModalProps> = ({
  order,
  posConfig,
  receiptSize,
  setReceiptSize,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Actions */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReceiptSize('80mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                receiptSize === '80mm'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              80mm Standard
            </button>
            <button
              type="button"
              onClick={() => setReceiptSize('58mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                receiptSize === '58mm'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              58mm Compact
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <LuPrinter size={13} />
              <span>Reprint</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
            >
              <LuX size={18} />
            </button>
          </div>
        </div>

        {/* Thermal Slip Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-200 dark:bg-slate-900 flex justify-center">
          <div
            className={`bg-white text-black p-5 shadow-lg font-mono text-xs rounded-sm transition-all duration-200 ${
              receiptSize === '80mm' ? 'w-[320px]' : 'w-[240px]'
            }`}
          >
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">
                {posConfig.store_title}
              </h3>
              <p className="text-[10px] leading-tight text-slate-700">{posConfig.store_address}</p>
              <p className="text-[10px] text-slate-700">Phone: {posConfig.store_phone}</p>
              <p className="text-[10px] font-bold text-slate-800">TAX / NTN: {posConfig.tax_id}</p>
            </div>

            {/* Ticket Meta */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Ticket #:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>
                  {new Date(order.created_at).toLocaleDateString()}{' '}
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{order.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{order.customer_name}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold pb-1 border-b border-dotted border-black/40">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Rate</span>
                <span className="w-1/4 text-right">Total</span>
              </div>

              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className="w-1/2 truncate font-semibold" title={it.product_name}>
                    <span className="font-bold">{it.quantity} × </span>
                    {it.product_name}
                  </span>
                  <span className="w-1/4 text-center font-mono">{it.unit_price.toLocaleString()}</span>
                  <span className="w-1/4 text-right font-bold font-mono">
                    {it.line_total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({order.discount_percentage}%):</span>
                  <span className="font-mono">- Rs. {order.discount_amount.toLocaleString()}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({order.tax_percentage}%):</span>
                  <span className="font-mono">+ Rs. {order.tax_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-dotted border-black">
                <span>TOTAL:</span>
                <span className="font-mono">Rs. {order.total_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Tender & Change */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Tendered ({order.payment_method}):</span>
                <span className="font-mono">Rs. {order.cash_tendered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change Due:</span>
                <span className="font-mono">Rs. {order.change_due.toLocaleString()}</span>
              </div>
            </div>

            {/* Barcode & Footer Disclaimer */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                <Barcode
                  value={order.order_number}
                  width={1.2}
                  height={35}
                  fontSize={10}
                  margin={0}
                />
              </div>
              <p className="text-[9px] leading-tight text-slate-600">
                {posConfig.footer_message}
              </p>
              <p className="text-[8px] text-slate-400 font-medium">
                {posConfig.software_credit || 'Software Developed by: NHT ENTERPRISES - +92 312 8039911'}
              </p>
              <p className="text-[7.5px] text-slate-400">Reprinted Copy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
