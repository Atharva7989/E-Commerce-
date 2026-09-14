"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
};

type Cart = {
  id: string;
  items: CartItem[];
  subtotal: number;
};

type CartContextType = {
  cart: Cart | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  loadCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCart = async () => {
    const res = await fetch('http://localhost:3001/cart', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      const subtotal = data.items.reduce((sum: number, i: CartItem) => sum + i.product.price * i.quantity, 0);
      setCart({ ...data, subtotal });
    }
  };

  // Listen for custom event to open cart modal
  useEffect(() => {
    const handler = () => openCart();
    window.addEventListener('open-cart', handler);
    return () => window.removeEventListener('open-cart', handler);
  }, []);

  // Fetch cart on component mount
  useEffect(() => {
    fetchCart().catch(console.error);
  }, []);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const loadCart = async () => {
    await fetchCart();
  };

  const addItem = async (productId: string, quantity: number) => {
    await fetch('http://localhost:3001/cart/items', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    await fetchCart();
  };

  const updateItem = async (productId: string, quantity: number) => {
    await fetch(`http://localhost:3001/cart/items/${productId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    await fetchCart();
  };

  const removeItem = async (productId: string) => {
    await fetch(`http://localhost:3001/cart/items/${productId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await fetchCart();
  };

  const clearCart = async () => {
    await fetch('http://localhost:3001/cart', {
      method: 'DELETE',
      credentials: 'include',
    });
    await fetchCart();
  };

  const value: CartContextType = {
    cart,
    isOpen,
    openCart,
    closeCart,
    loadCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
