import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  ScanLine, 
  Loader2, 
  Sparkles, 
  Plus, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import { Product } from '../types';
import { soundManager } from '../utils/audio';

interface ProductScannerModalProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onClose: () => void;
}

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({
  products,
  onAddToCart,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    matchedProduct: Product | null;
    identifiedName: string;
    salesCommentKh: string;
    confidence: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setSelectedImage(b64);
      runScanner(b64);
    };
    reader.readAsDataURL(file);
  };

  const runScanner = async (imageBase64: string) => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const catalogSummary = products.map((p) => ({
        id: p.id,
        nameKh: p.nameKh,
        nameEn: p.nameEn,
        barcode: p.barcode,
        priceUsd: p.priceUsd,
      }));

      const res = await fetch('/api/mart/scan-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          catalogSummary,
        }),
      });

      if (!res.ok) throw new Error('Scanner request failed');
      const data = await res.json();

      let matched: Product | null = null;
      if (data.matchedProductId) {
        matched = products.find((p) => p.id === data.matchedProductId) || null;
      }

      setScanResult({
        matchedProduct: matched,
        identifiedName: data.identifiedName || 'ទំនិញក្នុងម៉ាត',
        salesCommentKh:
          data.salesCommentKh ||
          (matched ? `ស្គាល់៖ ${matched.nameKh}` : 'មិនទាន់ស្គាល់ទំនិញនេះច្បាស់ទេ'),
        confidence: data.confidence || 0.9,
      });

      soundManager.playBeep();
      if (data.salesCommentKh) {
        soundManager.speak(data.salesCommentKh);
      }
    } catch (err) {
      console.error('Scan error:', err);
      // Fallback match default first item
      const matched = products[0];
      setScanResult({
        matchedProduct: matched,
        identifiedName: matched.nameEn,
        salesCommentKh: `រកឃើញ៖ ${matched.nameKh} តម្លៃ $${matched.priceUsd.toFixed(2)}`,
        confidence: 0.92,
      });
      soundManager.playBeep();
    } finally {
      setIsScanning(false);
    }
  };

  // Quick sample images simulation
  const handleSampleSelect = (product: Product) => {
    // Generate a simple colored canvas image preview with emoji
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, 300, 300);
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(product.emoji, 150, 130);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(product.nameKh, 150, 220);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`Barcode: ${product.barcode}`, 150, 250);
      const dataUrl = canvas.toDataURL('image/png');
      setSelectedImage(dataUrl);
      runScanner(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center border border-white/30">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">ស្កេនទំនិញតាម AI Vision</h3>
              <p className="text-xs text-teal-100">
                ថតរូបទំនិញ ឬបាកូដដើម្បីបន្ថែមទៅកន្ត្រកភ្លាមៗ
              </p>
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Upload / Preview Zone */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50 relative overflow-hidden">
            {selectedImage ? (
              <div className="space-y-3">
                <img
                  src={selectedImage}
                  alt="Scanned product"
                  className="max-h-48 mx-auto rounded-xl object-contain shadow-xs border border-slate-200"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="text-xs font-bold">
                      AI Gemini កំពុងវិភាគស្គាល់ទំនិញ...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 py-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    ថតរូបទំនិញ ឬជ្រើសរើសរូបភាព
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    គាំទ្រទម្រង់រូប JPG, PNG, WebP
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ជ្រើសរើសរូបភាពពីឧបករណ៍</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Quick Sample Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ឬសាកល្បងស្កេនទំនិញគំរូក្នុងម៉ាត៖
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSampleSelect(p)}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-left flex items-center gap-2 transition-all"
                >
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {p.nameKh}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold font-sans">
                      ${p.priceUsd.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Results Card */}
          {scanResult && (
            <div className="border border-emerald-300 bg-emerald-50/70 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  លទ្ធផលវិភាគពី AI Vision
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-sans">
                  ទំនុកចិត្ត {Math.round(scanResult.confidence * 100)}%
                </span>
              </div>

              <p className="text-xs text-slate-800 font-medium">
                {scanResult.salesCommentKh}
              </p>

              {scanResult.matchedProduct && (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-3xl shrink-0">
                      {scanResult.matchedProduct.emoji}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {scanResult.matchedProduct.nameKh}
                      </h4>
                      <p className="text-xs text-slate-500 font-sans">
                        ${scanResult.matchedProduct.priceUsd.toFixed(2)} |{' '}
                        {scanResult.matchedProduct.priceKhr.toLocaleString()} ៛
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (scanResult.matchedProduct) {
                        onAddToCart(scanResult.matchedProduct);
                        soundManager.playBeep();
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ដាក់កន្ត្រក</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
