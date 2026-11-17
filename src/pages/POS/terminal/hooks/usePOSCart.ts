import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  posService,
  PosProductItem,
  PosCategoryItem,
  PosOrderItem,
  PosHeldOrder,
  PosSettings,
  PosShift,
} from '../../../../service/posService';

interface UsePOSCartProps {
  currentTerminalSlug: string;
  posConfig: PosSettings;
  activeShift: PosShift | null;
  displayCashierName: string;
  requireOpenDrawer: () => boolean;
  playTone: (type: 'notification' | 'success' | 'scan' | 'warning' | 'delete') => void;
  showConfirm: (args: any) => void;
  setIsPayModalOpen: (open: boolean) => void;
  setCashTendered: (amt: number) => void;
}

export const usePOSCart = ({
  currentTerminalSlug,
  posConfig,
  activeShift,
  displayCashierName,
  requireOpenDrawer,
  playTone,
  showConfirm,
  setIsPayModalOpen,
  setCashTendered,
}: UsePOSCartProps) => {
  const [products, setProducts] = useState<PosProductItem[]>([]);
  const [categories, setCategories] = useState<PosCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortByDate, setSortByDate] = useState<'newest' | 'oldest'>('newest');
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const [prods, cats] = await Promise.all([posService.getProducts(), posService.getCategories()]);
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

  useEffect(() => {
    const handleCatalogUpdate = () => {
      loadCatalog();
    };
    window.addEventListener('pos_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('pos_catalog_updated', handleCatalogUpdate);
  }, []);

  const isProductInCategory = (p: PosProductItem, cat: PosCategoryItem) => {
    const leafMatch = p.category.toLowerCase() === cat.name.toLowerCase();
    if (!leafMatch) return false;
    if (cat.parent_name && p.parent_category) {
      return p.parent_category.toLowerCase() === cat.parent_name.toLowerCase();
    }
    return true;
  };

  const filteredProducts = useMemo(() => {
    const activeCat = categories.find((c) => c.id === selectedCategory || c.name === selectedCategory);

    const filtered = products.filter((p) => {
      if (p.show_in_pos === false) return false;
      if (!posService.isProductVisibleOnCounter(p, currentTerminalSlug)) return false;
      const matchCat =
        selectedCategory === 'All' ||
        (activeCat ? isProductInCategory(p, activeCat) : p.category.toLowerCase() === selectedCategory.toLowerCase());
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
  }, [products, categories, selectedCategory, searchQuery, sortByDate, currentTerminalSlug]);

  const resolveInitialFulfillment = (config: PosSettings) => {
    const def = config?.default_fulfillment;
    if (!def || def === 'None' || def.toLowerCase() === 'unselected') return '';
    return def;
  };

  const [cartItems, setCartItems] = useState<PosOrderItem[]>([]);
  const [ticketNumber, setTicketNumber] = useState<string>(() => {
    if (!activeShift) return '';
    return posService.getNextOrderNumber(activeShift.business_date);
  });
  const [customerName, setCustomerName] = useState<string>(posConfig.default_customer_name || 'Walk-in Customer');
  const [customerTier, setCustomerTier] = useState<'VIP' | 'Regular' | 'Retail'>('VIP');
  const [fulfillmentType, setFulfillmentType] = useState<string>(() => resolveInitialFulfillment(posConfig));
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState<boolean>(false);
  const [pendingOpenPaymentAfterFulfillment, setPendingOpenPaymentAfterFulfillment] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(posConfig.default_tax_rate || 0);

  const [heldOrders, setHeldOrders] = useState<PosHeldOrder[]>(() => posService.getHeldOrders());
  const [isHeldModalOpen, setIsHeldModalOpen] = useState<boolean>(false);
  const [isHoldNoteModalOpen, setIsHoldNoteModalOpen] = useState<boolean>(false);
  const [holdNoteInput, setHoldNoteInput] = useState<string>('');
  const [selectedHeldIds, setSelectedHeldIds] = useState<string[]>([]);
  const [isHeldSelectMode, setIsHeldSelectMode] = useState<boolean>(false);
  const [swipedHeldId, setSwipedHeldId] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
          line_total: newQty * existing.unit_price - existing.discount_amount,
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
        line_total: product.retail_price,
      };
      return [...prev, newItem];
    });
  };

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
              line_total: newQty * it.unit_price - it.discount_amount,
            };
          }
          return it;
        })
        .filter(Boolean) as PosOrderItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    playTone('delete');
    setCartItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    showConfirm({
      title: 'Clear Current Order',
      message: 'Are you sure you want to remove all items from the current cart?',
      confirmLabel: 'Clear Cart',
      isDestructive: true,
      onConfirm: () => {
        playTone('delete');
        setCartItems([]);
        setDiscountPercent(0);
        setFulfillmentType(resolveInitialFulfillment(posConfig));
        toast.success('Order cart cleared');
      },
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireOpenDrawer()) return;
    const query = searchQuery.trim();
    if (!query) return;

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

  const handleOpenHoldModal = () => {
    if (!requireOpenDrawer()) return;
    if (cartItems.length === 0) {
      toast.error('No items in current order to hold.');
      return;
    }
    setHoldNoteInput('');
    setIsHoldNoteModalOpen(true);
  };

  const handleConfirmHoldOrder = (customNote?: string) => {
    if (cartItems.length === 0) return;
    const finalNote = (typeof customNote === 'string' ? customNote : holdNoteInput).trim();
    const orderLabel = `${customerName} (${cartItems.length} items)`;

    posService.holdOrder({
      order_number: ticketNumber,
      order_label: orderLabel,
      note: finalNote,
      cashier_name: displayCashierName,
      items: cartItems,
      subtotal,
      discount_percent: discountPercent,
      fulfillment_type: fulfillmentType,
      customer_name: customerName,
      customer_tier: customerTier,
    });

    setHeldOrders(posService.getHeldOrders());
    setCartItems([]);
    setDiscountPercent(0);
    setFulfillmentType(resolveInitialFulfillment(posConfig));
    setTicketNumber(activeShift ? posService.getNextOrderNumber(activeShift.business_date) : '');
    setIsHoldNoteModalOpen(false);
    playTone('notification');
    toast.success(`Order ${ticketNumber} parked in Held Orders`);
  };

  const handleResumeHeldOrder = (held: PosHeldOrder) => {
    const resumeOrderNumber = held.order_number || held.ticket_number || '';

    if (cartItems.length > 0) {
      const activeLabel = `${customerName} (${cartItems.length} items)`;
      posService.holdOrder({
        order_number: ticketNumber,
        order_label: activeLabel,
        note: 'Auto-parked during order switch',
        cashier_name: displayCashierName,
        items: cartItems,
        subtotal,
        discount_percent: discountPercent,
        fulfillment_type: fulfillmentType,
        customer_name: customerName,
        customer_tier: customerTier,
      });
      toast.success(`Active order ${ticketNumber} auto-parked safely`);
    }

    setCartItems(held.items);
    setCustomerName(held.customer_name || 'Walk-in Customer');
    setCustomerTier((held.customer_tier as any) || 'VIP');
    setDiscountPercent(held.discount_percent || 0);
    setFulfillmentType(held.fulfillment_type || '');
    setTicketNumber(resumeOrderNumber);

    posService.removeHeldOrder(held.id);
    setHeldOrders(posService.getHeldOrders());
    setIsHeldModalOpen(false);
    playTone('notification');
    toast.success(`Resumed order ${resumeOrderNumber}`);
  };

  const handleDeleteHeldOrder = (heldId: string) => {
    posService.removeHeldOrder(heldId);
    setHeldOrders(posService.getHeldOrders());
    setSelectedHeldIds((prev) => prev.filter((id) => id !== heldId));
    playTone('delete');
    toast.success('Held order deleted');
  };

  const handleBatchDeleteHeldOrders = (ids: string[]) => {
    ids.forEach((id) => posService.removeHeldOrder(id));
    setHeldOrders(posService.getHeldOrders());
    setSelectedHeldIds([]);
    setIsHeldSelectMode(false);
    playTone('delete');
    toast.success(`Deleted ${ids.length} held orders`);
  };

  const handleSelectFulfillment = (type: string) => {
    setFulfillmentType(type);
    setIsFulfillmentModalOpen(false);
    playTone('success');
    if (type) {
      toast.success(`Packaging mode: ${type}`);
    } else {
      toast.success('Handover mode reset to Unselected');
    }
    if (pendingOpenPaymentAfterFulfillment) {
      setPendingOpenPaymentAfterFulfillment(false);
      setCashTendered(grandTotal);
      setIsPayModalOpen(true);
    }
  };

  const handleCloseFulfillmentModal = () => {
    setIsFulfillmentModalOpen(false);
    setPendingOpenPaymentAfterFulfillment(false);
  };

  const handleOpenPayment = () => {
    if (!requireOpenDrawer()) return;
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Add products to order first.');
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

  return {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortByDate,
    setSortByDate,
    loadingCatalog,
    loadCatalog,
    filteredProducts,
    cartItems,
    setCartItems,
    ticketNumber,
    setTicketNumber,
    customerName,
    setCustomerName,
    customerTier,
    setCustomerTier,
    fulfillmentType,
    setFulfillmentType,
    isFulfillmentModalOpen,
    setIsFulfillmentModalOpen,
    discountPercent,
    setDiscountPercent,
    taxPercent,
    setTaxPercent,
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
    heldOrders,
    setHeldOrders,
    isHeldModalOpen,
    setIsHeldModalOpen,
    isHoldNoteModalOpen,
    setIsHoldNoteModalOpen,
    holdNoteInput,
    setHoldNoteInput,
    selectedHeldIds,
    setSelectedHeldIds,
    isHeldSelectMode,
    setIsHeldSelectMode,
    swipedHeldId,
    setSwipedHeldId,
    barcodeInputRef,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleBarcodeSubmit,
    handleOpenHoldModal,
    handleConfirmHoldOrder,
    handleResumeHeldOrder,
    handleDeleteHeldOrder,
    handleBatchDeleteHeldOrders,
    handleSelectFulfillment,
    handleCloseFulfillmentModal,
    handleOpenPayment,
    resolveInitialFulfillment,
  };
};
