import React from 'react';
import { formatQtyToBoxPc } from '../../../../../utils/QtyBadge';

export const getQtyOptionBParts = (qty: number) => {
  const { box, pc } = formatQtyToBoxPc(qty);
  let main = '';
  let unit = '';
  if (box > 0 && pc > 0) {
    main = `${box} Boxes`;
    unit = `+ ${pc} Pc${pc > 1 ? 's' : ''}`;
  } else if (box > 0) {
    main = `${box}`;
    unit = 'Boxes';
  } else if (pc > 0) {
    main = `${pc}`;
    unit = `Pc${pc > 1 ? 's' : ''}`;
  } else {
    main = '0';
    unit = 'Pcs';
  }
  return { main, unit };
};

export type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'all_time';

export const calculateDatePreset = (preset: DatePreset): { from: string; to: string } => {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  if (preset === 'today') {
    const todayStr = formatDate(today);
    return { from: todayStr, to: todayStr };
  } else if (preset === 'yesterday') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = formatDate(y);
    return { from: yStr, to: yStr };
  } else if (preset === 'this_week') {
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return { from: formatDate(startOfWeek), to: formatDate(today) };
  } else if (preset === 'this_month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDate(startOfMonth), to: formatDate(today) };
  } else if (preset === 'last_month') {
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: formatDate(startOfLastMonth), to: formatDate(endOfLastMonth) };
  }
  return { from: '', to: '' };
};
