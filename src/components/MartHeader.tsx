import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Sparkles, 
  ScanLine, 
  Volume2, 
  VolumeX, 
  Boxes, 
  ShoppingCart, 
  Clock, 
  Coins,
  BadgePercent
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface MartHeaderProps {
  cartCount: number;
  totalUsd: number;
  onOpenScanner: () => void;
  onOpenAdmin: () => void;
  onOpenPromos: () => void;
  onToggleCart: () => void;
  isCartOpen: boolean;
}

export const MartHeader: React.FC<MartHeaderProps> = ({
  cartCount,
  totalUsd,
  onOpenScanner,
  onOpenAdmin,
  onOpenPromos,
  onToggleCart,
  isCartOpen,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('km-KH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundOn(next);
    if (next) soundManager.playBeep();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & AI Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>ម៉ាតឆ្លាតវៃ</span>
                <span className="text-emerald-600 font-extrabold text-sm sm:text-base font-sans">SMART MART</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                AI Agent Active
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              សុវណ្ណលីតា • ភ្នាក់ងារ AI ជួយលក់ទំនិញ ណែនាំផលិតផល និងគិតលុយ ២៤/៧
            </p>
          </div>
        </div>

        {/* Currency Rate & Time info */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>អត្រាប្តូរប្រាក់៖</span>
            <strong className="text-slate-900">$1 = 4,100 ៛</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-300"></div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeStr || 'ម៉ោងក្នុងម៉ាត'}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {/* Promos Button */}
          <button
            id="header-promos-btn"
            onClick={onOpenPromos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            title="ប្រូម៉ូសិនពិសេស"
          >
            <BadgePercent className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">ប្រូម៉ូសិន</span>
          </button>

          {/* Barcode / Camera Vision Scanner */}
          <button
            id="header-scanner-btn"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
            title="ស្កេនទំនិញ ឬបាកូដ"
          >
            <ScanLine className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">ស្កេនទំនិញ</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="header-sound-btn"
            onClick={handleToggleSound}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title={soundOn ? 'បិទសំឡេង (Mute)' : 'បើកសំឡេង (Sound On)'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Inventory Admin Button */}
          <button
            id="header-admin-btn"
            onClick={onOpenAdmin}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="គ្រប់គ្រងស្តុកទំនិញ (Inventory Admin)"
          >
            <Boxes className="w-4 h-4" />
          </button>

          {/* Cart Trigger */}
          <button
            id="header-cart-toggle-btn"
            onClick={onToggleCart}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-xs transition-all ${
              isCartOpen
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline font-sans font-semibold">${totalUsd.toFixed(2)}</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 -mr-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center justify-center font-sans">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
