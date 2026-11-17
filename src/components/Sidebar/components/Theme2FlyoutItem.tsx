import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

interface Theme2FlyoutItemProps {
  child: any;
  pathname: string;
  handleLinkClick: () => void;
  getTenantPath?: (path?: string) => string;
  setOpenMenuId: (id: string | null) => void;
  activeChildKey: string | null;
  setActiveChildKey: React.Dispatch<React.SetStateAction<string | null>>;
  clearHideTimeout?: () => void;
  scheduleHide?: () => void;
}

export const Theme2FlyoutItem: React.FC<Theme2FlyoutItemProps> = ({
  child,
  pathname,
  handleLinkClick,
  getTenantPath,
  setOpenMenuId,
  activeChildKey,
  setActiveChildKey,
}) => {
  const location = useLocation();
  const fullCurrentPath = location.pathname + location.search;
  const subDest = (child.path && getTenantPath ? getTenantPath(child.path) : child.path) || '#';
  const hasSubChildren = Boolean(child.children && child.children.length > 0);
  
  const norm = (p?: string) => (p || '').toLowerCase().split('?')[0];
  const isSubActive = Boolean(
    child.path && (
      norm(pathname) === norm(subDest) || 
      norm(pathname) === norm(child.path) ||
      (hasSubChildren && child.children.some((g: any) => {
        const gDest = (g.path && getTenantPath ? getTenantPath(g.path) : g.path) || '';
        return norm(pathname) === norm(gDest) || norm(pathname) === norm(g.path);
      }))
    )
  );
  const isHovered = activeChildKey === child.label;

  const itemLiRef = React.useRef<HTMLLIElement>(null);
  const [subFlyoutStyle, setSubFlyoutStyle] = React.useState<React.CSSProperties>({ top: 0 });

  const handleMouseEnter = () => {
    setActiveChildKey(child.label);
    if (hasSubChildren && itemLiRef.current) {
      const rect = itemLiRef.current.getBoundingClientRect();
      const count = child.children?.length || 1;
      const estimatedHeight = count * 35 + 24;
      const spaceBelow = window.innerHeight - rect.top;

      if (spaceBelow < estimatedHeight) {
        if (rect.bottom >= estimatedHeight) {
          setSubFlyoutStyle({ bottom: 0, top: 'auto' });
        } else {
          const overflow = estimatedHeight - spaceBelow + 12;
          setSubFlyoutStyle({ top: -overflow, bottom: 'auto' });
        }
      } else {
        setSubFlyoutStyle({ top: 0, bottom: 'auto' });
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLLIElement>) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    setActiveChildKey((prev: string | null) => (prev === child.label ? null : prev));
  };

  return (
    <li
      ref={itemLiRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavLink
        to={hasSubChildren ? (child.children[0]?.path || subDest) : subDest}
        onClick={() => {
          setOpenMenuId(null);
          handleLinkClick();
        }}
        className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
          isHovered || isSubActive
            ? 'text-white shadow-xs font-semibold'
            : 'text-neutral-300 hover:bg-white/10 hover:text-white'
        }`}
        style={{
          backgroundColor: isHovered || isSubActive
            ? 'var(--color-primary, #800020)'
            : undefined,
        }}
      >
        <span className="truncate">{child.label}</span>
        {hasSubChildren && (
          <FiChevronRight size={12} className={`shrink-0 ml-2 transition-transform ${isHovered ? 'text-white' : 'text-neutral-400'}`} />
        )}
      </NavLink>

      {/* 2nd Tier Nested Sub-Flyout (pops out to the right) */}
      {hasSubChildren && isHovered && (
        <div
          className="absolute left-full pl-1.5 min-w-[210px] max-w-[250px] z-99999"
          style={{
            ...subFlyoutStyle,
            animation: 'sidebarFlyoutFadeIn 0.12s ease-out forwards',
          }}
        >
          {/* Invisible safe bridge covering the gap seamlessly */}
          <div className="absolute top-0 -left-2 w-3 h-full bg-transparent pointer-events-auto" />
          <div className="rounded-xl border border-[#2D2D2D] bg-[#161618] text-slate-100 shadow-2xl ring-1 ring-white/5 p-1.5 max-h-[calc(100vh-32px)] overflow-y-auto">
            <ul className="flex flex-col gap-0.5">
              {child.children.map((grandChild: any, gIdx: number) => {
                const gDest = (grandChild.path && getTenantPath ? getTenantPath(grandChild.path) : grandChild.path) || '#';
                const isGActive = grandChild.path && (
                  pathname === gDest || 
                  pathname === grandChild.path ||
                  fullCurrentPath === gDest ||
                  fullCurrentPath === grandChild.path
                );
                return (
                  <li key={gIdx}>
                    <NavLink
                      to={gDest}
                      onClick={() => {
                        setOpenMenuId(null);
                        handleLinkClick();
                      }}
                      className={`flex items-center rounded-lg px-3 py-1.5 text-[12.5px] font-normal transition-all duration-150 ${
                        isGActive
                          ? 'text-white font-semibold shadow-xs'
                          : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: isGActive ? 'var(--color-primary, #800020)' : undefined,
                      }}
                    >
                      <span className="truncate">{grandChild.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
};
