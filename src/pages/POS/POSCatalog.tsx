import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import {
  LuShoppingBag,
  LuDownload,
  LuPackagePlus,
  LuPlus,
  LuStore,
  LuLayers,
  LuSearch,
  LuLock,
  LuImage,
  LuUpload,
  LuCheck,
  LuX,
  LuEye,
  LuEyeOff,
  LuPrinter,
  LuArrowLeft,
  LuSparkles,
  LuFilter,
  LuSave
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import {
  posService,
  PosProductItem,
  PosCategoryItem
} from '../../service/posService';

interface POSCatalogProps {
  embedded?: boolean;
  onBack?: () => void;
}

export const POSCatalog: React.FC<POSCatalogProps> = ({ embedded, onBack }) => {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const { isRTL } = useLanguage();
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());

  useEffect(() => {
    const handleTheme = () => setAccentColor(getSavedAccentColor());
    window.addEventListener('uzair_jibran_theme_color_changed', handleTheme);
    return () => window.removeEventListener('uzair_jibran_theme_color_changed', handleTheme);
  }, []);

  const contrastText = getContrastTextColor(accentColor);

  // Active View Tab: 'products' | 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Products & Categories
  const [products, setProducts] = useState<PosProductItem[]>([]);
  const [categories, setCategories] = useState<PosCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Drag & Drop and Ctrl + V Paste States
  const [isDraggingEdit, setIsDraggingEdit] = useState<boolean>(false);
  const [isDraggingAdd, setIsDraggingAdd] = useState<boolean>(false);

  // Global Ctrl + V listener when either modal is active
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle if editingImageItem or isAddModalOpen is active
      if (!editingImageItem && !isAddModalOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            if (file.size > 5 * 1024 * 1024) {
              toast.error('Image size must be under 5MB');
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              if (typeof event.target?.result === 'string') {
                if (editingImageItem) {
                  setImageUrlInput(event.target.result);
                  toast.success('Image pasted from clipboard (Ctrl + V)!');
                } else if (isAddModalOpen) {
                  setNewImageUrl(event.target.result);
                  toast.success('Image pasted from clipboard (Ctrl + V)!');
                }
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [editingImageItem, isAddModalOpen]);

  // Drag & drop handlers for Edit Image Modal
  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingEdit(true);
  };
  const handleEditDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingEdit(false);
  };
  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingEdit(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setImageUrlInput(event.target.result);
          toast.success('Image dropped successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop handlers for Add Product Modal
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
  const handleAddDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAdd(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setNewImageUrl(event.target.result);
          toast.success('Image dropped successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'All' | 'Visible' | 'Hidden'>('All');

  // ── ERP Product List Import Modal State ──
  const [isErpImportModalOpen, setIsErpImportModalOpen] = useState<boolean>(false);
  const [erpProducts, setErpProducts] = useState<PosProductItem[]>([]);
  const [loadingErp, setLoadingErp] = useState<boolean>(false);
  const [erpSearchQuery, setErpSearchQuery] = useState<string>('');
  const [selectedErpIds, setSelectedErpIds] = useState<Set<string>>(new Set());

  const handleOpenErpImport = async () => {
    setIsErpImportModalOpen(true);
    setLoadingErp(true);
    try {
      const list = await posService.getErpProducts();
      setErpProducts(list);
      // Pre-check products that currently have show_in_pos !== false
      const currentPosIds = new Set(list.filter((p) => p.show_in_pos !== false).map((p) => p.id));
      setSelectedErpIds(currentPosIds);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load ERP products');
    } finally {
      setLoadingErp(false);
    }
  };

  // Group ERP products by Category
  const groupedErpProducts = useMemo(() => {
    const q = erpSearchQuery.trim().toLowerCase();
    const filtered = erpProducts.filter((p) => {
      if (!q) return true;
      return (
        p.product_name.toLowerCase().includes(q) ||
        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });

    const groups: Record<string, PosProductItem[]> = {};
    for (const prod of filtered) {
      const cat = prod.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(prod);
    }
    return groups;
  }, [erpProducts, erpSearchQuery]);

  // Toggle Whole Category
  const handleToggleCategory = (itemsInCategory: PosProductItem[]) => {
    const categoryIds = itemsInCategory.map((it) => it.id);
    const areAllSelected = categoryIds.every((id) => selectedErpIds.has(id));

    setSelectedErpIds((prev) => {
      const next = new Set(prev);
      if (areAllSelected) {
        categoryIds.forEach((id) => next.delete(id));
      } else {
        categoryIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Toggle One Product
  const handleToggleOneProduct = (productId: string) => {
    setSelectedErpIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Select All / Deselect All
  const handleSelectAllErp = () => {
    setSelectedErpIds(new Set(erpProducts.map((p) => p.id)));
  };

  const handleDeselectAllErp = () => {
    setSelectedErpIds(new Set());
  };

  // Confirm and Save to POS
  const handleConfirmErpImport = async () => {
    try {
      const allTargetIds = erpProducts.map((p) => p.id);
      await posService.setProductsPosVisibility(Array.from(selectedErpIds), allTargetIds);
      toast.success(`Updated POS catalog! ${selectedErpIds.size} products now active on POS Terminal.`);
      setIsErpImportModalOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync products to POS');
    }
  };

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newItemCode, setNewItemCode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Pure Cotton & Latha');
  const [newCustomCategory, setNewCustomCategory] = useState<string>('');
  const [newRetailPrice, setNewRetailPrice] = useState<number>(0);
  const [newUom, setNewUom] = useState<string>('PCS');
  const [newBarcode, setNewBarcode] = useState<string>('');
  const [newLockBarcode, setNewLockBarcode] = useState<boolean>(true);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newShowInPos, setNewShowInPos] = useState<boolean>(true);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

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
      const cat = newCategory === '__CUSTOM__' ? (newCustomCategory.trim() || 'General') : newCategory;
      const sku = newItemCode.trim() || `SKU-${Date.now().toString().slice(-6)}`;
      const barcodeToSave = newBarcode.trim() || posService.generateUniqueBarcode({ id: sku, category: cat });

      const created = await posService.createProduct({
        product_name: newProductName.trim(),
        item_sr_no: sku,
        category: cat,
        retail_price: newRetailPrice,
        uom: newUom,
        image_url: newImageUrl.trim() || undefined,
        barcode: barcodeToSave,
        barcode_locked: newLockBarcode,
        show_in_pos: newShowInPos
      });

      toast.success(`Product "${created.product_name}" added to POS & product list!`);
      setIsAddModalOpen(false);
      setNewProductName('');
      setNewItemCode('');
      setNewRetailPrice(0);
      setNewBarcode('');
      setNewImageUrl('');
      setNewCustomCategory('');
      await loadData();
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Failed to create product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleAddModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setNewImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Barcode Print Modal
  const [printingProduct, setPrintingProduct] = useState<PosProductItem | null>(null);

  // Image Upload Preview Modal
  const [editingImageItem, setEditingImageItem] = useState<{ id: string; type: 'product' | 'category'; currentUrl?: string; name: string } | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        posService.getProducts(),
        posService.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load POS catalog data:', err);
      toast.error('Error loading catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Visibility filter
      if (visibilityFilter === 'Visible' && p.show_in_pos === false) return false;
      if (visibilityFilter === 'Hidden' && p.show_in_pos !== false) return false;
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        p.product_name.toLowerCase().includes(q) ||
        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, visibilityFilter, searchQuery]);

  // Toggle Single Product Visibility
  const handleToggleProductVisibility = async (productId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, show_in_pos: nextVal } : p))
    );
    await posService.toggleProductPosVisibility(productId, nextVal);
    toast.success(nextVal ? 'Product made visible on POS' : 'Product hidden from POS');
  };

  // Toggle Category Visibility (also affects its products if desired)
  const handleToggleCategoryVisibility = async (categoryId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, show_in_pos: nextVal } : c))
    );
    await posService.updateCategoryVisibility(categoryId, nextVal);
    toast.success(nextVal ? 'Category enabled in POS' : 'Category hidden from POS');
  };

  // Generate Unique Barcode with Permanent Lock
  const handleGenerateBarcode = async (product: PosProductItem) => {
    if (product.barcode_locked) {
      toast.error('Barcode is permanently locked and cannot be modified.');
      return;
    }

    if (
      product.barcode &&
      !window.confirm(`Generate and permanently lock barcode for "${product.product_name}"? Once locked, it can NEVER be reverted.`)
    ) {
      return;
    }

    const newBarcode = posService.generateUniqueBarcode(product);

    // Update state immediately
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, barcode: newBarcode, barcode_locked: true }
          : p
      )
    );

    // Persist lock to service/database
    await posService.lockProductBarcode(product.id, newBarcode);
    toast.success(`Generated & permanently locked barcode: ${newBarcode}`);
  };

  // Image Upload / URL Save
  const handleSaveImage = async () => {
    if (!editingImageItem) return;

    if (editingImageItem.type === 'product') {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingImageItem.id ? { ...p, image_url: imageUrlInput } : p))
      );
      await posService.updateProductImage(editingImageItem.id, imageUrlInput);
      toast.success('Product image updated');
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingImageItem.id ? { ...c, image_url: imageUrlInput } : c))
      );
      await posService.updateCategoryImage(editingImageItem.id, imageUrlInput);
      toast.success('Category image updated');
    }

    setEditingImageItem(null);
    setImageUrlInput('');
  };

  // Handle Local File Upload (Base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrlInput(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 animate-fadeIn p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => { if (onBack) onBack(); else navigate('/pos/terminal'); }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Return to POS Terminal"
          >
            <LuArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <LuShoppingBag className="text-primary" />
              <span>POS Store Catalog & Visibility</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select which items & categories appear on the POS counter, upload display images, and generate immutable barcodes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Button: Get from ERP Product List */}
          <button
            type="button"
            onClick={handleOpenErpImport}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 bg-indigo-600 hover:bg-indigo-700"
            title="Import products from main ERP product list"
          >
            <LuDownload size={16} />
            <span>Get from ERP Product List</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewProductName('');
              setNewItemCode(`SKU-${Date.now().toString().slice(-5)}`);
              setNewBarcode(posService.generateUniqueBarcode({ id: String(Date.now()) }));
              setNewRetailPrice(0);
              setNewImageUrl('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 bg-emerald-600 hover:bg-emerald-700"
          >
            <LuPlus size={16} />
            <span>+ Add Product to POS</span>
          </button>

          <button
            type="button"
            onClick={() => { if (onBack) onBack(); else navigate('/pos/terminal'); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            <MdPointOfSale size={16} />
            <span>{embedded ? 'Back to Cashier Register' : 'Launch POS Terminal'}</span>
          </button>
        </div>
      </div>

      {/* Tabs: Products vs Categories */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          style={
            activeTab === 'products'
              ? { backgroundColor: accentColor, color: contrastText }
              : undefined
          }
        >
          <LuStore size={15} />
          <span>Products & Barcodes ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          style={
            activeTab === 'categories'
              ? { backgroundColor: accentColor, color: contrastText }
              : undefined
          }
        >
          <LuLayers size={15} />
          <span>Category Visibility & Covers ({categories.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PRODUCTS MANAGEMENT
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Dropdown & Visibility Filter */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Visibility</option>
                <option value="Visible">Visible on POS Only</option>
                <option value="Hidden">Hidden Only</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Item & Visual</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Retail Price</th>
                    <th className="py-3 px-4">Barcode & Lock Status</th>
                    <th className="py-3 px-4 text-center">POS Visible</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No products match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isVisible = p.show_in_pos !== false;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          
                          {/* Item & Visual */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => {
                                  setEditingImageItem({ id: p.id, type: 'product', currentUrl: p.image_url, name: p.product_name });
                                  setImageUrlInput(p.image_url || '');
                                }}
                                className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer relative group"
                                title="Click to upload/change image"
                              >
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <LuImage size={18} />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                  <LuUpload size={13} />
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {p.product_name}
                                </h4>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {p.item_sr_no || 'SKU'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category (Leaf Category in Big, Parent & Sub in Small) */}
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                                {p.category}
                              </span>
                              {(p.parent_category || p.sub_category) && (
                                <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[170px]" title={`Parent: ${p.parent_category || ''} • Sub: ${p.sub_category || ''}`}>
                                  {[p.parent_category && `Parent: ${p.parent_category}`, p.sub_category && `Sub: ${p.sub_category}`].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Retail Price */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            Rs. {p.retail_price.toLocaleString()}
                          </td>

                          {/* Barcode & Irreversible Lock */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {p.barcode ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {p.barcode}
                                  </span>

                                  {p.barcode_locked ? (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0"
                                      title="This barcode is permanently locked into the system and cannot be altered or reverted."
                                    >
                                      <LuLock size={11} />
                                      <span>Locked</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateBarcode(p)}
                                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-primary border border-primary/30 hover:bg-primary/10 transition cursor-pointer"
                                    >
                                      Lock Now
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateBarcode(p)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <LuSparkles size={12} />
                                  <span>Generate Barcode</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* POS Visible Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleProductVisibility(p.id, isVisible)}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                isVisible
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title={isVisible ? 'Visible in POS' : 'Hidden from POS'}
                            >
                              {isVisible ? <LuEye size={16} /> : <LuEyeOff size={16} />}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print Barcode Label */}
                              <button
                                type="button"
                                disabled={!p.barcode}
                                onClick={() => setPrintingProduct(p)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-40"
                                title="Print Barcode Sticker"
                              >
                                <LuPrinter size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: CATEGORIES MANAGEMENT
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const isVisible = cat.show_in_pos !== false;
            const itemCount = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;

            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                {/* Category Cover Image */}
                <div
                  onClick={() => {
                    setEditingImageItem({ id: cat.id, type: 'category', currentUrl: cat.image_url, name: cat.name });
                    setImageUrlInput(cat.image_url || '');
                  }}
                  className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                  title="Click to change category image"
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1">
                      <LuLayers size={26} />
                      <span className="text-[10px]">No Cover Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1.5">
                    <LuUpload size={14} />
                    <span>Upload Cover</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                    {(cat.parent_name || cat.sub_name) && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]" title={`Parent: ${cat.parent_name || ''} • Sub: ${cat.sub_name || ''}`}>
                        {[cat.parent_name && `Parent: ${cat.parent_name}`, cat.sub_name && `Sub: ${cat.sub_name}`].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <span className="text-xs text-slate-400">
                      {itemCount} catalog items
                    </span>
                  </div>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryVisibility(cat.id, isVisible)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isVisible
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    {isVisible ? <LuEye size={13} /> : <LuEyeOff size={13} />}
                    <span>{isVisible ? 'POS Active' : 'Hidden'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: BARCODE STICKER PRINT PREVIEW
         ───────────────────────────────────────────────────────────── */}
      {printingProduct && printingProduct.barcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <IoBarcodeOutline className="text-primary" />
                <span>Barcode Thermal Sticker Preview</span>
              </h3>
              <button
                type="button"
                onClick={() => setPrintingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Thermal Label Card */}
            <div className="bg-white text-black p-4 rounded-lg shadow-sm border border-slate-300 font-sans space-y-1 mx-auto max-w-[260px]">
              <span className="block text-[11px] font-extrabold uppercase tracking-tight truncate">
                {printingProduct.product_name}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">
                {printingProduct.item_sr_no || 'SKU'}
              </span>

              <div className="flex justify-center py-2">
                <Barcode
                  value={printingProduct.barcode}
                  width={1.4}
                  height={45}
                  fontSize={11}
                  margin={0}
                />
              </div>

              <div className="text-sm font-black font-mono pt-1 border-t border-dashed border-slate-300">
                Rs. {printingProduct.retail_price.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintingProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <LuPrinter size={14} />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: IMAGE UPLOAD / URL MODAL
         ───────────────────────────────────────────────────────────── */}
      {editingImageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LuImage className="text-primary" />
                <span>Update {editingImageItem.type === 'product' ? 'Product' : 'Category'} Image</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingImageItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Target Item Name */}
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Target: <span className="text-primary">{editingImageItem.name}</span>
            </p>

            {/* Interactive Drag & Drop + Ctrl + V Dropzone */}
            <div
              onDragOver={handleEditDragOver}
              onDragEnter={handleEditDragOver}
              onDragLeave={handleEditDragLeave}
              onDrop={handleEditDrop}
              onClick={() => { if (!imageUrlInput) fileInputRef.current?.click(); }}
              className={`relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-4 cursor-pointer group ${
                isDraggingEdit
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
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingImageItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <LuSave size={14} />
                <span>Save Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* ─────────────────────────────────────────────────────────────
          MODAL: GET PRODUCTS FROM ERP MASTER PRODUCT LIST
         ───────────────────────────────────────────────────────────── */}
      {isErpImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <LuDownload size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Get from ERP Product List
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select whole categories or pick individual products to display on your POS Terminal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsErpImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Filter & Quick Selection Toolbar */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={erpSearchQuery}
                  onChange={(e) => setErpSearchQuery(e.target.value)}
                  placeholder="Filter ERP products or categories..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  <strong className="text-indigo-600 dark:text-indigo-400">{selectedErpIds.size}</strong> of {erpProducts.length} selected
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllErp}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllErp}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Category-wise Grouped List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {loadingErp ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading ERP product list...
                </div>
              ) : Object.keys(groupedErpProducts).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching products found in ERP.
                </div>
              ) : (
                Object.entries(groupedErpProducts).map(([categoryName, items]) => {
                  const areAllSelected = items.every((it) => selectedErpIds.has(it.id));
                  const selectedCountInCat = items.filter((it) => selectedErpIds.has(it.id)).length;

                  return (
                    <div
                      key={categoryName}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161D2B] overflow-hidden shadow-xs"
                    >
                      {/* Category Header with Whole-Category Checkbox */}
                      <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={areAllSelected}
                            onChange={() => handleToggleCategory(items)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight block">
                              {categoryName}
                            </span>
                            {items[0] && (items[0].parent_category || items[0].sub_category) && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                                {[items[0].parent_category && `Parent: ${items[0].parent_category}`, items[0].sub_category && `Sub: ${items[0].sub_category}`].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {items.length} products
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(items)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          {areAllSelected ? 'Deselect Category' : `Select Whole Category (${selectedCountInCat}/${items.length})`}
                        </button>
                      </div>

                      {/* Products Grid / Rows inside this Category */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                        {items.map((prod) => {
                          const isChecked = selectedErpIds.has(prod.id);

                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleToggleOneProduct(prod.id)}
                              className={`p-3 flex items-center justify-between gap-3 rounded-xl transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by parent div onClick
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                                />

                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {prod.product_name}
                                  </h5>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                    <span>Code: {prod.item_sr_no || 'SKU'}</span>
                                    <span>•</span>
                                    <span>UOM: {prod.uom}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-extrabold text-xs font-mono text-slate-900 dark:text-white">
                                  Rs. {prod.retail_price.toLocaleString()}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isChecked
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isChecked ? '✓ Show in POS' : 'Hidden'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white">{selectedErpIds.size} products</strong> will be available on the POS terminal
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsErpImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmErpImport}
                  className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white transition flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-90 bg-indigo-600 hover:bg-indigo-700"
                >
                  <LuCheck size={16} />
                  <span>Add Selected ({selectedErpIds.size}) to POS Catalog</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* ─────────────────────────────────────────────────────────────
          MODAL: ADD NEW PRODUCT TO POS & DATABASE
         ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
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
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Pure Cotton & Latha">Pure Cotton & Latha</option>
                    <option value="Pure Silk & Boski">Pure Silk & Boski</option>
                    <option value="Suit">Suit</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Audio & Tech">Audio & Tech</option>
                    <option value="Home">Home</option>
                    <option value="__CUSTOM__">+ New Custom Category</option>
                  </select>
                </div>
              </div>

              {/* If Custom Category Selected */}
              {newCategory === '__CUSTOM__' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Category Name:
                  </label>
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="e.g. Unstitched Fabric"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Unit of Measure (UOM):
                  </label>
                  <select
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="Meter">Meter</option>
                    <option value="Suit">Suit</option>
                    <option value="Pack">Pack</option>
                    <option value="Yard">Yard</option>
                    <option value="Roll">Roll</option>
                    <option value="Box">Box</option>
                  </select>
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
                  <span>Permanently lock this barcode (cannot be reverted)</span>
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

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={handleCreateProduct}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                <LuCheck size={16} />
                <span>{isSavingProduct ? 'Saving...' : 'Save & Add to POS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POSCatalog;
