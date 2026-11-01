import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import {
  LuStore,
  LuPackage,
  LuTruck,
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
  LuArrowRightLeft,
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
  LuCalendar,
  LuCheckCircle2,
  LuBarChart3
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
  const [ticketNumber, setTicketNumber] = useState<string>(() => {
    const shift = posService.getActiveShift();
    if (!shift) return '';
    return posService.getNextOrderNumber(shift.business_date);
  });
  const [customerName, setCustomerName] = useState<string>(posConfig.default_customer_name || 'Walk-in Customer');
  const [customerTier, setCustomerTier] = useState<'VIP' | 'Regular' | 'Retail'>('VIP');
  const [fulfillmentType, setFulfillmentType] = useState<string>('');
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState<boolean>(false);
  const [pendingOpenPaymentAfterFulfillment, setPendingOpenPaymentAfterFulfillment] = useState<boolean>(false);
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

  // Cash Drawer & Day Session Modal State
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'open_day' | 'close_day' | 'movement'>('open_day');

  // Day Open State
  const [dayOpenDate, setDayOpenDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dayOpenPettyCash, setDayOpenPettyCash] = useState<number>(() => posService.getLastClosingPettyCash());
  const [dayOpenCashIn, setDayOpenCashIn] = useState<number>(0);
  const [dayOpenCashOut, setDayOpenCashOut] = useState<number>(0);
  const [pettyCashSource, setPettyCashSource] = useState<string>(() => {
    const lookup = posService.getPettyCashForDate(new Date().toISOString().split('T')[0]);
    return lookup.isFound ? `Auto-filled from ${lookup.foundDate} close` : 'Manual start / First day';
  });

  const handleDayOpenDateChange = (newDate: string) => {
    setDayOpenDate(newDate);
    const lookup = posService.getPettyCashForDate(newDate);
    setDayOpenPettyCash(lookup.amount);
    setPettyCashSource(lookup.isFound ? `Auto-filled from ${lookup.foundDate} close` : 'No prior shift before this date (enter manually)');
  };

  // Day Close State
  const [dayCloseDate, setDayCloseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dayCloseCashOut, setDayCloseCashOut] = useState<number>(0);
  const [dayCloseCashIn, setDayCloseCashIn] = useState<number>(0);
  const [dayCloseNotes, setDayCloseNotes] = useState<string>('');

  // Quick Movement State
  const [drawerMovementType, setDrawerMovementType] = useState<'in' | 'out'>('in');
  const [drawerAmount, setDrawerAmount] = useState<number>(0);
  const [drawerReason, setDrawerReason] = useState<string>('');

  const handleOpenDrawerModal = () => {
    const shift = posService.getActiveShift();
    setActiveShift(shift);
    if (!shift) {
      setDrawerTab('open_day');
      const todayStr = new Date().toISOString().split('T')[0];
      setDayOpenDate(todayStr);
      const lookup = posService.getPettyCashForDate(todayStr);
      setDayOpenPettyCash(lookup.amount);
      setPettyCashSource(lookup.isFound ? `Auto-filled from ${lookup.foundDate} close` : 'No prior shift before this date (enter manually)');
      setDayOpenCashIn(0);
      setDayOpenCashOut(0);
    } else {
      setDrawerTab('movement');
      setDayCloseCashOut(0);
      setDayCloseCashIn(0);
    }
    setIsDrawerModalOpen(true);
  };

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

      // When fulfillment modal is open, quick-pick 1, 2, 3 (Keyboard friendly across top row & numpad)
      if (isFulfillmentModalOpen) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          handleSelectFulfillment('In-Store Bag');
          return;
        } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          handleSelectFulfillment('Takeaway');
          return;
        } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          handleSelectFulfillment('Delivery');
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCloseFulfillmentModal();
          return;
        }
      }

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
        if (isFulfillmentModalOpen) handleCloseFulfillmentModal();
        else if (isReceiptModalOpen) setIsReceiptModalOpen(false);
        else if (isPayModalOpen) setIsPayModalOpen(false);
        else if (isHeldModalOpen) setIsHeldModalOpen(false);
        else if (isDrawerModalOpen) setIsDrawerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isLocked, isPayModalOpen, isReceiptModalOpen, isHeldModalOpen, isDrawerModalOpen, isFulfillmentModalOpen, pendingOpenPaymentAfterFulfillment, grandTotal]);

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

  // Packaging & Handover selection handlers
  const handleSelectFulfillment = (type: string) => {
    setFulfillmentType(type);
    setIsFulfillmentModalOpen(false);
    playTone('success');
    toast.success(`Packaging mode: ${type}`);
    if (pendingOpenPaymentAfterFulfillment) {
      setPendingOpenPaymentAfterFulfillment(false);
      setCashTendered(grandTotal);
      setIsPayModalOpen(true);
    }
  };

  const handleCloseFulfillmentModal = () => {
    setIsFulfillmentModalOpen(false);
    setPendingOpenPaymentAfterFulfillment(false);
    // Explicitly remains unselected if closed without choosing
  };

  // Guard check: Cash Drawer & Day session must be open before any sale activity
  const requireOpenDrawer = (): boolean => {
    if (!activeShift) {
      playTone('warning');
      toast.error('Please open the drawer first! Business day is closed.', {
        id: 'drawer-closed-guard',
        duration: 4000,
        icon: '🔒'
      });
      handleOpenDrawerModal();
      return false;
    }
    return true;
  };

  // Add Item to Cart
  const handleAddToCart = (product: PosProductItem) => {
    if (!requireOpenDrawer()) return;
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
      setFulfillmentType('');
      toast.success('Cart cleared');
    }
  };

  // Barcode / Fast Input Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireOpenDrawer()) return;
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
    setTicketNumber(activeShift ? posService.getNextOrderNumber(activeShift.business_date) : '');
    playTone('notification');
    toast.success(`Order ${ticketNumber} parked into Held Orders`);
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
    if (!requireOpenDrawer()) return;
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Add products to ticket first.');
      return;
    }
    if (!fulfillmentType) {
      playTone('warning');
      setPendingOpenPaymentAfterFulfillment(true);
      setIsFulfillmentModalOpen(true);
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
        order_number: ticketNumber,
        cashier_name: userEmail?.split('@')[0] || 'Cashier',
        customer_name: customerName,
        customer_tier: customerTier,
        terminal_code: posConfig.terminal_name || 'Terminal 01',
        fulfillment_type: fulfillmentType || 'In-Store Bag',
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
      const updatedShift = posService.getActiveShift();
      setActiveShift(updatedShift);
      setCartItems([]);
      setTicketNumber(updatedShift ? posService.getNextOrderNumber(updatedShift.business_date) : '');
      setDiscountPercent(0);
      setFulfillmentType('');
    } catch (err) {
      console.error('Failed to complete sale:', err);
      toast.error('Failed to save POS order');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Open Day Submit
  const handleOpenDaySubmit = async () => {
    try {
      const shift = await posService.openDayShift({
        businessDate: dayOpenDate,
        cashierName: userEmail?.split('@')[0] || 'Alex Rivera',
        openingPettyCash: dayOpenPettyCash,
        cashIn: dayOpenCashIn,
        cashOut: dayOpenCashOut,
        terminalCode: posConfig.terminal_name
      });
      setActiveShift(shift);
      setTicketNumber(posService.getNextOrderNumber(shift.business_date));
      setIsDrawerModalOpen(false);
      playTone('success');
      toast.success(`Day opened for ${dayOpenDate}! Opening Balance: Rs. ${shift.opening_float.toLocaleString()}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to open day');
    }
  };

  // Close Day Submit
  const handleCloseDaySubmit = async () => {
    if (!activeShift) {
      toast.error('No active shift open to close.');
      return;
    }
    try {
      const closed = await posService.closeDayShift({
        shiftId: activeShift.id,
        cashOut: dayCloseCashOut,
        cashIn: dayCloseCashIn,
        closingNotes: dayCloseNotes
      });
      setActiveShift(null);
      setTicketNumber('');
      setCartItems([]);
      setIsDrawerModalOpen(false);
      playTone('success');
      toast.success(`Day closed! Remaining Petty Cash: Rs. ${(closed.closing_petty_cash || 0).toLocaleString()} saved for next day.`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to close day');
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
                <span>Held Orders</span>
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
              onClick={handleOpenDrawerModal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LuBanknote size={17} className="text-emerald-500" />
                <span>Cash Drawer</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${activeShift ? 'text-slate-400' : 'text-amber-500'}`}>
                {activeShift ? `Rs. ${(activeShift.expected_cash || 0).toLocaleString()}` : 'Day Closed'}
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
                <LuBarChart3 size={17} className="text-indigo-500" />
                <span>Reports & Daily Summary</span>
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

            {/* Quick Action: + New Sale */}
            <button
              type="button"
              onClick={() => {
                if (!requireOpenDrawer()) return;
                if (cartItems.length > 0 && !window.confirm('Start new fresh sale order? Current items will be reset.')) return;
                setCartItems([]);
                setTicketNumber(activeShift ? posService.getNextOrderNumber(activeShift.business_date) : '');
                setFulfillmentType('');
                toast.success('New sale order started');
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <LuPlus size={14} className="text-primary" />
              <span>+ New Sale</span>
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
              title="Held orders"
            >
              <LuPauseCircle size={15} />
              <span className="hidden sm:inline">Held</span>
              <span>({heldOrders.length})</span>
            </button>

            {/* Quick Drawer */}
            <button
              type="button"
              onClick={handleOpenDrawerModal}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                activeShift
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
              title="Cash drawer & business day operations"
            >
              <LuBanknote size={15} />
              <span>Drawer</span>
              {!activeShift && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono font-bold">
                  Closed
                </span>
              )}
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
                {activeShift ? (
                  <span className="block text-[10px] text-emerald-500 font-semibold">
                    Shift Active
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenDrawerModal}
                    className="block text-[10px] text-amber-500 font-bold hover:underline cursor-pointer"
                  >
                    🔒 Day Closed (Open)
                  </button>
                )}
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
            
            {/* Warning Banner when Cash Drawer / Day is closed */}
            {!activeShift && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <LuLock size={15} className="text-amber-500 shrink-0" />
                  <span>Cash Drawer & Day Session are closed. Please open the drawer first to create sales.</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenDrawerModal}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <LuUnlock size={13} />
                  <span>Open Drawer First</span>
                </button>
              </div>
            )}

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
                    {activeShift ? `Rs. ${(activeShift.expected_cash || 0).toLocaleString()}` : 'Closed (Day Not Open)'}
                  </strong>
                </span>

                <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>

                <span className="hidden sm:flex items-center gap-1.5">
                  <LuReceipt className="text-sky-500 text-sm" />
                  <span>Sales Today:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">
                    {posService.getAllOrders().length} Orders
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
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order:</span>
                  {activeShift && ticketNumber ? (
                    <span className="font-mono font-black text-slate-800 dark:text-slate-100">
                      {ticketNumber}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Day Closed (No Order)
                    </span>
                  )}
                </div>

                {activeShift ? (
                  fulfillmentType ? (
                    <button
                      type="button"
                      onClick={() => setIsFulfillmentModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs hover:border-primary/60 bg-white dark:bg-[#161D2B] border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 group active:scale-95"
                      title="Click to change order handover mode"
                    >
                      {fulfillmentType === 'Delivery' ? (
                        <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                          <LuTruck size={12} />
                        </span>
                      ) : fulfillmentType === 'Takeaway' ? (
                        <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <LuPackage size={12} />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <LuShoppingBag size={12} />
                        </span>
                      )}
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {fulfillmentType}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary dark:text-primary-light bg-primary/10 px-1.5 py-0.5 rounded-md group-hover:bg-primary group-hover:text-white transition-colors ml-0.5">
                        <LuArrowRightLeft size={9} />
                        <span>Change</span>
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsFulfillmentModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-150 cursor-pointer shadow-2xs group"
                      title="Packaging not selected. Click to choose handover mode."
                    >
                      <LuShoppingBag size={13} className="text-amber-500 animate-bounce" />
                      <span>Select Handover</span>
                      <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-md group-hover:scale-105 transition-transform">
                        Unselected
                      </span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenDrawerModal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
                  >
                    <LuUnlock size={11} />
                    <span>Open Day</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Scrollable Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {!activeShift ? (
                <div
                  onClick={handleOpenDrawerModal}
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
                    onClick={handleOpenDrawerModal}
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
                {!activeShift ? (
                  <button
                    type="button"
                    onClick={handleOpenDrawerModal}
                    className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                  >
                    <LuLock size={16} />
                    <span>Please Open Drawer First</span>
                  </button>
                ) : (
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
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleHoldOrder}
                    className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <LuPauseCircle size={14} />
                    <span>Hold Order [F4]</span>
                  </button>

                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleClearCart}
                    className="py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <LuTrash2 size={14} />
                    <span>Clear Order</span>
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
                  Order {ticketNumber} • {customerName}
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
                    <span>Order #:</span>
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
          MODAL: ORDER PACKAGING & HANDOVER MODE (HORIZONTAL & KEYBOARD FRIENDLY)
         ───────────────────────────────────────────────────────────── */}
      {isFulfillmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={handleCloseFulfillmentModal}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <LuShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    Select Packaging & Handover Mode
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose how this order will be handed over to the customer. Press <kbd className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">1</kbd>, <kbd className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">2</kbd>, or <kbd className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">3</kbd> to quick-select.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseFulfillmentModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Close (Esc) - Remains unselected"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Modal Body: 3 Interactive Option Cards HORIZONTALLY */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: In-Store Bag */}
              <button
                type="button"
                onClick={() => handleSelectFulfillment('In-Store Bag')}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                  fulfillmentType === 'In-Store Bag'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-emerald-500/60 hover:bg-emerald-500/5'
                }`}
              >
                {/* Top Row: Hotkey Tag & Active Indicator */}
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Key</span> [ 1 ]
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      fulfillmentType === 'In-Store Bag'
                        ? 'border-emerald-500 bg-emerald-500 text-white scale-110 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 group-hover:border-emerald-400'
                    }`}
                  >
                    {fulfillmentType === 'In-Store Bag' && <LuCheck size={14} className="stroke-[3]" />}
                  </div>
                </div>

                {/* Center Icon */}
                <div className="my-2">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 ${
                      fulfillmentType === 'In-Store Bag'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                    }`}
                  >
                    <LuShoppingBag size={28} />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      In-Store Bag
                    </h4>
                    {fulfillmentType === 'In-Store Bag' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Boutique shopping bag handed over immediately to walk-in customer.
                  </p>
                </div>

                {/* Bottom Action Hint */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className={fulfillmentType === 'In-Store Bag' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}>
                    {fulfillmentType === 'In-Store Bag' ? '✓ Currently Selected' : 'Press 1 or Click'}
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>

              {/* Option 2: Takeaway / Shop Pickup */}
              <button
                type="button"
                onClick={() => handleSelectFulfillment('Takeaway')}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                  fulfillmentType === 'Takeaway'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-amber-500/60 hover:bg-amber-500/5'
                }`}
              >
                {/* Top Row: Hotkey Tag & Active Indicator */}
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Key</span> [ 2 ]
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      fulfillmentType === 'Takeaway'
                        ? 'border-amber-500 bg-amber-500 text-white scale-110 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 group-hover:border-amber-400'
                    }`}
                  >
                    {fulfillmentType === 'Takeaway' && <LuCheck size={14} className="stroke-[3]" />}
                  </div>
                </div>

                {/* Center Icon */}
                <div className="my-2">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 ${
                      fulfillmentType === 'Takeaway'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                    }`}
                  >
                    <LuPackage size={28} />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Takeaway / Pickup
                    </h4>
                    {fulfillmentType === 'Takeaway' && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Packed parcel or boxed suit reserved for customer pickup or takeaway.
                  </p>
                </div>

                {/* Bottom Action Hint */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className={fulfillmentType === 'Takeaway' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-500 transition-colors'}>
                    {fulfillmentType === 'Takeaway' ? '✓ Currently Selected' : 'Press 2 or Click'}
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>

              {/* Option 3: Delivery / Courier */}
              <button
                type="button"
                onClick={() => handleSelectFulfillment('Delivery')}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                  fulfillmentType === 'Delivery'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-primary/60 hover:bg-primary/5'
                }`}
              >
                {/* Top Row: Hotkey Tag & Active Indicator */}
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-primary/15 text-primary dark:text-primary-light border border-primary/30 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Key</span> [ 3 ]
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      fulfillmentType === 'Delivery'
                        ? 'border-primary bg-primary text-white scale-110 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 group-hover:border-primary/60'
                    }`}
                  >
                    {fulfillmentType === 'Delivery' && <LuCheck size={14} className="stroke-[3]" />}
                  </div>
                </div>

                {/* Center Icon */}
                <div className="my-2">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 ${
                      fulfillmentType === 'Delivery'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                    }`}
                  >
                    <LuTruck size={28} />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Delivery / Courier
                    </h4>
                    {fulfillmentType === 'Delivery' && (
                      <span className="text-[10px] font-bold text-primary dark:text-primary-light bg-primary/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Dispatched by rider, bike delivery, or courier service with tracking details.
                  </p>
                </div>

                {/* Bottom Action Hint */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className={fulfillmentType === 'Delivery' ? 'text-primary dark:text-primary-light' : 'text-slate-400 group-hover:text-primary transition-colors'}>
                    {fulfillmentType === 'Delivery' ? '✓ Currently Selected' : 'Press 3 or Click'}
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-[#0c1017] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">Keyboard Hotkeys:</span>
                <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400">[1] Bag</span>
                <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-amber-600 dark:text-amber-400">[2] Takeaway</span>
                <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-primary">[3] Delivery</span>
              </div>
              <button
                type="button"
                onClick={handleCloseFulfillmentModal}
                className="px-4 py-1.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Close (Esc)
              </button>
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
                  Parked / Held Orders ({heldOrders.length})
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
                  No orders currently held.
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
                            toast.success('Held order discarded');
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
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <LuBanknote size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                    Cash Drawer & Day Session
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Day Open, Day Close petty cash reconciliation & cash in/out
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-1.5 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDrawerTab('open_day')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'open_day'
                    ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={drawerTab === 'open_day' ? { borderBottom: `2px solid ${accentColor}` } : undefined}
              >
                <span>Day Open</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('close_day')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'close_day'
                    ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={drawerTab === 'close_day' ? { borderBottom: `2px solid ${accentColor}` } : undefined}
              >
                <span>Day Close</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('movement')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'movement'
                    ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={drawerTab === 'movement' ? { borderBottom: `2px solid ${accentColor}` } : undefined}
              >
                <span>Cash In / Out</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* TAB 1: DAY OPEN */}
              {drawerTab === 'open_day' && (
                <div className="space-y-4">
                  {activeShift ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <LuCheckCircle2 size={16} />
                          <span>Shift #{activeShift.session_number} is Currently Open</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          {activeShift.business_date || new Date(activeShift.opened_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Opening Float: <strong>Rs. {activeShift.opening_float.toLocaleString()}</strong> (Petty Cash: Rs. {(activeShift.opening_petty_cash || 0).toLocaleString()}, Cash In: Rs. {(activeShift.opening_cash_in || 0).toLocaleString()}).
                      </p>
                      <button
                        type="button"
                        onClick={() => setDrawerTab('close_day')}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-xs cursor-pointer"
                        style={{ backgroundColor: accentColor }}
                      >
                        Proceed to Day Close ➔
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Date Select */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <LuCalendar size={13} className="text-primary" />
                          <span>Business Date:</span>
                        </label>
                        <input
                          type="date"
                          value={dayOpenDate}
                          onChange={(e) => handleDayOpenDateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                      </div>

                      {/* Opening Petty Cash (Brought Forward from Last Working Day) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Petty Cash (Remaining from Last Close):
                          </label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {pettyCashSource}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={dayOpenPettyCash || ''}
                          onChange={(e) => setDayOpenPettyCash(Number(e.target.value) || 0)}
                          placeholder="e.g. 20000"
                          className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Cash In */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Cash In / Float Added (Rs.):
                        </label>
                        <input
                          type="number"
                          value={dayOpenCashIn || ''}
                          onChange={(e) => setDayOpenCashIn(Number(e.target.value) || 0)}
                          placeholder="e.g. 5000"
                          className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Optional Cash Out */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Cash Out (Optional Morning Drop / Expense) (Rs.):</span>
                          <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                        </label>
                        <input
                          type="number"
                          value={dayOpenCashOut || ''}
                          onChange={(e) => setDayOpenCashOut(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Live Calculation Preview */}
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                          <span>Petty Cash: Rs. {dayOpenPettyCash.toLocaleString()}</span>
                          <span>+ Cash In: Rs. {dayOpenCashIn.toLocaleString()}</span>
                          <span>- Cash Out: Rs. {dayOpenCashOut.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Total Opening Balance:
                          </span>
                          <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                            Rs. {(dayOpenPettyCash + dayOpenCashIn - dayOpenCashOut).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="button"
                        onClick={handleOpenDaySubmit}
                        className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition shadow-sm cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        Confirm & Open Day (Rs. {(dayOpenPettyCash + dayOpenCashIn - dayOpenCashOut).toLocaleString()})
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: DAY CLOSE */}
              {drawerTab === 'close_day' && (
                <div className="space-y-4">
                  {!activeShift ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        No active shift is currently open.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Please open the day first to record sales and reconcile closing cash.
                      </p>
                      <button
                        type="button"
                        onClick={() => setDrawerTab('open_day')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-xs cursor-pointer"
                        style={{ backgroundColor: accentColor }}
                      >
                        Go to Day Open ➔
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Date Select */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <LuCalendar size={13} className="text-primary" />
                          <span>Closing Date:</span>
                        </label>
                        <input
                          type="date"
                          value={dayCloseDate}
                          onChange={(e) => setDayCloseDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                      </div>

                      {/* Day Sales & Opening Stats */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Opening Petty Cash
                          </span>
                          <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                            Rs. {(activeShift.opening_petty_cash ?? activeShift.opening_float).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                            Today's Cash Sales
                          </span>
                          <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            Rs. {(activeShift.cash_sales || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Cash Out (Main - Bank Deposit / Owner Payout) */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Cash Out (Take Home / Deposit to Owner / Bank) (Rs.):
                        </label>
                        <input
                          type="number"
                          value={dayCloseCashOut || ''}
                          onChange={(e) => setDayCloseCashOut(Number(e.target.value) || 0)}
                          placeholder="e.g. 50000"
                          className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Optional Cash In */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Cash In (Optional late return / recovery) (Rs.):</span>
                          <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                        </label>
                        <input
                          type="number"
                          value={dayCloseCashIn || ''}
                          onChange={(e) => setDayCloseCashIn(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Formula Box: (The Sale - Cash Out + (if Cash In)) + Opening Petty Cash = Remaining Petty Cash */}
                      {(() => {
                        const sales = Number(activeShift.cash_sales) || 0;
                        const openPetty = Number(activeShift.opening_petty_cash ?? activeShift.opening_float) || 0;
                        const closingPetty = Math.max(0, sales - dayCloseCashOut + dayCloseCashIn + openPetty);

                        return (
                          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                              Closing Formula Calculation
                            </div>
                            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                              Sales (Rs. {sales.toLocaleString()}) - Cash Out (Rs. {dayCloseCashOut.toLocaleString()}) + Cash In (Rs. {dayCloseCashIn.toLocaleString()}) + Opening Petty (Rs. {openPetty.toLocaleString()})
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                Remaining Petty Cash (for Tomorrow):
                              </span>
                              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                                Rs. {closingPetty.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ This remaining amount will automatically fill tomorrow's Day Open.
                            </p>
                          </div>
                        );
                      })()}

                      {/* Closing Notes */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Closing Notes / Handover:
                        </label>
                        <input
                          type="text"
                          value={dayCloseNotes}
                          onChange={(e) => setDayCloseNotes(e.target.value)}
                          placeholder="e.g. Handed Rs. 40,000 to owner, Rs. 15,000 kept in drawer"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="button"
                        onClick={handleCloseDaySubmit}
                        className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition shadow-sm cursor-pointer hover:opacity-90 bg-rose-600 hover:bg-rose-700"
                      >
                        Close Day & Finalize Petty Cash
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: QUICK CASH IN / OUT (DURING DAY) */}
              {drawerTab === 'movement' && (
                <div className="space-y-4">
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
                      placeholder="e.g. Petty cash refill, vendor cash drop, tea/refreshment"
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
              )}
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
