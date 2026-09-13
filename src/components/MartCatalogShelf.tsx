import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Tag, 
  Filter, 
  AlertCircle,
  Coffee,
  Utensils,
  Wine,
  Sparkles,
  Cookie,
  Flame,
  Check,
  Pencil,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { soundManager } from '../utils/audio';

interface MartCatalogShelfProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  cartProductQuantities: Record<string, number>;
  onAddNewProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export const MartCatalogShelf: React.FC<MartCatalogShelfProps> = ({
  products,
  onAddToCart,
  cartProductQuantities,
  onAddNewProduct,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: ProductCategory; labelKh: string; labelEn: string; icon: string }[] = [
    { id: 'all', labelKh: 'ទាំងអស់', labelEn: 'All', icon: '🏪' },
    { id: 'beverage', labelKh: 'ភេសជ្ជៈ', labelEn: 'Drinks', icon: '🥤' },
    { id: 'fastfood', labelKh: 'អាហាររហ័ស', labelEn: 'Fast Food', icon: '🍜' },
    { id: 'coffee', labelKh: 'កាហ្វេ & នំ', labelEn: 'Coffee', icon: '☕' },
    { id: 'snack', labelKh: 'អាហារសម្រន់', labelEn: 'Snacks', icon: '🥔' },
    { id: 'icecream', labelKh: 'ការ៉េម', labelEn: 'Ice Cream', icon: '🍦' },
    { id: 'daily', labelKh: 'របស់ប្រើប្រាស់', labelEn: 'Daily', icon: '🧼' },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nameKh.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>ធ្នើទំនិញក្នុងម៉ាត</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-sans">
                {filteredProducts.length} មុខ
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              ទំនិញស្រស់ៗ តម្លៃសមរម្យ បង់ជាប្រាក់ដុល្លារ ($) ឬប្រាក់រៀល (៛)
            </p>
          </div>

          {/* Actions: Add Product & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onAddNewProduct && (
              <button
                type="button"
                onClick={onAddNewProduct}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                title="បន្ថែមមុខទំនិញថ្មីចូលម៉ាត"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ ថែមទំនិញ</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="shelf-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ, បាកូដ..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.labelKh}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 overflow-y-auto max-h-[500px] lg:max-h-[540px]">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">រកមិនឃើញទំនិញដែលលោកអ្នកចង់បានទេ</p>
            <p className="text-xs text-slate-400 mt-1">សូមសាកល្បងវាយពាក្យគន្លឹះផ្សេង ឬសួរភ្នាក់ងារ AI</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const currentQty = cartProductQuantities[product.id] || 0;
              const isLowStock = product.stock <= 10;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all p-3 flex flex-col justify-between"
                >
                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shadow-2xs">
                      {product.badge}
                    </span>
                  )}

                  {/* Stock tag */}
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isOutOfStock ? 'អស់ស្តុក' : `សល់ ${product.stock}`}
                  </span>

                  {/* Product Visual */}
                  <div className="py-4 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    {product.emoji}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {product.nameKh}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 font-sans">
                      {product.nameEn}
                    </p>

                    {/* Pricing */}
                    <div className="pt-1 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-emerald-700 font-sans">
                        ${product.priceUsd.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-sans">
                        {product.priceKhr.toLocaleString()} ៛
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    {(onEditProduct || onDeleteProduct) && (
                      <div className="flex items-center justify-end gap-1 pt-1">
                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProduct(product);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-[11px] font-bold flex items-center gap-1 border border-slate-200 transition-colors"
                            title="កែប្រែទំនិញ"
                          >
                            <Pencil className="w-3 h-3 text-emerald-600" />
                            <span>កែ</span>
                          </button>
                        )}
                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProduct(product);
                            }}
                            className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold flex items-center gap-1 border border-rose-200 transition-colors"
                            title="លុបទំនិញនេះ"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>លុប</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    {currentQty > 0 ? (
                      <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-1 border border-emerald-200">
                        <button
                          onClick={() => {
                            onAddToCart(product, -1);
                            soundManager.playBeep();
                          }}
                          className="w-6 h-6 rounded-md bg-white text-emerald-800 flex items-center justify-center shadow-2xs hover:bg-emerald-100 active:scale-90 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-emerald-900 font-sans">
                          {currentQty}
                        </span>
                        <button
                          onClick={() => {
                            onAddToCart(product, 1);
                            soundManager.playBeep();
                          }}
                          disabled={currentQty >= product.stock}
                          className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs hover:bg-emerald-700 active:scale-90 transition-all disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onAddToCart(product, 1);
                          soundManager.playBeep();
                        }}
                        disabled={isOutOfStock}
                        className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-emerald-600 active:scale-98 disabled:opacity-30 disabled:hover:bg-slate-900 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ដាក់កន្ត្រក</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
