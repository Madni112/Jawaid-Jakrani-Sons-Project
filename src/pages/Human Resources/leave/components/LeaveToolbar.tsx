import React from 'react';
import { DateWindow, SearchBox, StatusPills } from '../../../Masters/masterUi';

interface LeaveToolbarProps {
  tab: string;
  searchEpoch: number;
  onSearch: (s: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  statusCounts: { value: string; label: string; count: number }[];
  typeState: string;
  onTypeStateChange: (state: string) => void;
  typeStateCounts: { value: string; label: string; count: number }[];
  fromDate: string;
  toDate: string;
  onDateChange: (from: string, to: string) => void;
}

export const LeaveToolbar: React.FC<LeaveToolbarProps> = ({
  tab,
  searchEpoch,
  onSearch,
  status,
  onStatusChange,
  statusCounts,
  typeState,
  onTypeStateChange,
  typeStateCounts,
  fromDate,
  toDate,
  onDateChange
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3.5 pt-4 border-t border-stroke dark:border-strokedark">
      <SearchBox
        key={searchEpoch}
        placeholder={
          tab === 'Applications'
            ? 'Search by application #, staff, designation or reason'
            : tab === 'Balances'
            ? 'Search staff by code, name or designation'
            : 'Search leave types by code, name or description'
        }
        onSearch={onSearch}
      />
      {tab === 'Applications' && (
        <StatusPills value={status} onChange={onStatusChange} counts={statusCounts} />
      )}
      {tab === 'Leave Types' && (
        <StatusPills value={typeState} onChange={onTypeStateChange} counts={typeStateCounts} />
      )}
      {tab === 'Applications' && (
        <DateWindow from={fromDate} to={toDate} onChange={onDateChange} />
      )}
    </div>
  );
};

export default LeaveToolbar;
