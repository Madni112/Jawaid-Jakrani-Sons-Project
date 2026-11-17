import React from 'react';

// Visual badge indicating whether a master category/brand/print already exists or will be created
export const MasterBadge: React.FC<{ exists: boolean }> = ({ exists }) => {
  if (exists) {
    return (
      <span
        title="Already exists in database master catalog"
        className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
        <span>Already</span>
      </span>
    );
  }
  return (
    <span
      title="Will be auto-created in master catalog during upload"
      className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
      <span>Will create</span>
    </span>
  );
};
