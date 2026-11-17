export type DuplicateStatus = 'ready' | 'duplicate_in_file' | 'duplicate_in_db' | 'invalid';

export interface ProcessedRow {
  id: string;
  rowIndex: number;
  code: string;
  productName: string;
  category: string;
  subCategory: string;
  parentCat: string;
  brand: string;
  purchasePrice: number;
  retailPrice: number;
  uom: string;
  minimumStock: number;
  // Tile-specific attributes
  print?: string;
  tileWidth?: number;
  tileHeight?: number;
  piecesPerBox?: number;
  sqMPerPiece?: number;
  sqMPerBox?: number;
  purchasePerSqM?: number;
  salePerSqM?: number;
  profitPerBox?: number;
  profitMarginPercent?: string;
  // Status
  status: DuplicateStatus;
  statusReason: string;
  matchedDbProduct?: {
    id: number | string;
    product_name: string;
    item_sr_no: string;
    purchase_price: number;
    retail_price: number;
    category?: string;
  };
  matchedFileRowIndex?: number;
  selected: boolean;
  rawRow: any;
}
