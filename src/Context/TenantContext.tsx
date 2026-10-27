import React, { createContext, useContext } from 'react';
import { getBrandConfig } from '../utils/brand';

export interface TenantContextType {
  tenantSlug: string;
  branchId: number;
  tenantName: string;
}

const defaultBrand = getBrandConfig();

const TenantContext = createContext<TenantContextType>({
  tenantSlug: 'default',
  branchId: 1,
  tenantName: defaultBrand.fullName
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TenantContext.Provider
      value={{
        tenantSlug: 'default',
        branchId: 1,
        tenantName: defaultBrand.fullName
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
