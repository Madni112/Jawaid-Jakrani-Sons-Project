import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCalendarToday,
  MdShoppingCart,
  MdLocalMall,
  MdAddBox,
  MdCompareArrows,
  MdAssessment,
  MdTrendingUp,
  MdArrowUpward,
  MdArrowDownward,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdReceiptLong,
} from 'react-icons/md';
import ActionCard from '../../../ui/ActionCard';
import StatCard from '../../../ui/StatCard';

interface Theme1FinancialCardsProps {
  metrics: any;
  setActiveBreakdownModal: (modal: 'cash' | 'bank' | 'receivables' | 'payables' | 'stock' | null) => void;
  t: (key: string, defaultValue: string) => string;
}

export const Theme1FinancialCards: React.FC<Theme1FinancialCardsProps> = ({
  metrics,
  setActiveBreakdownModal,
  t,
}) => {
  const navigate = useNavigate();

  return (
    <>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('executive_dashboard_title', 'Executive Management Dashboard')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('executive_dashboard_subtitle', 'Real-time fiscal monitoring, procurement velocity & operational intelligence')}
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3.5 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
                <MdCalendarToday className="text-emerald-600" />
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
            <ActionCard title="Sales" subtitle="Customer Bill" Icon={MdShoppingCart} bgGradient="bg-gradient-to-br from-emerald-600 to-teal-800" onClick={() => navigate('/sales/invoice/list')} />
            <ActionCard title="Purchases" subtitle="Buy New Product" Icon={MdLocalMall} bgGradient="bg-gradient-to-br from-teal-700 to-emerald-900" onClick={() => navigate('/Purchase/Purchases/list')} />
            <ActionCard title="Products" subtitle="Items List" Icon={MdAddBox} bgGradient="bg-gradient-to-br from-teal-600 to-cyan-800" onClick={() => navigate('/Administration/Products/list')} />
            <ActionCard title="Sale Return" subtitle="Customer Return" Icon={MdCompareArrows} bgGradient="bg-gradient-to-br from-slate-700 to-slate-900" onClick={() => navigate('/Sales/Sales-Return/List')} />
            <ActionCard
              title="Stock Report"
              subtitle="Inventory Audit"
              Icon={MdAssessment}
              bgGradient="bg-gradient-to-br from-emerald-700 to-teal-900"
              onClick={() => {
                navigate('/Reports/Reports-Dashboard?category=inventory', { state: { category: 'inventory' } });
              }}
            />
            <ActionCard title="Today's Sale" subtitle={`Rs. ${metrics.todaysSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} Icon={MdTrendingUp} bgGradient="bg-gradient-to-br from-teal-500 to-emerald-700" onClick={() => { }} />
            <ActionCard title="This Month Sales" subtitle={`Rs. ${metrics.thisMonthSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} Icon={MdArrowUpward} bgGradient="bg-gradient-to-br from-emerald-800 to-slate-900" onClick={() => { }} />
            <ActionCard title="This Month Purchases" subtitle={`Rs. ${metrics.thisMonthPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} Icon={MdArrowDownward} bgGradient="bg-gradient-to-br from-teal-800 to-slate-900" onClick={() => { }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              title="Cash"
              value={metrics.cashBalance}
              Icon={MdAccountBalanceWallet}
              bgColor="bg-gradient-to-br from-emerald-500 to-teal-600"
              thisMonthValue={metrics.thisMonthCashInflow}
              thisMonthLabel="This Month"
              onClick={() => setActiveBreakdownModal('cash')}
            />
            <StatCard
              title="Bank Balance"
              value={metrics.totalBankBalance}
              Icon={MdAccountBalance}
              bgColor="bg-gradient-to-br from-teal-600 to-cyan-700"
              thisMonthValue={metrics.thisMonthBankInflow}
              thisMonthLabel="This Month"
              onClick={() => setActiveBreakdownModal('bank')}
            />
            <StatCard
              title="Receivables"
              value={metrics.totalReceivables}
              Icon={MdReceiptLong}
              bgColor="bg-gradient-to-br from-emerald-600 to-teal-700"
              thisMonthValue={metrics.thisMonthReceivables}
              thisMonthLabel="This Month"
              onClick={() => setActiveBreakdownModal('receivables')}
            />
            <StatCard
              title="Stock Assets"
              value={metrics.inventoryAssetValue}
              Icon={MdAssessment}
              bgColor="bg-gradient-to-br from-emerald-700 to-slate-900"
              thisMonthValue={metrics.inventoryAssetValue}
              thisMonthLabel="This Month"
              onClick={() => setActiveBreakdownModal('stock')}
            />
          </div>
        </>
  );
};

export default Theme1FinancialCards;
