// Helper to get exact date in Pakistan Time (YYYY-MM-DD)
export const getPakistanDate = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

export const resolvePcsPerBox = (prod: any, sampleQty?: number): number => {
  if (prod) {
    const looseRatio = Number(prod.loose_conversion_ratio || 0);
    const boxPcs = Number(prod.pieces_per_box || prod.pcs_per_box || prod.pieces_per_packing || 0);
    if (looseRatio > 1) return looseRatio;
    if (boxPcs > 1) return boxPcs;
    const isTile = Boolean(
      String(prod.category || '').toLowerCase().includes('tile') ||
      String(prod.scenario_name || '').toLowerCase().includes('tile')
    );
    if (isTile) return 4;
  }
  if (typeof sampleQty === 'number' && Math.abs(sampleQty - Math.round(sampleQty)) > 0.0001) {
    const fraction = sampleQty - Math.floor(sampleQty);
    for (const cand of [12, 6, 4, 8, 10, 16, 24]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.01) {
        return cand;
      }
    }
  }
  return 1;
};

export const formatItemBoxQty = (qty: number, pcsPerBox: number): string => {
  if (pcsPerBox > 1) {
    const totPcs = Math.round(qty * pcsPerBox);
    const b = Math.floor(totPcs / pcsPerBox);
    const p = totPcs % pcsPerBox;
    if (p === 0) return `${b} Boxes`;
    return `${b} Boxes + ${p} Pcs`;
  }
  const cleanQty = Math.round(qty * 100) / 100;
  return String(cleanQty);
};
