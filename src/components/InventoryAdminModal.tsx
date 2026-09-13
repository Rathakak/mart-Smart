import React, { useState } from 'react';
import { 
  X, 
  Boxes, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  PackageCheck,
  Search,
  Check,
  Pencil,
  Trash2,
  PlusCircle,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { Product, OrderReceipt } from '../types';
import { KHR_RATE } from '../data/products';
import { soundManager } from '../utils/audio';
import { TopSellingBarChart } from './TopSellingBarChart';

interface InventoryAdminModalProps {
  products: Product[];
  onRestock: (productId: string, amount: number) => void;
  orderHistory: OrderReceipt[];
  onClose: () => void;
  onAddNewProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onResetDefaultCatalog?: () => void;
}

export const InventoryAdminModal: React.FC<InventoryAdminModalProps> = ({
  products,
  onRestock,
  orderHistory,
  onClose,
  onAddNewProduct,
  onEditProduct,
  onDeleteProduct,
  onResetDefaultCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'orders'>('inventory');

  const filtered = products.filter(
    (p) =>
      p.nameKh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
  );

  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValuationUsd = products.reduce((sum, p) => sum + p.stock * p.priceUsd, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  const totalSalesUsd = orderHistory.reduce((sum, o) => sum + o.totalUsd, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">គ្រប់គ្រងស្តុក & ស្ថិតិម៉ាត (Mart Manager)</h3>
              <p className="text-xs text-slate-400">ត្រួតពិនិត្យទំនិញ បន្ថែមស្តុក គំនូសតាងលក់ដាច់ និងប្រវត្តិលក់</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">ទំនិញក្នុងស្តុកសរុប</span>
            <span className="text-lg font-black text-slate-900 font-sans">{totalStockCount} កំប៉ុង/កញ្ចប់</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">តម្លៃស្តុកសរុប</span>
            <span className="text-lg font-black text-emerald-700 font-sans">${totalValuationUsd.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">ការលក់សរុបថ្ងៃនេះ</span>
            <span className="text-lg font-black text-amber-700 font-sans">${totalSalesUsd.toFixed(2)}</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>បញ្ជីស្តុកទំនិញ ({products.length})</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-sans text-[10px]">
                {lowStockCount} ជិតអស់
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analytics'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>គំនូសតាងទំនិញលក់ដាច់ (Top Selling)</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>វិក្កយបត្រលក់ ({orderHistory.length})</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'inventory' ? (
            <>
              {/* Top Controls: Add product & Search */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ស្វែងរកតាមឈ្មោះ ឬបាកូដ..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onAddNewProduct && (
                    <button
                      type="button"
                      onClick={onAddNewProduct}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ ថែមមុខទំនិញថ្មី</span>
                    </button>
                  )}

                  {onResetDefaultCatalog && (
                    <button
                      type="button"
                      onClick={onResetDefaultCatalog}
                      title="កំណត់ទំនិញដើមវិញ (Default Catalog)"
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 border border-slate-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ស្តារដើម</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {filtered.map((product) => {
                  const isLow = product.stock <= 10;
                  return (
                    <div
                      key={product.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl p-1 bg-slate-50 rounded-lg shrink-0">
                          {product.emoji}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {product.nameKh}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-sans">
                            {product.nameEn} | Barcode: {product.barcode} | <span className="text-emerald-700 font-bold font-sans">${product.priceUsd.toFixed(2)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Stock Adjuster & Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                        <span
                          className={`text-xs font-bold font-sans px-2 py-0.5 rounded ${
                            isLow ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          សល់ {product.stock}
                        </span>

                        <button
                          onClick={() => {
                            onRestock(product.id, 10);
                            soundManager.playBeep();
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors"
                          title="បន្ថែមស្តុក ១០"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => {
                            onRestock(product.id, 25);
                            soundManager.playBeep();
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-colors"
                          title="បន្ថែមស្តុក ២៥"
                        >
                          +25
                        </button>

                        {/* Edit Button */}
                        {onEditProduct && (
                          <button
                            onClick={() => onEditProduct(product)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1"
                            title="កែប្រែព័ត៌មានទំនិញ"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                            <span>កែ</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        {onDeleteProduct && (
                          <button
                            onClick={() => onDeleteProduct(product)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1"
                            title="លុបទំនិញនេះ"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>លុប</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'analytics' ? (
            /* Analytics View with Recharts BarChart */
            <TopSellingBarChart orderHistory={orderHistory} products={products} />
          ) : (
            /* Orders View */
            <div className="space-y-3">
              {orderHistory.length > 0 && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-900 font-medium">
                    ចង់មើលការវិភាគទំនិញលក់ដាច់តាមគំនូសតាង Recharts ទេ?
                  </span>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>មើលគំនូសតាង</span>
                  </button>
                </div>
              )}

              {orderHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <p className="text-sm">មិនទាន់មានវិក្កយបត្រលក់នៅឡើយទេ</p>
                  <p className="text-xs text-slate-400">
                    សូមធ្វើការគិតលុយទំនិញក្នុងកន្ត្រក POS ដើម្បីកត់ត្រាវិក្កយបត្រ
                  </p>
                </div>
              ) : (
                orderHistory.map((order) => (
                  <div
                    key={order.orderId}
                    className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 font-mono">
                        #{order.orderId}
                      </span>
                      <span className="text-slate-400 text-[11px]">{order.date}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {order.items.map((it) => `${it.nameKh} (${it.qty})`).join(', ')}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                      <span className="font-medium text-slate-500">
                        វិធីទូទាត់: {order.paymentMethod}
                      </span>
                      <span className="font-bold text-emerald-700 font-sans">
                        ${order.totalUsd.toFixed(2)} ({order.totalKhr.toLocaleString()} ៛)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
