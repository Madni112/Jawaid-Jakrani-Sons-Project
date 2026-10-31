import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import {
  LuShoppingBag,
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

export const POSCatalog: React.FC = () => {
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

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'All' | 'Visible' | 'Hidden'>('All');

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
            onClick={() => navigate('/pos/terminal')}
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
          <button
            type="button"
            onClick={() => navigate('/pos/terminal')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            <MdPointOfSale size={16} />
            <span>Launch POS Terminal</span>
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

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {p.category}
                            </span>
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

            {/* Preview Box */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              {imageUrlInput ? (
                <img src={imageUrlInput} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400 space-y-1">
                  <LuImage size={32} className="mx-auto" />
                  <span className="text-xs">No image provided</span>
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
    </div>
  );
};

export default POSCatalog;
