import { supabase } from '../Context/supabaseClient';

/**
 * Consolidates all legacy 'Main Warehouse' balances, opening stocks,
 * sales dispatches, returns, challans, and purchases into 'A-39'.
 */
export async function migrateMainWarehouseToA39(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Move opening stocks
    await supabase
      .from('opening_stocks')
      .update({ location: 'A-39' })
      .ilike('location', 'main warehouse');

    // 2. Move stock_balances
    const { data: mainWhBalances } = await supabase
      .from('stock_balances')
      .select('*')
      .ilike('warehouse_name', 'main warehouse');

    if (mainWhBalances && mainWhBalances.length > 0) {
      for (const row of mainWhBalances) {
        const prodName = String(row.product_name || '').trim();
        const qty = Number(row.quantity || 0);

        // Check if an A-39 balance row exists
        const { data: existingA39 } = await supabase
          .from('stock_balances')
          .select('*')
          .ilike('product_name', prodName)
          .ilike('warehouse_name', 'A-39')
          .maybeSingle();

        if (existingA39) {
          // Merge quantities into A-39
          await supabase
            .from('stock_balances')
            .update({ quantity: Number(existingA39.quantity || 0) + qty, updated_at: new Date().toISOString() })
            .eq('id', existingA39.id);
          // Delete old Main Warehouse row
          await supabase
            .from('stock_balances')
            .delete()
            .eq('id', row.id);
        } else {
          // Re-label to A-39
          await supabase
            .from('stock_balances')
            .update({ warehouse_name: 'A-39', updated_at: new Date().toISOString() })
            .eq('id', row.id);
        }
      }
    }

    // 3. Move sales invoices dispatch warehouse and items JSON
    const { data: mainWhInvoices } = await supabase
      .from('sales_invoices')
      .select('id, dispatch_warehouse, items')
      .ilike('dispatch_warehouse', 'main warehouse');

    if (mainWhInvoices && mainWhInvoices.length > 0) {
      for (const inv of mainWhInvoices) {
        let updatedItems = inv.items;
        if (Array.isArray(updatedItems)) {
          updatedItems = updatedItems.map((item: any) => {
            if (item && typeof item === 'object' && String(item.warehouse || '').toLowerCase() === 'main warehouse') {
              return { ...item, warehouse: 'A-39' };
            }
            return item;
          });
        }
        await supabase
          .from('sales_invoices')
          .update({ dispatch_warehouse: 'A-39', items: updatedItems })
          .eq('id', inv.id);
      }
    }

    // 4. Move delivery challans dispatch & source warehouse
    await supabase
      .from('delivery_challans')
      .update({ dispatch_warehouse: 'A-39' })
      .ilike('dispatch_warehouse', 'main warehouse');

    await supabase
      .from('delivery_challans')
      .update({ source_warehouse: 'A-39' })
      .ilike('source_warehouse', 'main warehouse');

    // 5. Move supplier purchases target warehouse
    await supabase
      .from('supplier_purchases')
      .update({ target_warehouse: 'A-39' })
      .ilike('target_warehouse', 'main warehouse');

    // 6. Move sales returns warehouse
    await supabase
      .from('sales_returns')
      .update({ warehouse_name: 'A-39' })
      .ilike('warehouse_name', 'main warehouse');

    await supabase
      .from('sales_returns')
      .update({ source_warehouse: 'A-39' })
      .ilike('source_warehouse', 'main warehouse');

    // 7. Move stock transfers
    await supabase
      .from('stock_transfers')
      .update({ source_location: 'A-39' })
      .ilike('source_location', 'main warehouse');

    await supabase
      .from('stock_transfers')
      .update({ destination_location: 'A-39' })
      .ilike('destination_location', 'main warehouse');

    // 8. Remove Main Warehouse from inventory locations if present
    await supabase
      .from('inventory_locations')
      .delete()
      .ilike('name', 'main warehouse');

    return {
      success: true,
      message: 'Successfully migrated all Main Warehouse balances, opening stock, and transactions to A-39.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to migrate warehouse.'
    };
  }
}
