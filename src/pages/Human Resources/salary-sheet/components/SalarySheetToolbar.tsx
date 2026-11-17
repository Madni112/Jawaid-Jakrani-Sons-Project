import React from 'react';
import { SearchBox, StatusPills } from '../../../Masters/masterUi';
import { SheetStatus } from '../../../../services/hr.service';

interface SalarySheetToolbarProps {
  detail: any;
  searchEpoch: number;
  onSearch: (s: string) => void;
  status: SheetStatus | '';
  onStatusChange: (status: SheetStatus | '') => void;
  statusCounts: { value: SheetStatus | ''; label: string; count: number }[];
}

export const SalarySheetToolbar: React.FC<SalarySheetToolbarProps> = ({
  detail,
  searchEpoch,
  onSearch,
  status,
  onStatusChange,
  statusCounts
}) => {
  if (detail) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stroke dark:border-strokedark mt-4">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        <SearchBox
          key={searchEpoch}
          placeholder="Search sheet #, month, account or journal..."
          onSearch={onSearch}
        />
        <StatusPills
          value={status}
          onChange={(v) => onStatusChange(v as SheetStatus | '')}
          counts={statusCounts}
        />
      </div>
    </div>
  );
};

export default SalarySheetToolbar;
