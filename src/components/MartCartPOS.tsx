import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Sparkles, 
  Tag, 
  Check, 
  Coins, 
  Receipt,
  ArrowRight
} from 'lucide-react';
import { CartItem } from '../types';
import { KHR_RATE } from '../data/products';
import { soundManager } from '../utils/audio';

interface MartCartPOSProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  promoDiscountPercent: number;
  promoCodeApplied: string;
  onApplyPromo: (code: string) => boolean;
}

export const MartCartPOS: React.FC<MartCartPOSProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  promoDiscountPercent,
  promoCodeApplied,
  onApplyPromo,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ text: string; success: boolean } | null>(null);

  const subtotalUsd = cart.reduce(
    (acc, item) => acc + item.product.priceUsd * item.quantity,
    0
  );

  const discountUsd = (subtotalUsd * promoDiscountPercent) / 100;
  const totalUsd = Math.max(0, subtotalUsd - discountUsd);
  const totalKhr = Math.round(totalUsd * KHR_RATE);

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const ok = onApplyPromo(promoInput.trim().toUpperCase());
    if (ok) {
      setPromoMsg({ text: `បានអនុវត្តកូដ "${promoInput.toUpperCase()}" ជោគជ័យ!`, success: true });
      soundManager.playBeep();
      setPromoInput('');
    } else {
      setPromoMsg({ text: 'កូដមិនត្រឹមត្រូវ ឬផុតកំណត់!', success: false });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* POS Top Header */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">បញ្ជរគិតលុយ (POS Cart)</h3>
            <p className="text-[11px] text-slate-400">
              សរុប {totalItemsCount} មុខទំនិញ
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('តើលោកអ្នកចង់សម្អាតកន្ត្រកទាំងអស់ឬ?')) {
                onClearCart();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
            title="សម្អាតកន្ត្រក"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">សម្អាត</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 text-slate-300 stroke-1 mb-2" />
            <p className="text-sm font-medium text-slate-600">កន្ត្រកនៅទទេ</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              ជ្រើសរើសទំនិញពីធ្នើ ឬប្រាប់ភ្នាក់ងារ AI ដើម្បីដាក់ចូលកន្ត្រក
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const itemSubtotal = item.product.priceUsd * item.quantity;
            return (
              <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl p-1 bg-slate-50 rounded-lg border border-slate-200/60 shrink-0">
                    {item.product.emoji}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.nameKh}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-sans">
                      <span>${item.product.priceUsd.toFixed(2)}</span>
                      <span>×</span>
                      <span className="font-semibold text-slate-700">{item.quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Right Quantity Control & Item Total */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900 font-sans">
                      ${itemSubtotal.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {Math.round(itemSubtotal * KHR_RATE).toLocaleString()} ៛
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-xs shadow-2xs"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-slate-800 font-sans">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center text-xs shadow-2xs disabled:opacity-30"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Promo Code Box */}
      <div className="p-3 bg-slate-50 border-t border-slate-200/80">
        <form onSubmit={handleApplyPromoCode} className="flex gap-1.5">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="បញ្ចូលកូដប្រូម៉ូសិន (ឧ. MART10)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 uppercase"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium transition-colors"
          >
            ប្រើកូដ
          </button>
        </form>

        {promoMsg && (
          <p
            className={`text-[11px] mt-1.5 font-medium ${
              promoMsg.success ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {promoMsg.text}
          </p>
        )}

        {promoCodeApplied && (
          <div className="mt-1.5 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            <span className="flex items-center gap-1 font-semibold">
              <Tag className="w-3 h-3" /> កូដ៖ {promoCodeApplied} (-{promoDiscountPercent}%)
            </span>
            <span className="font-sans font-bold">-${discountUsd.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Bill Calculation & Checkout Button */}
      <div className="p-4 bg-white border-t border-slate-200/80 space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>តម្លៃសរុប (Subtotal):</span>
          <span className="font-sans font-semibold text-slate-800">${subtotalUsd.toFixed(2)}</span>
        </div>

        {discountUsd > 0 && (
          <div className="flex justify-between text-xs text-emerald-600 font-semibold">
            <span>បញ្ចុះតម្លៃប្រូម៉ូសិន:</span>
            <span className="font-sans">-${discountUsd.toFixed(2)}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ប្រាក់ត្រូវបង់ (Total Due)
            </div>
            <div className="text-xs text-slate-500 font-sans">
              (អត្រា 1$ = 4,100៛)
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-emerald-700 font-sans tracking-tight">
              ${totalUsd.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-slate-600 font-sans">
              {totalKhr.toLocaleString()} ៛
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          id="cart-checkout-btn"
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>គិតលុយឥឡូវនេះ (Checkout)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
