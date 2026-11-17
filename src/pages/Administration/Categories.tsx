import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Spinner from '../../ui/Spinner';
import { MdCategory, MdSave } from 'react-icons/md';
import { useAuth } from '../../Context/Auth';
import { InventoryCategory, DeletingCategoryItem } from './categories/types/categoryTypes';
import {
  fetchInventoryCategories,
  deleteCategoryById,
  saveBottomCategory
} from './categories/services/categoryService';
import { ParentCategoryCombobox } from './categories/components/ParentCategoryCombobox';
import { SubCategoryCombobox } from './categories/components/SubCategoryCombobox';
import { CategoryDeleteModal } from './categories/components/CategoryDeleteModal';
import { CategoryTable } from './categories/components/CategoryTable';

const Categories: React.FC = () => {
  const { tenantId } = useAuth();
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Parent Category combobox state
  const [selectedParentId, setSelectedParentId] = useState<string | number>('');
  const [parentInput, setParentInput] = useState('');

  // Sub Category combobox state
  const [selectedSubId, setSelectedSubId] = useState<string | number>('');
  const [subInput, setSubInput] = useState('');

  // Bottom category form state
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | number | null>(null);

  // Delete modal confirmation state
  const [deletingCategoryItem, setDeletingCategoryItem] = useState<DeletingCategoryItem | null>(null);

  // Pagination and Lookup filters control parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchInventoryCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [tenantId]);

  // --- Computed Hierarchies ---
  const parentCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null || c.parent_id === undefined),
    [categories]
  );

  const subCategories = useMemo(() => {
    if (!selectedParentId) return [];
    return categories.filter((c) => c.parent_id === Number(selectedParentId));
  }, [categories, selectedParentId]);

  const bottomCategories = useMemo(() => {
    const subCatIds = new Set(
      categories
        .filter(
          (c) =>
            c.parent_id &&
            categories.find((p) => p.id === c.parent_id)?.parent_id === null
        )
        .map((c) => c.id)
    );
    return categories.filter((c) => c.parent_id && subCatIds.has(c.parent_id));
  }, [categories]);

  // --- Delete Action (via Modal) ---
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategoryItem) return;
    const { id, name, type } = deletingCategoryItem;

    try {
      await deleteCategoryById(id);
      toast.success(`${type} Category "${name}" deleted.`);

      if (type === 'Parent' && id.toString() === selectedParentId.toString()) {
        setSelectedParentId('');
        setParentInput('');
        setSelectedSubId('');
        setSubInput('');
      } else if (type === 'Sub' && id.toString() === selectedSubId.toString()) {
        setSelectedSubId('');
        setSubInput('');
      } else if (type === 'Category' && editCategoryId === id) {
        setEditCategoryId(null);
        setCategoryName('');
      }

      await fetchCategories();
    } catch (err: any) {
      toast.error('Could not delete: ' + err.message);
    } finally {
      setDeletingCategoryItem(null);
    }
  };

  // --- Create / Update Bottom Category Form ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.error('Category Name is required');
    if (!selectedSubId) return toast.error('Please select a Sub Category');

    try {
      setSubmitting(true);
      const isDuplicate = categories
        .filter((c) => c.parent_id === Number(selectedSubId) && c.id !== editCategoryId)
        .some((c) => c.name?.toLowerCase() === categoryName.trim().toLowerCase());
      if (isDuplicate) return toast.error('Category already exists under this sub category');

      await saveBottomCategory(categoryName.trim(), selectedSubId, editCategoryId, tenantId);
      toast.success(editCategoryId ? 'Category updated successfully!' : 'Category created successfully!');

      setCategoryName('');
      setEditCategoryId(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = (cat: InventoryCategory) => {
    setEditCategoryId(cat.id);
    setCategoryName(cat.name);

    const subCat = categories.find((c) => c.id === cat.parent_id);
    if (subCat) {
      setSelectedSubId(subCat.id);
      setSubInput(subCat.name);
      const parentCat = categories.find((c) => c.id === subCat.parent_id);
      if (parentCat) {
        setSelectedParentId(parentCat.id);
        setParentInput(parentCat.name);
      } else {
        setSelectedParentId('');
        setParentInput('');
      }
    } else {
      setSelectedSubId('');
      setSubInput('');
      setSelectedParentId('');
      setParentInput('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          Categories
        </h2>
      </div>

      {/* CREATION FORM */}
      <div className="rounded-xl border shadow-xs p-5 transition duration-150 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-boxdark">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <MdCategory className="text-emerald-600 text-lg" />
            <span>{editCategoryId ? 'Edit Category Structure' : 'Register New Category Structure'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Parent Category Combobox */}
          <ParentCategoryCombobox
            parentCategories={parentCategories}
            selectedParentId={selectedParentId}
            parentInput={parentInput}
            tenantId={tenantId}
            deletingCategoryItem={deletingCategoryItem}
            onSelectParent={(id, name) => {
              setSelectedParentId(id);
              setParentInput(name);
              setSelectedSubId('');
              setSubInput('');
            }}
            onClearParent={() => {
              setSelectedParentId('');
              setParentInput('');
              setSelectedSubId('');
              setSubInput('');
            }}
            onParentInputChange={setParentInput}
            onRequestDelete={(item) => setDeletingCategoryItem(item)}
            onReload={fetchCategories}
          />

          {/* Sub Category Combobox */}
          <SubCategoryCombobox
            subCategories={subCategories}
            selectedParentId={selectedParentId}
            selectedSubId={selectedSubId}
            subInput={subInput}
            tenantId={tenantId}
            deletingCategoryItem={deletingCategoryItem}
            onSelectSub={(id, name) => {
              setSelectedSubId(id);
              setSubInput(name);
            }}
            onClearSub={() => {
              setSelectedSubId('');
              setSubInput('');
            }}
            onSubInputChange={setSubInput}
            onRequestDelete={(item) => setDeletingCategoryItem(item)}
            onReload={fetchCategories}
          />

          {/* Category (Bottom Level) Form */}
          <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-gray-500 mb-1.5 text-xs font-bold">Category *</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={!selectedSubId}
                className="w-full border border-stroke rounded-lg p-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-black dark:text-white font-bold text-xs h-[42px] disabled:opacity-50"
                placeholder="Enter category..."
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-[22px]">
              <button
                type="submit"
                disabled={!selectedSubId || submitting}
                className="h-[42px] px-6 flex shrink-0 items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm gap-2"
              >
                {submitting ? <Spinner /> : <><MdSave size={16} /> {editCategoryId ? 'Update' : 'Save'}</>}
              </button>
              {editCategoryId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditCategoryId(null);
                    setCategoryName('');
                    setSelectedSubId('');
                    setSubInput('');
                    setSelectedParentId('');
                    setParentInput('');
                  }}
                  className="h-[42px] px-4 flex shrink-0 items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-meta-4 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs rounded-lg transition shadow-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* TABLE */}
      <CategoryTable
        categories={categories}
        bottomCategories={bottomCategories}
        loading={loading}
        searchTerm={searchTerm}
        pageSize={pageSize}
        currentPage={currentPage}
        onSearchChange={setSearchTerm}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        onEditCategory={handleEditCategory}
        onRequestDelete={(item) => setDeletingCategoryItem(item)}
      />

      {/* DELETE CATEGORY CONFIRMATION MODAL POPUP */}
      {deletingCategoryItem && (
        <CategoryDeleteModal
          item={deletingCategoryItem}
          onCancel={() => setDeletingCategoryItem(null)}
          onConfirm={handleConfirmDeleteCategory}
        />
      )}
    </div>
  );
};

export default Categories;
