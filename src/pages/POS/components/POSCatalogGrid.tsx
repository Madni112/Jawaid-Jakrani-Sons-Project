import React from 'react';
import {
  LuLock,
  LuUnlock,
  LuLayers,
  LuTag,
  LuClock,
  LuStore,
  LuShoppingBag,
  LuPlus,
  LuCoins,
  LuReceipt,
  LuPrinter,
  LuShieldCheck,
} from 'react-icons/lu';
import { posService, PosProduct, PosOrderItem } from '../../../service/posService';

interface POSCatalogGridProps {
  activeShift: any;
  handleOpenDrawerModal: () => void;
  posConfig: any;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  products: PosProduct[];
  currentTerminalSlug: string;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  categories: any[];
  sortByDate: string;
  setSortByDate: React.Dispatch<React.SetStateAction<string>>;
  loadingCatalog: boolean;
  filteredProducts: PosProduct[];
  setSearchQuery: (val: string) => void;
  cartItems: PosOrderItem[];
  handleAddToCart: (prod: PosProduct) => void;
}

export const POSCatalogGrid: React.FC<POSCatalogGridProps> = ({
  activeShift,
  handleOpenDrawerModal,
  posConfig,
  selectedCategory,
  setSelectedCategory,
  products,
  currentTerminalSlug,
  accentColor,
  contrastText,
  isAccentWhite,
  categories,
  sortByDate,
  setSortByDate,
  loadingCatalog,
  filteredProducts,
  setSearchQuery,
  cartItems,
  handleAddToCart,
}) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0B0F17] min-w-0">
      {/* Warning Banner when Cash Drawer / Day is closed */}
      {!activeShift && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold">
            <LuLock size={15} className="text-amber-500 shrink-0" />
            <span>Cash Drawer & Day Session are closed. Please open the drawer first to create sales.</span>
          </div>
          <button
            type="button"
            onClick={handleOpenDrawerModal}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <LuUnlock size={13} />
            <span>Open Drawer First</span>
          </button>
        </div>
      )}

      {/* Category Filter Pills (with Dynamic Display Style: pill | card | text) */}
      <div className="p-3 bg-white dark:bg-[#111622] border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 overflow-x-auto no-scrollbar shrink-0">
        {/* All Items Button */}
        {(() => {
          const catStyle = posConfig.category_display_style || 'pill';
          const isAllSelected = selectedCategory === 'All';
          const totalItemCount = products.filter(
            (p) => p.show_in_pos !== false && posService.isProductVisibleOnCounter(p, currentTerminalSlug)
          ).length;

          if (catStyle === 'card') {
            return (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`rounded-2xl text-center transition shrink-0 cursor-pointer flex flex-col items-center justify-between w-[115px] sm:w-[125px] h-[105px] border overflow-hidden ${
                  isAllSelected
                    ? 'shadow-sm scale-[1.02]'
                    : 'bg-white dark:bg-[#151c2e] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                style={
                  isAllSelected
                    ? {
                        backgroundColor: accentColor,
                        color: contrastText,
                        borderColor: isAccentWhite ? '#cbd5e1' : 'transparent',
                      }
                    : undefined
                }
              >
                <div
                  className={`w-full h-14 flex items-center justify-center shrink-0 ${
                    isAllSelected
                      ? 'bg-black/10 dark:bg-white/15 text-current'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LuLayers size={22} />
                </div>
                <div className="w-full px-2 py-1.5 text-center leading-tight">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-black tracking-tight truncate">All Items</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                        isAllSelected
                          ? 'bg-black/15 dark:bg-white/20 text-current'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {totalItemCount}
                    </span>
                  </div>
                  <span className="text-[9px] opacity-75 font-medium block truncate leading-none mt-1">
                    All Categories
                  </span>
                </div>
              </button>
            );
          }

          if (catStyle === 'text') {
            return (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3.5 py-2 rounded-xl text-left transition shrink-0 cursor-pointer flex items-center gap-2 border ${
                  isAllSelected
                    ? 'shadow-xs scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                }`}
                style={
                  isAllSelected
                    ? {
                        backgroundColor: accentColor,
                        color: contrastText,
                        borderColor: isAccentWhite ? '#cbd5e1' : 'transparent',
                      }
                    : undefined
                }
              >
                <span className="text-xs font-black tracking-tight">All Items</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                    isAllSelected
                      ? 'bg-black/10 dark:bg-white/15 text-current'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {totalItemCount}
                </span>
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-left transition shrink-0 cursor-pointer flex items-center gap-2.5 min-w-[120px] border ${
                isAllSelected
                  ? 'shadow-xs scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
              style={
                isAllSelected
                  ? {
                      backgroundColor: accentColor,
                      color: contrastText,
                      borderColor: isAccentWhite ? '#cbd5e1' : 'transparent',
                    }
                  : undefined
              }
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAllSelected
                    ? 'bg-black/10 dark:bg-white/15 text-current'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <LuLayers size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight">All Items</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                      isAllSelected
                        ? 'bg-black/10 dark:bg-white/15 text-current'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {totalItemCount}
                  </span>
                </div>
                <span className="text-[10px] opacity-75 font-medium block leading-tight">
                  All Categories
                </span>
              </div>
            </button>
          );
        })()}

        {/* Filtered Categories */}
        {categories
          .filter((cat) => posService.isCategoryVisibleOnCounter(cat, currentTerminalSlug))
          .map((cat) => {
            const count = products.filter(
              (p) =>
                p.category === cat.name &&
                p.show_in_pos !== false &&
                posService.isProductVisibleOnCounter(p, currentTerminalSlug)
            ).length;
            const isSelected = selectedCategory === cat.name;
            return { cat, count, isSelected };
          })
          .filter(({ count, isSelected }) => count > 0 || isSelected)
          .map(({ cat, count, isSelected }) => {
            const catStyle = posConfig.category_display_style || 'pill';
            const hierarchy = [cat.parent_name, cat.department, cat.sub_category]
              .filter(Boolean)
              .map((s) => String(s).trim())
              .filter((v, i, a) => a.indexOf(v) === i);
            const subtitleText = hierarchy.length > 0 ? hierarchy.join(' • ') : 'Category';

            if (catStyle === 'card') {
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-2xl text-center transition shrink-0 cursor-pointer flex flex-col items-center justify-between w-[115px] sm:w-[125px] h-[105px] border overflow-hidden ${
                    isSelected
                      ? 'shadow-sm scale-[1.02]'
                      : 'bg-white dark:bg-[#151c2e] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: accentColor,
                          color: contrastText,
                          borderColor: isAccentWhite ? '#cbd5e1' : 'transparent',
                        }
                      : undefined
                  }
                  title={cat.full_path || cat.name}
                >
                  <div className="w-full h-14 relative bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex items-center justify-center shrink-0">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          isSelected
                            ? 'bg-black/10 dark:bg-white/15 text-current'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <LuTag size={20} />
                      </div>
                    )}
                  </div>
                  <div className="w-full px-2 py-1.5 text-center leading-tight">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs font-black tracking-tight truncate">{cat.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-black/15 dark:bg-white/20 text-current'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <span className="text-[9px] opacity-75 font-medium block truncate leading-none mt-1">
                      {subtitleText}
                    </span>
                  </div>
                </button>
              );
            }

            if (catStyle === 'text') {
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-left transition shrink-0 cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'shadow-xs scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: accentColor,
                          color: contrastText,
                          borderColor: isAccentWhite ? '#cbd5e1' : 'transparent',
                        }
                      : undefined
                  }
                  title={cat.full_path || cat.name}
                >
                  <span className="text-xs font-black tracking-tight">{cat.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                      isSelected
                        ? 'bg-black/10 dark:bg-white/15 text-current'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-left transition shrink-0 cursor-pointer flex items-center gap-2.5 min-w-[130px] max-w-[250px] border ${
                  isSelected
                    ? 'shadow-xs scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: accentColor,
                        color: contrastText,
                        borderColor: isAccentWhite ? '#cbd5e1' : 'transparent',
                      }
                    : undefined
                }
                title={cat.full_path || cat.name}
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-black/10 dark:border-white/10 shadow-2xs"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-black/10 dark:bg-white/15 text-current'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <LuTag size={15} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-black tracking-tight truncate">
                      {cat.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-black/10 dark:bg-white/15 text-current'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-75 font-medium mt-0.5 block leading-tight truncate">
                    {subtitleText}
                  </span>
                </div>
              </button>
            );
          })}

        {/* Date-Wise Sort Toggle Pill */}
        <button
          type="button"
          onClick={() => setSortByDate((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          className="ml-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          title="Toggle ordering: Newest Added First vs Oldest First"
        >
          <LuClock size={13} className="text-primary" />
          <span>{sortByDate === 'newest' ? '📅 Newest First' : '📅 Oldest First'}</span>
        </button>
      </div>

      {/* Product Card Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingCatalog ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading catalog items...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <LuStore size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No matching products found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Try searching with another keyword, clearing the category filter, or scanning a barcode.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              style={{
                backgroundColor: accentColor,
                color: contrastText,
                border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
              }}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          (() => {
            const isCompactProduct = (posConfig.product_card_size || 'tall') === 'compact';
            return (
              <div
                className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${
                  isCompactProduct ? 'gap-2.5' : 'gap-3.5'
                }`}
              >
                {filteredProducts.map((prod) => {
                  const cartItem = cartItems.find((it) => it.product_id === prod.id);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleAddToCart(prod)}
                      className={`group relative rounded-2xl bg-white dark:bg-[#111622] border transition-all duration-200 ${
                        isCompactProduct ? 'p-2 sm:p-2.5' : 'p-3'
                      } flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                        cartItem
                          ? 'border-primary ring-2 ring-primary/20 dark:ring-primary/30'
                          : 'border-slate-200 dark:border-slate-800/80 hover:border-primary/50'
                      }`}
                    >
                      {/* Selected quantity badge */}
                      {cartItem && (
                        <div
                          className={`absolute ${
                            isCompactProduct ? 'top-1.5 right-1.5 w-5 h-5 text-[10px]' : 'top-2.5 right-2.5 w-6 h-6 text-xs'
                          } z-10 rounded-full font-bold flex items-center justify-center shadow-md animate-bounce`}
                          style={{
                            backgroundColor: accentColor,
                            color: contrastText,
                            border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
                          }}
                        >
                          {cartItem.quantity}
                        </div>
                      )}

                      {/* Product Image / Placeholder */}
                      <div
                        className={`relative w-full ${
                          isCompactProduct ? 'h-24 sm:h-28 mb-1.5' : 'h-48 sm:h-52 mb-2.5'
                        } rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 shrink-0`}
                      >
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/60 dark:from-slate-800/50 dark:to-slate-800/90 text-slate-300 dark:text-slate-600 group-hover:text-primary/70 transition-colors">
                            <LuShoppingBag
                              size={isCompactProduct ? 30 : 48}
                              className="opacity-70 group-hover:scale-110 transition-transform duration-200"
                            />
                          </div>
                        )}

                        {/* Category Badge */}
                        <span
                          className={`absolute ${
                            isCompactProduct
                              ? 'bottom-1 left-1 px-1.5 py-0.2 text-[9px]'
                              : 'bottom-2 left-2 px-2 py-0.5 text-[10px]'
                          } rounded-md font-bold bg-black/60 backdrop-blur-xs text-white`}
                        >
                          {prod.category}
                        </span>
                      </div>

                      {/* Product Title & Code */}
                      <div className={isCompactProduct ? 'space-y-0.5 mb-1.5' : 'space-y-1 mb-2'}>
                        <h4
                          className={`font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors ${
                            isCompactProduct ? 'text-[11px] sm:text-xs' : 'text-xs'
                          }`}
                          title={prod.product_name}
                        >
                          {prod.product_name}
                        </h4>
                        {(() => {
                          const hierarchyParts = [prod.parent_category, prod.sub_category]
                            .filter(Boolean)
                            .map((s: any) => String(s).trim())
                            .filter((v, i, a) => a.indexOf(v) === i);
                          if (hierarchyParts.length === 0) return null;
                          const catLine = hierarchyParts.join(' • ');
                          return (
                            <p
                              className={`${
                                isCompactProduct ? 'text-[9px]' : 'text-[10px]'
                              } text-slate-400 font-medium truncate`}
                              title={catLine}
                            >
                              {catLine}
                            </p>
                          );
                        })()}
                        <div
                          className={`flex items-center justify-between text-slate-400 ${
                            isCompactProduct ? 'text-[9px]' : 'text-[10px]'
                          }`}
                        >
                          <span className="font-mono">{prod.item_sr_no || 'SKU'}</span>
                          <span className="text-emerald-500 font-semibold">In Stock</span>
                        </div>
                      </div>

                      {/* Price & Add Indicator */}
                      <div
                        className={`flex items-center justify-between ${
                          isCompactProduct ? 'pt-1.5' : 'pt-2'
                        } border-t border-slate-100 dark:border-slate-800/60`}
                      >
                        <span
                          className={`${
                            isCompactProduct ? 'text-xs' : 'text-xs sm:text-sm'
                          } font-extrabold text-slate-900 dark:text-white`}
                        >
                          Rs. {prod.retail_price.toLocaleString()}
                        </span>
                        <div
                          className={`${
                            isCompactProduct ? 'w-5 h-5 rounded-md text-[11px]' : 'w-6 h-6 rounded-lg text-xs'
                          } bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold transition`}
                        >
                          <LuPlus size={isCompactProduct ? 11 : 13} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <footer className="h-10 bg-white dark:bg-[#111622] border-t border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <LuCoins className="text-amber-500 text-sm" />
            <span>Drawer Balance:</span>
            <strong className="text-slate-800 dark:text-white font-mono">
              {activeShift ? `Rs. ${(activeShift.expected_cash || 0).toLocaleString()}` : 'Closed (Day Not Open)'}
            </strong>
          </span>

          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>

          <span className="hidden sm:flex items-center gap-1.5">
            <LuReceipt className="text-sky-500 text-sm" />
            <span>Sales Today:</span>
            <strong className="text-slate-800 dark:text-white font-mono">
              {posService.getAllOrders().length} Orders
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <LuPrinter className="text-emerald-500 text-sm" />
            <span>Thermal Printer:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">
              {posConfig.receipt_paper_size} Online
            </strong>
          </span>

          <span className="hidden md:inline-block text-slate-300 dark:text-slate-700">•</span>

          <span className="hidden md:flex items-center gap-1 text-[11px]">
            <LuShieldCheck className="text-primary" />
            <span>Secure Cloud Sync</span>
          </span>
        </div>
      </footer>
    </main>
  );
};
