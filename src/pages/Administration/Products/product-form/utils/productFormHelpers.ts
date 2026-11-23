import * as Yup from 'yup';

export interface UomItem {
  id: number;
  short_code: string;
  full_name: string;
  category: string;
  is_active: boolean;
}

export interface LooseTier {
  id?: string;
  uom: string;
  ratio: number | string; // ratio relative to the immediate previous tier or main UOM
  costPrice?: number | string;
  salePrice?: number | string;
}

export interface ProductFormValues {
  productName: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  itemType: 'goods' | 'service';
  uom: string;
  profit: number | string;
  purchasePrice: number | string;
  scenarioName: string;
  mrp: number | string;
  retailPrice: number | string;
  serviceCharges: number | string;
  minStockAlert: number | string;
  hsCode: string;
  itemSrNo: string;
  sroScheduleNo: string;
  color: string;
  tileDimensionUnit: string;
  tileHeight: number | string;
  tileWidth: number | string;
  tileThickness: string;
  piecesPerBox: number | string;
  allowLooseSales: boolean;
  looseUom: string;
  looseConversionRatio: number | string;
  loosePurchasePrice: number | string;
  looseSalePrice: number | string;
  looseTiers: LooseTier[];
  finishType: string;
  tilePrint: string;
  weightPerBox: number | string;
}

// Helper: parse tile dimensions (h × w) from sub_category, description, or SKU
export const parseTileDimensions = (data: any) => {
  if (!data) return { h: 60, w: 60 };
  const text = `${data?.sub_category || ''} ${data?.product_description || ''} ${data?.item_sr_no || ''}`;
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
  if (match) {
    return {
      h: Number(match[1]) || 60,
      w: Number(match[2]) || 60
    };
  }
  return { h: 60, w: 60 };
};

export const parseTileUnit = (data: any) => {
  if (!data) return 'cm';
  const text = `${data?.product_description || ''} ${data?.item_sr_no || ''}`;
  if (/\b(?:in|inch|inches)\b/i.test(text)) return 'in';
  if (/\b(?:m|meter|meters)\b/i.test(text) && !/\b(?:sq\.?m|m²)\b/i.test(text)) return 'm';
  return 'cm';
};

