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
  LuSave,
  LuPencil,
  LuUnlock,
  LuScan,
  LuChevronDown
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import ClickOutside from '../../components/ClickOutside';
import { fetchAllUomsSafe } from '../../service/uomService';
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

// Helper to auto-compress and resize uploaded images for fast POS loading and quota safety
const compressImageFile = (
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

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
  const isAccentWhite = accentColor.toLowerCase() === '#ffffff' || accentColor.toLowerCase() === '#fff';

  // Active View Tab: 'products' | 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Products & Categories
  const [products, setProducts] = useState<PosProductItem[]>([]);
  const [categories, setCategories] = useState<PosCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'All' | 'Visible' | 'Hidden'>('All');

  // ERP Product List Import Modal State
  const [isErpImportModalOpen, setIsErpImportModalOpen] = useState<boolean>(false);
  const [erpProducts, setErpProducts] = useState<PosProductItem[]>([]);
  const [loadingErp, setLoadingErp] = useState<boolean>(false);
  const [erpSearchQuery, setErpSearchQuery] = useState<string>('');
  const [selectedErpIds, setSelectedErpIds] = useState<Set<string>>(new Set());

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const uomDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (uomDropdownRef.current && !uomDropdownRef.current.contains(e.target as Node)) {
        setIsUomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newItemCode, setNewItemCode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Pure Cotton & Latha');
  const [newCustomCategory, setNewCustomCategory] = useState<string>('');
  const [newRetailPrice, setNewRetailPrice] = useState<number>(0);
  const [newUom, setNewUom] = useState<string>('PCS');
  // Category & UOM Combobox Searchable & Addable States
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [uomSearch, setUomSearch] = useState<string>('');
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState<boolean>(false);
  const [uomList, setUomList] = useState<string[]>([
    'PCS', 'Meter', 'Suit', 'Yard', 'Thaan', 'Gaz', 'Pack', 'Roll', 'Box', 'Dozen', 'KG', 'Gram', 'Set', 'Pair'
  ]);
  const [newBarcode, setNewBarcode] = useState<string>('');
  const [newLockBarcode, setNewLockBarcode] = useState<boolean>(true);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newShowInPos, setNewShowInPos] = useState<boolean>(true);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Barcode Print Modal
  const [printingProduct, setPrintingProduct] = useState<PosProductItem | null>(null);

  // Custom Barcode Modal
  const [editingBarcodeItem, setEditingBarcodeItem] = useState<PosProductItem | null>(null);
  const [customBarcodeVal, setCustomBarcodeVal] = useState<string>('');
  const [customBarcodeLock, setCustomBarcodeLock] = useState<boolean>(true);

  // Image Upload Preview Modal
  const [editingImageItem, setEditingImageItem] = useState<{ id: string; type: 'product' | 'category'; currentUrl?: string; name: string } | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop and Ctrl + V Paste States
  const [isDraggingEdit, setIsDraggingEdit] = useState<boolean>(false);
  const [isDraggingAdd, setIsDraggingAdd] = useState<boolean>(false);

  // Global Ctrl + V listener when either modal is active
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
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
            if (file.size > 10 * 1024 * 1024) {
              toast.error('Image size must be under 10MB');
              return;
            }
            try {
              const compressed = await compressImageFile(file);
              if (editingImageItem) {
                setImageUrlInput(compressed);
                toast.success('Image pasted from clipboard (Ctrl + V)!');
              } else if (isAddModalOpen) {
                setNewImageUrl(compressed);
                toast.success('Image pasted from clipboard (Ctrl + V)!');
              }
            } catch {
              toast.error('Could not process pasted image');
            }
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
  const handleEditDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingEdit(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be under 10MB');
        return;
      }
      try {
        const compressed = await compressImageFile(file);
        setImageUrlInput(compressed);
        toast.success('Image dropped successfully!');
      } catch {
        toast.error('Could not process image');
      }
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
      window.dispatchEvent(new Event('pos_catalog_updated'));
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync products to POS');
    }
  };


  // ── Searchable & Addable Category and UOM Helpers ──
  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => {
      if (c.name && c.name.trim()) set.add(c.name.trim());
    });
    ['Pure Cotton & Latha', 'Pure Silk & Boski', 'Suit', 'Apparel', 'Accessories', 'Audio & Tech', 'Home', 'Summer Lawn & Jacquard', 'Unstitched Wash & Wear'].forEach(n => set.add(n));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return allCategoryNames;
    return allCategoryNames.filter(c => c.toLowerCase().includes(q));
  }, [allCategoryNames, categorySearch]);

  const isExactCategoryMatch = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return true;
    return allCategoryNames.some(c => c.toLowerCase() === q);
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

    setCategories(prev => {
      if (prev.some(c => c.name.toLowerCase() === name.toLowerCase())) return prev;
      return [{ id: `cat-${Date.now()}`, name, full_path: name, product_count: 0, show_in_pos: true }, ...prev];
    });

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
    return uomList.filter(u => u.toLowerCase().includes(q));
  }, [uomList, uomSearch]);

  const isExactUomMatch = useMemo(() => {
    const q = uomSearch.trim().toLowerCase();
    if (!q) return true;
    return uomList.some(u => u.toLowerCase() === q);
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
    setUomList(prev => prev.includes(custom) ? prev : [...prev, custom]);
    setUomSearch('');
    setIsUomDropdownOpen(false);
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
      window.dispatchEvent(new Event('pos_catalog_updated'));
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Failed to create product');
    } finally {
      setIsSavingProduct(false);
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
    } catch {
      toast.error('Could not process image');
    }
  };


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
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Toggle Category Visibility (also affects its products if desired)
  const handleToggleCategoryVisibility = async (categoryId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, show_in_pos: nextVal } : c))
    );
    await posService.updateCategoryVisibility(categoryId, nextVal);
    toast.success(nextVal ? 'Category enabled in POS' : 'Category hidden from POS');
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Open Custom Barcode Modal
  const handleOpenEditBarcode = (product: PosProductItem) => {
    setEditingBarcodeItem(product);
    setCustomBarcodeVal(product.barcode || '');
    setCustomBarcodeLock(product.barcode_locked ?? true);
  };

  // Save Custom Barcode
  const handleSaveCustomBarcode = async () => {
    if (!editingBarcodeItem) return;
    const val = customBarcodeVal.trim();
    if (!val) {
      toast.error('Please enter or scan a barcode.');
      return;
    }

    // Check for duplicate barcode in other products
    const duplicate = products.find(
      (p) => p.id !== editingBarcodeItem.id && p.barcode && p.barcode.toLowerCase() === val.toLowerCase()
    );
    if (duplicate) {
      toast.error(`Barcode "${val}" is already assigned to "${duplicate.product_name}"`);
      return;
    }

    // Update state immediately
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingBarcodeItem.id
          ? { ...p, barcode: val, barcode_locked: customBarcodeLock }
          : p
      )
    );

    await posService.updateProductBarcode(editingBarcodeItem.id, val, customBarcodeLock);
    window.dispatchEvent(new Event('pos_catalog_updated'));
    toast.success(`Barcode updated for "${editingBarcodeItem.product_name}"`);
    setEditingBarcodeItem(null);
  };

  // Unlock Barcode for modifications
  const handleUnlockBarcode = async (product: PosProductItem) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, barcode_locked: false } : p
      )
    );
    await posService.unlockProductBarcode(product.id);
    window.dispatchEvent(new Event('pos_catalog_updated'));
    toast.success(`Barcode unlocked for "${product.product_name}". You can now edit it.`);
  };

  // Lock Barcode to prevent accidental changes
  const handleLockBarcode = async (product: PosProductItem) => {
    if (!product.barcode) {
      toast.error('No barcode to lock.');
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, barcode_locked: true } : p
      )
    );
    await posService.lockProductBarcode(product.id, product.barcode);
    window.dispatchEvent(new Event('pos_catalog_updated'));
    toast.success(`Barcode locked for "${product.product_name}"`);
  };

  // Generate Unique Barcode
  const handleGenerateBarcode = async (product: PosProductItem) => {
    if (product.barcode_locked) {
      toast.error('Barcode is locked. Click unlock first to change it.');
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

    // Persist to service/database
    await posService.lockProductBarcode(product.id, newBarcode);
    window.dispatchEvent(new Event('pos_catalog_updated'));
    toast.success(`Generated & locked barcode: ${newBarcode}`);
  };

  // Image Upload / URL Save
  const handleSaveImage = async () => {
    if (!editingImageItem) return;

    const trimmedUrl = imageUrlInput.trim();
    if (editingImageItem.type === 'product') {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingImageItem.id ? { ...p, image_url: trimmedUrl } : p))
      );
      await posService.updateProductImage(editingImageItem.id, trimmedUrl);
      toast.success('Product image updated');
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingImageItem.id ? { ...c, image_url: trimmedUrl } : c))
      );
      await posService.updateCategoryImage(editingImageItem.id, trimmedUrl);
      toast.success('Category cover image updated');
    }

    setEditingImageItem(null);
    setImageUrlInput('');
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Handle Local File Upload (Auto-compressed)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      setImageUrlInput(compressed);
    } catch {
      toast.error('Could not process image');
    }
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
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined
            }}
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
                              {(() => {
                                const hierarchyParts = [p.parent_category, p.sub_category]
                                  .filter(Boolean)
                                  .map((s: any) => String(s).trim())
                                  .filter((v, i, a) => a.indexOf(v) === i);
                                if (hierarchyParts.length === 0) return null;
                                const line = hierarchyParts.join(' • ');
                                return (
                                  <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[170px]" title={line}>
                                    {line}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Retail Price */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            Rs. {p.retail_price.toLocaleString()}
                          </td>

                          {/* Barcode & Lock Status */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.barcode ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBarcode(p)}
                                    title="Click to edit or scan barcode"
                                    className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <span>{p.barcode}</span>
                                    <LuPencil size={10} className="text-slate-400" />
                                  </button>

                                  {p.barcode_locked ? (
                                    <div className="flex items-center gap-1">
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0"
                                        title="Locked: Protected from accidental changes."
                                      >
                                        <LuLock size={11} />
                                        <span>Locked</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUnlockBarcode(p)}
                                        className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                                        title="Unlock barcode to edit or reassign"
                                      >
                                        <LuUnlock size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleLockBarcode(p)}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-primary border border-primary/30 hover:bg-primary/10 transition cursor-pointer flex items-center gap-1"
                                        title="Lock this barcode"
                                      >
                                        <LuLock size={10} />
                                        <span>Lock Now</span>
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBarcode(p)}
                                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Type custom code or scan physical tag"
                                  >
                                    <LuScan size={12} />
                                    <span>Custom / Scan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateBarcode(p)}
                                    className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Auto-generate 13-digit barcode"
                                  >
                                    <LuSparkles size={11} />
                                    <span>Auto</span>
                                  </button>
                                </div>
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
                    {(() => {
                      const hierarchyParts = [cat.parent_name, cat.sub_name]
                        .filter(Boolean)
                        .map((s: any) => String(s).trim())
                        .filter((v, i, a) => a.indexOf(v) === i && v.toLowerCase() !== cat.name.toLowerCase());
                      if (hierarchyParts.length === 0) return null;
                      const line = hierarchyParts.join(' • ');
                      return (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]" title={line}>
                          {line}
                        </p>
                      );
                    })()}
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CUSTOM BARCODE & SCANNER SETUP
         ───────────────────────────────────────────────────────────── */}
      {editingBarcodeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <LuScan className="text-primary" />
                  <span>Custom Barcode & Scanner Setup</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Product: <strong className="text-slate-800 dark:text-slate-200">{editingBarcodeItem.product_name}</strong>
                  {editingBarcodeItem.item_sr_no && <span className="ml-1 font-mono text-[10px]">({editingBarcodeItem.item_sr_no})</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBarcodeItem(null)}
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
                    onClick={() => setCustomBarcodeVal(posService.generateUniqueBarcode(editingBarcodeItem))}
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
                        handleSaveCustomBarcode();
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
                onClick={() => setEditingBarcodeItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomBarcode}
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
                            {items[0] && (() => {
                              const hierarchyParts = [items[0].parent_category, items[0].sub_category]
                                .filter(Boolean)
                                .map((s: any) => String(s).trim())
                                .filter((v, i, a) => a.indexOf(v) === i);
                              if (hierarchyParts.length === 0) return null;
                              return (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                                  {hierarchyParts.join(' • ')}
                                </span>
                              );
                            })()}
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
      )}

    </div>
  );
};

export default POSCatalog;
