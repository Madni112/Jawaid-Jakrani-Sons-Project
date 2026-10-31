import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import {
  LuStore,
  LuSearch,
  LuPlus,
  LuMinus,
  LuTrash2,
  LuCreditCard,
  LuBanknote,
  LuQrCode,
  LuReceipt,
  LuClock,
  LuUser,
  LuLock,
  LuUnlock,
  LuPrinter,
  LuLayers,
  LuArrowLeft,
  LuCheck,
  LuX,
  LuPercent,
  LuTag,
  LuShoppingBag,
  LuChevronDown,
  LuVolume2,
  LuVolumeX,
  LuSun,
  LuMoon,
  LuPauseCircle,
  LuRotateCcw,
  LuFileText,
  LuShieldCheck,
  LuCoins,
  LuArrowDownLeft,
  LuArrowUpRight,
  LuHelpCircle,
  LuSparkles,
  LuCalendar
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import useColorMode from '../../hooks/useColorMode';
import {
  getSavedAccentColor,
  getContrastTextColor,
  isDarkModeActive
} from '../../constant/themeConfig';
import { triggerFeedbackSound } from '../../utils/audioFeedback';
import POSCatalog from './POSCatalog';
import POSOrders from './POSOrders';
import POSRegister from './POSRegister';
import {
  posService,
  PosOrder,
  PosOrderItem,
  PosProductItem,
  PosCategoryItem,
  PosHeldOrder,
  PosShift,
  PosSettings
} from '../../service/posService';

export const POSTerminal: React.FC = () => {
  const navigate = useNavigate();
  const { userEmail, businessName, currentUser } = useAuth();
  const { isRTL } = useLanguage();
  const [colorMode, setColorMode] = useColorMode();
  const isDark = isDarkModeActive();

  // Dynamic Theme Accent
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());
  useEffect(() => {
    const handleThemeChange = () => setAccentColor(getSavedAccentColor());
    window.addEventListener('uzair_jibran_theme_color_changed', handleThemeChange);
    return () => window.removeEventListener('uzair_jibran_theme_color_changed', handleThemeChange);
  }, []);

  const contrastText = getContrastTextColor(accentColor);

  // POS Settings & Active Shift
  const [posConfig, setPosConfig] = useState<PosSettings>(() => posService.getSettings());
  const [activeShift, setActiveShift] = useState<PosShift | null>(() => posService.getActiveShift());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(posConfig.sound_effects_enabled);

  // Time & Session
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sub-view within POS Terminal (keeps user inside POS without redirecting back to ERP)
  type PosView = 'register' | 'transactions' | 'catalog' | 'returns' | 'summary';
  const [activeView, setActiveView] = useState<PosView>('register');

  // Products & Categories
  const [products, setProducts] = useState<PosProductItem[]>([]);
  const [categories, setCategories] = useState<PosCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortByDate, setSortByDate] = useState<'newest' | 'oldest'>('newest');
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);

  // Load Catalog Data
  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const [prods, cats] = await Promise.all([
        posService.getProducts(),
        posService.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Automatically refresh catalog when returning to register
  useEffect(() => {
    if (activeView === 'register') {
      loadCatalog();
    }
  }, [activeView]);

  // Listen for instant updates from catalog (images, visibility, additions)
  useEffect(() => {
    const handleCatalogUpdate = () => {
      loadCatalog();
    };
    window.addEventListener('pos_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('pos_catalog_updated', handleCatalogUpdate);
  }, []);

  // Filtered Products (with Date-Wise Sorting)
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      if (p.show_in_pos === false) return false;
      const matchCat =
        selectedCategory === 'All' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (p.sub_category && p.sub_category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (p.parent_category && p.parent_category.toLowerCase() === selectedCategory.toLowerCase());
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        p.product_name.toLowerCase().includes(query) ||
        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });

    return filtered.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : Number(a.id) || 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : Number(b.id) || 0;
      return sortByDate === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [products, selectedCategory, searchQuery, sortByDate]);

  // Current Ticket / Cart State
  const [cartItems, setCartItems] = useState<PosOrderItem[]>([]);
  const [ticketNumber, setTicketNumber] = useState<string>(() => `#TK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customerName, setCustomerName] = useState<string>(posConfig.default_customer_name || 'Walk-in Customer');
  const [customerTier, setCustomerTier] = useState<'VIP' | 'Regular' | 'Retail'>('VIP');
  const [fulfillmentType, setFulfillmentType] = useState<string>(posConfig.default_fulfillment || 'In-Store Bag');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(posConfig.default_tax_rate || 0);

  // Held Orders State
  const [heldOrders, setHeldOrders] = useState<PosHeldOrder[]>(() => posService.getHeldOrders());
  const [isHeldModalOpen, setIsHeldModalOpen] = useState<boolean>(false);

  // Lock Terminal State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockPin, setLockPin] = useState<string>('');

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Digital' | 'Split'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<PosOrder | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [receiptSize, setReceiptSize] = useState<'80mm' | '58mm'>(posConfig.receipt_paper_size || '80mm');

  // Cash Drawer Modal State
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState<boolean>(false);
  const [drawerMovementType, setDrawerMovementType] = useState<'in' | 'out'>('in');
  const [drawerAmount, setDrawerAmount] = useState<number>(0);
  const [drawerReason, setDrawerReason] = useState<string>('');

  // Barcode Scanner Ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Play Sound helper
  const playTone = (type: 'notification' | 'success' | 'scan' | 'warning' | 'delete') => {
    if (soundEnabled) {
      try {
        triggerFeedbackSound(type, userEmail);
      } catch (_) {}
    }
  };

  // Keyboard Shortcuts (F2: Search/Scan, F4: Hold, F9: Pay, Esc: Clear/Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0) handleHoldOrder();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cartItems.length > 0 && !isPayModalOpen) handleOpenPayment();
      } else if (e.key === 'Escape') {
        if (isReceiptModalOpen) setIsReceiptModalOpen(false);
        else if (isPayModalOpen) setIsPayModalOpen(false);
        else if (isHeldModalOpen) setIsHeldModalOpen(false);
        else if (isDrawerModalOpen) setIsDrawerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isLocked, isPayModalOpen, isReceiptModalOpen, isHeldModalOpen, isDrawerModalOpen]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.line_total, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * (discountPercent || 0)) / 100);
  }, [subtotal, discountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    return Math.round((taxableAmount * (taxPercent || 0)) / 100);
  }, [taxableAmount, taxPercent]);

  const grandTotal = Math.max(0, taxableAmount + taxAmount);
  const changeDue = Math.max(0, cashTendered - grandTotal);

  // Add Item to Cart
  const handleAddToCart = (product: PosProductItem) => {
    playTone('scan');
    setCartItems((prev) => {
      const idx = prev.findIndex((it) => it.product_id === product.id);
      if (idx !== -1) {
        const next = [...prev];
        const existing = next[idx];
        const newQty = existing.quantity + 1;
        next[idx] = {
          ...existing,
          quantity: newQty,
          line_total: newQty * existing.unit_price - existing.discount_amount
        };
        return next;
      }
      const newItem: PosOrderItem = {
        product_id: product.id,
        product_name: product.product_name,
        product_code: product.item_sr_no || 'ITM',
        barcode: product.barcode,
        image_url: product.image_url,
        category: product.category,
        uom: product.uom || 'PCS',
        quantity: 1,
        unit_price: product.retail_price,
        discount_amount: 0,
        line_total: product.retail_price
      };
      return [...prev, newItem];
    });
  };

  // Adjust Quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((it) => {
          if (it.product_id === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...it,
              quantity: newQty,
              line_total: newQty * it.unit_price - it.discount_amount
            };
          }
          return it;
        })
        .filter(Boolean) as PosOrderItem[];
    });
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    playTone('delete');
    setCartItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  // Clear Cart
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('Clear all items on current ticket?')) {
      playTone('delete');
      setCartItems([]);
      setDiscountPercent(0);
      toast.success('Cart cleared');
    }
  };

  // Barcode / Fast Input Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Search by exact barcode or item_sr_no
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        (p.item_sr_no && p.item_sr_no.toLowerCase() === query.toLowerCase())
    );

    if (matched) {
      handleAddToCart(matched);
      setSearchQuery('');
      toast.success(`Scanned: ${matched.product_name}`);
    } else {
      playTone('warning');
      toast.error(`Barcode not found: ${query}`);
    }
  };

  // Hold / Park Current Order
  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    const ticketLabel = `${customerName} (${cartItems.length} items)`;
    const newHeld: PosHeldOrder = {
      id: `held-${Date.now()}`,
      ticket_label: ticketLabel,
      ticket_number: ticketNumber,
      cashier_name: userEmail?.split('@')[0] || 'Cashier',
      items: cartItems,
      subtotal,
      customer_name: customerName,
      customer_tier: customerTier,
      created_at: new Date().toISOString()
    };
    posService.holdOrder(newHeld);
    setHeldOrders(posService.getHeldOrders());
    setCartItems([]);
    setTicketNumber(`#TK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    playTone('notification');
    toast.success(`Ticket ${ticketNumber} parked into Held Orders`);
  };

  // Resume Held Order
  const handleResumeHeldOrder = (held: PosHeldOrder) => {
    if (cartItems.length > 0) {
      if (!window.confirm('Replace current active ticket with held order?')) return;
    }
    setCartItems(held.items);
    setCustomerName(held.customer_name || 'Walk-in Customer');
    setCustomerTier((held.customer_tier as any) || 'VIP');
    setTicketNumber(held.ticket_number);
    posService.removeHeldOrder(held.id);
    setHeldOrders(posService.getHeldOrders());
    setIsHeldModalOpen(false);
    playTone('notification');
    toast.success(`Resumed ticket ${held.ticket_number}`);
  };

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Add products to ticket first.');
      return;
    }
    setCashTendered(grandTotal);
    setIsPayModalOpen(true);
  };

  // Complete Order
  const handleCompleteOrder = async () => {
    if (paymentMethod === 'Cash' && cashTendered < grandTotal) {
      playTone('warning');
      toast.error(`Insufficient cash tendered. Total is Rs. ${grandTotal.toLocaleString()}`);
      return;
    }

    try {
      setIsProcessingSale(true);
      const orderPayload: Omit<PosOrder, 'id' | 'order_number' | 'created_at'> = {
        shift_id: activeShift?.id,
        cashier_name: userEmail?.split('@')[0] || 'Cashier',
        customer_name: customerName,
        customer_tier: customerTier,
        terminal_code: posConfig.terminal_name || 'Terminal 01',
        fulfillment_type: fulfillmentType,
        subtotal,
        tax_percentage: taxPercent,
        tax_amount: taxAmount,
        discount_percentage: discountPercent,
        discount_amount: discountAmount,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'Cash' ? cashTendered : grandTotal,
        change_due: paymentMethod === 'Cash' ? changeDue : 0,
        status: 'Completed',
        items: cartItems
      };

      const saved = await posService.createOrder(orderPayload);
      playTone('success');
      toast.success(`Sale completed! Ticket: ${saved.order_number}`);

      setCompletedOrder(saved);
      setIsPayModalOpen(false);
      setIsReceiptModalOpen(true);

      // Refresh Shift & Cart
      setActiveShift(posService.getActiveShift());
      setCartItems([]);
      setTicketNumber(`#TK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setDiscountPercent(0);
    } catch (err) {
      console.error('Failed to complete sale:', err);
      toast.error('Failed to save POS order');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Drawer Cash In / Out
  const handleDrawerMovement = () => {
    if (!drawerAmount || drawerAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!activeShift) {
      toast.error('No active shift open. Please start a shift first.');
      return;
    }
    posService.recordCashMovement(activeShift.id, drawerMovementType, drawerAmount);
    setActiveShift(posService.getActiveShift());
    setIsDrawerModalOpen(false);
    setDrawerAmount(0);
    setDrawerReason('');
    playTone('notification');
    toast.success(`Drawer cash ${drawerMovementType.toUpperCase()} of Rs. ${drawerAmount.toLocaleString()} recorded`);
  };

  // Lock / Unlock Terminal
  const handleUnlock = () => {
    setIsLocked(false);
    setLockPin('');
    toast.success('Terminal unlocked');
  };

  const currentCashierName = userEmail?.split('@')[0] || 'Alex Rivera';
  const displayBrand = businessName || posConfig.store_title || 'Atelier Terminal';

  return (
    <div className={`relative flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 font-sans select-none ${isRTL ? 'rtl' : 'ltr'}`}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT POS SIDEBAR (Atelier Terminal Navigation)
         ───────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white dark:bg-[#111622] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 z-20 shadow-sm">
        {/* Top Brand Logo */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-all duration-300"
                style={{ backgroundColor: accentColor }}
              >
                <MdPointOfSale size={22} />
              </div>
              <div className="leading-tight">
                <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <span>{displayBrand}</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {posConfig.terminal_name} • POS
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links (Loads views in-place without redirecting to ERP) */}
          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveView('register');
                loadCatalog();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
                activeView === 'register'
                  ? 'shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              style={
                activeView === 'register'
                  ? { backgroundColor: `${accentColor}18`, color: accentColor }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <MdPointOfSale size={17} />
                <span>Register Terminal</span>
              </div>
              {activeView === 'register' && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LuPauseCircle size={17} className="text-amber-500" />
                <span>Held Tickets</span>
              </div>
              {heldOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {heldOrders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('transactions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
                activeView === 'transactions'
                  ? 'shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              style={
                activeView === 'transactions'
                  ? { backgroundColor: `${accentColor}18`, color: accentColor }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <LuReceipt size={17} className="text-sky-500" />
                <span>Transactions</span>
              </div>
              {activeView === 'transactions' && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDrawerModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LuBanknote size={17} className="text-emerald-500" />
                <span>Cash Drawer</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Rs. {(activeShift?.expected_cash || 24500).toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
                activeView === 'catalog'
                  ? 'shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              style={
                activeView === 'catalog'
                  ? { backgroundColor: `${accentColor}18`, color: accentColor }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <LuShoppingBag size={17} className="text-purple-500" />
                <span>POS Store Catalog</span>
              </div>
              {activeView === 'catalog' && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('returns')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
                activeView === 'returns'
                  ? 'shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              style={
                activeView === 'returns'
                  ? { backgroundColor: `${accentColor}18`, color: accentColor }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <LuRotateCcw size={17} className="text-rose-500" />
                <span>Returns & Refunds</span>
              </div>
              {activeView === 'returns' && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('summary')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
                activeView === 'summary'
                  ? 'shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              style={
                activeView === 'summary'
                  ? { backgroundColor: `${accentColor}18`, color: accentColor }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <LuFileText size={17} className="text-indigo-500" />
                <span>Daily Summary (Z-Report)</span>
              </div>
              {activeView === 'summary' && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Lock & Exit Buttons */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          {/* Lock Terminal Button */}
          <button
            type="button"
            onClick={() => setIsLocked(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <LuLock size={15} className="text-amber-500" />
              <span>Lock Terminal</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase">Screen Lock</span>
          </button>

          {/* Exit to ERP Dashboard Button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            <LuArrowLeft size={14} />
            <span>Exit to ERP System</span>
          </button>

          {/* System status pill */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>99.8% Online</span>
            </div>
            <span className="font-mono text-[10px]">v1.4 POS</span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE (Top Navbar + Catalog + Order Ticket Panel)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* ── TOP POS NAVBAR ── */}
        <header className="h-16 bg-white dark:bg-[#111622] border-b border-slate-200 dark:border-slate-800/80 px-5 flex items-center justify-between shrink-0 gap-4 z-10">
          
          {/* Left: Terminal pill & Live clock */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {posConfig.terminal_name}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LuCalendar size={13} className="text-primary opacity-80" />
                {currentDate}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                {currentTime}
              </span>
            </div>

            {/* Back to Register Terminal if in Sub-view */}
            {activeView !== 'register' && (
              <button
                type="button"
                onClick={() => {
                  setActiveView('register');
                  loadCatalog();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white transition shadow-sm cursor-pointer hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <LuArrowLeft size={14} />
                <span>Back to Register</span>
              </button>
            )}

            {/* Quick Action: New Ticket */}
            <button
              type="button"
              onClick={() => {
                if (cartItems.length > 0 && !window.confirm('Start new fresh ticket? Current items will be reset.')) return;
                setCartItems([]);
                setTicketNumber(`#TK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
                toast.success('New ticket initialized');
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <LuPlus size={14} className="text-primary" />
              <span>New Ticket</span>
            </button>
          </div>

          {/* Center: Live Barcode & Item Search Input */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-xl relative">
            <div className="relative">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items or scan barcode... [F2]"
                className="w-full pl-10 pr-24 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900 dark:text-white placeholder:text-slate-400 transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition flex items-center gap-1 shadow-2xs"
                style={{ backgroundColor: accentColor }}
              >
                <IoBarcodeOutline size={13} />
                <span>Scan [F2]</span>
              </button>
            </div>
          </form>

          {/* Right: Quick Action Buttons, Sound, Mode, Cashier info */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Held Tickets Count */}
            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition cursor-pointer"
              title="Held tickets"
            >
              <LuPauseCircle size={15} />
              <span className="hidden sm:inline">Held</span>
              <span>({heldOrders.length})</span>
            </button>

            {/* Quick Drawer */}
            <button
              type="button"
              onClick={() => setIsDrawerModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition cursor-pointer"
              title="Quick cash drawer operations"
            >
              <LuBanknote size={15} />
              <span>Drawer</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                toast.success(next ? 'Sound effects enabled' : 'Sound effects muted');
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
              title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {soundEnabled ? <LuVolume2 size={16} /> : <LuVolumeX size={16} />}
            </button>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = colorMode === 'dark' ? 'light' : 'dark';
                setColorMode(next);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
              title="Toggle theme mode"
            >
              {isDark ? <LuSun size={16} className="text-amber-400" /> : <LuMoon size={16} />}
            </button>

            {/* Active Cashier Avatar & Name */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText
                }}
              >
                {currentCashierName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden xl:block leading-tight text-left">
                <span className="block text-xs font-bold text-slate-900 dark:text-white capitalize">
                  {currentCashierName}
                </span>
                <span className="block text-[10px] text-emerald-500 font-semibold">
                  Shift Active
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── WORKSPACE BODY: (Center Catalog + Right Cart OR Embedded POS Sub-Pages) ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {activeView === 'register' && (
            <>
          {/* ─────────────────────────────────────────────────────────────
              CENTER: PRODUCT CATALOG & CATEGORY SELECTOR
             ───────────────────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0B0F17] min-w-0">
            
            {/* Category Filter Pills (Category in Big, Sub & Parent in Small) */}
            <div className="p-3 bg-white dark:bg-[#111622] border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3.5 py-1.5 rounded-xl text-left transition shrink-0 cursor-pointer flex flex-col justify-center min-w-[110px] border ${
                  selectedCategory === 'All'
                    ? 'shadow-xs border-transparent scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                }`}
                style={
                  selectedCategory === 'All'
                    ? { backgroundColor: accentColor, color: contrastText }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black tracking-tight">All Items</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                      selectedCategory === 'All'
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {products.filter((p) => p.show_in_pos !== false).length}
                  </span>
                </div>
                <span className="text-[10px] opacity-75 font-medium mt-0.5 block leading-tight">
                  All Categories
                </span>
              </button>

              {categories
                .filter((c) => c.show_in_pos !== false)
                .map((cat) => {
                  const count = products.filter(
                    (p) =>
                      p.show_in_pos !== false &&
                      (p.category.toLowerCase() === cat.name.toLowerCase() ||
                        (cat.sub_name && p.sub_category?.toLowerCase() === cat.sub_name.toLowerCase()) ||
                        (p.parent_category && p.parent_category.toLowerCase() === cat.name.toLowerCase()))
                  ).length;
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return { cat, count, isSelected };
                })
                .filter(({ count, isSelected }) => count > 0 || isSelected)
                .map(({ cat, count, isSelected }) => {
                  // Hierarchy subtitle formatting without mentioning "Parent:" or "Sub:"
                  const hierarchyParts = [cat.parent_name, cat.sub_name]
                    .filter(Boolean)
                    .map((s) => String(s).trim())
                    .filter((v, i, a) => a.indexOf(v) === i && v.toLowerCase() !== cat.name.toLowerCase());
                  const subtitleText = hierarchyParts.length > 0 ? hierarchyParts.join(' • ') : 'Cloth Category';

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-left transition shrink-0 cursor-pointer flex flex-col justify-center min-w-[130px] max-w-[240px] border ${
                        isSelected
                          ? 'shadow-xs border-transparent scale-[1.02]'
                          : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: accentColor, color: contrastText }
                          : undefined
                      }
                      title={cat.full_path || cat.name}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black tracking-tight truncate">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                            isSelected
                              ? 'bg-black/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-75 font-medium mt-0.5 truncate block leading-tight">
                        {subtitleText}
                      </span>
                    </button>
                  );
                })}

              {/* Date-Wise Sort Toggle Pill */}
              <button
                type="button"
                onClick={() => setSortByDate((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                className="ml-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                title="Toggle ordering: Newest Added First vs Oldest First"
              >
                <LuClock size={13} className="text-primary" />
                <span>{sortByDate === 'newest' ? '📅 Newest First' : '📅 Oldest First'}</span>
              </button>
            </div>

            {/* Product Card Grid (4 Columns) */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingCatalog ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Loading catalog items...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <LuStore size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No matching products found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Try searching with another keyword, clearing the category filter, or scanning a barcode.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                  {filteredProducts.map((prod) => {
                    const cartItem = cartItems.find((it) => it.product_id === prod.id);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleAddToCart(prod)}
                        className={`group relative rounded-2xl bg-white dark:bg-[#111622] border transition-all duration-200 p-3 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                          cartItem
                            ? 'border-primary ring-2 ring-primary/20 dark:ring-primary/30'
                            : 'border-slate-200 dark:border-slate-800/80 hover:border-primary/50'
                        }`}
                      >
                        {/* Selected quantity badge */}
                        {cartItem && (
                          <div
                            className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shadow-md animate-bounce"
                            style={{
                              backgroundColor: accentColor,
                              color: contrastText
                            }}
                          >
                            {cartItem.quantity}
                          </div>
                        )}

                        {/* Product Image / Full Placeholder */}
                        <div className="relative w-full h-48 sm:h-52 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 mb-2.5 shrink-0">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/60 dark:from-slate-800/50 dark:to-slate-800/90 text-slate-300 dark:text-slate-600 group-hover:text-primary/70 transition-colors">
                              <LuShoppingBag size={48} className="opacity-70 group-hover:scale-110 transition-transform duration-200" />
                            </div>
                          )}

                          {/* Category Badge */}
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white">
                            {prod.category}
                          </span>
                        </div>

                        {/* Product Title & Code */}
                        <div className="space-y-1 mb-2">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors" title={prod.product_name}>
                            {prod.product_name}
                          </h4>
                          {(() => {
                            const hierarchyParts = [prod.parent_category, prod.sub_category]
                              .filter(Boolean)
                              .map((s: any) => String(s).trim())
                              .filter((v, i, a) => a.indexOf(v) === i);
                            if (hierarchyParts.length === 0) return null;
                            const catLine = hierarchyParts.join(' • ');
                            return (
                              <p className="text-[10px] text-slate-400 font-medium truncate" title={catLine}>
                                {catLine}
                              </p>
                            );
                          })()}
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-mono">{prod.item_sr_no || 'SKU'}</span>
                            <span className="text-emerald-500 font-semibold">In Stock</span>
                          </div>
                        </div>

                        {/* Price & Add Indicator */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                            Rs. {prod.retail_price.toLocaleString()}
                          </span>
                          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition">
                            <LuPlus size={13} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── BOTTOM STATUS BAR ── */}
            <footer className="h-10 bg-white dark:bg-[#111622] border-t border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <LuCoins className="text-amber-500 text-sm" />
                  <span>Drawer Balance:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">
                    Rs. {(activeShift?.expected_cash || 24500).toLocaleString()}
                  </strong>
                </span>

                <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>

                <span className="hidden sm:flex items-center gap-1.5">
                  <LuReceipt className="text-sky-500 text-sm" />
                  <span>Sales Today:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">
                    {posService.getAllOrders().length} Tickets
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <LuPrinter className="text-emerald-500 text-sm" />
                  <span>Thermal Printer:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {posConfig.receipt_paper_size} Online
                  </strong>
                </span>

                <span className="hidden md:inline-block text-slate-300 dark:text-slate-700">•</span>

                <span className="hidden md:flex items-center gap-1 text-[11px]">
                  <LuShieldCheck className="text-primary" />
                  <span>Secure Cloud Sync</span>
                </span>
              </div>
            </footer>
          </main>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT: ORDER TICKET / CART PANEL
             ───────────────────────────────────────────────────────────── */}
          <aside className="w-80 lg:w-96 bg-white dark:bg-[#111622] border-l border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 shadow-sm z-10">
            
            {/* 1. Ticket Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 space-y-2.5">
              {/* Customer Selector */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <LuUser size={15} />
                  </div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none truncate w-32"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomerTier(customerTier === 'VIP' ? 'Regular' : 'VIP')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition cursor-pointer ${
                      customerTier === 'VIP'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    ★ {customerTier}
                  </button>
                </div>
              </div>

              {/* Order Meta: Ticket Number & Fulfillment dropdown */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                  {ticketNumber}
                </span>

                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value)}
                  className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 focus:outline-none cursor-pointer"
                >
                  <option value="In-Store Bag">In-Store Bag</option>
                  <option value="Takeaway">Takeaway</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>
            </div>

            {/* 2. Scrollable Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <LuReceipt size={26} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No items on ticket
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
                        Rs. {item.unit_price.toLocaleString()}
                      </span>
                    </div>

                    {/* Stepper Buttons [- 1 +] */}
                    <div className="flex items-center gap-1 bg-white dark:bg-[#111622] rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product_id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-rose-500 transition cursor-pointer"
                      >
                        <LuMinus size={11} />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-800 dark:text-white font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product_id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition cursor-pointer"
                      >
                        <LuPlus size={11} />
                      </button>
                    </div>

                    {/* Line Total & Delete */}
                    <div className="text-right shrink-0">
                      <span className="block font-bold text-xs text-slate-900 dark:text-white font-mono">
                        Rs. {item.line_total.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product_id)}
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
                    Rs. {subtotal.toLocaleString()}
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
                    - Rs. {discountAmount.toLocaleString()}
                  </span>
                </div>

                {/* Tax Row */}
                {taxPercent > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({taxPercent}%)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      + Rs. {taxAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                    Total
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Hold, Clear & Place Order */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={handleOpenPayment}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-98"
                  style={{
                    backgroundColor: accentColor,
                    color: contrastText
                  }}
                >
                  <MdPointOfSale size={18} />
                  <span>Place Order [F9] • Rs. {grandTotal.toLocaleString()}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleHoldOrder}
                    className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <LuPauseCircle size={14} />
                    <span>Hold [F4]</span>
                  </button>

                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleClearCart}
                    className="py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <LuTrash2 size={14} />
                    <span>Clear Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
            </>
          )}

          {activeView === 'transactions' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSOrders embedded onBack={() => setActiveView('register')} />
            </div>
          )}

          {activeView === 'catalog' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSCatalog embedded onBack={() => { setActiveView('register'); loadCatalog(); }} />
            </div>
          )}

          {activeView === 'returns' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSOrders embedded isReturnsOnly onBack={() => setActiveView('register')} />
            </div>
          )}

          {activeView === 'summary' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSRegister embedded onBack={() => { setActiveView('register'); setActiveShift(posService.getActiveShift()); }} />
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: PAYMENT TENDER & CHECKOUT
         ───────────────────────────────────────────────────────────── */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <MdPointOfSale className="text-primary text-xl" />
                  <span>Payment Tender</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ticket {ticketNumber} • {customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Payment Method Selector */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Cash', label: 'Cash', icon: LuBanknote },
                  { id: 'Card', label: 'Card (POS)', icon: LuCreditCard },
                  { id: 'Digital', label: 'Digital / QR', icon: LuQrCode },
                  { id: 'Split', label: 'Split', icon: LuCoins }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: `${accentColor}18`, color: accentColor }
                          : undefined
                      }
                    >
                      <Icon size={20} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Total Due Display */}
              <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Net Amount Due
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    Rs. {grandTotal.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary">
                  {cartItems.length} items
                </span>
              </div>

              {/* Cash Tendered & Quick Buttons */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cash Tendered from Customer:
                  </label>
                  <input
                    type="number"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    placeholder="Enter cash given"
                    className="w-full px-4 py-2.5 text-base font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                  />

                  {/* Quick Denominations */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { label: 'Exact', val: grandTotal },
                      { label: '+500', val: Math.ceil(grandTotal / 500) * 500 },
                      { label: '+1,000', val: Math.ceil(grandTotal / 1000) * 1000 },
                      { label: '+5,000', val: Math.ceil(grandTotal / 5000) * 5000 }
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashTendered(btn.val)}
                        className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Pill */}
                  <div className="rounded-xl p-3.5 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Change Due to Customer:
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-300 font-mono">
                      Rs. {changeDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessingSale}
                onClick={handleCompleteOrder}
                className="flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wide text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                <LuCheck size={16} />
                <span>
                  {isProcessingSale ? 'Finalizing...' : 'Complete Sale & Print Receipt'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: THERMAL RECEIPT PREVIEW (80mm & 58mm)
         ───────────────────────────────────────────────────────────── */}
      {isReceiptModalOpen && completedOrder && (
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
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
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
                    <span className="font-bold">{completedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(completedOrder.created_at).toLocaleDateString()} {new Date(completedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{completedOrder.cashier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">{completedOrder.customer_name}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-bold pb-1 border-b border-dotted border-black/40">
                    <span className="w-1/2">Item</span>
                    <span className="w-1/4 text-center">Qty</span>
                    <span className="w-1/4 text-right">Total</span>
                  </div>

                  {completedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="w-1/2 truncate font-semibold" title={it.product_name}>
                        {it.product_name}
                      </span>
                      <span className="w-1/4 text-center font-mono">
                        {it.quantity} x {it.unit_price}
                      </span>
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
                    <span className="font-mono">Rs. {completedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {completedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({completedOrder.discount_percentage}%):</span>
                      <span className="font-mono">- Rs. {completedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {completedOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({completedOrder.tax_percentage}%):</span>
                      <span className="font-mono">+ Rs. {completedOrder.tax_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-dotted border-black">
                    <span>TOTAL:</span>
                    <span className="font-mono">Rs. {completedOrder.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Tender & Change */}
                <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Tendered ({completedOrder.payment_method}):</span>
                    <span className="font-mono">Rs. {completedOrder.cash_tendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Due:</span>
                    <span className="font-mono">Rs. {completedOrder.change_due.toLocaleString()}</span>
                  </div>
                </div>

                {/* Barcode & Footer Disclaimer */}
                <div className="pt-3 text-center space-y-2">
                  <div className="flex justify-center">
                    <Barcode
                      value={completedOrder.order_number}
                      width={1.2}
                      height={35}
                      fontSize={10}
                      margin={0}
                    />
                  </div>
                  <p className="text-[9px] leading-tight text-slate-600">
                    {posConfig.footer_message}
                  </p>
                  <p className="text-[8px] text-slate-400">Powered by Atelier POS Terminal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: HELD ORDERS DRAWER
         ───────────────────────────────────────────────────────────── */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuPauseCircle className="text-amber-500 text-lg" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Held / Parked Tickets ({heldOrders.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {heldOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No tickets currently held.
                </div>
              ) : (
                heldOrders.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs text-primary">
                        {h.ticket_number}
                      </span>
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                        {h.ticket_label}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Cashier: {h.cashier_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                        Rs. {h.subtotal.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResumeHeldOrder(h)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this held ticket?')) {
                            posService.removeHeldOrder(h.id);
                            setHeldOrders(posService.getHeldOrders());
                            toast.success('Held ticket discarded');
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: CASH DRAWER FLOAT & CASH IN / OUT
         ───────────────────────────────────────────────────────────── */}
      {isDrawerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuBanknote className="text-emerald-500 text-lg" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Cash Drawer Operations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Drawer Live Balance Card */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Calculated Drawer Float & Cash
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  Rs. {(activeShift?.expected_cash || 24500).toLocaleString()}
                </div>
              </div>

              {/* Movement Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerMovementType('in')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    drawerMovementType === 'in'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LuArrowDownLeft size={14} />
                  <span>Cash In (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerMovementType('out')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    drawerMovementType === 'out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LuArrowUpRight size={14} />
                  <span>Cash Out (-)</span>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (Rs.):
                </label>
                <input
                  type="number"
                  value={drawerAmount || ''}
                  onChange={(e) => setDrawerAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reason / Description:
                </label>
                <input
                  type="text"
                  value={drawerReason}
                  onChange={(e) => setDrawerReason(e.target.value)}
                  placeholder="e.g. Petty cash refill, vendor cash drop"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleDrawerMovement}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Record Cash {drawerMovementType.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OVERLAY: SCREEN LOCK TERMINAL
         ───────────────────────────────────────────────────────────── */}
      {isLocked && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white p-6 animate-fadeIn">
          <div className="text-center space-y-4 max-w-sm w-full">
            <div
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center font-bold text-white shadow-2xl animate-pulse"
              style={{ backgroundColor: accentColor }}
            >
              <LuLock size={38} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">{displayBrand}</h2>
              <p className="text-xs text-slate-400">
                Terminal #{posConfig.terminal_name} • Session Locked
              </p>
              <p className="text-[11px] text-emerald-400 font-mono">
                Cashier: {currentCashierName}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleUnlock}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white transition flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <LuUnlock size={16} />
                <span>Unlock Terminal Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSTerminal;
