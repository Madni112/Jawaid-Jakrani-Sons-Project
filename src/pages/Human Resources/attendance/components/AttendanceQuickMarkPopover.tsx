import React from 'react';
import { CELL } from '../utils/attendanceHelpers';
import type { HrMark, QuickMarkMenuState } from '../types/attendanceTypes';

interface AttendanceQuickMarkPopoverProps {
  quickMarkMenu: QuickMarkMenuState;
  onClose: () => void;
  onSelectMark: (empId: string, day: number, mark: HrMark | '') => void;
}

export const AttendanceQuickMarkPopover: React.FC<AttendanceQuickMarkPopoverProps> = ({
  quickMarkMenu,
  onClose,
  onSelectMark
}) => {
  const MENU_HEIGHT = 320;
  const MENU_WIDTH = 180;
  const spaceBelow = window.innerHeight - quickMarkMenu.y;
  const openUpward = spaceBelow < MENU_HEIGHT;
  const topPos = openUpward
    ? Math.max(10, quickMarkMenu.y - MENU_HEIGHT)
    : Math.min(quickMarkMenu.y, window.innerHeight - MENU_HEIGHT - 10);
  const leftPos = Math.max(10, Math.min(quickMarkMenu.x, window.innerWidth - MENU_WIDTH - 20));

  return (
    <>
      <div
        className="fixed inset-0 z-99998"
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          left: leftPos,
          top: topPos
        }}
        className="z-99999 w-44 rounded-lg border border-stroke bg-white p-2 shadow-2xl dark:border-strokedark dark:bg-boxdark text-xs animate-fade-in"
      >
        <div className="font-bold text-[11px] text-gray-500 pb-1.5 mb-1.5 border-b border-stroke dark:border-strokedark flex items-center justify-between">
          <span>Day {quickMarkMenu.day} — Quick Mark</span>
        </div>
        <div className="space-y-1">
          {(Object.keys(CELL) as HrMark[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onSelectMark(quickMarkMenu.empId, quickMarkMenu.day, m)}
              className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${CELL[m].cls}`}>
                  {CELL[m].short}
                </span>
                <span>{m}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelectMark(quickMarkMenu.empId, quickMarkMenu.day, '')}
            className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 cursor-pointer text-left font-medium"
          >
            <span className="w-4 h-4 rounded border border-dashed border-gray-300 flex items-center justify-center text-[9px]">
              ·
            </span>
            <span>Clear / Unmarked</span>
          </button>
        </div>
      </div>
    </>
  );
};
