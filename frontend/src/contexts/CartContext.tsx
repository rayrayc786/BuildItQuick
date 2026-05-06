import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  images?: string[];
  category?: string;
  subCategory?: string;
  brand?: string;
  size?: string;
  productCode?: string;
  mrp: number;
  salePrice?: number;
  deliveryTime?: string;
  unitType: 'individual' | 'weight-based' | 'pack' | 'bundle';
  unitLabel: string;
  csiMasterFormat: string;
  weightPerUnit: number;
  volumePerUnit: number;
  imageUrl?: string;
  price: number;
  basePrice?: number;
  gstAmount?: number;
  discountRate?: number;
  productName?: string;
  avgRating?: number;
  numReviews?: number;
  description?: string;
  infoPara?: string;
  productId?: string;
  hsnCode?: string;
  subVariants?: {
    title: string;
    value: string;
  }[];
  variants?: {
    name: string;
    price: number;
    weight: number;
    volume: number;
    sku?: string;
    pricing?: {
      salePrice?: number;
      gst?: number;
      mrp?: number;
      basePrice?: number;
      gstAmount?: number;
      discountRate?: number;
    };
    inventory?: {
      unitWeight?: number;
      stock?: number;
    };
    unitWeightGm?: number;
    variantId?: string;
    meta?: {
      suppliedWith?: string;
    };
    measure?: {
      term?: string;
      value?: string;
      unit?: string;
    };
    logisticsCategory?: string;
  }[];
  bulkPricing?: { minQty: number, discount: number }[];
  logisticsCategory?: string;
}

export interface Offer {
  _id: string;
  title: string;
  description: string;
  discount: string;
  discountAmount: number;
  offerType: 'standard' | 'brand' | 'category' | 'product' | 'accumulated';
  minAmount: number;
  brandName?: string;
  categoryName?: string;
  freeDelivery: boolean;
  rewardItem?: string;
  validityDays?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string; // Name of the variant
}

