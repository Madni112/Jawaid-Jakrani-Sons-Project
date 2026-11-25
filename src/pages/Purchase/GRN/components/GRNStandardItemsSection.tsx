import React, { useState } from 'react';
import { FieldArray, FormikErrors, FormikTouched } from 'formik';
import { FiTrash2 } from 'react-icons/fi';
import WarehouseSelect from './WarehouseSelect';
import ChainedUomInputGrid from '../../../../components/ChainedUomInputGrid';
import { LooseChainBadge } from '../../../../utils/looseUomHelpers';
import { GRNFormValues, LocationItem, ProductItem } from '../types/grnTypes';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import { isTileProduct } from '../utils/grnHelpers';

interface GRNStandardItemsSectionProps {
  values: GRNFormValues;
  errors: FormikErrors<GRNFormValues>;
  touched: FormikTouched<GRNFormValues>;
  setFieldValue: (field: string, value: any) => void;
  locations: LocationItem[];
  productList: ProductItem[];
  getLocationStock: (productName: string, warehouseName: string) => number;
}

export const GRNStandardItemsSection: React.FC<GRNStandardItemsSectionProps> = ({
  values,
  errors,
  touched,
  setFieldValue,
  locations,
  productList,
  getLocationStock,
}) => {
  const [openDropdownRowIndex, setOpenDropdownRowIndex] = useState<number | null>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);

  return (
    <div className="border border-stroke dark:border-strokedark rounded-sm overflow-visible pb-4">
      <table className="w-full table-auto border-collapse text-left">
        <thead>
          <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
            <th className="p-3 w-10 text-center">S#</th>
            <th className="p-3 w-80 min-w-[280px]">Product Code / Description</th>
            <th className="p-3 w-56">Receiving Warehouse</th>
            <th className="p-3 min-w-[300px] text-center">Quantity (UOM)</th>
            <th className="p-3 w-24 text-center">UOM</th>
            <th className="p-3 w-10 text-center"></th>
          </tr>
        </thead>
        <FieldArray name="items">
          {({ push, remove }) => (
            <tbody>
              {values.items.map((item, idx) => (
                <tr key={idx} className="border-b border-stroke dark:border-strokedark relative">
                  <td className="p-3 text-center text-gray-500">{idx + 1}</td>

                  {/* Merged Product Code / Description Combobox */}
                  <td className="p-3 relative prod-name-container w-80 min-w-[280px]">
                    {(() => {
                      const query = (item.itemName || '').toLowerCase().trim();
                      const nonTileProds = (productList || []).filter((p: any) => !isTileProduct(p));
                      const filtered = nonTileProds.filter((p: any) => {
                        if (!query) return true;
                        const name = String(p.product_name || '').toLowerCase();
                        const sku = String(p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                        return name.includes(query) || sku.includes(query);
                      });

                      return (
                        <div className="relative">
                          <input
                            type="text"
                            name={`items.${idx}.itemName`}
                            value={item.itemName}
                            autoComplete="off"
                            onChange={(e) => {
                              const typed = e.target.value;
                              setFieldValue(`items.${idx}.itemName`, typed);
                              setOpenDropdownRowIndex(idx);
                              setHighlightedProductIndex(0);

                              const matched = productList.find(
                                (p) =>
                                  (p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase()) ||
                                  (p.item_sr_no && p.item_sr_no.toLowerCase() === typed.trim().toLowerCase())
                              );
                              if (matched) {
                                setFieldValue(`items.${idx}.itemName`, matched.product_name);
                                setFieldValue(`items.${idx}.skuCode`, matched.item_sr_no || `SKU-${matched.id}`);
                                setFieldValue(`items.${idx}.uom`, matched.uom || 'Nos');
                              }
                            }}
                            onFocus={() => {
                              setOpenDropdownRowIndex(idx);
                              setHighlightedProductIndex(0);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlightedProductIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlightedProductIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
                              } else if (e.key === 'Enter' && filtered.length > 0) {
                                e.preventDefault();
                                const p = filtered[highlightedProductIndex] || filtered[0];
                                setFieldValue(`items.${idx}.itemName`, p.product_name);
                                setFieldValue(`items.${idx}.skuCode`, p.item_sr_no || `SKU-${p.id}`);
                                setFieldValue(`items.${idx}.uom`, p.uom || 'Nos');
                                setOpenDropdownRowIndex(null);
                              } else if (e.key === 'Tab' || e.key === 'Escape') {
                                setOpenDropdownRowIndex(null);
                              }
                            }}
                            placeholder="Search by code or product description..."
                            className={`w-full rounded border p-2 bg-transparent font-bold outline-none focus:border-primary ${
                              touched.items?.[idx]?.itemName && (errors.items as any)?.[idx]?.itemName
                                ? 'border-red-500'
                                : 'border-stroke dark:border-strokedark'
                            }`}
                          />
                          {item.skuCode && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              Code: <span className="font-bold text-slate-600 dark:text-slate-300">{item.skuCode}</span>
                            </div>
                          )}
                          {openDropdownRowIndex === idx && filtered.length > 0 && (
                            <div className="absolute left-0 top-full mt-1 z-[999999] min-w-[360px] max-w-[460px] max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                              {filtered.map((p: any, pIdx: number) => {
                                const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                const isHighlighted = highlightedProductIndex === pIdx;
                                return (
                                  <div
                                    key={p.id || p.product_name}
                                    onMouseEnter={() => setHighlightedProductIndex(pIdx)}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setFieldValue(`items.${idx}.itemName`, p.product_name);
                                      setFieldValue(`items.${idx}.skuCode`, displaySku);
                                      setFieldValue(`items.${idx}.uom`, p.uom || 'Nos');
                                      setOpenDropdownRowIndex(null);
                                    }}
                                    className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                      isHighlighted
                                        ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-primary text-black dark:text-white font-bold'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold block truncate max-w-[210px]">{p.product_name}</span>
                                      <span className="text-[10px] opacity-80 block font-mono text-slate-500">
                                        Code: {displaySku} • {p.category || 'Product'}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end">
                                      {p.purchase_price ? (
                                        <span className="font-mono font-bold block text-emerald-600 dark:text-emerald-400">
                                          Rs. {Number(p.purchase_price || 0).toLocaleString()}
                                        </span>
                                      ) : null}
                                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded mt-0.5">
                                        Stock: {formatStockWithBoxesAndPcs(p.current_stock || 0, p).inlineText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Receiving Warehouse */}
                  <td className="p-3 w-48">
                    <WarehouseSelect
                      locations={locations}
                      selectedWarehouse={item.warehouseName || ''}
                      onSelect={(wh) => setFieldValue(`items.${idx}.warehouseName`, wh)}
                      productName={item.itemName}
                      getLocationStock={getLocationStock}
                    />
                  </td>

                  <td className="p-3">
                    {(() => {
                      const selectedProd = productList.find((p) => p.product_name === item.itemName);
                      const isTile =
                        String(selectedProd?.category || '').toLowerCase().includes('tile') ||
                        String(selectedProd?.uom || '').toUpperCase() === 'BOX';
                      const rawPcs = Number(
                        selectedProd?.loose_conversion_ratio ||
                          selectedProd?.pieces_per_box ||
                          selectedProd?.pcs_per_box ||
                          selectedProd?.pieces_per_packing ||
                          0
                      );
                      const pcsPerBox = rawPcs > 1 ? rawPcs : isTile ? 4 : 1;

                      const allowLoose = Boolean(selectedProd?.allow_loose_sales || (Array.isArray(selectedProd?.multi_loose_units) && selectedProd.multi_loose_units.length > 0));
                      if (allowLoose || (isTile && pcsPerBox > 1)) {
                        return (
                          <ChainedUomInputGrid
                            primaryUom={selectedProd?.uom || (isTile ? 'BOX' : 'Unit')}
                            primaryQuantity={Number(item.qty) || 0}
                            primaryRate={Number(selectedProd?.purchase_price) || 0}
                            tiers={
                              Array.isArray(selectedProd?.multi_loose_units) && selectedProd.multi_loose_units.length > 0
                                ? selectedProd.multi_loose_units
                                : [{ uom: selectedProd?.loose_uom || (isTile ? 'PCS' : 'Units'), ratio: pcsPerBox, costPrice: selectedProd?.loose_purchase_price, salePrice: selectedProd?.loose_sale_price }]
                            }
                            tierQuantities={item.tier_quantities}
                            tierRates={item.tier_rates}
                            mode="cost"
                            onChange={({ primaryQuantity, tierQuantities, tierRates, totalConvertedPrimaryQty }) => {
                              setFieldValue(`items.${idx}.qty`, totalConvertedPrimaryQty);
                              setFieldValue(`items.${idx}.tier_quantities`, tierQuantities);
                              setFieldValue(`items.${idx}.tier_rates`, tierRates);
                            }}
                          />
                        );
                      }

                      return (
                        <input
                          type="number"
                          min="0"
                          step={
                            ['kg', 'ltr', 'cm', 'mm', 'yd', 'm', 'g', 'ml', 'ton', 'sqm', 'sqft', 'cbm'].includes(
                              String(item.uom).toLowerCase()
                            )
                              ? '0.01'
                              : '1'
                          }
                          name={`items.${idx}.qty`}
                          value={item.qty}
                          onKeyDown={(e) => {
                            const decimalUoms = [
                              'kg',
                              'ltr',
                              'cm',
                              'mm',
                              'yd',
                              'm',
                              'g',
                              'ml',
                              'ton',
                              'sqm',
                              'sqft',
                              'cbm',
                            ];
                            const isDecimalAllowed = decimalUoms.includes(String(item.uom).toLowerCase());
                            if (!isDecimalAllowed && e.key === '.') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const decimalUoms = [
                              'kg',
                              'ltr',
                              'cm',
                              'mm',
                              'yd',
                              'm',
                              'g',
                              'ml',
                              'ton',
                              'sqm',
                              'sqft',
                              'cbm',
                            ];
                            const isDecimalAllowed = decimalUoms.includes(String(item.uom).toLowerCase());
                            let valStr = e.target.value;
                            if (!isDecimalAllowed && valStr.includes('.')) {
                              valStr = valStr.split('.')[0];
                            }
                            setFieldValue(`items.${idx}.qty`, Math.max(0, Number(valStr) || 0));
                          }}
                          className={`w-full text-right rounded border p-2 bg-transparent font-bold font-mono outline-none focus:border-primary ${
                            touched.items?.[idx]?.qty && (errors.items as any)?.[idx]?.qty
                              ? 'border-red-500'
                              : 'border-stroke dark:border-strokedark'
                          }`}
                        />
                      );
                    })()}
                  </td>

                  <td className="p-3 font-mono text-center">
                    {(() => {
                      const selectedProd = productList.find((p) => p.product_name === item.itemName);
                      const isTile =
                        String(selectedProd?.category || '').toLowerCase().includes('tile') ||
                        String(selectedProd?.uom || '').toUpperCase() === 'BOX';
                      const rawPcs = Number(
                        selectedProd?.loose_conversion_ratio ||
                          selectedProd?.pieces_per_box ||
                          selectedProd?.pcs_per_box ||
                          selectedProd?.pieces_per_packing ||
                          0
                      );
                      const pcsPerBox = rawPcs > 1 ? rawPcs : isTile ? 4 : 1;
                      if (isTile && pcsPerBox > 1) {
                        return (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold">{item.uom || 'BOX'}</span>
                            <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap">
                              ({pcsPerBox} Pcs/Box)
                            </span>
                          </div>
                        );
                      }
                      return <span className="text-xs font-bold">{item.uom || 'Nos'}</span>;
                    })()}
                  </td>

                  <td className="p-3 text-center">
                    {values.items.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-danger">
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} className="p-3 text-left">
                  <button
                    type="button"
                    onClick={() => push({ itemName: '', skuCode: '', qty: 1, uom: 'Nos', warehouseName: '' })}
                    className="text-primary font-bold hover:underline"
                  >
                    + Add Item Line
                  </button>
                </td>
              </tr>
            </tbody>
          )}
        </FieldArray>
      </table>
    </div>
  );
};
