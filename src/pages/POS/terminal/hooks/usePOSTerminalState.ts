import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../Context/Auth';
import useColorMode from '../../../../hooks/useColorMode';
import {
  getSavedAccentColor,
  getContrastTextColor,
  getSafeAccentTextColor,
  isDarkModeActive,
} from '../../../../constant/themeConfig';
import { triggerFeedbackSound } from '../../../../utils/audioFeedback';
import { posService, PosShift, PosSettings } from '../../../../service/posService';
import { PosView, ConfirmDialogState } from '../types/posTerminalTypes';

export const usePOSTerminalState = () => {
  const { userEmail, businessName, currentUser, logout, userName } = useAuth();
  const [colorMode, setColorMode] = useColorMode();
  const isDark = isDarkModeActive();

  const { posSlug } = useParams<{ posSlug?: string }>();
  const currentTerminalSlug = (posSlug || 'pos1').toLowerCase();
  const currentCounterConfig = posService.getTerminalBySlug(currentTerminalSlug);
  const loggedInCashier = posService.getLoggedInCashier(currentTerminalSlug);

  const displayCashierName =
    loggedInCashier?.name ||
    userName ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    (userEmail ? userEmail.split('@')[0] : 'Cashier');
  const displayCashierRole = loggedInCashier?.role
    ? loggedInCashier.role.charAt(0).toUpperCase() + loggedInCashier.role.slice(1)
    : 'Cashier';
  const displayCashierEmail = loggedInCashier
    ? `${loggedInCashier.name.toLowerCase().replace(/\s+/g, '.')}@pos.local`
    : userEmail || currentUser?.email || 'cashier@jawaidjakwani.com';

  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [isPosSettingsModalOpen, setIsPosSettingsModalOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileDropdownOpen]);

  // Manager Override Modal State
  const [isManagerOverrideModalOpen, setIsManagerOverrideModalOpen] = useState(false);
  const [managerOverrideReason, setManagerOverrideReason] = useState<'discount' | 'refund'>('discount');
  const [pendingDiscountValue, setPendingDiscountValue] = useState<number>(0);
  const [managerOverridePasswordInput, setManagerOverridePasswordInput] = useState('');

  // Dynamic Theme Accent
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());
  useEffect(() => {
    const handleThemeChange = () => setAccentColor(getSavedAccentColor());
    window.addEventListener('uzair_jibran_theme_color_changed', handleThemeChange);
    return () => window.removeEventListener('uzair_jibran_theme_color_changed', handleThemeChange);
  }, []);

  const contrastText = getContrastTextColor(accentColor);
  const safeAccentText = getSafeAccentTextColor(accentColor, isDark);
  const isAccentWhite = accentColor.toLowerCase() === '#ffffff' || accentColor.toLowerCase() === '#fff';
  const activeSidebarBg = isAccentWhite
    ? isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(15, 23, 42, 0.08)'
    : `${accentColor}18`;

  // POS Settings & Active Shift
  const [posConfig, setPosConfig] = useState<PosSettings>(() => posService.getSettings());
  const [activeShift, setActiveShift] = useState<PosShift | null>(() =>
    posService.getActiveShift(currentCounterConfig?.name || posConfig.terminal_name)
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(posConfig.sound_effects_enabled);

  // Time & Session
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(
        now.toLocaleDateString(undefined, {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeView, setActiveView] = useState<PosView>('register');

  // Lock Terminal State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockPin, setLockPin] = useState<string>('');

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = true,
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      isDestructive,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Cash Drawer & Day Session Modal State
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'open_day' | 'close_day' | 'movement'>('open_day');

  // Day Open State
  const [dayOpenDate, setDayOpenDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const existingSessionForDate = useMemo(() => {
    return posService.getExistingClosedShiftForDate(dayOpenDate, currentCounterConfig?.name || posConfig.terminal_name);
  }, [dayOpenDate, currentCounterConfig, posConfig.terminal_name, isDrawerModalOpen, activeShift]);
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
    setPettyCashSource(
      lookup.isFound ? `Auto-filled from ${lookup.foundDate} close` : 'No prior shift before this date (enter manually)'
    );
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

  // Stale Shift Detection
  const [staleShift, setStaleShift] = useState<PosShift | null>(() =>
    posService.getStaleShift(currentCounterConfig?.name || posConfig.terminal_name)
  );
  const [selectedZReport, setSelectedZReport] = useState<PosShift | null>(null);
  const [isStaleShiftModalOpen, setIsStaleShiftModalOpen] = useState<boolean>(() => Boolean(posService.getStaleShift()));

  useEffect(() => {
    const stale = posService.getStaleShift();
    setStaleShift(stale);
    if (stale) {
      setIsStaleShiftModalOpen(true);
    }
  }, [activeShift]);

  const playTone = (type: 'notification' | 'success' | 'scan' | 'warning' | 'delete') => {
    if (soundEnabled) {
      try {
        triggerFeedbackSound(type, userEmail);
      } catch (_) {}
    }
  };

  const handleOpenCloseForStaleShift = () => {
    if (!staleShift) return;
    setIsStaleShiftModalOpen(false);
    setDrawerTab('close_day');
    const sDate = posService.getShiftBusinessDate(staleShift);
    setDayCloseDate(sDate || new Date().toISOString().split('T')[0]);
    setDayCloseCashOut(0);
    setDayCloseCashIn(0);
    setDayCloseNotes('Closed from overdue shift prompt');
    setIsDrawerModalOpen(true);
  };

  const handleQuickAutoCloseStaleShift = async () => {
    if (!staleShift) return;
    try {
      const todayDateStr = posService.getTodayDateStr();
      const sDate = posService.getShiftBusinessDate(staleShift);
      const closed = await posService.closeDayShift({
        shiftId: staleShift.id,
        cashOut: 0,
        cashIn: 0,
        closingNotes: `Auto-closed on ${todayDateStr} when opening new day session.`,
        actualCountedCash: staleShift.expected_cash,
      });
      setActiveShift(null);
      setStaleShift(null);
      setIsStaleShiftModalOpen(false);
      playTone('success');
      toast.success(`Previous shift for ${sDate || 'old date'} successfully closed!`);
      setSelectedZReport(closed);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to auto-close previous shift');
    }
  };

  const handleOpenDrawerModal = () => {
    const shift = posService.getActiveShift();
    setActiveShift(shift);
    if (!shift) {
      setDrawerTab('open_day');
      const todayStr = new Date().toISOString().split('T')[0];
      setDayOpenDate(todayStr);
      const lookup = posService.getPettyCashForDate(todayStr);
      setDayOpenPettyCash(lookup.amount);
      setPettyCashSource(
        lookup.isFound
          ? `Auto-filled from ${lookup.foundDate} close`
          : 'No prior shift before this date (enter manually)'
      );
      setDayOpenCashIn(0);
      setDayOpenCashOut(0);
    } else {
      setDrawerTab('movement');
      setDayCloseCashOut(0);
      setDayCloseCashIn(0);
    }
    setIsDrawerModalOpen(true);
  };

  const requireOpenDrawer = () => {
    const shift = posService.getActiveShift(currentCounterConfig?.name || posConfig.terminal_name);
    if (!shift) {
      playTone('warning');
      toast.error('Cash drawer is closed. Please open the day session before adding products.', { icon: '🔒' });
      setDrawerTab('open_day');
      setIsDrawerModalOpen(true);
      return false;
    }
    return true;
  };

  const handleVerifyManagerOverride = (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    if (posService.verifyManagerOverride(currentTerminalSlug, managerOverridePasswordInput)) {
      onSuccess();
      setIsManagerOverrideModalOpen(false);
      setManagerOverridePasswordInput('');
    } else {
      toast.error('Invalid Manager Password. Authorization denied.', { icon: '🔒' });
      setManagerOverridePasswordInput('');
    }
  };

  const handleOpenDaySubmit = async (onSuccessShift: (shift: PosShift) => void) => {
    try {
      const isResuming = Boolean(existingSessionForDate);
      const shift = await posService.openDayShift({
        businessDate: dayOpenDate,
        cashierName: displayCashierName,
        openingPettyCash: dayOpenPettyCash,
        cashIn: dayOpenCashIn,
        cashOut: dayOpenCashOut,
        terminalCode: currentCounterConfig?.name || posConfig.terminal_name,
      });
      setActiveShift(shift);
      onSuccessShift(shift);
      setIsDrawerModalOpen(false);
      playTone('success');
      if (isResuming) {
        toast.success(`Session #${shift.session_number} reopened & resumed for ${dayOpenDate}!`);
      } else {
        toast.success(`Day opened for ${dayOpenDate}! Opening Balance: Rs. ${shift.opening_float.toLocaleString()}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to open day');
    }
  };

  const handleCloseDaySubmit = async (onCloseReset: () => void) => {
    if (!activeShift) {
      toast.error('No active shift open to close.');
      return;
    }
    try {
      const closed = await posService.closeDayShift({
        shiftId: activeShift.id,
        cashOut: dayCloseCashOut,
        cashIn: dayCloseCashIn,
        closingNotes: dayCloseNotes,
      });
      setActiveShift(null);
      setStaleShift(null);
      setIsStaleShiftModalOpen(false);
      onCloseReset();
      setIsDrawerModalOpen(false);
      playTone('success');
      toast.success(
        `Day closed! Remaining Petty Cash: Rs. ${(closed.closing_petty_cash || 0).toLocaleString()} saved for next day.`
      );
      setSelectedZReport(closed);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to close day');
    }
  };

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
    setActiveShift(posService.getActiveShift(currentCounterConfig?.name || posConfig.terminal_name));
    setIsDrawerModalOpen(false);
    setDrawerAmount(0);
    setDrawerReason('');
    playTone('notification');
    toast.success(`Drawer cash ${drawerMovementType.toUpperCase()} of Rs. ${drawerAmount.toLocaleString()} recorded`);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setLockPin('');
    toast.success('Terminal unlocked');
  };

  return {
    userEmail,
    businessName,
    currentUser,
    logout,
    colorMode,
    setColorMode,
    isDark,
    currentTerminalSlug,
    currentCounterConfig,
    loggedInCashier,
    displayCashierName,
    displayCashierRole,
    displayCashierEmail,
    profileDropdownOpen,
    setProfileDropdownOpen,
    profileDropdownRef,
    isPosSettingsModalOpen,
    setIsPosSettingsModalOpen,
    isManagerOverrideModalOpen,
    setIsManagerOverrideModalOpen,
    managerOverrideReason,
    setManagerOverrideReason,
    pendingDiscountValue,
    setPendingDiscountValue,
    managerOverridePasswordInput,
    setManagerOverridePasswordInput,
    handleVerifyManagerOverride,
    accentColor,
    contrastText,
    safeAccentText,
    isAccentWhite,
    activeSidebarBg,
    posConfig,
    setPosConfig,
    activeShift,
    setActiveShift,
    soundEnabled,
    setSoundEnabled,
    currentTime,
    currentDate,
    activeView,
    setActiveView,
    isLocked,
    setIsLocked,
    lockPin,
    setLockPin,
    confirmDialog,
    setConfirmDialog,
    showConfirm,
    isDrawerModalOpen,
    setIsDrawerModalOpen,
    drawerTab,
    setDrawerTab,
    dayOpenDate,
    dayOpenPettyCash,
    setDayOpenPettyCash,
    dayOpenCashIn,
    setDayOpenCashIn,
    dayOpenCashOut,
    setDayOpenCashOut,
    pettyCashSource,
    existingSessionForDate,
    handleDayOpenDateChange,
    dayCloseDate,
    setDayCloseDate,
    dayCloseCashOut,
    setDayCloseCashOut,
    dayCloseCashIn,
    setDayCloseCashIn,
    dayCloseNotes,
    setDayCloseNotes,
    drawerMovementType,
    setDrawerMovementType,
    drawerAmount,
    setDrawerAmount,
    drawerReason,
    setDrawerReason,
    staleShift,
    setStaleShift,
    selectedZReport,
    setSelectedZReport,
    isStaleShiftModalOpen,
    setIsStaleShiftModalOpen,
    playTone,
    handleOpenCloseForStaleShift,
    handleQuickAutoCloseStaleShift,
    handleOpenDrawerModal,
    requireOpenDrawer,
    handleOpenDaySubmit,
    handleCloseDaySubmit,
    handleDrawerMovement,
    handleUnlock,
  };
};
