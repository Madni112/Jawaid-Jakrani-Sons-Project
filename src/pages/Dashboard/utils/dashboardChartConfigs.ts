import { FinancialSummary } from '../../../service/financialCalculations';

export const getSalesVsPurchasesChartConfig = (metrics: FinancialSummary | null) => {
  const hasMonthlyTrend = Boolean(metrics?.monthlySalesTrend && metrics.monthlySalesTrend.length > 0);
  const monthlyCategories = hasMonthlyTrend
    ? metrics!.monthlySalesTrend.map((m) => m.month)
    : ['Jan', 'Feb', 'Mar'];
  const grossSalesData = hasMonthlyTrend
    ? metrics!.monthlySalesTrend.map((m) => m.sales)
    : [0, 0, 0];
  const procurementData = hasMonthlyTrend
    ? metrics!.monthlySalesTrend.map((m) => m.purchases)
    : [0, 0, 0];

  const options: any = {
    chart: { type: 'area', height: 300, toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#059669', '#D97706'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: monthlyCategories,
      labels: { style: { colors: '#64748B', fontSize: '11px' } }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `Rs. ${(val / 1000).toFixed(0)}k`,
        style: { colors: '#64748B', fontSize: '11px' }
      }
    },
    tooltip: { y: { formatter: (val: number) => `Rs. ${val.toLocaleString()}` } },
    legend: { position: 'top', horizontalAlign: 'right' }
  };

  const series = [
    { name: 'Gross Sales', data: grossSalesData },
    { name: 'Procurement Purchases', data: procurementData }
  ];

  return { options, series };
};

export const getCustomerSalesChartConfig = (
  chartViewTab: 'daily' | 'monthly',
  customerSalesDaily: { dates: string[]; sales: number[] },
  customerSalesMonthly: { months: string[]; sales: number[] }
) => {
  const customerGraphCategories =
    chartViewTab === 'daily' ? customerSalesDaily.dates : customerSalesMonthly.months;
  const customerGraphData =
    chartViewTab === 'daily' ? customerSalesDaily.sales : customerSalesMonthly.sales;

  const options: any = {
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    colors: ['#059669'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: chartViewTab === 'daily' ? '45%' : '35%',
        distributed: false
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: customerGraphCategories,
      labels: { style: { colors: '#64748B', fontSize: '10px' } }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `Rs. ${(val / 1000).toFixed(0)}k`,
        style: { colors: '#64748B', fontSize: '11px' }
      }
    },
    tooltip: {
      y: { formatter: (val: number) => `Rs. ${Number(val || 0).toLocaleString()}` }
    }
  };

  const series = [
    {
      name: chartViewTab === 'daily' ? 'Daily Customer Sales' : 'Monthly Customer Sales',
      data: customerGraphData
    }
  ];

  return { options, series };
};

export const getBankDonutConfig = (metrics: FinancialSummary | null) => {
  const totalBankBalance = metrics?.bankAccounts
    ? metrics.bankAccounts.reduce((acc, b) => acc + Math.max(0, b.netBalance), 0)
    : 0;

  const options: any = {
    chart: { type: 'donut' },
    colors: totalBankBalance > 0 ? ['#059669', '#0D9488', '#10B981', '#14B8A6', '#334155'] : ['#CBD5E1'],
    labels: totalBankBalance > 0 ? metrics!.bankAccounts.map((b) => b.accountTitle) : ['Zero Balance'],
    legend: { position: 'bottom' },
    tooltip: {
      y: { formatter: (val: number) => `Rs. ${totalBankBalance > 0 ? val.toLocaleString() : '0.00'}` }
    }
  };

  const series =
    totalBankBalance > 0
      ? metrics!.bankAccounts.map((b) => Math.max(0, b.netBalance))
      : [1];

  return { options, series };
};
