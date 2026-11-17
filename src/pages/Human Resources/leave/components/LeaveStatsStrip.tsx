import React from 'react';
import { RegisterStat, StatStrip } from '../../../Masters/masterUi';

interface LeaveStatsStripProps {
  stats: RegisterStat[];
}

export const LeaveStatsStrip: React.FC<LeaveStatsStripProps> = ({ stats }) => {
  return (
    <div className="pt-4 pb-1">
      <StatStrip stats={stats} />
    </div>
  );
};

export default LeaveStatsStrip;
