import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  Banknote, 
  Receipt, 
  Printer, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  PhoneCall
} from 'lucide-react';
import { CartItem, OrderReceipt } from '../types';
import { KHR_RATE } from '../data/products';
import { soundManager } from '../utils/audio';

interface CheckoutModalProps {
  cart: CartItem[];
  subtotalUsd: number;
  discountUsd: number;
  totalUsd: number;
  onClose: () => void;
  onOrderCompleted: (receipt: OrderReceipt) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  subtotalUsd,
  discountUsd,
  totalUsd,
  onClose,
  onOrderCompleted,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'KHQR' | 'CASH'>('KHQR');
  const [cashGivenStr, setCashGivenStr] = useState<string>('');
  const [completedReceipt, setCompletedReceipt] = useState<OrderReceipt | null>(null);

  const totalKhr = Math.round(totalUsd * KHR_RATE);

  const cashGivenNum = parseFloat(cashGivenStr) || 0;
  const changeUsd = Math.max(0, cashGivenNum - totalUsd);
  const changeKhr = Math.round(changeUsd * KHR_RATE);
  const isCashSufficient = paymentMethod === 'CASH' ? cashGivenNum >= totalUsd : true;

  const handleFinishPayment = () => {
    soundManager.playSuccess();
    const orderId = `SM-${Date.now().toString().slice(-6)}`;
    const receipt: OrderReceipt = {
      orderId,
      date: new Date().toLocaleString('km-KH'),
      items: cart.map((i) => ({
        productId: i.product.id,
        nameKh: i.product.nameKh,
        nameEn: i.product.nameEn,
        qty: i.quantity,
        priceUsd: i.product.priceUsd,
        subtotalUsd: i.product.priceUsd * i.quantity,
      })),
      subtotalUsd,
      discountUsd,
      taxUsd: 0,
      totalUsd,
      totalKhr,
      paymentMethod,
      cashGivenUsd: paymentMethod === 'CASH' ? cashGivenNum : undefined,
      changeUsd: paymentMethod === 'CASH' ? changeUsd : undefined,
      changeKhr: paymentMethod === 'CASH' ? changeKhr : undefined,
    };

    setCompletedReceipt(receipt);
    onOrderCompleted(receipt);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {completedReceipt ? 'វិក្កយបត្រទូទាត់ប្រាក់' : 'ការទូទាត់ប្រាក់ (Payment Checkout)'}
              </h3>
              <p className="text-xs text-slate-400">Smart Mart • ម៉ាតឆ្លាតវៃ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {completedReceipt ? (
            /* Printable Receipt View */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-1.5" />
                <h4 className="text-base font-bold text-emerald-900">
                  ការទូទាត់បានជោគជ័យ!
                </h4>
                <p className="text-xs text-emerald-700">
                  សូមអរគុណសម្រាប់ការគាំទ្រ Smart Mart!
                </p>
              </div>

              {/* Thermal Receipt Style Box */}
              <div
                id="printable-receipt"
                className="bg-slate-50 border border-slate-300 rounded-xl p-5 font-mono text-xs text-slate-800 space-y-3 shadow-inner"
              >
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h5 className="font-bold text-sm tracking-wider font-sans">
                    SMART MART 24/7 (ម៉ាតឆ្លាតវៃ)
                  </h5>
                  <p className="text-[11px] text-slate-500">Phnom Penh, Cambodia</p>
                  <p className="text-[11px] text-slate-500">
                    បេឡា / AI Cashier: សុវណ្ណលីតា (Smart Agent)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    លេខវិក្កយបត្រ: {completedReceipt.orderId}
                  </p>
                  <p className="text-[10px] text-slate-400">{completedReceipt.date}</p>
                </div>

                {/* Items */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                  {completedReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="font-sans pr-2">
                        <span className="font-semibold">{it.nameKh}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {it.qty} × ${it.priceUsd.toFixed(2)}
                        </div>
                      </div>
                      <span className="font-bold font-mono">
                        ${it.subtotalUsd.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 text-right">
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>តម្លៃសរុប (Subtotal):</span>
                    <span className="font-mono">${completedReceipt.subtotalUsd.toFixed(2)}</span>
                  </div>
                  {completedReceipt.discountUsd > 0 && (
                    <div className="flex justify-between text-emerald-700 font-sans">
                      <span>ចុះតម្លៃប្រូម៉ូសិន (Discount):</span>
                      <span className="font-mono">-${completedReceipt.discountUsd.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span className="font-sans">សរុប (Total USD):</span>
                    <span className="font-mono">${completedReceipt.totalUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-800">
                    <span className="font-sans">សរុបជាប្រាក់រៀល (KHR):</span>
                    <span className="font-mono">
                      {completedReceipt.totalKhr.toLocaleString()} ៛
                    </span>
                  </div>

                  {completedReceipt.paymentMethod === 'CASH' && (
                    <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                      <div className="flex justify-between text-slate-600 font-sans">
                        <span>ប្រាក់បានទទួល (Cash Paid):</span>
                        <span className="font-mono">
                          ${completedReceipt.cashGivenUsd?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 font-sans">
                        <span>ប្រាក់អាប់ជាដុល្លារ (Change USD):</span>
                        <span className="font-mono text-emerald-700">
                          ${completedReceipt.changeUsd?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-700 font-sans">
                        <span>ប្រាក់អាប់ជារៀល (Change KHR):</span>
                        <span className="font-mono text-emerald-800">
                          {completedReceipt.changeKhr?.toLocaleString()} ៛
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Barcode */}
                <div className="text-center pt-2 border-t border-dashed border-slate-300">
                  <p className="text-[10px] text-slate-500 font-sans">
                    វិធីទូទាត់៖ {completedReceipt.paymentMethod === 'KHQR' ? 'KHQR (Bakong)' : 'សាច់ប្រាក់សុទ្ធ'}
                  </p>
                  <div className="tracking-[0.25em] text-xs font-mono font-bold mt-1 text-slate-400">
                    |||| ||| ||||| |||| || |||||
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">
                    សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ព (Print)</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>ទិញបន្ត (Done)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Payment Selection & Input */
            <>
              {/* Amount Due Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">ទឹកប្រាក់សរុបត្រូវទូទាត់</span>
                  <div className="text-2xl font-black text-slate-900 font-sans">
                    ${totalUsd.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">ប្រាក់រៀល (Rate 4,100)</span>
                  <div className="text-lg font-bold text-emerald-700 font-sans">
                    {totalKhr.toLocaleString()} ៛
                  </div>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ជ្រើសរើសវិធីសាស្ត្រទូទាត់ (Payment Method)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* KHQR Button */}
                  <button
                    onClick={() => setPaymentMethod('KHQR')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      paymentMethod === 'KHQR'
                        ? 'border-rose-500 bg-rose-50/50 shadow-sm ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      KH
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">KHQR (Bakong)</div>
                      <div className="text-[11px] text-slate-500">ABA, Wing, ACLEDA...</div>
                    </div>
                  </button>

                  {/* Cash Button */}
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">សាច់ប្រាក់ (Cash)</div>
                      <div className="text-[11px] text-slate-500">ប្រាក់ដុល្លារ ឬរៀល</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* KHQR Content View */}
              {paymentMethod === 'KHQR' && (
                <div className="border border-rose-200 rounded-2xl p-5 bg-gradient-to-b from-rose-50/40 to-white text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs shadow-xs">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>KHQR • BAKONG PAYMENT</span>
                  </div>

                  {/* Simulated QR Code */}
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-center relative">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-slate-900"
                      fill="currentColor"
                    >
                      {/* Stylized QR Matrix */}
                      <rect x="5" y="5" width="25" height="25" rx="3" fill="#E11D48" />
                      <rect x="10" y="10" width="15" height="15" rx="2" fill="#FFFFFF" />
                      <rect x="14" y="14" width="7" height="7" rx="1" fill="#E11D48" />

                      <rect x="70" y="5" width="25" height="25" rx="3" fill="#E11D48" />
                      <rect x="75" y="10" width="15" height="15" rx="2" fill="#FFFFFF" />
                      <rect x="79" y="14" width="7" height="7" rx="1" fill="#E11D48" />

                      <rect x="5" y="70" width="25" height="25" rx="3" fill="#E11D48" />
                      <rect x="10" y="75" width="15" height="15" rx="2" fill="#FFFFFF" />
                      <rect x="14" y="79" width="7" height="7" rx="1" fill="#E11D48" />

                      <rect x="35" y="10" width="8" height="8" fill="#1E293B" />
                      <rect x="48" y="10" width="8" height="18" fill="#1E293B" />
                      <rect x="35" y="25" width="12" height="8" fill="#1E293B" />
                      <rect x="10" y="38" width="18" height="8" fill="#1E293B" />
                      <rect x="35" y="40" width="30" height="20" rx="3" fill="#0F172A" />
                      <rect x="72" y="38" width="16" height="8" fill="#1E293B" />
                      <rect x="35" y="65" width="10" height="25" fill="#1E293B" />
                      <rect x="50" y="68" width="25" height="10" fill="#1E293B" />
                      <rect x="80" y="68" width="12" height="25" fill="#1E293B" />
                      <rect x="55" y="82" width="15" height="10" fill="#1E293B" />
                    </svg>

                    {/* Central Bakong / KH Mart badge */}
                    <div className="absolute w-8 h-8 rounded-full bg-white border-2 border-rose-600 flex items-center justify-center font-bold text-[10px] text-rose-600 shadow-xs">
                      $
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      SMART MART CAMBODIA CO., LTD
                    </div>
                    <div className="text-xs text-slate-500">
                      ស្កេនតាមរយៈ ABA, Wing, ACLEDA, Sathapana, Canadia...
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Payment Options */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-4 border border-emerald-200 rounded-2xl p-4 bg-emerald-50/40">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      បញ្ចូលចំនួនប្រាក់បានទទួលជាដុល្លារ ($) (Cash Received):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-sans">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={cashGivenStr}
                        onChange={(e) => setCashGivenStr(e.target.value)}
                        placeholder={`ឧទាហរណ៍ ${Math.ceil(totalUsd)}`}
                        className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-sans font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick cash shortcut chips */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      ជ្រើសរើសក្រដាសប្រាក់រហ័ស៖
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        Math.ceil(totalUsd),
                        5,
                        10,
                        20,
                        50,
                        100,
                      ]
                        .filter((v, i, a) => v >= totalUsd && a.indexOf(v) === i)
                        .slice(0, 5)
                        .map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashGivenStr(amt.toString())}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold font-sans hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            ${amt}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Change Calculation */}
                  {cashGivenNum > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>ប្រាក់អាប់ជាដុល្លារ (Change USD):</span>
                        <span
                          className={`font-bold font-sans ${
                            cashGivenNum < totalUsd ? 'text-rose-600' : 'text-emerald-700 text-sm'
                          }`}
                        >
                          {cashGivenNum < totalUsd
                            ? `ខ្វះ $${(totalUsd - cashGivenNum).toFixed(2)}`
                            : `$${changeUsd.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ប្រាក់អាប់ជារៀល (Change KHR):</span>
                        <span className="font-bold font-sans text-emerald-800">
                          {changeKhr.toLocaleString()} ៛
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Payment Button */}
              <button
                id="checkout-complete-btn"
                onClick={handleFinishPayment}
                disabled={!isCashSufficient}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {paymentMethod === 'KHQR'
                    ? 'បញ្ជាក់ថាបានស្កេន និងទទួលប្រាក់រួច (Confirm KHQR)'
                    : 'បញ្ចប់ការគិតលុយ & ចេញវិក្កយបត្រ (Confirm Cash & Receipt)'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
