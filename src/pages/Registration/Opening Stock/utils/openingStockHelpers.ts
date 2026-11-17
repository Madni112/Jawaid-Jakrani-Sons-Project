import React from 'react';
import { supabase } from '../../../../Context/supabaseClient';
import { OpeningStockItemRow, ItemStockInfo } from '../types/openingStockTypes';

export const todayStr = () => new Date().toISOString().split('T')[0];

export const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

export const generateUniqueStockNo = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `STK-${timestamp}-${randomCode}`;
};

export const isTileProduct = (p: any): boolean => {
    if (!p) return false;
    const parent = String(p.sub_sub_category || '').toLowerCase().trim();
    if (parent) return parent.includes('tile');
    const cat = String(p.category || '').toLowerCase();
    const desc = String(p.product_description || '').toLowerCase();
    const name = String(p.product_name || p.itemName || '').toLowerCase();
    return cat.includes('tile') || desc.includes('[tile') || name.includes('tile');
};

export const isLoosePackagingItem = (p: any): boolean => {
    if (!p) return false;
    if (Boolean(p.allow_loose_sales)) return true;
    const ratio = Number(p.loose_conversion_ratio || 0);
    if (ratio > 1) return true;
    return isTileProduct(p);
};

export const getProductPiecesPerBox = (p: any): number => {
    if (!p) return 4;
    const looseRatio = Number(p.loose_conversion_ratio || 0);
    if (Boolean(p.allow_loose_sales) && looseRatio > 0) return looseRatio;
    const raw = Number(p.pieces_per_box ?? p.pcs_per_box ?? p.pieces_per_packing ?? 0);
    if (raw >= 1) return raw;
    if (looseRatio > 0) return looseRatio;
    const match = String(p.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
    if (match && Number(match[1]) > 0) return Number(match[1]);
    return 4;
};

export const getProduct = (products: any[], name?: string, code?: string) => {
    const nameToFind = String(name || '').trim().toLowerCase();
    const codeToFind = String(code || '').trim().toLowerCase();
    if (!nameToFind && !codeToFind) return null;
    return (products || []).find((p: any) =>
        (nameToFind && p.product_name && p.product_name.trim().toLowerCase() === nameToFind) ||
        (codeToFind && p.item_sr_no && p.item_sr_no.trim().toLowerCase() === codeToFind)
    ) || null;
};

export const getItemCurrentStock = (
    products: any[],
    stockMap: Record<string, number>,
    itemName: string
): ItemStockInfo => {
    if (!itemName) {
        return { totalStock: 0, boxes: 0, loose: 0, isTile: false, pcsPerBox: 4, hasProduct: false, uom: 'Boxes', looseUom: 'Pcs' };
    }
    const p = products.find(prod =>
        prod.product_name?.toLowerCase().trim() === itemName.toLowerCase().trim()
    );
    if (!p) {
        return { totalStock: 0, boxes: 0, loose: 0, isTile: false, pcsPerBox: 4, hasProduct: false, uom: 'Boxes', looseUom: 'Pcs' };
    }

    const key = String(p.product_name || '').toLowerCase().trim();
    const totalStock = stockMap[key] !== undefined ? stockMap[key] : (Number(p.current_stock) || 0);

    const isTile = isLoosePackagingItem(p);
    const pcsPerBox = getProductPiecesPerBox(p);
    const mainUom = p.uom ? (p.uom.toUpperCase() === 'BOX' ? 'Boxes' : p.uom) : 'Boxes';
    const looseUom = p.loose_uom || 'Pcs';

    if (isTile) {
        const boxes = Math.floor(totalStock);
        let loose = Math.round((totalStock - boxes) * pcsPerBox);
        let finalBoxes = boxes;
        if (loose >= pcsPerBox) {
            finalBoxes += Math.floor(loose / pcsPerBox);
            loose = loose % pcsPerBox;
        }
        return {
            totalStock,
            boxes: finalBoxes,
            loose,
            isTile: true,
            pcsPerBox,
            hasProduct: true,
            uom: mainUom,
            looseUom
        };
    }

    return {
        totalStock,
        boxes: 0,
        loose: 0,
        isTile: false,
        pcsPerBox: 1,
        hasProduct: true,
        uom: p.uom || 'units',
        looseUom: 'Pcs'
    };
};

export const emptyItemRow = (): OpeningStockItemRow => ({
    itemCode: '',
    itemName: '',
    qty: 1,
    purchasePrice: 0,
    pieceCost: '',
    expiryDate: '',
    isTileItem: false,
    boxQty: 1,
    loosePcs: 0,
    piecesPerBox: 4
});

export const fmtMoney = (val: number): string =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const assertNoDuplicateRows = (rows: any[]): string | null => {
    const seen: Record<string, number> = {};
    for (let i = 0; i < rows.length; i++) {
        const key = String(rows[i].itemName || '').trim().toLowerCase();
        if (seen[key] !== undefined) {
            return `Cannot save — "${rows[i].itemName}" is added in both row ${seen[key] + 1} and row ${i + 1}. Please remove the duplicate line.`;
        }
        seen[key] = i;
    }
    return null;
};

export const buildPayloads = (rows: any[], stockNoValue: string, header: any, products: any[]) =>
    rows.map((r: any) => {
        const unitCost = Number(r.purchasePrice) || 0;
        const pObj = getProduct(products, r.itemName, r.itemCode);
        const isPack = Boolean(r.isTileItem || isLoosePackagingItem(pObj));
        const pcsPerBox = r.piecesPerBox || getProductPiecesPerBox(pObj);
        const pcCost = r.pieceCost !== undefined && r.pieceCost !== ''
            ? Number(r.pieceCost)
            : (pcsPerBox > 0 ? unitCost / pcsPerBox : 0);

        const bQty = Number(r.boxQty || 0);
        const lPcs = Number(r.loosePcs || 0);
        const quantity = isPack ? Number((bQty + (pcsPerBox > 0 ? lPcs / pcsPerBox : 0)).toFixed(3)) : (Number(r.qty) || 0);
        const totalValuation = isPack
            ? (bQty * unitCost) + (lPcs * pcCost)
            : quantity * unitCost;

        const exp = r.expiryDate ? r.expiryDate : null;
        return {
            stock_no: stockNoValue,
            stockno: stockNoValue,
            item_code: r.itemCode || '',
            skucode: r.itemCode || '',
            product_name: r.itemName,
            itemname: r.itemName,
            batch_number: header.batchNumber || '',
            batchnumber: header.batchNumber || '',
            location: header.location,
            qty: quantity,
            quantity: quantity,
            purchase_price: unitCost,
            rate: unitCost,
            amount: totalValuation,
            total_amount: totalValuation,
            opening_date: header.openingDate,
            openingdate: header.openingDate,
            expiry_date: exp,
            expirydate: exp
        };
    });

export const aggregateByProduct = (rows: any[]): Record<string, number> => {
    const map: Record<string, number> = {};
    rows.forEach((r: any) => {
        const key = String(r.itemName || r.product_name || r.itemname || '').trim().toLowerCase();
        if (key) map[key] = (map[key] || 0) + (Number(r.qty ?? r.quantity) || 0);
    });
    return map;
};

export const updateProductStock = async (nameKey: string, delta: number) => {
    if (!nameKey || delta === 0) return;
    const { data: prod } = await supabase
        .from('products')
        .select('id, current_stock')
        .ilike('product_name', nameKey)
        .maybeSingle();

    if (prod) {
        const next = Math.max(0, (Number(prod.current_stock) || 0) + delta);
        await supabase.from('products').update({ current_stock: next }).eq('id', prod.id);
    }
};
