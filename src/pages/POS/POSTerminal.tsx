import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { posService } from '../../service/posService';

import { usePOSTerminalState } from './terminal/hooks/usePOSTerminalState';
import { usePOSCart } from './terminal/hooks/usePOSCart';
import { usePOSPayment } from './terminal/hooks/usePOSPayment';

import { POSReceiptModal } from './components/POSReceiptModal';
import { POSPaymentModal } from './components/POSPaymentModal';
import { POSFulfillmentModal } from './components/POSFulfillmentModal';
import { POSHoldNoteModal, POSHeldOrdersDrawer } from './components/POSHeldOrdersModal';
import { POSDrawerModal } from './components/POSDrawerModal';
import { POSStaleShiftModal } from './components/POSStaleShiftModal';
import { POSManagerOverrideModal } from './components/POSManagerOverrideModal';
import { POSTerminalLockScreen } from './components/POSTerminalLockScreen';
import { POSConfirmDialog } from './components/POSConfirmDialog';
import { POSCartDrawer } from './components/POSCartDrawer';
import { POSLeftSidebar } from './components/POSLeftSidebar';
import { POSTopNavbar } from './components/POSTopNavbar';
import { POSCatalogGrid } from './components/POSCatalogGrid';
import { POSSettingsTab } from '../Settings/POSSettingsTab';

import POSCatalog from './POSCatalog';
import POSOrders from './POSOrders';
import POSRegister from './POSRegister';
import { LuAlertTriangle } from 'react-icons/lu';

