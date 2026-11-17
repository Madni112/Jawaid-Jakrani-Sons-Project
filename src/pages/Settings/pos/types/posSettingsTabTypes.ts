export interface POSSettingsTabProps {
  onClose?: () => void;
  isModal?: boolean;
}

export type SettingsTabKey = 'store' | 'receipt' | 'checkout' | 'theme';
