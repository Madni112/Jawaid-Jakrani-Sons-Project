import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import {
  posService,
  PosProductItem,
  PosCategoryItem,
  PosTerminalCounter,
} from '../../service/posService';
import { compressImageFile } from './catalog/utils/imageCompressor';

// Subcomponents
import POSCatalogHeader from './catalog/components/POSCatalogHeader';
import POSProductsTab from './catalog/components/POSProductsTab';
import POSCategoriesTab from './catalog/components/POSCategoriesTab';

// Modals
import CounterAssignmentModal from './catalog/modals/CounterAssignmentModal';
import AddCategoryModal from './catalog/modals/AddCategoryModal';
import PrintBarcodeModal from './catalog/modals/PrintBarcodeModal';
import EditBarcodeModal from './catalog/modals/EditBarcodeModal';
import EditImageModal from './catalog/modals/EditImageModal';
import ErpImportModal from './catalog/modals/ErpImportModal';
import AddProductModal from './catalog/modals/AddProductModal';

interface POSCatalogProps {
  embedded?: boolean;
  onBack?: () => void;
}

export const POSCatalog: React.FC<POSCatalogProps> = ({ embedded, onBack }) => {
  const navigate = useNavigate();

  // Dynamic Accent Theme
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());
  const contrastText = useMemo(() => getContrastTextColor(accentColor), [accentColor]);
  const isAccentWhite = contrastText === '#0F172A';

  useEffect(() => {
    const handleThemeUpdate = () => setAccentColor(getSavedAccentColor());
    window.addEventListener('storage', handleThemeUpdate);
    window.addEventListener('theme-changed', handleThemeUpdate);
    return () => {
      window.removeEventListener('storage', handleThemeUpdate);
      window.removeEventListener('theme-changed', handleThemeUpdate);
    };
  }, []);

  // Tabs
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Data
  const [products, setProducts] = useState<PosProductItem[]>([]);
  const [categories, setCategories] = useState<PosCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'All' | 'Visible' | 'Hidden'>('All');
  const [counterFilter, setCounterFilter] = useState<string>('All');
  const [terminals, setTerminals] = useState<PosTerminalCounter[]>([]);

  // Raw DB categories for hierarchical combobox
  const [rawDbCategories, setRawDbCategories] = useState<
    { id: number | string; name: string; parent_id?: number | string | null }[]
  >([]);

  // Modals state
  const [editingCountersItem, setEditingCountersItem] = useState<{
    id: string;
    name: string;
    type: 'product' | 'category';
    currentCounters: string[];
  } | null>(null);
  const [tempSelectedCounters, setTempSelectedCounters] = useState<string[]>(['all']);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryModalName, setNewCategoryModalName] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [printingProduct, setPrintingProduct] = useState<PosProductItem | null>(null);

  const [editingBarcodeItem, setEditingBarcodeItem] = useState<PosProductItem | null>(null);
  const [customBarcodeVal, setCustomBarcodeVal] = useState<string>('');
  const [customBarcodeLock, setCustomBarcodeLock] = useState<boolean>(true);

  const [editingImageItem, setEditingImageItem] = useState<{
    id: string;
    type: 'product' | 'category';
    currentUrl?: string;
    name: string;
  } | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isDraggingEdit, setIsDraggingEdit] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ERP Import Modal State
  const [isErpImportModalOpen, setIsErpImportModalOpen] = useState<boolean>(false);
  const [erpProducts, setErpProducts] = useState<PosProductItem[]>([]);
  const [loadingErp, setLoadingErp] = useState<boolean>(false);
  const [erpSearchQuery, setErpSearchQuery] = useState<string>('');
  const [selectedErpIds, setSelectedErpIds] = useState<Set<string>>(new Set());

  // Global Ctrl + V listener when editingImageItem is active
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!editingImageItem) return;

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
              setImageUrlInput(compressed);
              toast.success('Image pasted from clipboard (Ctrl + V)!');
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
  }, [editingImageItem]);

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

  // Open ERP Import Modal
  const handleOpenErpImport = async () => {
    setIsErpImportModalOpen(true);
    setLoadingErp(true);
    try {
      const list = await posService.getErpProducts();
      setErpProducts(list);
      const currentPosIds = new Set(list.filter((p) => p.show_in_pos !== false).map((p) => p.id));
      setSelectedErpIds(currentPosIds);
    } catch (err) {
      console.error('Failed to load ERP products:', err);
      toast.error('Could not load ERP inventory');
    } finally {
      setLoadingErp(false);
    }
  };

  // Grouped ERP Products
  const groupedErpProducts = useMemo(() => {
    const q = erpSearchQuery.trim().toLowerCase();
    const filtered = erpProducts.filter((p) => {
      if (!q) return true;
      return (
        p.product_name.toLowerCase().includes(q) ||
        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
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

  const areAllSelected = useMemo(() => {
    if (erpProducts.length === 0) return false;
    return erpProducts.every((p) => selectedErpIds.has(p.id));
  }, [erpProducts, selectedErpIds]);

  const handleToggleCategory = (itemsInCategory: PosProductItem[]) => {
    const categoryIds = itemsInCategory.map((it) => it.id);
    const allSelected = categoryIds.every((id) => selectedErpIds.has(id));
    setSelectedErpIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        categoryIds.forEach((id) => next.delete(id));
      } else {
        categoryIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

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

  const handleSelectAllErp = () => {
    setSelectedErpIds(new Set(erpProducts.map((p) => p.id)));
  };

  const handleDeselectAllErp = () => {
    setSelectedErpIds(new Set());
  };

  const handleConfirmErpImport = async () => {
    const allTargetIds = erpProducts.map((p) => p.id);
    const activeIdsArray = Array.from(selectedErpIds);
    await posService.bulkSetProductPosVisibility(activeIdsArray, allTargetIds);
    toast.success(`Updated POS visibility for ${erpProducts.length} items!`);
    setIsErpImportModalOpen(false);
    await loadData();
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, products]);

  // Create Category from Add Category Modal
  const handleCreateCategoryFromModal = async () => {
    const name = newCategoryModalName.trim();
    if (!name) {
      toast.error('Please enter a category name');
      return;
    }
    setIsCreatingCategory(true);
    try {
      const created = await posService.createCategory(name);
      setCategories((prev) => {
        const exists = prev.some((c) => c.name.toLowerCase() === name.toLowerCase());
        if (exists) return prev;
        return [...prev, created];
      });
      toast.success(`Category "${name}" created and enabled on POS!`);
      setNewCategoryModalName('');
      setIsAddCategoryModalOpen(false);
      window.dispatchEvent(new Event('pos_catalog_updated'));
    } catch (err) {
      console.error('Failed to create category:', err);
      toast.error('Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        posService.getProducts(),
        posService.getCategories(),
      ]);
      const terms = posService.getTerminals();
      setTerminals(terms);
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
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (visibilityFilter === 'Visible' && p.show_in_pos === false) return false;
      if (visibilityFilter === 'Hidden' && p.show_in_pos !== false) return false;
      if (counterFilter !== 'All' && !posService.isProductVisibleOnCounter(p, counterFilter))
        return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        p.product_name.toLowerCase().includes(q) ||
        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, visibilityFilter, counterFilter, searchQuery]);

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

  // Toggle Category Visibility
  const handleToggleCategoryVisibility = async (categoryId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, show_in_pos: nextVal } : c))
    );
    await posService.updateCategoryVisibility(categoryId, nextVal);
    toast.success(nextVal ? 'Category enabled in POS' : 'Category hidden from POS');
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Open Counter Assignment Modal
  const handleOpenCounterAssign = (
    id: string,
    type: 'product' | 'category',
    name: string,
    currentCounters?: string[]
  ) => {
    const counters =
      currentCounters && currentCounters.length > 0 ? [...currentCounters] : ['all'];
    setEditingCountersItem({ id, type, name, currentCounters: counters });
    setTempSelectedCounters(counters);
  };

  // Save Counter Assignment
  const handleSaveCounterAssign = () => {
    if (!editingCountersItem) return;
    const countersToSave =
      tempSelectedCounters.length === 0 ? ['all'] : tempSelectedCounters;

    if (editingCountersItem.type === 'product') {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingCountersItem.id ? { ...p, visible_counters: countersToSave } : p
        )
      );
      posService.setProductCounterAssignment(editingCountersItem.id, countersToSave);
      toast.success(`Updated counter access for ${editingCountersItem.name}`);
    } else {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCountersItem.id ? { ...c, visible_counters: countersToSave } : c
        )
      );
      posService.setCategoryCounterAssignment(editingCountersItem.id, countersToSave);
      toast.success(`Updated counter access for ${editingCountersItem.name}`);
    }

    setEditingCountersItem(null);
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Open Custom Barcode Modal
  const handleOpenEditBarcode = (product: PosProductItem) => {
    setEditingBarcodeItem(product);
    setCustomBarcodeVal(
      product.barcode || posService.generateUniqueBarcode(product)
    );
    setCustomBarcodeLock(product.barcode_locked !== false);
  };

  // Save Custom Barcode
  const handleSaveCustomBarcode = async () => {
    if (!editingBarcodeItem) return;
    const val = customBarcodeVal.trim();
    if (!val) {
      toast.error('Barcode cannot be empty');
      return;
    }

    const duplicate = products.find(
      (p) => p.id !== editingBarcodeItem.id && p.barcode && p.barcode.toLowerCase() === val.toLowerCase()
    );
    if (duplicate) {
      toast.error(`Barcode "${val}" is already assigned to "${duplicate.product_name}"`);
      return;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingBarcodeItem.id
          ? { ...p, barcode: val, barcode_locked: customBarcodeLock }
          : p
      )
    );

    if (customBarcodeLock) {
      await posService.lockProductBarcode(editingBarcodeItem.id, val);
      toast.success(`Barcode set and locked: ${val}`);
    } else {
      await posService.updateProductBarcode(editingBarcodeItem.id, val);
      toast.success(`Barcode updated: ${val}`);
    }

    setEditingBarcodeItem(null);
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Unlock Barcode
  const handleUnlockBarcode = async (product: PosProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, barcode_locked: false } : p))
    );
    await posService.unlockProductBarcode(product.id);
    toast.success('Barcode unlocked! Regenerating is now allowed.');
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Lock Barcode
  const handleLockBarcode = async (product: PosProductItem) => {
    if (!product.barcode) {
      toast.error('Product has no barcode to lock');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, barcode_locked: true } : p))
    );
    await posService.lockProductBarcode(product.id, product.barcode);
    toast.success('Barcode locked permanently!');
    window.dispatchEvent(new Event('pos_catalog_updated'));
  };

  // Generate & Lock Barcode
  const handleGenerateBarcode = async (product: PosProductItem) => {
    if (product.barcode_locked) {
      toast.error('This barcode is locked. Please unlock it first to regenerate.');
      return;
    }
    const newBarcode = posService.generateUniqueBarcode(product);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, barcode: newBarcode, barcode_locked: true }
          : p
      )
    );
    await posService.lockProductBarcode(product.id, newBarcode);
    toast.success(`Generated & locked barcode: ${newBarcode}`);
    window.dispatchEvent(new Event('pos_catalog_updated'));
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

  // Local File Upload
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
      toast.success('Image uploaded & compressed!');
    } catch {
      toast.error('Error reading image file');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Header */}
      <POSCatalogHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        productsCount={products.length}
        categoriesCount={categories.length}
        embedded={embedded}
        onBack={onBack}
        onOpenErpImport={handleOpenErpImport}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <POSProductsTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          allCategoryNames={allCategoryNames}
          visibilityFilter={visibilityFilter}
          setVisibilityFilter={setVisibilityFilter}
          counterFilter={counterFilter}
          setCounterFilter={setCounterFilter}
          terminals={terminals}
          filteredProducts={filteredProducts}
          onOpenAddProduct={() => setIsAddModalOpen(true)}
          onOpenEditImage={(item) => {
            setEditingImageItem(item);
            setImageUrlInput(item.currentUrl || '');
          }}
          onOpenEditBarcode={handleOpenEditBarcode}
          onPrintBarcode={(p) => setPrintingProduct(p)}
          onOpenCounterAssign={handleOpenCounterAssign}
          onToggleProductVisibility={handleToggleProductVisibility}
          onGenerateBarcode={handleGenerateBarcode}
          onLockBarcode={handleLockBarcode}
          onUnlockBarcode={handleUnlockBarcode}
          accentColor={accentColor}
          contrastText={contrastText}
          isAccentWhite={isAccentWhite}
        />
      )}

      {/* TAB 2: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <POSCategoriesTab
          categories={categories}
          products={products}
          terminals={terminals}
          onOpenAddCategory={() => {
            setNewCategoryModalName('');
            setIsAddCategoryModalOpen(true);
          }}
          onOpenEditImage={(item) => {
            setEditingImageItem(item);
            setImageUrlInput(item.currentUrl || '');
          }}
          onOpenCounterAssign={handleOpenCounterAssign}
          onToggleCategoryVisibility={handleToggleCategoryVisibility}
          accentColor={accentColor}
          contrastText={contrastText}
          isAccentWhite={isAccentWhite}
        />
      )}

      {/* MODALS */}
      <CounterAssignmentModal
        editingCountersItem={editingCountersItem}
        onClose={() => setEditingCountersItem(null)}
        terminals={terminals}
        tempSelectedCounters={tempSelectedCounters}
        setTempSelectedCounters={setTempSelectedCounters}
        onSave={handleSaveCounterAssign}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        categoryName={newCategoryModalName}
        setCategoryName={setNewCategoryModalName}
        isCreating={isCreatingCategory}
        onCreate={handleCreateCategoryFromModal}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      <PrintBarcodeModal
        product={printingProduct}
        onClose={() => setPrintingProduct(null)}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      <EditBarcodeModal
        item={editingBarcodeItem}
        onClose={() => setEditingBarcodeItem(null)}
        customBarcodeVal={customBarcodeVal}
        setCustomBarcodeVal={setCustomBarcodeVal}
        customBarcodeLock={customBarcodeLock}
        setCustomBarcodeLock={setCustomBarcodeLock}
        onSave={handleSaveCustomBarcode}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      <EditImageModal
        item={editingImageItem}
        onClose={() => setEditingImageItem(null)}
        imageUrlInput={imageUrlInput}
        setImageUrlInput={setImageUrlInput}
        onSave={handleSaveImage}
        fileInputRef={fileInputRef}
        isDragging={isDraggingEdit}
        onDragOver={handleEditDragOver}
        onDragLeave={handleEditDragLeave}
        onDrop={handleEditDrop}
        onFileUpload={handleFileUpload}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      <ErpImportModal
        isOpen={isErpImportModalOpen}
        onClose={() => setIsErpImportModalOpen(false)}
        loading={loadingErp}
        searchQuery={erpSearchQuery}
        setSearchQuery={setErpSearchQuery}
        selectedErpIds={selectedErpIds}
        groupedErpProducts={groupedErpProducts}
        areAllSelected={areAllSelected}
        onSelectAll={handleSelectAllErp}
        onDeselectAll={handleDeselectAllErp}
        onToggleCategory={(category, prods) => handleToggleCategory(prods)}
        onToggleOneProduct={handleToggleOneProduct}
        onConfirm={handleConfirmErpImport}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductCreated={loadData}
        categories={categories}
        allCategoryNames={allCategoryNames}
        rawDbCategories={rawDbCategories}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />
    </div>
  );
};

export default POSCatalog;