export interface EnrichedCartItem {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  selectedVariant: string;
  variantAttributes: Record<string, string>;
  variantImage: string;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  lineTotalInclGST: number;
  lineBaseTotal: number;
  lineTaxTotal: number;
  basePrice: number;
  taxRate: number;
  totalWeight: number;
  totalVolume: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variantName?: string) => void;
  removeFromCart: (productId: string, variantName?: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalWeight: number;
  totalVolume: number;
  totalGst: number;
  maxLogisticsCategory: 'light' | 'medium' | 'heavy';
  vehicleClass: string;
  appliedDiscount: number;
  appliedOffers: string[];
  rewardItems: string[];
  isFreeDelivery: boolean;
  platformFee: number;
  deliveryCharge: number;
  deliveryChargeBreakup: {
    base: number;
    gst: number;
  } | null;
  grandTotal: number;
  totalSavings: number;
  totalBaseAmount: number;
  totalTaxAmount: number;
  splitPaymentAmount: number;
  partPaymentPercentage: number;
  enrichedItems: EnrichedCartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1, variantName?: string) => {
    if (product.deliveryTime === 'On Demand' && quantity > 0) {
      toast.error('This product is only available on demand. Please use Request on Demand.', {
        id: 'on-demand-error',
        duration: 3000
      });
      return;
    }

    if (quantity > 0) {
      toast.success(`${product.name} added to cart`, {
        id: 'cart-toast',
        position: 'bottom-center',
        duration: 2000
      });
    }
    setCart(prev => {
      const existing = prev.find(item => 
        String(item.product._id) === String(product._id) && item.selectedVariant === variantName
      );
      
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) {
          return prev.filter(item => !(String(item.product._id) === String(product._id) && item.selectedVariant === variantName));
        }
        return prev.map(item => 
          (String(item.product._id) === String(product._id) && item.selectedVariant === variantName)
            ? { ...item, quantity: newQty } 
            : item
        );
      }
      return [...prev, { product, quantity, selectedVariant: variantName }];
    });
  };

  const removeFromCart = (productId: string, variantName?: string) => {
    setCart(prev => prev.filter(item => !(String(item.product._id) === String(productId) && item.selectedVariant === variantName)));
  };

  const clearCart = () => setCart([]);

  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalWeight: 0,
    totalVolume: 0,
    totalGst: 0,
    maxLogisticsCategory: 'light' as 'light' | 'medium' | 'heavy',
    appliedDiscount: 0,
    appliedOffers: [] as string[],
    rewardItems: [] as string[],
    isFreeDelivery: false,
    vehicleClass: 'Bike',
    platformFee: 0,
    deliveryCharge: 0,
    deliveryChargeBreakup: null as { base: number; gst: number } | null,
    grandTotal: 0,
    totalSavings: 0,
    totalBaseAmount: 0,
    totalTaxAmount: 0,
    splitPaymentAmount: 0,
    partPaymentPercentage: 25,
    enrichedItems: [] as any[]
  });

  useEffect(() => {
    const fetchCartSummary = async () => {
      if (cart.length === 0) {
        setSummary({
          totalAmount: 0,
          totalWeight: 0,
          totalVolume: 0,
          totalGst: 0,
          maxLogisticsCategory: 'light',
          appliedDiscount: 0,
          appliedOffers: [],
          rewardItems: [],
          isFreeDelivery: false,
          vehicleClass: 'Bike',
          platformFee: 0,
          deliveryCharge: 0,
          deliveryChargeBreakup: null,
          grandTotal: 0,
          totalSavings: 0,
          totalBaseAmount: 0,
          totalTaxAmount: 0,
          splitPaymentAmount: 0,
          partPaymentPercentage: 25,
          enrichedItems: []
        });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/cart/calculate`, {
          items: cart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant
          }))
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data.success) {
          const s = res.data.data;
          setSummary({
            totalAmount: s.subTotal, // Use subTotal as totalAmount for gross display
            totalGst: s.totalTaxAmount,
            totalWeight: s.totalWeight,
            totalVolume: s.totalVolume,
            appliedDiscount: s.appliedDiscount,
            appliedOffers: s.appliedOffers,
            rewardItems: s.rewardItems,
            isFreeDelivery: s.deliveryCharge === 0,
            vehicleClass: s.vehicleClass || 'Bike',
            maxLogisticsCategory: s.vehicleClass?.toLowerCase() === 'truck' ? 'heavy' : 
                                  s.vehicleClass?.toLowerCase() === 'three wheeler' ? 'medium' : 'light',
            platformFee: s.platformFee,
            deliveryCharge: s.deliveryCharge,
            deliveryChargeBreakup: s.deliveryChargeBreakup || null,
            grandTotal: s.totalAmount,
            totalSavings: s.totalSavings,
            totalBaseAmount: s.totalBaseAmount,
            totalTaxAmount: s.totalTaxAmount,
            splitPaymentAmount: s.splitPaymentAmount,
            partPaymentPercentage: s.partPaymentPercentage,
            enrichedItems: s.mappedItems
          });
        }
      } catch (err) {
        console.error('Backend cart calculation failed:', err);
      }
    };

    fetchCartSummary();
  }, [cart]);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, clearCart, 
      totalAmount: summary.totalAmount,
      totalWeight: summary.totalWeight, 
      totalVolume: summary.totalVolume, 
      totalGst: summary.totalGst, 
      vehicleClass: summary.vehicleClass, 
      maxLogisticsCategory: summary.maxLogisticsCategory,
      appliedDiscount: summary.appliedDiscount, 
      appliedOffers: summary.appliedOffers, 
      rewardItems: summary.rewardItems, 
      isFreeDelivery: summary.isFreeDelivery,
      platformFee: summary.platformFee,
      deliveryCharge: summary.deliveryCharge,
      deliveryChargeBreakup: summary.deliveryChargeBreakup,
      grandTotal: summary.grandTotal,
      totalSavings: summary.totalSavings,
      totalBaseAmount: summary.totalBaseAmount,
      totalTaxAmount: summary.totalTaxAmount,
      splitPaymentAmount: summary.splitPaymentAmount,
      partPaymentPercentage: summary.partPaymentPercentage,
      enrichedItems: summary.enrichedItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
