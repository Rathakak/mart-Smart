import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Barcode, Sparkles, AlertCircle, Tag, Package } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { KHR_RATE } from '../data/products';
import { soundManager } from '../utils/audio';

interface ProductFormModalProps {
  initialProduct?: Product | null; // null means Add New
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const CATEGORY_OPTIONS: { id: Exclude<ProductCategory, 'all'>; labelKh: string; labelEn: string; icon: string }[] = [
  { id: 'beverage', labelKh: 'ភេសជ្ជៈ', labelEn: 'Beverage', icon: '🥤' },
  { id: 'fastfood', labelKh: 'អាហាររហ័ស', labelEn: 'Fast Food', icon: '🍜' },
  { id: 'snack', labelKh: 'អាហារសម្រន់', labelEn: 'Snacks', icon: '🥔' },
  { id: 'coffee', labelKh: 'កាហ្វេ & នំ', labelEn: 'Coffee & Bakery', icon: '☕' },
  { id: 'icecream', labelKh: 'ការ៉េម', labelEn: 'Ice Cream', icon: '🍦' },
  { id: 'daily', labelKh: 'របស់ប្រើប្រាស់', labelEn: 'Daily Goods', icon: '🧼' },
];

const EMOJI_PRESETS = [
  '🥤', '🧃', '☕', '⚡', '🦅', '🍜', '🥪', '🥖', '🌭', '🍕',
  '🥔', '🥜', '🍿', '🍦', '🍫', '🍬', '🧼', '💊', '🧴', '🧻'
];

const BADGE_PRESETS = [
  { label: 'គ្មានស្លាក', value: '' },
  { label: '🇰🇭 ផលិតផលខ្មែរ', value: 'ផលិតផលខ្មែរ (Khmer Product)' },
  { label: '🔥 ពេញនិយម', value: 'ពេញនិយម (Popular)' },
  { label: '✨ មុខទំនិញថ្មី', value: 'ទំនិញថ្មី (New)' },
  { label: '🏷️ ប្រូម៉ូសិនពិសេស', value: 'ប្រូម៉ូសិនពិសេស' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialProduct,
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = !!initialProduct;

  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<Exclude<ProductCategory, 'all'>>('beverage');
  const [priceUsd, setPriceUsd] = useState<number>(1.0);
  const [stock, setStock] = useState<number>(30);
  const [barcode, setBarcode] = useState('');
  const [emoji, setEmoji] = useState('🥤');
  const [badge, setBadge] = useState('');
  const [descriptionKh, setDescriptionKh] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate data when editing or opening
  useEffect(() => {
    if (initialProduct) {
      setNameKh(initialProduct.nameKh || '');
      setNameEn(initialProduct.nameEn || '');
      setCategory(initialProduct.category || 'beverage');
      setPriceUsd(initialProduct.priceUsd || 1.0);
      setStock(initialProduct.stock ?? 30);
      setBarcode(initialProduct.barcode || '');
      setEmoji(initialProduct.emoji || '🥤');
      setBadge(initialProduct.badge || '');
      setDescriptionKh(initialProduct.descriptionKh || '');
      setDescriptionEn(initialProduct.descriptionEn || '');
      setTagsInput(initialProduct.tags?.join(', ') || '');
    } else {
      // New product defaults
      setNameKh('');
      setNameEn('');
      setCategory('beverage');
      setPriceUsd(0.75);
      setStock(25);
      // Generate Cambodian barcode 884...
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      setBarcode(`884012${randomSuffix}`);
      setEmoji('🥤');
      setBadge('ផលិតផលខ្មែរ (Khmer Product)');
      setDescriptionKh('');
      setDescriptionEn('');
      setTagsInput('ភេសជ្ជៈ, ត្រជាក់, ផលិតផលខ្មែរ');
    }
    setErrorMessage('');
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`884012${randomSuffix}`);
    soundManager.playBeep();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameKh.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះទំនិញជាភាសាខ្មែរ!');
      return;
    }

    if (!barcode.trim()) {
      setErrorMessage('សូមបញ្ចូលលេខកូដបាកូដទំនិញ!');
      return;
    }

    if (priceUsd <= 0) {
      setErrorMessage('តម្លៃទំនិញត្រូវតែធំជាង ០ ដុល្លារ!');
      return;
    }

    const selectedCategoryObj = CATEGORY_OPTIONS.find((c) => c.id === category);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Auto-add key words to tags
    if (nameKh && !parsedTags.includes(nameKh.toLowerCase())) {
      parsedTags.push(nameKh.toLowerCase());
    }

    const newOrUpdatedProduct: Product = {
      id: initialProduct ? initialProduct.id : `p-custom-${Date.now()}`,
      nameKh: nameKh.trim(),
      nameEn: nameEn.trim() || nameKh.trim(),
      category,
      categoryKh: selectedCategoryObj?.labelKh || 'ទំនិញទូទៅ',
      priceUsd: parseFloat(priceUsd.toFixed(2)),
      priceKhr: Math.round(priceUsd * KHR_RATE),
      stock: Math.max(0, Math.floor(stock)),
      barcode: barcode.trim(),
      emoji: emoji.trim() || '📦',
      badge: badge.trim() ? badge.trim() : undefined,
      descriptionKh: descriptionKh.trim() || `ទំនិញគុណភាពខ្ពស់ ${nameKh}`,
      descriptionEn: descriptionEn.trim() || `High quality item ${nameEn || nameKh}`,
      tags: parsedTags,
    };

    onSave(newOrUpdatedProduct);
    soundManager.playSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              {isEditing ? <Package className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEditing ? 'កែប្រែព័ត៌មានមុខទំនិញ (Edit Product)' : 'ថែមមុខទំនិញថ្មីចូលម៉ាត (Add Product)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'កែប្រែតម្លៃ ចំនួនស្តុក ឬព័ត៌មានលម្អិត' : 'បញ្ចូលទំនិញថ្មីចូលធ្នើ និងប្រព័ន្ធ AI ម៉ាត'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ឈ្មោះទំនិញ (ភាសាខ្មែរ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nameKh}
                onChange={(e) => setNameKh(e.target.value)}
                placeholder="ឧ. ទឹកក្រូចអាយស៍ (IZE Cola)..."
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ឈ្មោះជាភាសាអង់គ្លេស (English Name)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. IZE Cola Can (330ml)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          {/* Category & Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                ប្រភេទមុខទំនិញ (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.labelKh} ({cat.labelEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                រូបតំណាង Emoji
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={4}
                  className="w-14 text-center text-xl py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400">ជ្រើសរើសខាងក្រោម</span>
              </div>
            </div>
          </div>

          {/* Emoji Preset Quick Picks */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
              រើស Emoji រហ័ស៖
            </span>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
              {EMOJI_PRESETS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setEmoji(icon)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-base transition-all hover:bg-white hover:shadow-2xs ${
                    emoji === icon ? 'bg-emerald-100 border border-emerald-400 scale-110' : ''
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Price ($ USD and computed KHR) & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                តម្លៃដុល្លារ ($ USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                = {Math.round(priceUsd * KHR_RATE).toLocaleString()} ៛ (អត្រា {KHR_RATE.toLocaleString()})
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ចំនួនស្តុក (Stock Qty)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                លេខកូដបាកូដ (Barcode)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="884..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  title="បង្កើតកូដកម្ពុជា 884..."
                  className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 shrink-0 text-[10px] font-bold"
                >
                  កូដ 884
                </button>
              </div>
            </div>
          </div>

          {/* Badge Presets */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ស្លាកពិសេស (Badge Tag)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BADGE_PRESETS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setBadge(b.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    badge === b.value
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags for Search & AI */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ពាក្យគន្លឹះស្វែងរក & AI ណែនាំ (Tags)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ញែកគ្នាដោយក្បៀស (ឧ. ភេសជ្ជៈ, ត្រជាក់, ឆ្ងាញ់, ខ្មែរ)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'រក្សាទុកការកែប្រែ' : 'ថែមមុខទំនិញថ្មី'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
