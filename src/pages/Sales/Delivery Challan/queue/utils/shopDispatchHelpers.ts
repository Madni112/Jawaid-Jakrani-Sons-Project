import { ProductMasterItem, InvoiceGroup } from '../types/shopDispatchTypes';

// Helper to get exact date in Pakistan Time (YYYY-MM-DD)
export const getPakistanDate = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

// ── Boxes / Pcs formatting (same as Delivery Challan page) ──
export const pcsPerBoxFor = (productName: string, productsMaster: ProductMasterItem[]): number => {
  const key = String(productName || '').trim().toLowerCase();
  const pr = productsMaster.find((p) => String(p.product_name || '').trim().toLowerCase() === key);
  if (!pr) return 1;
  const isTile = Boolean(
    String(pr.category || '').toLowerCase().includes('tile') ||
    String(pr.scenario_name || '').toLowerCase().includes('tile')
  );
  const rp = Number(pr.pieces_per_box || pr.pcs_per_box || pr.pieces_per_packing || 0);
  return isTile ? (rp > 1 ? rp : 4) : 1;
};

export const fmtBoxPcs = (qty: number, productName: string, productsMaster: ProductMasterItem[]): string => {
  const pb = pcsPerBoxFor(productName, productsMaster);
  if (pb > 1) {
    const pieces = Math.round(qty * pb);
    const boxes = Math.floor(pieces / pb);
    const loose = pieces % pb;
    return `${boxes} Boxes${loose > 0 ? ` + ${loose} Pcs` : ''}`;
  }
  return qty.toLocaleString();
};

export const sumGroupQty = (
  group: InvoiceGroup,
  kind: 'order' | 'disp' | 'hold',
  productsMaster: ProductMasterItem[]
): string => {
  let boxes = 0;
  let pcs = 0;
  (group.challans || []).forEach((c) => {
    (c.items || []).forEach((it) => {
      const qty = kind === 'order'
        ? Number(it.orderQty ?? it.qty ?? 0)
        : kind === 'disp'
          ? Number(it.dispatchedQty ?? 0)
          : Number(it.holdQty ?? 0);
      const pb = pcsPerBoxFor(it.pDescription || it.itemName || it.product_name || '', productsMaster);
      if (pb > 1) {
        const pieces = Math.round(qty * pb);
        boxes += Math.floor(pieces / pb);
        pcs += pieces % pb;
      } else {
        boxes += qty;
      }
    });
  });
  return `${boxes.toLocaleString()}${pcs > 0 ? ` + ${pcs} Pcs` : ''}`;
};
