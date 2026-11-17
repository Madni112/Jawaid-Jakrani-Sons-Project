import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { useLanguage } from '../../../Context/LanguageContext';
import { MdCloudUpload } from 'react-icons/md';
import CustomerImportModal from './CustomerImportModal';
import { CustomerRecord, COAAccount } from './history/types/customerHistoryTypes';
import {
  getCustomerDisplayName,
  getCustomerLocation,
  getCustomerCOA,
  normalizeAccountCode,
  parsePageNumber,
  getNextSuggestedCode
} from './history/utils/customerHistoryHelpers';
import {
  fetchCustomersAndCOAData,
  saveCustomerAccountCodeAction,
  deleteCustomerWithCOAAction
} from './history/services/customerHistoryService';
import { CustomerAccountModal } from './history/components/CustomerAccountModal';
import { CustomerDeleteConfirmModal } from './history/components/CustomerDeleteConfirmModal';
import { CustomerTableRow } from './history/components/CustomerTableRow';

export { getCustomerDisplayName };

const CustomerHistory: React.FC = () => {
  const { tenantId } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<COAAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Datatable search, sorting, and pagination trackers
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSortOrder, setPageSortOrder] = useState<'asc' | 'desc' | null>('asc');
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);
  const [deleteCustomerCOA, setDeleteCustomerCOA] = useState<boolean>(true);
  const [deletingCustomer, setDeletingCustomer] = useState<boolean>(false);

  const fetchCustomersAndCOA = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomersAndCOAData();
      setCustomers(data.customers);
      setCoaAccounts(data.coaAccounts);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load customer records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersAndCOA();
  }, [tenantId]);

  const handleOpenAccountModal = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setShowAccountModal(true);
  };

  const handleSaveAccountCode = async (params: {
    selectedCustomer: CustomerRecord;
    cleanCode: string;
    openingBalanceInput: string;
    balanceNatureInput: 'Debit' | 'Credit';
    existingCOA?: COAAccount;
    coaAccounts: COAAccount[];
  }) => {
    try {
      await saveCustomerAccountCodeAction(params);
      toast.success(
        `Customer account (${params.cleanCode}) assigned for "${getCustomerDisplayName(params.selectedCustomer)}"!`
      );
      setShowAccountModal(false);
      await fetchCustomersAndCOA();
    } catch (err: any) {
      toast.error('Failed to save account: ' + err.message);
      throw err;
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeletingCustomer(true);
    try {
      await deleteCustomerWithCOAAction(customerToDelete, deleteCustomerCOA);
      toast.success(
        `Customer ${deleteCustomerCOA ? 'and linked Chart of Accounts entry ' : ''}deleted successfully!`
      );
      setCustomerToDelete(null);
      fetchCustomersAndCOA();
    } catch (err: any) {
      toast.error('Failed to delete customer: ' + err.message);
    } finally {
      setDeletingCustomer(false);
    }
  };

  // Live filter and natural page # sort
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;

        const cleanTerm = term.replace(/[\s-]/g, '');
        const loc = getCustomerLocation(c);
        const coa = getCustomerCOA(c, coaAccounts);

        const name = getCustomerDisplayName(c).toLowerCase();
        const code = (c.customer_code || c.customerCode || '').toLowerCase();
        const pageNo = String(c.page_no || c.pageNo || '').toLowerCase();
        const city = (loc.city || c.sub_area || c.subArea || c.city || '').toLowerCase();
        const area = (loc.area || c.area || '').toLowerCase();
        const address = (c.address || '').toLowerCase();
        const province = (c.province || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        const coaCode = String(coa?.account_code || c.account_code || c.coa_code || '').toLowerCase();
        const ntn = (c.ntnNo || '').toLowerCase();

        const rawPhone = String(c.primaryPhone || c.phone || '').toLowerCase();
        const rawSecPhone = String(c.secondaryPhone || '').toLowerCase();
        const cleanPhone = rawPhone.replace(/[\s-]/g, '');
        const cleanSecPhone = rawSecPhone.replace(/[\s-]/g, '');

        return (
          name.includes(term) ||
          code.includes(term) ||
          pageNo.includes(term) ||
          city.includes(term) ||
          area.includes(term) ||
          address.includes(term) ||
          province.includes(term) ||
          company.includes(term) ||
          coaCode.includes(term) ||
          ntn.includes(term) ||
          rawPhone.includes(term) ||
          rawSecPhone.includes(term) ||
          (cleanTerm.length > 0 && (cleanPhone.includes(cleanTerm) || cleanSecPhone.includes(cleanTerm)))
        );
      })
      .sort((a, b) => {
        if (!pageSortOrder) {
          const rawCodeA = String(a.customer_code || a.customerCode || a.coa_code || a.account_code || '');
          const rawCodeB = String(b.customer_code || b.customerCode || b.coa_code || b.account_code || '');
          const numA = parseInt(rawCodeA.replace(/\D/g, '') || '999999', 10);
          const numB = parseInt(rawCodeB.replace(/\D/g, '') || '999999', 10);
          if (numA !== numB) return numA - numB;
          return getCustomerDisplayName(a).localeCompare(getCustomerDisplayName(b));
        }

        const pageA = a.page_no || a.pageNo;
        const pageB = b.page_no || b.pageNo;
        const numA = parsePageNumber(pageA);
        const numB = parsePageNumber(pageB);

        if (numA !== null && numB !== null) {
          if (numA !== numB) {
            return pageSortOrder === 'asc' ? numA - numB : numB - numA;
          }
          return String(pageA).localeCompare(String(pageB), undefined, { numeric: true });
        }

        if (numA !== null && numB === null) return pageSortOrder === 'asc' ? -1 : 1;
        if (numA === null && numB !== null) return pageSortOrder === 'asc' ? 1 : -1;

        if (pageA && pageB) {
          return pageSortOrder === 'asc'
            ? String(pageA).localeCompare(String(pageB), undefined, { numeric: true })
            : String(pageB).localeCompare(String(pageA), undefined, { numeric: true });
        }
        if (pageA && !pageB) return pageSortOrder === 'asc' ? -1 : 1;
        if (!pageA && pageB) return pageSortOrder === 'asc' ? 1 : -1;

        return getCustomerDisplayName(a).localeCompare(getCustomerDisplayName(b));
      });
  }, [customers, coaAccounts, searchTerm, pageSortOrder]);

  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, pageSortOrder]);

  // Compute selected customer modal initial values
  const selectedCustomerCOA = selectedCustomer ? getCustomerCOA(selectedCustomer, coaAccounts) : undefined;
  const rawCode = selectedCustomer
    ? selectedCustomerCOA?.account_code ||
      selectedCustomer.customer_code ||
      selectedCustomer.customerCode ||
      selectedCustomer.coa_code ||
      selectedCustomer.account_code ||
      ''
    : '';
  const initialCode = rawCode ? normalizeAccountCode(rawCode) : getNextSuggestedCode(coaAccounts, customers);

  let initialOpBal = '';
  if (
    selectedCustomerCOA?.opening_balance !== undefined &&
    selectedCustomerCOA?.opening_balance !== null &&
    Number(selectedCustomerCOA.opening_balance) > 0
  ) {
    initialOpBal = String(Math.abs(Number(selectedCustomerCOA.opening_balance)));
  } else if (
    selectedCustomer?.opening_balance !== undefined &&
    selectedCustomer?.opening_balance !== null &&
    Number(selectedCustomer.opening_balance) > 0
  ) {
    initialOpBal = String(Math.abs(Number(selectedCustomer.opening_balance)));
  } else if (
    selectedCustomer?.balance !== undefined &&
    selectedCustomer?.balance !== null &&
    Number(selectedCustomer.balance) !== 0
  ) {
    initialOpBal = String(Math.abs(Number(selectedCustomer.balance)));
  }

  const initialNature: 'Debit' | 'Credit' =
    selectedCustomerCOA?.balance_nature ||
    selectedCustomer?.balance_nature ||
    (Number(selectedCustomer?.balance) < 0 ? 'Credit' : 'Debit');

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      {/* Dynamic Header Layout */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t('customer_database', 'Customer Database')}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('manage_customers', 'Manage customer directory and assign Chart of Account ledger codes')}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 px-3.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <MdCloudUpload size={18} className="text-primary" />
            <span>{t('upload_excel', 'Upload Excel')}</span>
          </button>
          <button
            onClick={() => navigate('/Sales/Customers/Add')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            {t('add_new_customer', '+ Add New Customer')}
          </button>
        </div>
      </div>

      {/* Datatable Filter Control Header Line */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{isRTL ? 'دکھائیں' : 'Show'}</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm font-medium text-black dark:text-white"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size} className="dark:bg-boxdark">
                {size}
              </option>
            ))}
          </select>
          <span>{isRTL ? 'ریکارڈز' : 'entries'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm w-full sm:w-auto text-gray-500 dark:text-gray-400">
          <span>{isRTL ? 'تلاش:' : 'Search:'}</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(
              'search_customers_placeholder',
              'Search name, phone, city, area, account, page #...'
            )}
            className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm text-black dark:text-white"
          />
        </div>
      </div>

      {/* Core Table Canvas Frame */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className={`bg-gray-2 dark:bg-meta-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              <th className="w-16 py-4 px-4 font-bold text-black dark:text-white text-xs text-center">S#</th>
              <th className="min-w-[170px] py-4 px-4 font-bold text-black dark:text-white text-xs">
                {t('name', 'Name')}
              </th>
              <th className="min-w-[110px] py-4 px-4 font-bold text-black dark:text-white text-xs">
                {t('phone', 'Phone')}
              </th>
              <th className="min-w-[130px] py-4 px-4 font-bold text-black dark:text-white text-xs">
                {t('city_area', 'City / Area')}
              </th>
              <th className="min-w-[160px] py-4 px-4 font-bold text-black dark:text-white text-xs">
                {t('address', 'Address')}
              </th>
              <th className="min-w-[150px] py-4 px-4 font-bold text-black dark:text-white text-xs text-center">
                {t('accounts', 'Account Code')}
              </th>
              <th className="py-4 px-4 font-bold text-black dark:text-white text-xs text-center w-28">
                {t('actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Spinner />
                </td>
              </tr>
            ) : paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
                  No matching customer entries found.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((c, idx) => (
                <CustomerTableRow
                  key={c.id}
                  customer={c}
                  serialNumber={startIndex + idx + 1}
                  coaAccounts={coaAccounts}
                  onOpenAccountModal={handleOpenAccountModal}
                  onDeleteCustomer={(cust) => setCustomerToDelete(cust)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CALCULATED DATA COORDS SUMMARY METRIC FOOTER STRIP */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-stroke dark:border-strokedark">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
          {searchTerm && ` (filtered from ${customers.length} total customers)`}
        </div>

        {/* Dynamic Page Controls Buttons Array Map */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold disabled:opacity-40 cursor-pointer text-xs"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-teal-600 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold disabled:opacity-40 cursor-pointer text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── ASSIGN / EDIT ACCOUNT CODE MODAL ── */}
      {showAccountModal && selectedCustomer && (
        <CustomerAccountModal
          customer={selectedCustomer}
          initialCode={initialCode}
          initialOpeningBalance={initialOpBal}
          initialNature={initialNature}
          existingCOA={selectedCustomerCOA}
          coaAccounts={coaAccounts}
          onClose={() => setShowAccountModal(false)}
          onSave={handleSaveAccountCode}
        />
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <CustomerDeleteConfirmModal
          customer={customerToDelete}
          deleteCustomerCOA={deleteCustomerCOA}
          deletingCustomer={deletingCustomer}
          onDeleteCustomerCOAChange={setDeleteCustomerCOA}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={confirmDeleteCustomer}
        />
      )}

      {/* Bulk Customer Excel Import Modal */}
      <CustomerImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => fetchCustomersAndCOA()}
      />
    </div>
  );
};

export default CustomerHistory;
