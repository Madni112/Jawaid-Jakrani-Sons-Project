import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { DeleteConfirm, IconAction, TableEmpty } from '../../../Masters/masterUi';
import { LeaveType } from '../../../../services/hr.service';
import { days } from '../utils/leaveUtils';

interface LeaveTypesTabProps {
  loading: boolean;
  typesVisible: LeaveType[];
  types: LeaveType[];
  activeFilters: string[];
  onClearFilters: () => void;
  editable: boolean;
  confirmId: number | null;
  setConfirmId: (id: number | null) => void;
  approvedType: Set<number>;
  typeTotals: { perYear: number; carry: number; applied: number };
  onEditType: (t: LeaveType) => void;
  onRemoveType: (t: LeaveType) => void;
  onAddType: () => void;
}

export const LeaveTypesTab: React.FC<LeaveTypesTabProps> = ({
  loading,
  typesVisible,
  types,
  activeFilters,
  onClearFilters,
  editable,
  confirmId,
  setConfirmId,
  approvedType,
  typeTotals,
  onEditType,
  onRemoveType,
  onAddType
}) => {
  return (
    <table className="w-full table-auto text-left text-sm text-black dark:text-white">
      <thead className="sticky top-0 z-10 bg-gray-2 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
        <tr>
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Code</th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Leave Type</th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white text-right">
            Days / Year
          </th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white text-right">
            Carry Forward
          </th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white text-right">
            Applications
          </th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Status</th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white text-right w-24">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-b border-stroke dark:border-strokedark">
              <td colSpan={7} className="p-4">
                <div
                  className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse"
                  style={{ width: `${100 - i * 8}%` }}
                />
              </td>
            </tr>
          ))}
        {!loading && !typesVisible.length && (
          <TableEmpty
            colSpan={7}
            noun="leave types"
            filters={activeFilters}
            cleared={onClearFilters}
            addLabel={types.length ? undefined : 'ADD LEAVE TYPE'}
            onAdd={onAddType}
          />
        )}
        {!loading &&
          typesVisible.map((t) => (
            <tr
              key={t.id}
              className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/20 transition-colors"
            >
              <td className="py-3 px-4 font-medium">{t.code}</td>
              <td className="py-3 px-4">
                <span className="block font-medium">{t.name}</span>
                {t.description && (
                  <span className="block text-xs text-gray-400">{t.description}</span>
                )}
              </td>
              <td className="py-3 px-4 text-right tabular-nums">{t.daysPerYear}</td>
              <td className="py-3 px-4 text-right tabular-nums">
                {t.carryForward || <span className="text-gray-300">-</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums">{t.applied || 0}</td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${
                    t.isActive
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.isActive ? 'Active' : 'Stopped'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <IconAction
                    title="Edit leave type"
                    tone="primary"
                    disabled={!editable}
                    onClick={() => onEditType(t)}
                  >
                    <Pencil className="w-4 h-4" />
                  </IconAction>
                  {confirmId === t.id ? (
                    <DeleteConfirm
                      onConfirm={() => onRemoveType(t)}
                      onCancel={() => setConfirmId(null)}
                      keepLabel={`Keep ${t.name}`}
                    />
                  ) : (
                    <IconAction
                      title={
                        approvedType.has(t.id)
                          ? 'Has approved leave on record — switch it off instead'
                          : 'Delete leave type'
                      }
                      tone="danger"
                      disabled={!editable || approvedType.has(t.id)}
                      onClick={() => setConfirmId(t.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconAction>
                  )}
                </div>
              </td>
            </tr>
          ))}
      </tbody>
      {!!typesVisible.length && !loading && (
        <tfoot>
          <tr className="bg-gray-50 dark:bg-meta-4/40 font-bold border-t border-stroke dark:border-strokedark">
            <td colSpan={2} className="py-3 px-4 text-black dark:text-white">
              Total ({typesVisible.length})
            </td>
            <td className="py-3 px-4 text-right tabular-nums text-black dark:text-white">
              {days(typeTotals.perYear)}
            </td>
            <td className="py-3 px-4 text-right tabular-nums text-black dark:text-white">
              {days(typeTotals.carry)}
            </td>
            <td className="py-3 px-4 text-right tabular-nums text-black dark:text-white">
              {typeTotals.applied || 0}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};

export default LeaveTypesTab;
