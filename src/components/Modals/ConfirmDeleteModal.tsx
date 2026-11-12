import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';

export interface ConfirmDetailItem {
  label: string;
  value: React.ReactNode;
}

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  itemName?: string;
  itemType?: string;
  details?: ConfirmDetailItem[];
  warning?: string;
  confirmButtonText?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  accentVariant?: 'danger' | 'warning';
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Delete Confirmation',
  subtitle,
  itemName,
  itemType,
  details = [],
  warning,
  confirmButtonText = 'Confirm Delete',
  isDeleting = false,
  onConfirm,
  onCancel,
  accentVariant = 'danger',
}) => {
  if (!isOpen) return null;

  const isWarning = accentVariant === 'warning';

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl max-w-md w-full border border-stroke dark:border-strokedark overflow-hidden transform transition-all text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className={`p-5 flex items-start gap-4 ${isWarning ? 'bg-amber-500/10 border-b border-amber-500/20' : 'bg-red-500/10 border-b border-red-500/20'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isWarning ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'}`}>
            <FiAlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-black dark:text-white">
              {title}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {subtitle || (itemType ? `Are you sure you want to permanently delete this ${itemType}?` : 'This action cannot be undone.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 disabled:opacity-40"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Body Card */}
        <div className="p-5 space-y-3">
          {(itemName || details.length > 0) && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark space-y-2">
              {itemName && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">{itemType ? `${itemType}:` : 'Target Item:'}</span>
                  <span className="font-mono font-bold text-primary">{itemName}</span>
                </div>
              )}
              {details.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">{d.label}:</span>
                  <span className="font-semibold text-black dark:text-white text-right truncate max-w-[240px]">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {warning && (
            <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
              isWarning 
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200' 
                : 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200'
            }`}>
              <strong>Notice:</strong> {warning}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-gray-50/70 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex justify-end gap-2.5">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-100 dark:hover:bg-meta-4 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5 text-white ${
              isWarning 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Deleting...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
