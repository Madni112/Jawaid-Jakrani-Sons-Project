import React from 'react';

export interface ReportItem {
  id: string;
  title: string;
  category: 'sales' | 'purchases' | 'inventory' | 'accounts' | 'business';
  description: string;
  badge?: string;
  badgeType?: 'new' | 'audited' | 'accrual';
  createdAt?: string; // ISO / YYYY-MM-DD date string
  path: string;
  state?: any;
  icon: any;
}

export interface CategoryMeta {
  key: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
}
