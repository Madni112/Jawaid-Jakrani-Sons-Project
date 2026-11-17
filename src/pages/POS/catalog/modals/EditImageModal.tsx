import React from 'react';
import { createPortal } from 'react-dom';
import { LuImage, LuUpload, LuSave, LuX } from 'react-icons/lu';

export interface EditImageModalProps {
  item: {
    id: string;
    type: 'product' | 'category';
    currentUrl?: string;
    name: string;
  } | null;
  onClose: () => void;
  imageUrlInput: string;
  setImageUrlInput: (url: string) => void;
  onSave: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const EditImageModal: React.FC<EditImageModalProps> = ({
  item,
  onClose,
  imageUrlInput,
  setImageUrlInput,
  onSave,
  fileInputRef,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileUpload,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!item) return null;

  return createPortal(
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LuImage className="text-primary" />
                <span>Update {item.type === 'product' ? 'Product' : 'Category'} Image</span>
              </h3>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Target Item Name */}
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Target: <span className="text-primary">{item.name}</span>
            </p>

            {/* Interactive Drag & Drop + Ctrl + V Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => { if (!imageUrlInput) fileInputRef.current?.click(); }}
              className={`relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-4 cursor-pointer group ${
                isDragging
                  ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg ring-4 ring-primary/20'
                  : imageUrlInput
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-900/5'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161D2B] hover:border-primary/60 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {imageUrlInput ? (
                <>
                  <img src={imageUrlInput} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-3 text-center">
                    <LuUpload size={24} className="animate-bounce" />
                    <span className="text-xs font-bold">Drag & drop or paste (Ctrl + V) to replace</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold backdrop-blur-xs transition"
                    >
                      Browse Device File
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrlInput('');
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition shadow-md cursor-pointer"
                    title="Clear image"
                  >
                    <LuX size={14} />
                  </button>
                </>
              ) : (
                <div className="text-center space-y-2 select-none">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                    <LuUpload size={22} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Drag & Drop image here
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      or press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">Ctrl + V</kbd> to paste
                    </p>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-primary underline">
                    or click to browse files
                  </span>
                </div>
              )}
            </div>

            {/* Image URL Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Image Web URL:
              </label>
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Or Upload From Computer */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Or Upload from Computer:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText,
                  border: isAccentWhite ? '1px solid #cbd5e1' : undefined
                }}
              >
                <LuSave size={14} />
                <span>Save Image</span>
              </button>
            </div>
          </div>
        </div>,
    document.body
  );
};

export default EditImageModal;
