import { BomHeader, BomItem } from '../../../../service/bomService';
import { DedicatedRecipe } from '../../../../service/recipeService';

export interface BomCalculations {
  rawMaterialCost: number;
  totalOverheads: number;
  totalBatchCost: number;
  unitCost: number;
  unitProfit: number;
  marginPercentage: number;
}

export type { BomHeader, BomItem, DedicatedRecipe };
