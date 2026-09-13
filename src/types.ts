export type ProductCategory = 
  | 'all'
  | 'beverage' 
  | 'fastfood' 
  | 'snack' 
  | 'coffee' 
  | 'icecream' 
  | 'daily';

export interface Product {
  id: string;
  nameKh: string;
  nameEn: string;
  category: Exclude<ProductCategory, 'all'>;
  categoryKh: string;
  priceUsd: number;
  priceKhr: number;
  stock: number;
  barcode: string;
  emoji: string;
  badge?: string;
  descriptionKh: string;
  descriptionEn: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  action?: {
    type: 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'RECOMMEND' | 'APPLY_PROMO' | 'CHECKOUT';
    items?: { productId: string; quantity: number }[];
    promoCode?: string;
    discountPercent?: number;
  };
  recommendedProductIds?: string[];
  suggestedReplies?: string[];
}

export interface OrderReceipt {
  orderId: string;
  date: string;
  items: {
    productId: string;
    nameKh: string;
    nameEn: string;
    qty: number;
    priceUsd: number;
    subtotalUsd: number;
  }[];
  subtotalUsd: number;
  discountUsd: number;
  taxUsd: number;
  totalUsd: number;
  totalKhr: number;
  paymentMethod: 'KHQR' | 'CASH';
  cashGivenUsd?: number;
  changeUsd?: number;
  changeKhr?: number;
}

export interface MartPromotion {
  id: string;
  titleKh: string;
  titleEn: string;
  descKh: string;
  promoCode: string;
  discountPercent: number;
  emoji: string;
}
