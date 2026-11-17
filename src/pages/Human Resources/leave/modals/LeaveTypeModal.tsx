import React from 'react';
import { Area, Check as CheckBox, Field, FormFooter, NumCell, Text } from '../../../Masters/masterUi';
import { LeaveType } from '../../../../services/hr.service';

interface LeaveTypeModalProps {
  typeDraft: Partial<LeaveType> | null;
  setTypeDraft: React.Dispatch<React.SetStateAction<Partial<LeaveType> | null>>;
  saving: boolean;
  editable: boolean;
  onSubmitType: () => void;
  onClose: () => void;
}

export const LeaveTypeModal: React.FC<LeaveTypeModalProps> = ({
  typeDraft,
  setTypeDraft,
  saving,
  editable,
  onSubmitType,
  onClose
}) => {
  if (!typeDraft) return null;

  const setType = (patch: Partial<LeaveType>) =>
    setTypeDraft((d) => (d ? { ...d, ...patch } : null));

  return (
    <div className="rounded-sm border border-stroke bg-white p-5 sm:p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="text-base font-bold text-black dark:text-white mb-5 pb-3 border-b border-stroke dark:border-strokedark">
        {typeDraft.id ? `Edit Leave Type - [${typeDraft.name}]` : 'Create Leave Type'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Field label="Name" required>
          <Text
            value={typeDraft.name ?? ''}
            onChange={(e) => setType({ name: e.target.value })}
            placeholder="e.g. Casual Leave"
            disabled={!editable}
          />
        </Field>
        <Field label="Code">
          <Text
            value={typeDraft.code ?? ''}
            onChange={(e) => setType({ code: e.target.value.toUpperCase().slice(0, 4) })}
            placeholder="CL"
            disabled={!editable}
          />
        </Field>
        <Field label="Days a Year" required>
          <NumCell
            value={typeDraft.daysPerYear ?? 0}
            onChange={(e) => setType({ daysPerYear: Number(e.target.value) })}
            disabled={!editable}
          />
        </Field>
        <Field label="Carry Forward" hint="Days an employee may push into next year.">
          <NumCell
            value={typeDraft.carryForward ?? 0}
            onChange={(e) => setType({ carryForward: Number(e.target.value) })}
            disabled={!editable}
          />
        </Field>
        <div className="lg:col-span-4">
          <Field label="Description">
            <Area
              rows={2}
              value={typeDraft.description ?? ''}
              onChange={(e) => setType({ description: e.target.value })}
              disabled={!editable}
            />
          </Field>
        </div>
        <div className="flex items-center gap-4 lg:col-span-4">
          <CheckBox
            checked={typeDraft.isActive !== false}
            onChange={(v) => setType({ isActive: v })}
            label="Active"
            disabled={!editable}
          />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
        <FormFooter
          onSave={onSubmitType}
          onClose={onClose}
          saving={saving}
          disabled={!editable || !String(typeDraft.name ?? '').trim()}
          saveLabel={typeDraft.id ? 'SAVE' : 'ADD TYPE'}
        />
      </div>
    </div>
  );
};

export default LeaveTypeModal;
