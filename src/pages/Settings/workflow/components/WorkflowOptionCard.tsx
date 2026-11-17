import React from 'react';
import { ChallanModule } from '../../../../utils/challanValidation';
import { LocationItem, LocationChipsSelector, LocationAccentColor } from './LocationChipsSelector';
import { DuplicateGovernanceToggle } from './DuplicateGovernanceToggle';

interface WorkflowOptionCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  activeBgClass: string;
  activeBorderClass: string;
  toggleBgClass: string;
  title: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onToggleMain: (checked: boolean) => void;
  // Location chips
  locationChipsProps?: {
    locationsList: LocationItem[];
    selectedLocations: string[];
    onToggleLocation: (locName: string) => void;
    accentColor: LocationAccentColor;
    labelTitle?: string;
    helperNote?: string;
  };
  // Duplicate governance
  duplicateGovernanceProps?: {
    module: ChallanModule;
    isPermissive: boolean;
    isAuditing: boolean;
    moduleDisplayName: string;
    onToggleDuplicate: (checked: boolean) => void;
  };
  statusText: string;
  actionPageText: string;
}

export const WorkflowOptionCard: React.FC<WorkflowOptionCardProps> = ({
  icon,
  iconBgClass,
  iconTextClass,
  activeBgClass,
  activeBorderClass,
  toggleBgClass,
  title,
  description,
  enabled,
  saving,
  onToggleMain,
  locationChipsProps,
  duplicateGovernanceProps,
  statusText,
  actionPageText
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-6 shadow-sm flex flex-col justify-between ${
        enabled
          ? `${activeBgClass} ${activeBorderClass}`
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={`w-12 h-12 rounded-xl ${iconBgClass} ${iconTextClass} flex items-center justify-center text-xl font-bold shadow-inner`}
          >
            {icon}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggleMain(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${toggleBgClass}`}
            ></div>
          </label>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Per-location selection */}
        {enabled && locationChipsProps && (
          <LocationChipsSelector
            locationsList={locationChipsProps.locationsList}
            selectedLocations={locationChipsProps.selectedLocations}
            onToggleLocation={locationChipsProps.onToggleLocation}
            accentColor={locationChipsProps.accentColor}
            labelTitle={locationChipsProps.labelTitle}
            helperNote={locationChipsProps.helperNote}
          />
        )}

        {/* Duplicate Challan Governance */}
        {duplicateGovernanceProps && (
          <DuplicateGovernanceToggle
            module={duplicateGovernanceProps.module}
            isPermissive={duplicateGovernanceProps.isPermissive}
            isAuditing={duplicateGovernanceProps.isAuditing}
            saving={saving}
            moduleDisplayName={duplicateGovernanceProps.moduleDisplayName}
            onToggle={duplicateGovernanceProps.onToggleDuplicate}
          />
        )}

        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1.5 font-medium">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${enabled ? 'bg-primary' : 'bg-slate-400'}`}
            ></span>
            <span>
              Current mode: <strong>{statusText}</strong>
            </span>
          </div>
          <div className="text-slate-400">
            Action Page: <strong>{actionPageText}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
