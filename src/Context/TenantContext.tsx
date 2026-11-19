import React, { createContext, useContext } from 'react';

export interface TenantContextType {
  tenantSlug: string;
  branchId: number;
  tenantName: string;
}

const TenantContext = createContext<TenantContextType>({
  tenantSlug: 'default',
  branchId: 1,
  tenantName: 'ZOHAIB ALI AND COMPANY'
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TenantContext.Provider
      value={{
        tenantSlug: 'default',
        branchId: 1,
        tenantName: 'ZOHAIB ALI AND COMPANY'
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
