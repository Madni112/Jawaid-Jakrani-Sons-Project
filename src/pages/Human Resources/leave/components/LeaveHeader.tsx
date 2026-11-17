import React from 'react';
import { CalendarDays } from 'lucide-react';
import { ListToolbar } from '../../../Masters/masterUi';

interface LeaveHeaderProps {
  tab: string;
  onNewApplication: () => void;
}

export const LeaveHeader: React.FC<LeaveHeaderProps> = ({
  tab,
  onNewApplication
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
      <div>
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Leave Management
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {tab === 'Applications' && (
            <>
              Approving an application writes the leave onto the attendance sheet for those dates,
              so payroll never enters the same days twice.
            </>
          )}
          {tab === 'Balances' && (
            <>
              Entitlement is set per leave type for the year; used counts approved applications,
              and remaining is what may still be approved.
            </>
          )}
          {tab === 'Leave Types' && (
            <>Configure annual leave quotas and categories available for employee applications.</>
          )}
        </p>
      </div>
      {tab === 'Applications' && (
        <ListToolbar
          addLabel="NEW APPLICATION"
          onAdd={onNewApplication}
        />
      )}
    </div>
  );
};

export default LeaveHeader;
