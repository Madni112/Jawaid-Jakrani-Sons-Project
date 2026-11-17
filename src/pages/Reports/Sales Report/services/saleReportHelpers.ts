export const extractItemNames = (row: any): string[] => {
    let itemsList: any[] = [];
    if (Array.isArray(row.items)) {
      itemsList = row.items;
    } else if (typeof row.items === 'string') {
      try {
        itemsList = JSON.parse(row.items);
      } catch {
        itemsList = [];
      }
    }
    return itemsList
      .map((it: any) => it.itemName || it.pDescription || it.product_name || it.name || '')
      .filter(Boolean);
  };

export const extractItemDetails = (row: any, productUomMap: Record<string, string> = {}): Array<{
    name: string;
    qty: number | string;
    uom: string;
    price: number | string;
    discountAmt: number;
    discountPer: number;
  }> => {
    let itemsList: any[] = [];
    if (Array.isArray(row.items)) {
      itemsList = row.items;
    } else if (typeof row.items === 'string') {
      try {
        itemsList = JSON.parse(row.items);
      } catch {
        itemsList = [];
      }
    }
    return itemsList.map((it: any) => {
      const name = it.itemName || it.pDescription || it.product_name || it.name || 'Product';
      const cleanKey = String(name).trim().toLowerCase();
      const uom = it.uom || it.unit || productUomMap[cleanKey] || 'Nos';
      const price = Number(it.rp ?? it.rate ?? it.price ?? 0);
      const qty = Number(it.qty ?? it.quantity ?? it.orderQty ?? 1);
      const gross = price * qty;
      const discountAmt = Number(it.discountAmt ?? it.discount_amt ?? ((gross * Number(it.discountPer ?? it.discount_per ?? 0)) / 100));
      const discountPer = Number(
        it.discountPer ??
        it.discount_per ??
        (gross > 0 && discountAmt > 0 ? (discountAmt / gross) * 100 : 0)
      );
      return {
        name,
        qty: it.qty ?? it.quantity ?? it.orderQty ?? 1,
        uom,
        price,
        discountAmt,
        discountPer: Number(discountPer.toFixed(2)) === Math.round(discountPer) ? Math.round(discountPer) : Number(discountPer.toFixed(1))
      };
    }).filter(it => it.name);
  };

export const extractRowDiscounts = (row: any) => {
    let itemsList: any[] = [];
    if (Array.isArray(row.items)) {
      itemsList = row.items;
    } else if (typeof row.items === 'string') {
      try {
        itemsList = JSON.parse(row.items);
      } catch {
        itemsList = [];
      }
    }

    const itemsWithDiscount: Array<{ name: string; discountAmt: number; discountPer: number }> = [];
    let totalItemDiscount = 0;

    itemsList.forEach((it: any) => {
      const price = Number(it.rp ?? it.rate ?? it.price ?? 0);
      const qty = Number(it.qty ?? it.quantity ?? it.orderQty ?? 1);
      const gross = price * qty;
      const discountAmt = Number(it.discountAmt ?? it.discount_amt ?? ((gross * Number(it.discountPer ?? it.discount_per ?? 0)) / 100));
      const discountPer = Number(
        it.discountPer ??
        it.discount_per ??
        (gross > 0 && discountAmt > 0 ? (discountAmt / gross) * 100 : 0)
      );
      if (discountAmt > 0) {
        totalItemDiscount += discountAmt;
        itemsWithDiscount.push({
          name: it.itemName || it.pDescription || it.product_name || it.name || 'Item',
          discountAmt,
          discountPer: Number(discountPer.toFixed(2)) === Math.round(discountPer) ? Math.round(discountPer) : Number(discountPer.toFixed(1))
        });
      }
    });

    const overallBillDiscount = Number(
      row.overall_discount ||
      row.discount_amount ||
      itemsList.find((i: any) => i._overallDiscount !== undefined)?._overallDiscount ||
      0
    );

    const grandTotalDiscount = totalItemDiscount + overallBillDiscount;

    return {
      itemsWithDiscount,
      totalItemDiscount,
      overallBillDiscount,
      grandTotalDiscount
    };
  };
