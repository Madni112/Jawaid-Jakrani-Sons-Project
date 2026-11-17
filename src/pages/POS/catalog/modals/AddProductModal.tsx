import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  LuPlus,
  LuX,
  LuChevronDown,
  LuSearch,
  LuSparkles,
  LuUpload,
  LuCheck,
} from 'react-icons/lu';
import { IoBarcodeOutline } from 'react-icons/io5';
import { posService, PosCategoryItem } from '../../../../service/posService';
import { compressImageFile } from '../utils/imageCompressor';

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  categories: PosCategoryItem[];
  allCategoryNames: string[];
  rawDbCategories: { id: number | string; name: string; parent_id?: number | string | null }[];
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  categories,
  allCategoryNames,
  rawDbCategories,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  const [newProductName, setNewProductName] = useState<string>('');
  const [newItemCode, setNewItemCode] = useState<string>('');
  const [newParentCategory, setNewParentCategory] = useState<string>('Pure Cotton & Latha');
  const [newSubCategory, setNewSubCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Pure Cotton & Latha');
  const [newCustomCategory, setNewCustomCategory] = useState<string>('');
  const [newRetailPrice, setNewRetailPrice] = useState<number>(0);
  const [newUom, setNewUom] = useState<string>('PCS');

  const [categorySearch, setCategorySearch] = useState<string>('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [uomSearch, setUomSearch] = useState<string>('');
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState<boolean>(false);
  const [uomList, setUomList] = useState<string[]>([
    'PCS', 'MTR', 'YDS', 'SUIT', 'KG', 'BOX', 'SET', 'ROLL', 'PACK', 'DOZ', 'THÀN'
  ]);

  const [newBarcode, setNewBarcode] = useState<string>('');
  const [newLockBarcode, setNewLockBarcode] = useState<boolean>(true);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newShowInPos, setNewShowInPos] = useState<boolean>(true);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [isDraggingAdd, setIsDraggingAdd] = useState<boolean>(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const uomDropdownRef = useRef<HTMLDivElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (uomDropdownRef.current && !uomDropdownRef.current.contains(e.target as Node)) {
        setIsUomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return allCategoryNames;
    return allCategoryNames.filter((c) => c.toLowerCase().includes(q));
  }, [allCategoryNames, categorySearch]);

  const isExactCategoryMatch = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return true;
    return allCategoryNames.some((c) => c.toLowerCase() === q);
  }, [allCategoryNames, categorySearch]);

  const handleSelectCategory = (catName: string) => {
    setNewCategory(catName);
    setCategorySearch('');
    setIsCategoryDropdownOpen(false);
  };

  const handleAddNewCategory = async (nameToAdd?: string) => {
    const name = (nameToAdd || categorySearch).trim();
    if (!name) return;
    setNewCategory(name);
    setCategorySearch('');
    setIsCategoryDropdownOpen(false);

    try {
      await posService.createCategory(name);
    } catch (e) {
      console.warn('Error saving category to DB:', e);
    }
    toast.success(`Category "${name}" added!`);
  };

  const filteredUoms = useMemo(() => {
    const q = uomSearch.trim().toLowerCase();
    if (!q) return uomList;
    return uomList.filter((u) => u.toLowerCase().includes(q));
  }, [uomList, uomSearch]);

  const isExactUomMatch = useMemo(() => {
    const q = uomSearch.trim().toLowerCase();
    if (!q) return true;
    return uomList.some((u) => u.toLowerCase() === q);
  }, [uomList, uomSearch]);

  const handleSelectUom = (u: string) => {
    setNewUom(u);
    setUomSearch('');
    setIsUomDropdownOpen(false);
  };

  const handleAddCustomUom = () => {
    const custom = uomSearch.trim();
    if (!custom) return;
    setNewUom(custom);
    setUomList((prev) => (prev.includes(custom) ? prev : [...prev, custom]));
    setUomSearch('');
    setIsUomDropdownOpen(false);
  };

  const handleAddDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAdd(true);
  };
  const handleAddDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAdd(false);
  };
  const handleAddDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAdd(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be under 10MB');
        return;
      }
      try {
        const compressed = await compressImageFile(file);
        setNewImageUrl(compressed);
        toast.success('Image dropped successfully!');
      } catch {
        toast.error('Could not process image');
      }
    }
  };

  const handleAddModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      setNewImageUrl(compressed);
      toast.success('Photo uploaded & compressed!');
    } catch {
      toast.error('Error reading image file');
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (newRetailPrice < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    try {
      setIsSavingProduct(true);
      const parentCat = newParentCategory.trim() || newCategory.trim() || 'General';
      const subCat = newSubCategory.trim();
      const childCat =
        newCategory === '__CUSTOM__'
          ? newCustomCategory.trim() || 'General'
          : newCategory.trim() || parentCat;
      const sku = newItemCode.trim() || `SKU-${Date.now().toString().slice(-6)}`;
      const barcodeToSave =
        newBarcode.trim() || posService.generateUniqueBarcode({ id: sku, category: parentCat });

      const created = await posService.createProduct({
        product_name: newProductName.trim(),
        item_sr_no: sku,
        category: parentCat,
        sub_category: subCat,
        sub_sub_category: childCat,
        parent_category: parentCat,
        retail_price: newRetailPrice,
        uom: newUom,
        image_url: newImageUrl.trim() || undefined,
        barcode: barcodeToSave,
        barcode_locked: newLockBarcode,
        show_in_pos: newShowInPos,
      });

      toast.success(`Product "${created.product_name}" added to POS & product list!`);
      onClose();
      setNewProductName('');
      setNewItemCode('');
      setNewRetailPrice(0);
      setNewBarcode('');
      setNewImageUrl('');
      setNewCustomCategory('');
      onProductCreated();
      window.dispatchEvent(new Event('pos_catalog_updated'));
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Failed to create product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 shrink-0 bg-white dark:bg-[#111622]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <LuPlus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Add Product to POS & Master List
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Saves to the central database and immediately displays on the POS terminal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Product Name <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Pure Cotton Latha - Premium White"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* SKU Code & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Item Code / SKU:
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewItemCode(`SKU-${Date.now().toString().slice(-6)}`)}
                      className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="e.g. LTH-01"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Category Combobox (Searchable & Addable) */}
                <div className="space-y-1 relative" ref={categoryDropdownRef}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Category <span className="text-rose-500">*</span>:</span>
                    {newCategory && (
                      <span className="text-[10px] text-primary font-medium truncate max-w-[130px]">
                        {newCategory}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryDropdownOpen(prev => !prev);
                        setIsUomDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between gap-1 text-left"
                    >
                      <span className="truncate">{newCategory || 'Select or add category...'}</span>
                      <LuChevronDown className={`text-slate-400 text-sm transition-transform duration-200 flex-shrink-0 ${isCategoryDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute z-50 top-full mt-1.5 left-0 w-full min-w-[220px] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="relative flex items-center">
                            <LuSearch className="absolute left-2.5 text-slate-400 text-xs" />
                            <input
                              type="text"
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              placeholder="Search or add category..."
                              autoFocus
                              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleSelectCategory(cat)}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left flex items-center justify-between transition-colors ${
                                  newCategory === cat
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <span className="truncate">{cat}</span>
                                {newCategory === cat && <LuCheck className="text-primary text-xs" />}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center">
                              No matching category found
                            </div>
                          )}

                          {categorySearch.trim() && !isExactCategoryMatch && (
                            <button
                              type="button"
                              onClick={() => handleAddNewCategory()}
                              className="w-full px-2.5 py-2 text-xs rounded-lg text-left flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold border-t border-slate-100 dark:border-slate-800 transition-colors mt-1"
                            >
                              <LuPlus className="text-sm flex-shrink-0" />
                              <span className="truncate">Add &quot;{categorySearch.trim()}&quot; as new</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Retail Price & UOM */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Retail Price (Rs.) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="number"
                    value={newRetailPrice || ''}
                    onChange={(e) => setNewRetailPrice(Number(e.target.value) || 0)}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* UOM Combobox (Searchable & Addable) */}
                <div className="space-y-1 relative" ref={uomDropdownRef}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Unit of Measure (UOM):</span>
                    {newUom && (
                      <span className="text-[10px] text-primary font-medium truncate max-w-[90px]">
                        {newUom}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUomDropdownOpen(prev => !prev);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between gap-1 text-left"
                    >
                      <span className="truncate">{newUom || 'Select UOM...'}</span>
                      <LuChevronDown className={`text-slate-400 text-sm transition-transform duration-200 flex-shrink-0 ${isUomDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>

                    {isUomDropdownOpen && (
                      <div className="absolute z-50 top-full mt-1.5 left-0 w-full min-w-[180px] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="relative flex items-center">
                            <LuSearch className="absolute left-2.5 text-slate-400 text-xs" />
                            <input
                              type="text"
                              value={uomSearch}
                              onChange={(e) => setUomSearch(e.target.value)}
                              placeholder="Search or add UOM..."
                              autoFocus
                              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                          {filteredUoms.length > 0 ? (
                            filteredUoms.map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => handleSelectUom(u)}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left flex items-center justify-between transition-colors ${
                                  newUom === u
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <span className="truncate">{u}</span>
                                {newUom === u && <LuCheck className="text-primary text-xs" />}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center">
                              No matching UOM found
                            </div>
                          )}

                          {uomSearch.trim() && !isExactUomMatch && (
                            <button
                              type="button"
                              onClick={handleAddCustomUom}
                              className="w-full px-2.5 py-2 text-xs rounded-lg text-left flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold border-t border-slate-100 dark:border-slate-800 transition-colors mt-1"
                            >
                              <LuPlus className="text-sm flex-shrink-0" />
                              <span className="truncate">Add &quot;{uomSearch.trim()}&quot;</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Barcode Generation with Lock */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <IoBarcodeOutline className="text-primary text-sm" />
                    <span>Barcode:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewBarcode(posService.generateUniqueBarcode({ id: String(Date.now()) }))}
                    className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <LuSparkles size={11} />
                    <span>Generate Unique Barcode</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="e.g. 890123456789"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLockBarcode}
                    onChange={(e) => setNewLockBarcode(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Lock barcode (protect from accidental alterations, can unlock anytime)</span>
                </label>
              </div>

              {/* Image Preview & Upload with Drag-and-Drop and Ctrl + V */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Product Photo (Drag & Drop or Ctrl + V):
                </label>

                <div
                  onDragOver={handleAddDragOver}
                  onDragEnter={handleAddDragOver}
                  onDragLeave={handleAddDragLeave}
                  onDrop={handleAddDrop}
                  onClick={() => { if (!newImageUrl) addFileInputRef.current?.click(); }}
                  className={`relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-3 cursor-pointer group ${
                    isDraggingAdd
                      ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg ring-4 ring-primary/20'
                      : newImageUrl
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-900/5'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161D2B] hover:border-primary/60 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {newImageUrl ? (
                    <>
                      <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white p-3 text-center">
                        <LuUpload size={20} className="animate-bounce" />
                        <span className="text-xs font-bold">Drag & drop or paste (Ctrl + V) to replace</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewImageUrl('');
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition shadow-md cursor-pointer"
                        title="Clear image"
                      >
                        <LuX size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center space-y-1.5 select-none">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                        <LuUpload size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Drag & Drop product photo here
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          or press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[9px] font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">Ctrl + V</kbd> to paste from clipboard
                        </p>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-primary underline">
                        or click to browse
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste web image URL..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <input
                    ref={addFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAddModalFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Show in POS Terminal Toggle */}
              <label className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newShowInPos}
                  onChange={(e) => setNewShowInPos(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Show immediately on POS Register Terminal</span>
              </label>
            </div>

            {/* Modal Actions (Sticky Footer) */}
            <div className="flex items-center gap-2 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/60 dark:bg-[#111622]">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={handleCreateProduct}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText,
                  border: isAccentWhite ? '1px solid #cbd5e1' : undefined
                }}
              >
                <LuCheck size={16} />
                <span>{isSavingProduct ? 'Saving...' : 'Save & Add to POS'}</span>
              </button>
            </div>
          </div>
        </div>
,
    document.body
  );
};

export default AddProductModal;
