/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MartHeader } from './components/MartHeader';
import { AIAgentSalesPanel } from './components/AIAgentSalesPanel';
import { MartCatalogShelf } from './components/MartCatalogShelf';
import { MartCartPOS } from './components/MartCartPOS';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductScannerModal } from './components/ProductScannerModal';
import { InventoryAdminModal } from './components/InventoryAdminModal';
import { PromotionsModal } from './components/PromotionsModal';
import { ProductFormModal } from './components/ProductFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { INITIAL_PRODUCTS, MART_PROMOTIONS, KHR_RATE } from './data/products';
import { DEFAULT_ORDER_HISTORY } from './data/orders';
import { Product, CartItem, OrderReceipt } from './types';
import { soundManager } from './utils/audio';
import { 
  Bot, 
  Store, 
  ShoppingCart, 
  Sparkles, 
  X, 
  Check, 
  BellRing 
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('smart_mart_products_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading products from local storage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('smart_mart_products_v1', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to persist products:', e);
    }
  }, [products]);

  const [cart, setCart] = useState<CartItem[]>([
    // Preload with popular item as initial example
    { product: INITIAL_PRODUCTS[0], quantity: 1 },
    { product: INITIAL_PRODUCTS[6], quantity: 1 },
  ]);
  const [promoCodeApplied, setPromoCodeApplied] = useState<string>('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isPromosOpen, setIsPromosOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Product CRUD states (Add, Edit, Delete)
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Completed orders archive
  const [orderHistory, setOrderHistory] = useState<OrderReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('smart_mart_orders_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading order history from local storage:', e);
    }
    return DEFAULT_ORDER_HISTORY;
  });

  // Sync order history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('smart_mart_orders_v1', JSON.stringify(orderHistory));
    } catch (e) {
      console.error('Failed to persist order history:', e);
    }
  }, [orderHistory]);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => {
      setNotification((curr) => (curr === text ? null : curr));
    }, 3000);
  };

  // Cart Quantities map for quick shelf lookup
  const cartProductQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((it) => {
      map[it.product.id] = it.quantity;
    });
    return map;
  }, [cart]);

  // Calculations
  const subtotalUsd = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0);
  }, [cart]);

  const discountUsd = (subtotalUsd * promoDiscountPercent) / 100;
  const totalUsd = Math.max(0, subtotalUsd - discountUsd);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add / Increment product
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const newQty = prevCart[existingIndex].quantity + quantity;
        if (newQty <= 0) {
          return prevCart.filter((i) => i.product.id !== product.id);
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, product.stock),
        };
        return updated;
      } else {
        if (quantity > 0) {
          return [...prevCart, { product, quantity: Math.min(quantity, product.stock) }];
        }
        return prevCart;
      }
    });

    if (quantity > 0) {
      showNotification(`បានបន្ថែម "${product.nameKh}" ទៅក្នុងកន្ត្រក`);
    }
  };

  // Update quantity delta
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    soundManager.playBeep();
    handleAddToCart(product, delta);
  };

  // Remove item completely
  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    soundManager.playBeep();
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setPromoCodeApplied('');
    setPromoDiscountPercent(0);
  };

  // Apply promo code
  const handleApplyPromo = (code: string): boolean => {
    const matched = MART_PROMOTIONS.find(
      (p) => p.promoCode.toUpperCase() === code.toUpperCase()
    );
    if (matched) {
      setPromoCodeApplied(matched.promoCode);
      setPromoDiscountPercent(matched.discountPercent);
      showNotification(`បានអនុវត្តប្រូម៉ូសិន "${matched.titleKh}" (-${matched.discountPercent}%)`);
      return true;
    }
    return false;
  };

  // Order finalized
  const handleOrderCompleted = (receipt: OrderReceipt) => {
    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const orderedItem = receipt.items.find((i) => i.productId === p.id);
        if (orderedItem) {
          return { ...p, stock: Math.max(0, p.stock - orderedItem.qty) };
        }
        return p;
      })
    );

    // Save order
    setOrderHistory((prev) => [receipt, ...prev]);

    // Clear cart
    setCart([]);
    setPromoCodeApplied('');
    setPromoDiscountPercent(0);
    setIsMobileCartOpen(false);
  };

  // Restock from admin modal
  const handleRestock = (productId: string, amount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + amount } : p))
    );
    showNotification(`បានបន្ថែមស្តុក +${amount} រួចរាល់`);
  };

  // Product CRUD Handlers (Add, Edit, Delete)
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleOpenDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleSaveProduct = (savedProduct: Product) => {
    if (editingProduct) {
      // Update existing
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      );
      // Also update in cart if present
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === savedProduct.id
            ? { ...item, product: savedProduct }
            : item
        )
      );
      showNotification(`បានកែប្រែទំនិញ "${savedProduct.nameKh}" ដោយជោគជ័យ`);
    } else {
      // Add new
      setProducts((prev) => [savedProduct, ...prev]);
      showNotification(`បានបន្ថែមទំនិញ "${savedProduct.nameKh}" ទៅក្នុងម៉ាត`);
    }
  };

  const handleConfirmDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    soundManager.playBeep();
    if (target) {
      showNotification(`បានលុបទំនិញ "${target.nameKh}" ចេញពីម៉ាត`);
    }
  };

  const handleResetDefaultCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    try {
      localStorage.removeItem('smart_mart_products_v1');
    } catch (e) {
      console.error(e);
    }
    soundManager.playSuccess();
    showNotification('បានកំណត់បញ្ជីទំនិញដើមវិញរួចរាល់');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Kantumruy_Pro',sans-serif]">
      {/* App Header */}
      <MartHeader
        cartCount={totalItemsCount}
        totalUsd={totalUsd}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPromos={() => setIsPromosOpen(true)}
        onToggleCart={() => setIsMobileCartOpen(!isMobileCartOpen)}
        isCartOpen={isMobileCartOpen}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: AI Agent Sales Assistant (5 Cols) */}
          <div className="lg:col-span-5 w-full">
            <AIAgentSalesPanel
              products={products}
              onAddToCart={handleAddToCart}
              onApplyPromo={handleApplyPromo}
              onOpenScanner={() => setIsScannerOpen(true)}
              cartSummary={cart.map((c) => ({
                nameKh: c.product.nameKh,
                quantity: c.quantity,
              }))}
            />
          </div>

          {/* Middle Column: Mart Shelves & Catalog (4 Cols) */}
          <div className="lg:col-span-4 w-full">
            <MartCatalogShelf
              products={products}
              onAddToCart={handleAddToCart}
              cartProductQuantities={cartProductQuantities}
              onAddNewProduct={handleOpenAddProduct}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleOpenDeleteProduct}
            />
          </div>

          {/* Right Column: POS Cashier & Cart (3 Cols desktop, or floating drawer on mobile) */}
          <div className="hidden lg:block lg:col-span-3 h-[580px] lg:h-[620px] sticky top-20">
            <MartCartPOS
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={() => setIsCheckoutOpen(true)}
              promoDiscountPercent={promoDiscountPercent}
              promoCodeApplied={promoCodeApplied}
              onApplyPromo={handleApplyPromo}
            />
          </div>
        </div>
      </main>

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-white flex flex-col shadow-2xl relative">
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
            <MartCartPOS
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={() => {
                setIsMobileCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              promoDiscountPercent={promoDiscountPercent}
              promoCodeApplied={promoCodeApplied}
              onApplyPromo={handleApplyPromo}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          subtotalUsd={subtotalUsd}
          discountUsd={discountUsd}
          totalUsd={totalUsd}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {isScannerOpen && (
        <ProductScannerModal
          products={products}
          onAddToCart={handleAddToCart}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isAdminOpen && (
        <InventoryAdminModal
          products={products}
          onRestock={handleRestock}
          orderHistory={orderHistory}
          onClose={() => setIsAdminOpen(false)}
          onAddNewProduct={handleOpenAddProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={handleOpenDeleteProduct}
          onResetDefaultCatalog={handleResetDefaultCatalog}
        />
      )}

      {isPromosOpen && (
        <PromotionsModal
          onClose={() => setIsPromosOpen(false)}
          onApplyPromo={handleApplyPromo}
          onAddToCart={handleAddToCart}
          products={products}
        />
      )}

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        initialProduct={editingProduct}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDeleteProduct}
      />
    </div>
  );
}