export const parsePiecesPerBox = (data: any) => {
  if (!data) return 4;
  const loose = Number(data?.loose_conversion_ratio || 0);
  if (loose >= 1) return loose;
  const raw = Number(data?.pieces_per_box ?? data?.pcs_per_box ?? data?.pieces_per_packing ?? 0);
  if (raw >= 1) return raw;
  const match = String(data?.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
  if (match && Number(match[1]) > 0) return Number(match[1]);
  return 4;
};

export const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
  ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

export const getProductInitialValues = (editData: any, isEditMode: boolean): ProductFormValues => {
  if (isEditMode && editData) {
    const cachedMulti = (() => {
      try {
        const map = JSON.parse(localStorage.getItem('jj_multi_loose_units') || '{}');
        return map[editData.id] || (editData.item_sr_no && map[editData.item_sr_no]) || (editData.product_name && map[editData.product_name]) || null;
      } catch {
        return null;
      }
    })();

    const hasLoose = Boolean(
      editData.allow_loose_sales ||
      (Array.isArray(editData.multi_loose_units) && editData.multi_loose_units.length > 0) ||
      (Array.isArray(cachedMulti) && cachedMulti.length > 0) ||
      (editData.loose_uom && editData.loose_conversion_ratio)
    );

    return {
      productName: editData.product_name || '',
      category: editData.category || '',
      subCategory: editData.sub_category || '',
      subSubCategory: editData.sub_sub_category || '',
      itemType: editData.item_type || 'goods',
      uom: editData.uom || 'PCS',
      profit: editData.profit || 0,
      purchasePrice: editData.purchase_price || 0,
      scenarioName: editData.scenario_name || '',
      mrp: editData.mrp || editData.retail_price || 0,
      retailPrice: editData.retail_price || 0,
      serviceCharges: editData.service_charges || 0,
      minStockAlert:
        editData.min_stock_alert !== undefined && editData.min_stock_alert !== null
          ? editData.min_stock_alert
          : '',
      hsCode: editData.hs_code || '',
      itemSrNo: editData.item_sr_no || '',
      sroScheduleNo: editData.sro_schedule_no || '',
      color:
        editData.color ||
        (() => {
          const match = String(editData?.product_description || '').match(/Color:\s*([^|]+)/i);
          return match ? match[1].trim() : '';
        })() ||
        '',
      tileDimensionUnit: parseTileUnit(editData),
      tileHeight: parseTileDimensions(editData).h,
      tileWidth: parseTileDimensions(editData).w,
      tileThickness: (() => {
        const match = String(editData?.product_description || '').match(/Thickness:\s*([^|]+)/i);
        return match ? match[1].trim() : '';
      })(),
      piecesPerBox: parsePiecesPerBox(editData),
      allowLooseSales: hasLoose,
      looseUom: editData.loose_uom || (cachedMulti && cachedMulti[0]?.uom) || 'PCS',
      looseConversionRatio: editData.loose_conversion_ratio || (cachedMulti && cachedMulti[0]?.ratio) || parsePiecesPerBox(editData) || 1,
      loosePurchasePrice: editData.loose_purchase_price || '',
      looseSalePrice: editData.loose_sale_price || '',
      looseTiers: (() => {
        if (Array.isArray(cachedMulti) && cachedMulti.length > 0) {
          return cachedMulti;
        }
        if (Array.isArray(editData.multi_loose_units) && editData.multi_loose_units.length > 0) {
          return editData.multi_loose_units;
        }
        if (editData.loose_uom && editData.loose_conversion_ratio) {
          return [
            {
              id: 'tier-1',
              uom: editData.loose_uom,
              ratio: editData.loose_conversion_ratio,
              costPrice: editData.loose_purchase_price || '',
              salePrice: editData.loose_sale_price || ''
            }
          ];
        }
        return [];
      })(),
      finishType: editData.bin || '',
      tilePrint:
        editData.tile_print ||
        editData.print ||
        (() => {
          const match = String(editData?.product_description || '').match(/Print:\s*([^|]+)/i);
          return match ? match[1].trim() : '';
        })() ||
        '',
      weightPerBox: (() => {
        const match = String(editData?.product_description || '').match(/Wt:\s*([0-9.]+)\s*kg/i);
        return match ? match[1].trim() : '';
      })()
    };
  }

  return {
    productName: '',
    category: '',
    subCategory: '',
    subSubCategory: '',
    itemType: 'goods',
    uom: '',
    profit: 0,
    purchasePrice: '',
    scenarioName: '',
    mrp: '',
    retailPrice: '',
    serviceCharges: 0,
    minStockAlert: '',
    hsCode: '',
    itemSrNo: '',
    sroScheduleNo: '',
    color: '',
    tileDimensionUnit: 'cm',
    tileHeight: '',
    tileWidth: '',
    tileThickness: '',
    piecesPerBox: '',
    allowLooseSales: false,
    looseUom: 'PCS',
    looseConversionRatio: '',
    loosePurchasePrice: '',
    looseSalePrice: '',
    looseTiers: [],
    finishType: '',
    tilePrint: '',
    weightPerBox: ''
  };
};

export const productValidationSchema = Yup.object().shape({
  productName: Yup.string().required('Description is required'),
  category: Yup.string().required('Category is required'),
  purchasePrice: Yup.number().typeError('Must be a number').min(0).required('Required'),
  retailPrice: Yup.number().typeError('Must be a number').min(0).required('Required'),
  minStockAlert: Yup.number().typeError('Must be a valid quantity number').min(0, 'Cannot be negative').nullable()
});
