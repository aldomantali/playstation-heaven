import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TransaksiItem } from '../types';

interface CartContextType {
  cart: TransaksiItem[];
  addToCart: (item: TransaksiItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQty: (id: string, delta: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<TransaksiItem[]>([]);

  const addToCart = (item: TransaksiItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.tipe === 'produk');
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCart([]);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQty }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