export const POSTerminal: React.FC = () => {
  const { isRTL } = useLanguage();
  const { userEmail, businessName } = useAuth();

  const terminalState = usePOSTerminalState();

  const cartState = usePOSCart({
    currentTerminalSlug: terminalState.currentTerminalSlug,
    posConfig: terminalState.posConfig,
    activeShift: terminalState.activeShift,
    displayCashierName: terminalState.displayCashierName,
    requireOpenDrawer: terminalState.requireOpenDrawer,
    playTone: terminalState.playTone,
    showConfirm: terminalState.showConfirm,
    setIsPayModalOpen: (open) => paymentState.setIsPayModalOpen(open),
    setCashTendered: (amt) => paymentState.setCashTendered(amt),
  });

  const paymentState = usePOSPayment({
    posConfig: terminalState.posConfig,
    activeShift: terminalState.activeShift,
    setActiveShift: terminalState.setActiveShift,
    currentCounterConfig: terminalState.currentCounterConfig,
    displayCashierName: terminalState.displayCashierName,
    ticketNumber: cartState.ticketNumber,
    setTicketNumber: cartState.setTicketNumber,
    customerName: cartState.customerName,
    customerTier: cartState.customerTier,
    fulfillmentType: cartState.fulfillmentType,
    setFulfillmentType: cartState.setFulfillmentType,
    cartItems: cartState.cartItems,
    setCartItems: cartState.setCartItems,
    subtotal: cartState.subtotal,
    taxPercent: cartState.taxPercent,
    taxAmount: cartState.taxAmount,
    discountPercent: cartState.discountPercent,
    setDiscountPercent: cartState.setDiscountPercent,
    discountAmount: cartState.discountAmount,
    grandTotal: cartState.grandTotal,
    playTone: terminalState.playTone,
    resolveInitialFulfillment: cartState.resolveInitialFulfillment,
  });

  // Prompt Discount Handler with Manager Check
  const handlePromptDiscount = () => {
    const input = prompt('Enter discount percentage (0 - 50%):', String(cartState.discountPercent));
    if (input === null) return;
    const val = Math.min(50, Math.max(0, Number(input) || 0));
    if (val === 0) {
      cartState.setDiscountPercent(0);
      return;
    }
    if (terminalState.currentCounterConfig?.require_manager_for_discount !== false) {
      terminalState.setPendingDiscountValue(val);
      terminalState.setManagerOverrideReason('discount');
      terminalState.setManagerOverridePasswordInput('');
      terminalState.setIsManagerOverrideModalOpen(true);
    } else {
      cartState.setDiscountPercent(val);
      toast.success(`Discount of ${val}% applied`);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (terminalState.isLocked) return;

      if (cartState.isFulfillmentModalOpen) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          cartState.handleSelectFulfillment('In-Store Bag');
          return;
        } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          cartState.handleSelectFulfillment('Takeaway');
          return;
        } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          cartState.handleSelectFulfillment('Delivery');
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cartState.handleCloseFulfillmentModal();
          return;
        }
      }

      if (e.key === 'F2') {
        e.preventDefault();
        cartState.barcodeInputRef.current?.focus();
        cartState.barcodeInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        cartState.handleOpenHoldModal();
      } else if (e.key === 'F9') {
        e.preventDefault();
        cartState.handleOpenPayment();
      } else if (e.key === 'Escape') {
        if (paymentState.isPayModalOpen) paymentState.setIsPayModalOpen(false);
        else if (cartState.isHeldModalOpen) cartState.setIsHeldModalOpen(false);
        else if (terminalState.isDrawerModalOpen) terminalState.setIsDrawerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    terminalState.isLocked,
    cartState.isFulfillmentModalOpen,
    paymentState.isPayModalOpen,
    cartState.isHeldModalOpen,
    terminalState.isDrawerModalOpen,
  ]);

  const currentCashierName = userEmail?.split('@')[0] || 'Alex Rivera';
  const displayBrand = businessName || terminalState.posConfig.store_title || 'Atelier Terminal';

  return (
    <div
      className={`relative flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 font-sans select-none ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      {/* 1. LEFT POS SIDEBAR */}
      <POSLeftSidebar
        accentColor={terminalState.accentColor}
        contrastText={terminalState.contrastText}
        safeAccentText={terminalState.safeAccentText}
        activeSidebarBg={terminalState.activeSidebarBg}
        isAccentWhite={terminalState.isAccentWhite}
        displayBrand={displayBrand}
        posConfig={terminalState.posConfig}
        activeView={terminalState.activeView}
        setActiveView={terminalState.setActiveView}
        loadCatalog={cartState.loadCatalog}
        setIsHeldModalOpen={cartState.setIsHeldModalOpen}
        heldOrders={cartState.heldOrders}
        handleOpenDrawerModal={terminalState.handleOpenDrawerModal}
        activeShift={terminalState.activeShift}
        setIsLocked={terminalState.setIsLocked}
      />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP POS NAVBAR */}
        <POSTopNavbar
          posConfig={terminalState.posConfig}
          currentDate={terminalState.currentDate}
          currentTime={terminalState.currentTime}
          activeView={terminalState.activeView}
          setActiveView={terminalState.setActiveView}
          loadCatalog={cartState.loadCatalog}
          accentColor={terminalState.accentColor}
          contrastText={terminalState.contrastText}
          isAccentWhite={terminalState.isAccentWhite}
          requireOpenDrawer={terminalState.requireOpenDrawer}
          setCartItems={cartState.setCartItems}
          setTicketNumber={cartState.setTicketNumber}
          activeShift={terminalState.activeShift}
          setFulfillmentType={cartState.setFulfillmentType}
          cartItems={cartState.cartItems}
          showConfirm={terminalState.showConfirm}
          handleBarcodeSubmit={cartState.handleBarcodeSubmit}
          barcodeInputRef={cartState.barcodeInputRef}
          searchQuery={cartState.searchQuery}
          setSearchQuery={cartState.setSearchQuery}
          setIsHeldModalOpen={cartState.setIsHeldModalOpen}
          heldOrders={cartState.heldOrders}
          handleOpenDrawerModal={terminalState.handleOpenDrawerModal}
          soundEnabled={terminalState.soundEnabled}
          setSoundEnabled={terminalState.setSoundEnabled}
          colorMode={terminalState.colorMode}
          setColorMode={terminalState.setColorMode}
          isDark={terminalState.isDark}
          displayCashierName={terminalState.displayCashierName}
          currentCounterConfig={terminalState.currentCounterConfig}
          displayCashierRole={terminalState.displayCashierRole}
          setIsPosSettingsModalOpen={terminalState.setIsPosSettingsModalOpen}
          currentTerminalSlug={terminalState.currentTerminalSlug}
        />

        {/* STALE SHIFT WARNING BANNER */}
        {terminalState.staleShift && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <LuAlertTriangle className="text-amber-500 shrink-0 text-base" />
              <div className="truncate">
                <span className="font-extrabold text-amber-900 dark:text-amber-200">Unclosed Previous Shift:</span>{' '}
                <span className="text-amber-800 dark:text-amber-300">
                  Shift #{terminalState.staleShift.session_number} for{' '}
                  {posService.getShiftBusinessDate(terminalState.staleShift) || 'previous day'} is still open. Please
                  close it before ringing up today's sales.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={terminalState.handleOpenCloseForStaleShift}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Close Old Shift
              </button>
              <button
                type="button"
                onClick={terminalState.handleQuickAutoCloseStaleShift}
                className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                Auto-Close
              </button>
            </div>
          </div>
        )}

        {/* WORKSPACE BODY */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {terminalState.activeView === 'register' && (
            <>
              <POSCatalogGrid
                activeShift={terminalState.activeShift}
                handleOpenDrawerModal={terminalState.handleOpenDrawerModal}
                posConfig={terminalState.posConfig}
                selectedCategory={cartState.selectedCategory}
                setSelectedCategory={cartState.setSelectedCategory}
                products={cartState.products}
                currentTerminalSlug={terminalState.currentTerminalSlug}
                accentColor={terminalState.accentColor}
                contrastText={terminalState.contrastText}
                isAccentWhite={terminalState.isAccentWhite}
                categories={cartState.categories}
                sortByDate={cartState.sortByDate}
                setSortByDate={cartState.setSortByDate}
                loadingCatalog={cartState.loadingCatalog}
                filteredProducts={cartState.filteredProducts}
                setSearchQuery={cartState.setSearchQuery}
                cartItems={cartState.cartItems}
                handleAddToCart={cartState.handleAddToCart}
              />

              <POSCartDrawer
                customerName={cartState.customerName}
                setCustomerName={cartState.setCustomerName}
                activeShift={terminalState.activeShift}
                ticketNumber={cartState.ticketNumber}
                fulfillmentType={cartState.fulfillmentType}
                onOpenFulfillmentModal={() => cartState.setIsFulfillmentModalOpen(true)}
                onOpenDrawerModal={() => terminalState.setIsDrawerModalOpen(true)}
                cartItems={cartState.cartItems}
                onUpdateQuantity={cartState.handleUpdateQuantity}
                onRemoveItem={cartState.handleRemoveItem}
                subtotal={cartState.subtotal}
                discountPercent={cartState.discountPercent}
                setDiscountPercent={handlePromptDiscount}
                discountAmount={cartState.discountAmount}
                taxPercent={cartState.taxPercent}
                taxAmount={cartState.taxAmount}
                grandTotal={cartState.grandTotal}
                onOpenPayment={cartState.handleOpenPayment}
                onOpenHoldModal={cartState.handleOpenHoldModal}
                onClearCart={cartState.handleClearCart}
                accentColor={terminalState.accentColor}
                contrastText={terminalState.contrastText}
                isAccentWhite={terminalState.isAccentWhite}
              />
            </>
          )}

          {terminalState.activeView === 'transactions' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSOrders embedded onBack={() => terminalState.setActiveView('register')} />
            </div>
          )}

          {terminalState.activeView === 'catalog' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSCatalog
                embedded
                onBack={() => {
                  terminalState.setActiveView('register');
                  cartState.loadCatalog();
                }}
              />
            </div>
          )}

          {terminalState.activeView === 'returns' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSOrders embedded isReturnsOnly onBack={() => terminalState.setActiveView('register')} />
            </div>
          )}

          {terminalState.activeView === 'summary' && (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] min-w-0 p-3 sm:p-5">
              <POSRegister
                embedded
                onBack={() => {
                  terminalState.setActiveView('register');
                  terminalState.setActiveShift(
                    posService.getActiveShift(
                      terminalState.currentCounterConfig?.name || terminalState.posConfig.terminal_name
                    )
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CHECKOUT & PAYMENT TENDER */}
      <POSPaymentModal
        isOpen={paymentState.isPayModalOpen}
        onClose={() => paymentState.setIsPayModalOpen(false)}
        ticketNumber={cartState.ticketNumber}
        customerName={cartState.customerName}
        paymentMethod={paymentState.paymentMethod}
        setPaymentMethod={paymentState.setPaymentMethod}
        grandTotal={cartState.grandTotal}
        cartItems={cartState.cartItems}
        cashTendered={paymentState.cashTendered}
        setCashTendered={paymentState.setCashTendered}
        changeDue={paymentState.changeDue}
        posPaymentAccounts={paymentState.posPaymentAccounts}
        selectedPaymentAccount={paymentState.selectedPaymentAccount}
        setSelectedPaymentAccount={paymentState.setSelectedPaymentAccount}
        accountSearchQuery={paymentState.accountSearchQuery}
        setAccountSearchQuery={paymentState.setAccountSearchQuery}
        paymentRefNumber={paymentState.paymentRefNumber}
        setPaymentRefNumber={paymentState.setPaymentRefNumber}
        isProcessingSale={paymentState.isProcessingSale}
        handleCompleteOrder={paymentState.handleCompleteOrder}
        accentColor={terminalState.accentColor}
        contrastText={terminalState.contrastText}
        isAccentWhite={terminalState.isAccentWhite}
      />

      {/* MODAL 2: RECEIPT PRINT & SLIP */}
      <POSReceiptModal
        isOpen={paymentState.isReceiptModalOpen}
        onClose={() => paymentState.setIsReceiptModalOpen(false)}
        completedOrder={paymentState.completedOrder}
        posConfig={terminalState.posConfig}
        displayBrand={displayBrand}
        receiptSize={paymentState.receiptSize}
        setReceiptSize={paymentState.setReceiptSize}
        accentColor={terminalState.accentColor}
        contrastText={terminalState.contrastText}
        isAccentWhite={terminalState.isAccentWhite}
      />

      {/* MODAL 3: PACKAGING & HANDOVER MODE */}
      <POSFulfillmentModal
        isOpen={cartState.isFulfillmentModalOpen}
        fulfillmentType={cartState.fulfillmentType}
        onSelectFulfillment={cartState.handleSelectFulfillment}
        onClose={cartState.handleCloseFulfillmentModal}
      />

      {/* MODAL 4: HOLD ORDER QUICK-NOTE */}
      <POSHoldNoteModal
        isOpen={cartState.isHoldNoteModalOpen}
        ticketNumber={cartState.ticketNumber}
        holdNoteInput={cartState.holdNoteInput}
        setHoldNoteInput={cartState.setHoldNoteInput}
        onConfirm={cartState.handleConfirmHoldOrder}
        onClose={() => cartState.setIsHoldNoteModalOpen(false)}
      />

      {/* MODAL 5: HELD ORDERS DRAWER */}
      <POSHeldOrdersDrawer
        isOpen={cartState.isHeldModalOpen}
        heldOrders={cartState.heldOrders}
        isHeldSelectMode={cartState.isHeldSelectMode}
        setIsHeldSelectMode={cartState.setIsHeldSelectMode}
        selectedHeldIds={cartState.selectedHeldIds}
        setSelectedHeldIds={cartState.setSelectedHeldIds}
        swipedHeldId={cartState.swipedHeldId}
        setSwipedHeldId={cartState.setSwipedHeldId}
        onResume={cartState.handleResumeHeldOrder}
        onDeleteSingle={(order) => {
          const displayOrderNumber = order.order_number || order.ticket_number || 'Order';
          terminalState.showConfirm({
            title: 'Delete Held Order',
            message: `Are you sure you want to permanently delete held order ${displayOrderNumber}?`,
            confirmLabel: 'Delete Order',
            isDestructive: true,
            onConfirm: () => cartState.handleDeleteHeldOrder(order.id),
          });
        }}
        onDeleteMultiple={(ids) => {
          const count = ids.length;
          terminalState.showConfirm({
            title: `Delete ${count} Held Order${count > 1 ? 's' : ''}`,
            message: `Are you sure you want to permanently delete the ${count} selected held order${count > 1 ? 's' : ''}?`,
            confirmLabel: `Delete ${count} Order${count > 1 ? 's' : ''}`,
            isDestructive: true,
            onConfirm: () => cartState.handleBatchDeleteHeldOrders(ids),
          });
        }}
        onClose={() => {
          cartState.setIsHeldModalOpen(false);
          cartState.setIsHeldSelectMode(false);
          cartState.setSelectedHeldIds([]);
          cartState.setSwipedHeldId(null);
        }}
      />

      {/* MODAL 6: STALE SHIFT & Z-REPORT */}
      <POSStaleShiftModal
        isStaleShiftModalOpen={terminalState.isStaleShiftModalOpen}
        staleShift={terminalState.staleShift}
        onCloseStaleShiftModal={() => terminalState.setIsStaleShiftModalOpen(false)}
        onOpenCloseForStaleShift={terminalState.handleOpenCloseForStaleShift}
        onQuickAutoCloseStaleShift={terminalState.handleQuickAutoCloseStaleShift}
        selectedZReport={terminalState.selectedZReport}
        onCloseZReport={() => terminalState.setSelectedZReport(null)}
        onStartTodayFromZReport={() => {
          terminalState.setSelectedZReport(null);
          terminalState.handleOpenDrawerModal();
        }}
        posConfig={terminalState.posConfig}
        accentColor={terminalState.accentColor}
        contrastText={terminalState.contrastText}
        isAccentWhite={terminalState.isAccentWhite}
      />

      {/* MODAL 7: MANAGER OVERRIDE */}
      <POSManagerOverrideModal
        isOpen={terminalState.isManagerOverrideModalOpen}
        managerOverrideReason={terminalState.managerOverrideReason}
        pendingDiscountValue={terminalState.pendingDiscountValue}
        managerOverridePasswordInput={terminalState.managerOverridePasswordInput}
        setManagerOverridePasswordInput={terminalState.setManagerOverridePasswordInput}
        handleVerifyManagerOverride={(e) =>
          terminalState.handleVerifyManagerOverride(e, () => {
            if (terminalState.managerOverrideReason === 'discount') {
              cartState.setDiscountPercent(terminalState.pendingDiscountValue);
              toast.success(`Manager Override Approved: ${terminalState.pendingDiscountValue}% discount applied`);
            }
          })
        }
        onClose={() => terminalState.setIsManagerOverrideModalOpen(false)}
      />

      {/* MODAL 8: CASH DRAWER & DAY SESSION */}
      <POSDrawerModal
        isOpen={terminalState.isDrawerModalOpen}
        onClose={() => terminalState.setIsDrawerModalOpen(false)}
        drawerTab={terminalState.drawerTab}
        setDrawerTab={terminalState.setDrawerTab}
        activeShift={terminalState.activeShift}
        dayOpenDate={terminalState.dayOpenDate}
        handleDayOpenDateChange={terminalState.handleDayOpenDateChange}
        dayOpenPettyCash={terminalState.dayOpenPettyCash}
        setDayOpenPettyCash={terminalState.setDayOpenPettyCash}
        pettyCashSource={terminalState.pettyCashSource}
        dayOpenCashIn={terminalState.dayOpenCashIn}
        setDayOpenCashIn={terminalState.setDayOpenCashIn}
        dayOpenCashOut={terminalState.dayOpenCashOut}
        setDayOpenCashOut={terminalState.setDayOpenCashOut}
        existingSessionForDate={terminalState.existingSessionForDate}
        handleOpenDaySubmit={() =>
          terminalState.handleOpenDaySubmit((shift) => {
            cartState.setTicketNumber(posService.getNextOrderNumber(shift.business_date));
          })
        }
        dayCloseDate={terminalState.dayCloseDate}
        setDayCloseDate={terminalState.setDayCloseDate}
        dayCloseCashOut={terminalState.dayCloseCashOut}
        setDayCloseCashOut={terminalState.setDayCloseCashOut}
        dayCloseCashIn={terminalState.dayCloseCashIn}
        setDayCloseCashIn={terminalState.setDayCloseCashIn}
        dayCloseNotes={terminalState.dayCloseNotes}
        setDayCloseNotes={terminalState.setDayCloseNotes}
        handleCloseDaySubmit={() =>
          terminalState.handleCloseDaySubmit(() => {
            cartState.setTicketNumber('');
            cartState.setCartItems([]);
          })
        }
        drawerMovementType={terminalState.drawerMovementType}
        setDrawerMovementType={terminalState.setDrawerMovementType}
        drawerAmount={terminalState.drawerAmount}
        setDrawerAmount={terminalState.setDrawerAmount}
        drawerReason={terminalState.drawerReason}
        setDrawerReason={terminalState.setDrawerReason}
        handleDrawerMovement={terminalState.handleDrawerMovement}
        accentColor={terminalState.accentColor}
        contrastText={terminalState.contrastText}
        isAccentWhite={terminalState.isAccentWhite}
        safeAccentText={terminalState.safeAccentText}
      />

      {/* MODAL 9: SCREEN LOCK TERMINAL */}
      <POSTerminalLockScreen
        isLocked={terminalState.isLocked}
        displayBrand={displayBrand}
        terminalName={terminalState.posConfig.terminal_name}
        currentCashierName={currentCashierName}
        accentColor={terminalState.accentColor}
        contrastText={terminalState.contrastText}
        isAccentWhite={terminalState.isAccentWhite}
        onUnlock={terminalState.handleUnlock}
      />

      {/* MODAL 10: IN-POS SETTINGS & TERMINAL CONFIGURATION */}
      {terminalState.isPosSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7">
            <POSSettingsTab isModal onClose={() => terminalState.setIsPosSettingsModalOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL 11: CONFIRMATION DIALOG */}
      <POSConfirmDialog
        dialog={terminalState.confirmDialog}
        onClose={() => terminalState.setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default POSTerminal;
