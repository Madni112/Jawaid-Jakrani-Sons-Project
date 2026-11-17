import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import Spinner from '../../../../ui/Spinner';
import TablePagination from '../../../../components/TablePagination';
import { InventoryCategory, DeletingCategoryItem } from '../types/categoryTypes';

interface CategoryTableProps {
  categories: InventoryCategory[];
  bottomCategories: InventoryCategory[];
  loading: boolean;
  searchTerm: string;
  pageSize: number;
  currentPage: number;
  onSearchChange: (val: string) => void;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onEditCategory: (cat: InventoryCategory) => void;
  onRequestDelete: (item: DeletingCategoryItem) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  bottomCategories,
  loading,
  searchTerm,
  pageSize,
  currentPage,
  onSearchChange,
  onPageSizeChange,
  onPageChange,
  onEditCategory,
  onRequestDelete
}) => {
  const filteredCategories = bottomCategories.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredCategories.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + pageSize);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-xs font-semibold text-black dark:text-white"
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size} className="dark:bg-boxdark">
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto text-gray-500 dark:text-gray-400">
          <span>Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search categories..."
            className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none focus:border-primary text-xs text-black dark:text-white"
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
              <th className="py-4 px-4 font-semibold text-xs w-20">S#</th>
              <th className="py-4 px-4 font-semibold text-xs">Category (Bottom)</th>
              <th className="py-4 px-4 font-semibold text-xs">Sub Category (Middle)</th>
              <th className="py-4 px-4 font-semibold text-xs">Parent Category (Top)</th>
              <th className="py-4 px-4 font-semibold text-xs w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-xs">
                  <div className="flex justify-center items-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : paginatedCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-xs text-gray-500 dark:text-gray-400">
                  No categories found.
                </td>
              </tr>
            ) : (
              paginatedCategories.map((cat, idx) => {
                const serialNumber = startIndex + idx + 1;
                const subCat = categories.find((c) => c.id === cat.parent_id);
                const parentCat = subCat ? categories.find((c) => c.id === subCat.parent_id) : null;

                return (
                  <tr
                    key={cat.id}
                    className="border-b border-stroke dark:border-strokedark duration-150 text-xs hover:bg-gray-50 dark:hover:bg-meta-4/30"
                  >
                    <td className="py-3.5 px-4 text-black dark:text-white font-medium">{serialNumber}</td>
                    <td className="py-3.5 px-4 text-black dark:text-white font-bold uppercase tracking-tight">
                      {cat.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                      {subCat?.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                      {parentCat?.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditCategory(cat)}
                          className="inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 p-1.5 rounded transition"
                          title="Edit Category"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => onRequestDelete({ id: cat.id, name: cat.name, type: 'Category' })}
                          className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 p-1.5 rounded transition"
                          title="Delete Category"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={onPageChange}
        itemName="entries"
      />
    </div>
  );
};
