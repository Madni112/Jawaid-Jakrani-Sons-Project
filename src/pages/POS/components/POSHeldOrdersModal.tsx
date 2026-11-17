import React, { useState, useRef, useEffect } from 'react';
import {
  LuPauseCircle,
  LuX,
  LuTrash2,
  LuCheck,
  LuClock,
  LuUser,
  LuSparkles,
} from 'react-icons/lu';
import { PosHeldOrder, posService } from '../../../service/posService';

// ── SWIPEABLE HELD ORDER CARD COMPONENT ──
interface SwipeableHeldOrderCardProps {
  order: PosHeldOrder;
  isSelected: boolean;
  isSelectMode: boolean;
  onToggleSelect: (id: string) => void;
  onResume: (order: PosHeldOrder) => void;
  onDelete: (order: PosHeldOrder) => void;
  isSwiped: boolean;
  onSwipeChange: (id: string, swiped: boolean) => void;
}

export const SwipeableHeldOrderCard: React.FC<SwipeableHeldOrderCardProps> = ({
  order,
  isSelected,
  isSelectMode,
  onToggleSelect,
  onResume,
  onDelete,
  isSwiped,
  onSwipeChange,
}) => {
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const movedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isSwiped && !isSelectMode) {
      setOffsetX(-90);
    } else {
      setOffsetX(0);
    }
  }, [isSwiped, isSelectMode]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectMode) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    movedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSelectMode) return;
    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 6) movedRef.current = true;
      if (isSwiped) {
        const val = Math.min(0, Math.max(-90, -90 + diffX));
        setOffsetX(val);
      } else {
        if (diffX < 0) {
          setOffsetX(Math.max(-90, diffX));
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (isSelectMode) return;
    setIsDragging(false);
    if (isSwiped) {
      if (offsetX > -45) {
        setOffsetX(0);
        onSwipeChange(order.id, false);
      } else {
        setOffsetX(-90);
      }
    } else {
      if (offsetX < -35) {
        setOffsetX(-90);
        onSwipeChange(order.id, true);
      } else {
        setOffsetX(0);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSelectMode) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    movedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelectMode || !isDragging) return;
    const diffX = e.clientX - startXRef.current;
    if (Math.abs(diffX) > 6) movedRef.current = true;
    if (isSwiped) {
      const val = Math.min(0, Math.max(-90, -90 + diffX));
      setOffsetX(val);
    } else {
      if (diffX < 0) {
        setOffsetX(Math.max(-90, diffX));
      }
    }
  };

  const handleMouseUp = () => {
    if (isSelectMode || !isDragging) return;
    setIsDragging(false);
    if (isSwiped) {
      if (offsetX > -45) {
        setOffsetX(0);
        onSwipeChange(order.id, false);
      } else {
        setOffsetX(-90);
      }
    } else {
      if (offsetX < -35) {
        setOffsetX(-90);
        onSwipeChange(order.id, true);
      } else {
        setOffsetX(0);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isSelectMode || !isDragging) return;
    setIsDragging(false);
    if (offsetX < -35) {
      setOffsetX(-90);
      onSwipeChange(order.id, true);
    } else {
      setOffsetX(isSwiped ? -90 : 0);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const orderId = order.id || order.order_number || order.ticket_number || '';
    if (isSelectMode) {
      onToggleSelect(orderId);
      return;
    }
    if (movedRef.current || Math.abs(offsetX) > 8) {
      return;
    }
    if (isSwiped) {
      onSwipeChange(orderId, false);
      return;
    }
    onResume(order);
  };

  const displayOrderNumber = order.order_number || order.ticket_number || 'Order';

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group">
      {/* Background Revealed on Swipe Left: Red Delete Button (normal mode only) */}
      {!isSelectMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDelete(order);
          }}
          className="absolute inset-y-0 right-0 w-[90px] bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition active:bg-rose-800 z-0 rounded-r-2xl font-bold shadow-inner"
          title="Delete this held order"
        >
          <LuTrash2 size={22} className="animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold">Delete</span>
        </div>
      )}

      {/* Foreground Sliding Order Card */}
      <div
        style={{
          transform: isSelectMode ? 'none' : `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onTouchStart={!isSelectMode ? handleTouchStart : undefined}
        onTouchMove={!isSelectMode ? handleTouchMove : undefined}
        onTouchEnd={!isSelectMode ? handleTouchEnd : undefined}
        onMouseDown={!isSelectMode ? handleMouseDown : undefined}
        onMouseMove={!isSelectMode ? handleMouseMove : undefined}
        onMouseUp={!isSelectMode ? handleMouseUp : undefined}
        onMouseLeave={!isSelectMode ? handleMouseLeave : undefined}
        onClick={handleCardClick}
        className={`relative z-10 p-4 rounded-2xl bg-white dark:bg-[#161D2B] border transition-all duration-150 shadow-xs space-y-2.5 cursor-pointer active:scale-[0.99] ${
          isSelectMode && isSelected
            ? 'border-primary ring-2 ring-primary/20 dark:ring-primary/40 bg-primary/5 dark:bg-primary/10'
            : isSelectMode
            ? 'border-slate-200 dark:border-slate-800/90 hover:border-primary/50'
            : 'border-slate-200 dark:border-slate-800/90 hover:border-emerald-500/60 hover:shadow-md'
        }`}
      >
        {/* Top Row: Tickmark, Order ID, Fulfillment, Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSelectMode && (
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary border-primary text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                {isSelected && <LuCheck size={13} className="stroke-[3]" />}
              </div>
            )}
            <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono">
              {displayOrderNumber}
            </span>
            {order.fulfillment_mode && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {order.fulfillment_mode}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <LuClock size={11} />
            {new Date(order.held_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Customer & Total Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <LuUser size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
              {order.customer_name || 'Walk-in Customer'}
            </span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">
            Rs. {Number(order.total_amount || 0).toLocaleString()}
          </span>
        </div>

        {/* Notes if any */}
        {order.notes && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
            {order.notes}
          </div>
        )}

        {/* Item Count & Action Info */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>{order.items?.length || 0} items</span>
          {!isSelectMode && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <LuSparkles size={11} /> Tap to Resume
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── HOLD NOTE MODAL ──
interface POSHoldNoteModalProps {
  isOpen: boolean;
  ticketNumber: string;
  holdNoteInput: string;
  setHoldNoteInput: (val: string) => void;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

export const POSHoldNoteModal: React.FC<POSHoldNoteModalProps> = ({
  isOpen,
  ticketNumber,
  holdNoteInput,
  setHoldNoteInput,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <LuPauseCircle size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Hold Order: {ticketNumber}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Add an optional reference note or press Enter to park immediately
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(holdNoteInput);
          }}
          className="p-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Order Reference / Note (Optional):
            </label>
            <input
              type="text"
              autoFocus
              value={holdNoteInput}
              onChange={(e) => setHoldNoteInput(e.target.value)}
              placeholder="e.g. Trying another suit / At ATM / Reserved"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Quick suggestion tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Trying another suit', 'Customer at ATM', 'Waiting for fabric', 'Phone Inquiry'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setHoldNoteInput(tag);
                  onConfirm(tag);
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-500/15 hover:text-amber-600 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm cursor-pointer"
            >
              Park Order [Enter]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── HELD ORDERS SLIDE-OVER DRAWER ──
interface POSHeldOrdersDrawerProps {
  isOpen: boolean;
  heldOrders: PosHeldOrder[];
  isHeldSelectMode: boolean;
  setIsHeldSelectMode: (mode: boolean) => void;
  selectedHeldIds: string[];
  setSelectedHeldIds: React.Dispatch<React.SetStateAction<string[]>>;
  swipedHeldId: string | null;
  setSwipedHeldId: (id: string | null) => void;
  onResume: (order: PosHeldOrder) => void;
  onDeleteSingle: (order: PosHeldOrder) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onClose: () => void;
}

export const POSHeldOrdersDrawer: React.FC<POSHeldOrdersDrawerProps> = ({
  isOpen,
  heldOrders,
  isHeldSelectMode,
  setIsHeldSelectMode,
  selectedHeldIds,
  setSelectedHeldIds,
  swipedHeldId,
  setSwipedHeldId,
  onResume,
  onDeleteSingle,
  onDeleteMultiple,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111622] border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Top Multi-Delete & Select Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <LuPauseCircle size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  Held Orders
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    {heldOrders.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Safe Auto-Swap enabled • Switch without losing active items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isHeldSelectMode ? (
                <div className="flex items-center gap-1.5">
                  {selectedHeldIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onDeleteMultiple(selectedHeldIds)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer animate-fadeIn"
                    >
                      <LuTrash2 size={14} />
                      <span>Delete ({selectedHeldIds.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsHeldSelectMode(false);
                      setSelectedHeldIds([]);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : heldOrders.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsHeldSelectMode(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Select multiple orders to delete"
                >
                  <LuTrash2 size={18} />
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Close (Esc)"
              >
                <LuX size={18} />
              </button>
            </div>
          </div>

          {/* Sub-bar for Select All */}
          {isHeldSelectMode && heldOrders.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  if (selectedHeldIds.length === heldOrders.length) {
                    setSelectedHeldIds([]);
                  } else {
                    setSelectedHeldIds(heldOrders.map((h) => h.id));
                  }
                }}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                    selectedHeldIds.length === heldOrders.length && heldOrders.length > 0
                      ? 'bg-primary border-primary text-white'
                      : selectedHeldIds.length > 0
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedHeldIds.length === heldOrders.length && heldOrders.length > 0 ? (
                    <LuCheck size={11} className="stroke-[3]" />
                  ) : selectedHeldIds.length > 0 ? (
                    <div className="w-1.5 h-1.5 bg-primary rounded-xs" />
                  ) : null}
                </div>
                <span>
                  {selectedHeldIds.length === heldOrders.length && heldOrders.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </span>
              </button>

              <span className="text-[11px] text-primary font-bold">
                {selectedHeldIds.length > 0
                  ? `${selectedHeldIds.length} of ${heldOrders.length} selected`
                  : 'Tap any order container to select'}
              </span>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <LuPauseCircle size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No orders currently on hold.</p>
              <p className="text-[11px] text-slate-400 mt-1">Press [F4] while ringing an order to park it.</p>
            </div>
          ) : (
            heldOrders.map((h) => {
              const displayOrderNumber = h.order_number || h.ticket_number || 'Order';
              const orderId = h.id || displayOrderNumber;
              const isSelected = selectedHeldIds.includes(orderId);
              return (
                <SwipeableHeldOrderCard
                  key={orderId}
                  order={{ ...h, id: orderId }}
                  isSelected={isSelected}
                  isSelectMode={isHeldSelectMode}
                  onToggleSelect={(id) => {
                    setSelectedHeldIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    );
                  }}
                  onResume={(order) => onResume(order)}
                  onDelete={(order) => onDeleteSingle(order)}
                  isSwiped={swipedHeldId === orderId}
                  onSwipeChange={(id, swiped) => {
                    setSwipedHeldId(swiped ? id : null);
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
