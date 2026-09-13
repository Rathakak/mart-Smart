import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Product } from '../types';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900">
              តើលោកអ្នកចង់លុបទំនិញនេះមែនទេ?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              មុខទំនិញនេះនឹងត្រូវដកចេញពីបញ្ជីទំនិញលើធ្នើ និងពីប្រព័ន្ធ AI ម៉ាត។
            </p>
          </div>

          {/* Product Preview Card */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-left">
            <span className="text-3xl p-1 bg-white rounded-xl shadow-2xs">
              {product.emoji}
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {product.nameKh}
              </h4>
              <p className="text-[11px] text-slate-500 truncate font-sans">
                {product.nameEn}
              </p>
              <p className="text-xs font-bold text-emerald-700 font-sans mt-0.5">
                ${product.priceUsd.toFixed(2)} ({product.priceKhr.toLocaleString()} ៛)
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              onClick={() => {
                onConfirm(product.id);
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>យល់ព្រមលុប</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
