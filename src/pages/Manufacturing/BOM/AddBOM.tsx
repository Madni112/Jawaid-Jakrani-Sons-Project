import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../Context/LanguageContext';
import { supabase } from '../../../Context/supabaseClient';
import { bomService } from '../../../service/bomService';
import { recipeService } from '../../../service/recipeService';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';
import { fetchAllUomsSafe, UomItem } from '../../../service/uomService';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { BomHeader, BomItem, DedicatedRecipe, BomCalculations } from './types/bomTypes';
import BOMHeaderBar from './components/BOMHeaderBar';
import BOMRecipeActionBar from './components/BOMRecipeActionBar';
import BOMStepperHeader from './components/BOMStepperHeader';
import BOMProductOutputTab from './components/BOMProductOutputTab';
import BOMRawMaterialsTab from './components/BOMRawMaterialsTab';
import BOMLaborOverheadsTab from './components/BOMLaborOverheadsTab';
import BOMCostSummaryCard from './components/BOMCostSummaryCard';
import BOMSaveRecipeModal from './components/BOMSaveRecipeModal';
import BOMStepperControls from './components/BOMStepperControls';

const AddBOM: React.FC = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 3-Step Tab State
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Master lists from database
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [availableUoms, setAvailableUoms] = useState<string[]>([]);
  const [allUomsList, setAllUomsList] = useState<UomItem[]>([]);

  // Step 1: Finished Product Output State
  const [bomNumber, setBomNumber] = useState('');
  const [finishedProductName, setFinishedProductName] = useState('');
  const [finishedProductCode, setFinishedProductCode] = useState('');
  const [finishedProductId, setFinishedProductId] = useState('');

  // 3-Level Cascading Categories
  const [subSubCategory, setSubSubCategory] = useState(''); // Parent Category (top level)
  const [subCategory, setSubCategory] = useState('');       // Sub Category (middle level)
  const [category, setCategory] = useState('');             // Category (bottom level)

  const [batchQuantity, setBatchQuantity] = useState<number>(1);
  const [uom, setUom] = useState('PCS');
  const [status, setStatus] = useState<'Active' | 'Trial' | 'Draft'>('Active');

  // Finished Good Loose Selling Configurations
  const [allowLoose, setAllowLoose] = useState<boolean>(false);
  const [looseUom, setLooseUom] = useState<string>('PCS');
  const [looseRatio, setLooseRatio] = useState<number | string>(1);
  const [multiLooseUnits, setMultiLooseUnits] = useState<Array<{ uom: string; ratio: number | string; costPrice?: number | string; salePrice?: number | string }>>([]);

  // Step 2: Raw Materials Table
  const [items, setItems] = useState<BomItem[]>([
    {
      id: 'row-1',
      item_name: '',
      item_code: '',
      quantity: 1,
      uom: 'PCS',
      unit_cost: 0,
      wastage_percentage: 0,
      total_cost: 0,
      item_type: 'Chemical',
      notes: ''
    }
  ]);

  // Step 3: Labor, Overheads & SOP
  const [laborCost, setLaborCost] = useState<number>(0);
  const [overheadCost, setOverheadCost] = useState<number>(0);
  const [packagingCost, setPackagingCost] = useState<number>(0);
  const [targetSellingPrice, setTargetSellingPrice] = useState<number>(0);
  const [syncCatalogPrice, setSyncCatalogPrice] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  // Dedicated Database Recipe Management & Dirty Tracking State
  const [savedRecipes, setSavedRecipes] = useState<DedicatedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<DedicatedRecipe | null>(null);
  const [initialRecipeSnapshot, setInitialRecipeSnapshot] = useState<string | null>(null);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState<boolean>(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState<string>('');

  // Save Recipe Popup Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [recipeNameInput, setRecipeNameInput] = useState<string>('');
  const [savingRecipe, setSavingRecipe] = useState<boolean>(false);

  // Load catalog products, 3-level categories, active UOMs, and saved recipes
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [prodRes, catRes, uomsList, recList] = await Promise.all([
          supabase
            .from('products')
            .select('id, product_name, item_sr_no, purchase_price, sales_price, retail_price, uom, category, sub_category, sub_sub_category, allow_loose_sales, loose_uom, loose_conversion_ratio, loose_purchase_price, loose_sale_price, multi_loose_units')
            .limit(1000),
          supabase
            .from('inventory_categories')
            .select('id, name, parent_id')
            .order('name', { ascending: true }),
          fetchAllUomsSafe(),
          recipeService.getAll()
        ]);

        if (prodRes.data) setCatalogProducts(prodRes.data);
        if (catRes.data) setAllCategories(catRes.data);
        if (uomsList) setAllUomsList(uomsList.filter(u => u.is_active));
        if (recList) setSavedRecipes(recList);

        const activeUomCodes = uomsList
          .filter(u => u.is_active)
          .map(u => u.short_code.toUpperCase());
        setAvailableUoms(Array.from(new Set(activeUomCodes)));
      } catch (err) {
        console.warn('Error fetching master data for BOM:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Initialize BOM Number or load existing BOM for editing
  useEffect(() => {
    const init = async () => {
      if (isEditMode && id) {
        setLoading(true);
        try {
          const existing = await bomService.getById(id);
          if (existing) {
            setBomNumber(existing.bom_number);
            setFinishedProductName(existing.finished_product_name);
            setFinishedProductCode(existing.finished_product_code || '');
            setFinishedProductId(existing.finished_product_id || '');
            setCategory(existing.category || '');
            setBatchQuantity(existing.batch_quantity || 1);
            setUom(existing.uom || 'PCS');
            setStatus(existing.status === 'Trial' ? 'Trial' : existing.status === 'Draft' ? 'Trial' : 'Active');
            setLaborCost(existing.labor_cost || 0);
            setOverheadCost(existing.overhead_cost || 0);
            setPackagingCost(existing.packaging_cost || 0);
            setTargetSellingPrice(existing.target_selling_price || 0);
            setNotes(existing.notes || '');
            if (existing.items && existing.items.length > 0) {
              setItems(existing.items);
            }

            // Find matching product in catalog to prepopulate parent & sub categories
            const prod = catalogProducts.find(
              p => String(p.id) === String(existing.finished_product_id) ||
                   p.product_name?.toLowerCase() === existing.finished_product_name.toLowerCase()
            );
            if (prod) {
              if (prod.sub_sub_category) setSubSubCategory(prod.sub_sub_category);
              if (prod.sub_category) setSubCategory(prod.sub_category);
            }
          } else {
            toast.error(isRTL ? 'نسخہ نہیں ملا' : 'BOM not found');
            navigate('/Manufacturing/list');
          }
        } catch {
          toast.error(isRTL ? 'لوڈ کرنے میں ناکامی' : 'Failed to load BOM');
        } finally {
          setLoading(false);
        }
      } else {
        const nextNum = await bomService.getNextBomNumber();
        setBomNumber(nextNum);
      }
    };
    init();
  }, [id, isEditMode, isRTL, navigate, catalogProducts]);

  // Handle Finished Product selection from catalog
  const handleSelectFinishedProduct = (prodName: string, selectedProd?: any) => {
    setFinishedProductName(prodName);
    const found = selectedProd || catalogProducts.find(
      p => p.product_name?.toLowerCase() === prodName.toLowerCase()
    );
    if (found) {
      if (found.item_sr_no) setFinishedProductCode(found.item_sr_no);
      if (found.id) setFinishedProductId(String(found.id));
      if (found.category) setCategory(found.category);
      if (found.sub_category) setSubCategory(found.sub_category);
      if (found.sub_sub_category) setSubSubCategory(found.sub_sub_category);
      if (found.uom) setUom(found.uom);
      const existingPrice = Number(found.retail_price ?? found.sales_price ?? 0);
      if (existingPrice > 0) setTargetSellingPrice(existingPrice);

      // Auto-load loose selling hierarchy if product already has loose configured
      const hasLoose = Boolean(found.allow_loose_sales || (Array.isArray(found.multi_loose_units) && found.multi_loose_units.length > 0));
      setAllowLoose(hasLoose);
      if (hasLoose) {
        setLooseUom(found.loose_uom || (found.uom === 'LTR' ? 'ML' : 'PCS'));
        setLooseRatio(found.loose_conversion_ratio || 1000);
        if (Array.isArray(found.multi_loose_units)) {
          setMultiLooseUnits(found.multi_loose_units);
        } else {
          setMultiLooseUnits([]);
        }
      } else {
        setLooseUom('');
        setLooseRatio(1);
        setMultiLooseUnits([]);
      }
    }
  };

  // Row operations for Raw Materials (Step 2)
  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        item_name: '',
        item_code: '',
        quantity: 1,
        uom: 'PCS',
        unit_cost: 0,
        wastage_percentage: 0,
        total_cost: 0,
        item_type: 'Chemical',
        notes: ''
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) {
      toast.error(
        isRTL ? 'نسخے میں کم از کم ایک خام مال ہونا ضروری ہے' : 'BOM must contain at least 1 raw material'
      );
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: keyof BomItem | Partial<BomItem>, val?: any) => {
    setItems(prev => {
      const updated = [...prev];
      let row = { ...updated[index] };

      if (typeof field === 'object' && field !== null) {
        row = { ...row, ...field };
      } else if (typeof field === 'string') {
        (row as any)[field] = val;
      }

      // Recalculate line total: Qty * UnitCost * (1 + Wastage% / 100)
      const qty = Number(row.quantity) || 0;
      const uCost = Number(row.unit_cost) || 0;
      const waste = Number(row.wastage_percentage) || 0;
      row.total_cost = Math.round(qty * uCost * (1 + waste / 100));

      updated[index] = row;
      return updated;
    });
  };

  // Live Cost & Margin Calculations
  const calculations: BomCalculations = useMemo(() => {
    const chemicalCost = items
      .filter(it => it.item_type !== 'Packaging')
      .reduce((sum, it) => sum + (Number(it.total_cost) || 0), 0);
    const itemsPackagingCost = items
      .filter(it => it.item_type === 'Packaging')
      .reduce((sum, it) => sum + (Number(it.total_cost) || 0), 0);
    const rawMaterialCost = chemicalCost + itemsPackagingCost;
    const totalOverheads =
      (Number(laborCost) || 0) + (Number(overheadCost) || 0) + (Number(packagingCost) || itemsPackagingCost);
    const totalBatchCost = rawMaterialCost + totalOverheads;
    const batchQty = Number(batchQuantity) > 0 ? Number(batchQuantity) : 1;
    const unitCost = Math.round((totalBatchCost / batchQty) * 100) / 100;

    const targetPrice = Number(targetSellingPrice) || 0;
    const unitProfit = targetPrice - unitCost;
    const marginPercentage =
      targetPrice > 0 ? Math.round(((targetPrice - unitCost) / targetPrice) * 10000) / 100 : 0;

    return {
      rawMaterialCost,
      chemicalCost,
      packagingCost: itemsPackagingCost || Number(packagingCost) || 0,
      totalOverheads,
      totalBatchCost,
      unitCost,
      unitProfit,
      marginPercentage
    };
  }, [items, laborCost, overheadCost, packagingCost, batchQuantity, targetSellingPrice]);

  // Real-time Dirty / Change Detection vs Loaded Recipe
  const isRecipeModified = useMemo(() => {
    const currentSnap = recipeService.generateSnapshot({
      batchQuantity,
      uom,
      laborCost,
      overheadCost,
      packagingCost,
      targetSellingPrice,
      items,
      notes
    });

    if (!selectedRecipe || !initialRecipeSnapshot) {
      return items.some(i => i.item_name && i.item_name.trim().length > 0);
    }

    return currentSnap !== initialRecipeSnapshot;
  }, [
    selectedRecipe,
    initialRecipeSnapshot,
    batchQuantity,
    uom,
    laborCost,
    overheadCost,
    packagingCost,
    targetSellingPrice,
    items,
    notes
  ]);

  // Load a recipe into the form
  const handleLoadRecipe = (rec: DedicatedRecipe) => {
    setSelectedRecipe(rec);
    if (rec.finished_product_name) setFinishedProductName(rec.finished_product_name);
    if (rec.finished_product_code) setFinishedProductCode(rec.finished_product_code);
    if (rec.finished_product_id) setFinishedProductId(rec.finished_product_id);
    if (rec.category) setCategory(rec.category);
    if (rec.sub_category) setSubCategory(rec.sub_category);
    if (rec.sub_sub_category) setSubSubCategory(rec.sub_sub_category);
    if (rec.batch_quantity) setBatchQuantity(Number(rec.batch_quantity) || 1);
    if (rec.uom) setUom(rec.uom || 'PCS');
    if (rec.status) setStatus(rec.status === 'Trial' ? 'Trial' : rec.status === 'Draft' ? 'Draft' : 'Active');
    if (rec.labor_cost !== undefined) setLaborCost(Number(rec.labor_cost) || 0);
    if (rec.overhead_cost !== undefined) setOverheadCost(Number(rec.overhead_cost) || 0);
    if (rec.packaging_cost !== undefined) setPackagingCost(Number(rec.packaging_cost) || 0);
    if (rec.target_selling_price !== undefined) setTargetSellingPrice(Number(rec.target_selling_price) || 0);
    if (rec.notes !== undefined) setNotes(rec.notes || '');

    if (rec.raw_materials && rec.raw_materials.length > 0) {
      setItems(rec.raw_materials);
    }

    const snap = recipeService.generateSnapshot({
      batchQuantity: rec.batch_quantity || 1,
      uom: rec.uom || 'PCS',
      laborCost: rec.labor_cost || 0,
      overheadCost: rec.overhead_cost || 0,
      packagingCost: rec.packaging_cost || 0,
      targetSellingPrice: rec.target_selling_price || 0,
      items: rec.raw_materials || [],
      notes: rec.notes || ''
    });
    setInitialRecipeSnapshot(snap);
    setIsRecipePickerOpen(false);

    toast.success(
      isRTL ? `نسخہ "${rec.recipe_name}" کامیابی سے لوڈ ہو گیا` : `Recipe "${rec.recipe_name}" loaded successfully!`
    );
  };

  const handleResetRecipe = () => {
    setSelectedRecipe(null);
    setInitialRecipeSnapshot(null);
    toast.success(isRTL ? 'نسخہ ہٹا دیا گیا' : 'Cleared active recipe');
  };

  const handleOpenSaveModal = () => {
    const defaultName = selectedRecipe
      ? `${selectedRecipe.recipe_name} (Updated)`
      : finishedProductName
      ? `${finishedProductName} Recipe`
      : 'New Fabric Recipe';
    setRecipeNameInput(defaultName);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveRecipe = async () => {
    if (!recipeNameInput.trim()) {
      toast.error(isRTL ? 'نسخے کا نام درج کریں' : 'Please enter a recipe name');
      return;
    }

    try {
      setSavingRecipe(true);
      const saved = await recipeService.save({
        recipe_name: recipeNameInput.trim(),
        finished_product_name: finishedProductName || recipeNameInput.trim(),
        finished_product_code: finishedProductCode || '',
        finished_product_id: finishedProductId || '',
        category,
        sub_category: subCategory,
        sub_sub_category: subSubCategory,
        batch_quantity: batchQuantity,
        uom,
        raw_material_cost: calculations.rawMaterialCost,
        labor_cost: laborCost,
        overhead_cost: overheadCost,
        packaging_cost: packagingCost,
        total_cost: calculations.totalBatchCost,
        unit_cost: calculations.unitCost,
        target_selling_price: targetSellingPrice,
        margin_percentage: calculations.marginPercentage,
        status,
        notes,
        raw_materials: items
      });

      // Refresh recipe list
      const freshRecipes = await recipeService.getAll();
      setSavedRecipes(freshRecipes);

      // Set active recipe to the saved one & snapshot
      setSelectedRecipe(saved);
      const snap = recipeService.generateSnapshot({
        batchQuantity,
        uom,
        laborCost,
        overheadCost,
        packagingCost,
        targetSellingPrice,
        items,
        notes
      });
      setInitialRecipeSnapshot(snap);
      setIsSaveModalOpen(false);

      toast.success(
        isRTL
          ? `نیا نسخہ "${saved.recipe_name}" کامیابی سے ڈیٹا بیس میں محفوظ ہو گیا`
          : `Recipe "${saved.recipe_name}" saved to database successfully!`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save recipe');
    } finally {
      setSavingRecipe(false);
    }
  };

  // Tab Navigation Validation
  const handleNextTab = () => {
    if (activeTab === 1) {
      if (!finishedProductName.trim()) {
        toast.error(isRTL ? 'براہ کرم تیار پروڈکٹ کا نام درج کریں' : 'Please enter Finished Product Name');
        return;
      }
      if (!batchQuantity || Number(batchQuantity) <= 0) {
        toast.error(isRTL ? 'بیچ کی مقدار 0 سے زیادہ ہونی چاہیے' : 'Batch output quantity must be greater than 0');
        return;
      }
      setActiveTab(2);
    } else if (activeTab === 2) {
      const invalid = items.filter(it => !it.item_name.trim());
      if (invalid.length > 0) {
        toast.error(isRTL ? 'تمام قطاروں میں خام مال کا نام درج کریں' : 'Please specify material name for all raw material rows');
        return;
      }
      setActiveTab(3);
    }
  };

  const handlePrevTab = () => {
    if (activeTab === 3) setActiveTab(2);
    else if (activeTab === 2) setActiveTab(1);
  };

  // Form Submission & Auto-Creation in Product Catalog
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!finishedProductName.trim()) {
      setActiveTab(1);
      toast.error(isRTL ? 'براہ کرم تیار پروڈکٹ کا نام درج کریں' : 'Please specify Finished Product Name');
      return;
    }

    if (!batchQuantity || Number(batchQuantity) <= 0) {
      setActiveTab(1);
      toast.error(isRTL ? 'بیچ کی مقدار 0 سے زیادہ ہونی چاہیے' : 'Batch output quantity must be greater than 0');
      return;
    }

    const invalidItems = items.filter(it => !it.item_name.trim());
    if (invalidItems.length > 0) {
      setActiveTab(2);
      toast.error(isRTL ? 'تمام قطاروں میں خام مال کا نام درج کریں' : 'Please specify material name for all raw material rows');
      return;
    }

    try {
      setSaving(true);

      let effectiveProductId = finishedProductId;
      const cleanName = finishedProductName.trim();
      const cleanCode = finishedProductCode.trim() || undefined;
      const effectiveCategory = category || subCategory || subSubCategory || 'General';

      // 1. Auto-create product in `products` catalog if it doesn't already exist
      const existingInCatalog = catalogProducts.find(
        p => p.product_name?.toLowerCase() === cleanName.toLowerCase() ||
             (cleanCode && p.item_sr_no && p.item_sr_no.toLowerCase() === cleanCode.toLowerCase())
      );

      if (!existingInCatalog) {
        try {
          const newProductPayload = {
            product_name: cleanName,
            item_sr_no: cleanCode || null,
            sub_sub_category: subSubCategory || null,
            sub_category: subCategory || null,
            category: effectiveCategory,
            uom: uom || 'PCS',
            purchase_price: calculations.unitCost,
            sales_price: Number(targetSellingPrice) || calculations.unitCost,
            retail_price: Number(targetSellingPrice) || calculations.unitCost,
            product_description: `[Manufactured Good] ${cleanName} | Output UOM: ${uom} | Batch Size: ${batchQuantity}`,
            item_type: 'goods',
            tenant_id: 'uzair',
            allow_loose_sales: Boolean(allowLoose),
            loose_uom: allowLoose ? String(looseUom || 'PCS').toUpperCase() : null,
            loose_conversion_ratio: allowLoose ? (Number(looseRatio) || 1) : null,
            multi_loose_units: allowLoose && Array.isArray(multiLooseUnits) ? multiLooseUnits : []
          };

          const { data: newProd, error: prodErr } = await supabase
            .from('products')
            .insert([newProductPayload])
            .select('id')
            .single();

          if (!prodErr && newProd) {
            effectiveProductId = String(newProd.id);
            toast.success(
              isRTL
                ? `پروڈکٹ لسٹ میں "${cleanName}" کا اندراج کر دیا گیا ہے`
                : `Product "${cleanName}" automatically created in Products Catalog!`
            );
          }
        } catch (err) {
          console.warn('Product auto-insert notice:', err);
        }
      } else if (!effectiveProductId && existingInCatalog.id) {
        effectiveProductId = String(existingInCatalog.id);
      }

      // 1b. If user enabled "Sync to Catalog Price" for existing product, update catalog price
      if (existingInCatalog && syncCatalogPrice && effectiveProductId) {
        try {
          const updatePricePayload: Record<string, any> = {
            retail_price: Number(targetSellingPrice) || 0,
            sales_price: Number(targetSellingPrice) || 0
          };
          const { error: syncErr } = await supabase
            .from('products')
            .update(updatePricePayload)
            .eq('id', effectiveProductId);

          if (!syncErr) {
            toast.success(
              isRTL
                ? 'پروڈکٹ کیٹلاگ کی سیل پرائس بھی اپڈیٹ کر دی گئی ہے'
                : 'Product catalog selling price updated!'
            );
          }
        } catch (syncErr) {
          console.warn('Catalog price sync notice:', syncErr);
        }
      }

      // 2. Save BOM Recipe
      const payload: Partial<BomHeader> & { items: BomItem[] } = {
        id: isEditMode && id ? id : undefined,
        bom_number: bomNumber,
        finished_product_name: cleanName,
        finished_product_code: cleanCode || '',
        finished_product_id: effectiveProductId,
        category: effectiveCategory,
        batch_quantity: Number(batchQuantity),
        uom,
        raw_material_cost: calculations.rawMaterialCost,
        labor_cost: Number(laborCost) || 0,
        overhead_cost: Number(overheadCost) || 0,
        packaging_cost: Number(packagingCost) || 0,
        total_cost: calculations.totalBatchCost,
        unit_cost: calculations.unitCost,
        target_selling_price: Number(targetSellingPrice) || 0,
        margin_percentage: calculations.marginPercentage,
        status,
        notes: notes.trim(),
        items
      };

      await bomService.save(payload);

      toast.success(
        isRTL
          ? isEditMode
            ? 'نسخہ کامیابی سے اپڈیٹ ہو گیا'
            : 'نیا نسخہ اور پروڈکٹ کامیابی سے محفوظ ہو گئے'
          : isEditMode
          ? 'BOM recipe updated successfully'
          : 'New BOM recipe saved successfully!'
      );
      navigate('/Manufacturing/list');
    } catch (err: any) {
      toast.error(
        isRTL ? 'محفوظ کرنے میں خرابی ہوئی' : `Failed to save BOM: ${err?.message || 'Unknown error'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-[1600px] p-4 md:p-6 ${isRTL ? 'font-urdu' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Breadcrumb
        pageName={
          isRTL
            ? isEditMode
              ? 'ترمیم نسخہ (Edit BOM)'
              : 'نیا تیاری نسخہ (Create BOM)'
            : isEditMode
            ? 'Edit BOM Recipe'
            : 'Create Manufacturing BOM'
        }
      />

      {/* Header Bar */}
      <BOMHeaderBar
        bomNumber={bomNumber}
        isEditMode={isEditMode}
        isRTL={isRTL}
        status={status}
        setStatus={setStatus}
        onNavigateList={() => navigate('/Manufacturing/list')}
      />

      {/* Get Recipes Action Bar */}
      <BOMRecipeActionBar
        isRTL={isRTL}
        savedRecipes={savedRecipes}
        selectedRecipe={selectedRecipe}
        isRecipePickerOpen={isRecipePickerOpen}
        setIsRecipePickerOpen={setIsRecipePickerOpen}
        recipeSearchQuery={recipeSearchQuery}
        setRecipeSearchQuery={setRecipeSearchQuery}
        isRecipeModified={isRecipeModified}
        onLoadRecipe={handleLoadRecipe}
        onResetRecipe={handleResetRecipe}
      />

      {/* 3 Tabs Stepper Header */}
      <BOMStepperHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRTL={isRTL}
        finishedProductName={finishedProductName}
      />

      {/* Main Layout: Full width on Raw Materials tab so the wide table fits cleanly; 2-column on other tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Active Tab Panel */}
        <div className={`${activeTab === 2 ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6`}>
          {activeTab === 1 && (
            <BOMProductOutputTab
              isRTL={isRTL}
              catalogProducts={catalogProducts}
              finishedProductName={finishedProductName}
              onSelectFinishedProduct={handleSelectFinishedProduct}
              finishedProductCode={finishedProductCode}
              setFinishedProductCode={setFinishedProductCode}
              uom={uom}
              setUom={setUom}
              allUomsList={allUomsList}
              availableUoms={availableUoms}
              allCategories={allCategories}
              subSubCategory={subSubCategory}
              setSubSubCategory={setSubSubCategory}
              subCategory={subCategory}
              setSubCategory={setSubCategory}
              category={category}
              setCategory={setCategory}
              allowLoose={allowLoose}
              setAllowLoose={setAllowLoose}
              looseUom={looseUom}
              setLooseUom={setLooseUom}
              looseRatio={looseRatio}
              setLooseRatio={setLooseRatio}
              multiLooseUnits={multiLooseUnits}
              setMultiLooseUnits={setMultiLooseUnits}
            />
          )}

          {activeTab === 2 && (
            <BOMRawMaterialsTab
              isRTL={isRTL}
              uom={uom}
              batchQuantity={batchQuantity}
              setBatchQuantity={setBatchQuantity}
              items={items}
              catalogProducts={catalogProducts}
              allUomsList={allUomsList}
              availableUoms={availableUoms}
              rawMaterialCost={calculations.rawMaterialCost}
              onAddItemRow={handleAddItemRow}
              onRemoveItemRow={handleRemoveItemRow}
              onUpdateItem={handleUpdateItem}
            />
          )}

          {activeTab === 3 && (
            <BOMLaborOverheadsTab
              isRTL={isRTL}
              laborCost={laborCost}
              setLaborCost={setLaborCost}
              overheadCost={overheadCost}
              setOverheadCost={setOverheadCost}
              packagingCost={packagingCost}
              setPackagingCost={setPackagingCost}
              notes={notes}
              setNotes={setNotes}
            />
          )}

          {/* Bottom Stepper Controls */}
          <BOMStepperControls
            activeTab={activeTab}
            isRTL={isRTL}
            onPrevTab={handlePrevTab}
            onNextTab={handleNextTab}
            selectedRecipe={selectedRecipe}
            isRecipeModified={isRecipeModified}
            onOpenSaveModal={handleOpenSaveModal}
            onSubmit={handleSubmit}
            saving={saving}
          />
        </div>

        {/* Right/Bottom Pane: Sticky Cost & Margin Summary Card */}
        <div className={activeTab === 2 ? 'lg:col-span-12' : 'lg:col-span-4'}>
          <BOMCostSummaryCard
            isRTL={isRTL}
            uom={uom}
            calculations={calculations}
            targetSellingPrice={targetSellingPrice}
            setTargetSellingPrice={setTargetSellingPrice}
            syncCatalogPrice={syncCatalogPrice}
            setSyncCatalogPrice={setSyncCatalogPrice}
          />
        </div>
      </div>

      {/* Save Recipe Modal */}
      <BOMSaveRecipeModal
        isOpen={isSaveModalOpen}
        isRTL={isRTL}
        recipeNameInput={recipeNameInput}
        setRecipeNameInput={setRecipeNameInput}
        batchQuantity={batchQuantity}
        uom={uom}
        itemsCount={items.length}
        unitCost={calculations.unitCost}
        savingRecipe={savingRecipe}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirmSave={handleConfirmSaveRecipe}
      />
    </div>
  );
};

export default AddBOM;
