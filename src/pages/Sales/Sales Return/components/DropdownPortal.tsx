import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: React.ReactNode;
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  minWidth?: number;
  maxWidth?: number;
}

export const DropdownPortal: React.FC<DropdownPortalProps> = ({
  children,
  anchorEl,
  isOpen,
  minWidth = 280,
  maxWidth,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isOpen || !anchorEl) return;
    const update = () => setRect(anchorEl.getBoundingClientRect());
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, anchorEl]);

  if (!isOpen || !rect) return null;

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(8, Math.min(rect.left, window.innerWidth - (minWidth || 280) - 16)),
    width: maxWidth
      ? Math.min(Math.max(rect.width, minWidth), maxWidth)
      : Math.max(rect.width, minWidth),
    zIndex: 99999999,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
  };

  if (openUpward) {
    style.bottom = window.innerHeight - rect.top + 4;
    style.maxHeight = Math.min(spaceAbove - 16, 320);
  } else {
    style.top = rect.bottom + 4;
    style.maxHeight = Math.min(Math.max(spaceBelow - 16, 160), 320);
  }

  return createPortal(
    <div style={style}>
      {children}
    </div>,
    document.body
  );
};

export default DropdownPortal;
