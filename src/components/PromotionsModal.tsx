import React from 'react';
import { X, BadgePercent, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { MartPromotion, Product } from '../types';
import { MART_PROMOTIONS } from '../data/products';
import { soundManager } from '../utils/audio';

interface PromotionsModalProps {
  onClose: () => void;
  onApplyPromo: (code: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  products: Product[];
}

export const PromotionsModal: React.FC<PromotionsModalProps> = ({
  onClose,
  onApplyPromo,
  onAddToCart,
  products,
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleApply = (promo: MartPromotion) => {
    onApplyPromo(promo.promoCode);
    soundManager.playSuccess();
    setCopiedCode(promo.promoCode);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleAddBreakfastCombo = () => {
    const coffee = products.find((p) => p.id === 'p-cof-01');
    const croissant = products.find((p) => p.id === 'p-cof-03');
    if (coffee) onAddToCart(coffee, 1);
    if (croissant) onAddToCart(croissant, 1);
    onApplyPromo('MORNING50');
    soundManager.playSuccess();
    onClose();
  };

  const handleAddLateNightCombo = () => {
    const noodle = products.find((p) => p.id === 'p-food-01');
    const coke = products.find((p) => p.id === 'p-bev-01');
    if (noodle) onAddToCart(noodle, 1);
    if (coke) onAddToCart(coke, 1);
    onApplyPromo('NIGHT10');
    soundManager.playSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center border border-white/30">
              <BadgePercent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">ប្រូម៉ូសិនពិសេសប្រចាំថ្ងៃ</h3>
              <p className="text-xs text-amber-100">Smart Mart Deals & Combos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {MART_PROMOTIONS.map((promo) => (
            <div
              key={promo.id}
              className="p-4 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 to-orange-50/30 hover:border-amber-400 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{promo.emoji}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {promo.titleKh}
                    </h4>
                    <p className="text-xs text-slate-500 font-sans font-medium">
                      {promo.titleEn}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-1 rounded-lg bg-rose-500 text-white font-black text-xs font-sans">
                  -{promo.discountPercent}%
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {promo.descKh}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-md border border-amber-300">
                  <span>កូដ: {promo.promoCode}</span>
                </div>

                {promo.id === 'promo-1' ? (
                  <button
                    onClick={handleAddBreakfastCombo}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>ទិញកញ្ចប់នេះ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : promo.id === 'promo-3' ? (
                  <button
                    onClick={handleAddLateNightCombo}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>ទិញកញ្ចប់នេះ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(promo)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    {copiedCode === promo.promoCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>បានអនុវត្ត!</span>
                      </>
                    ) : (
                      <span>ប្រើប្រូម៉ូសិននេះ</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
