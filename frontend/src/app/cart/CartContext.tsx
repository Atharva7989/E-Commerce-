'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CartItem = {
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

export type Cart = {
  id: string;
  items: CartItem[];
  subtotal: number;
};

type CartContextType = {
  cart: Cart | null;
  isOpen: boolean;
  isAuthenticated: boolean;
  openCart: () => void;
  closeCart: () => void;
  loadCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, productDetails?: any) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'guest_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Helper to read guest cart from localStorage
  const getStoredGuestCart = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper to save guest cart to localStorage and update local state
  const saveGuestCart = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.product?.price) || 0) * item.quantity,
      0
    );
    setCart({
      id: 'guest-cart',
      items,
      subtotal,
    });
  };

  // Merge guest cart items into backend database cart
  const mergeGuestCart = useCallback(async () => {
    const guestItems = getStoredGuestCart();
    if (guestItems.length === 0) return;

    try {
      const payload = {
        items: guestItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await fetch(`${backendUrl}/cart/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_CART_KEY);
        }
        const data = await res.json();
        const subtotal = data.items.reduce(
          (sum: number, i: CartItem) => sum + (Number(i.product?.price) || 0) * i.quantity,
          0
        );
        setCart({ ...data, subtotal });
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to merge guest cart:', err);
    }
  }, [backendUrl]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/cart`, { credentials: 'include' });

      if (res.ok) {
        setIsAuthenticated(true);
        const data = await res.json();
        const subtotal = data.items.reduce(
          (sum: number, i: CartItem) => sum + (Number(i.product?.price) || 0) * i.quantity,
          0
        );
        setCart({ ...data, subtotal });

        // If guest cart has pending items in localStorage, merge them immediately
        const guestItems = getStoredGuestCart();
        if (guestItems.length > 0) {
          await mergeGuestCart();
        }
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        // Load guest cart from localStorage
        const guestItems = getStoredGuestCart();
        const subtotal = guestItems.reduce(
          (sum, i) => sum + (Number(i.product?.price) || 0) * i.quantity,
          0
        );
        setCart({
          id: 'guest-cart',
          items: guestItems,
          subtotal,
        });
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      // Fallback to guest cart on network/auth error
      const guestItems = getStoredGuestCart();
      const subtotal = guestItems.reduce(
        (sum, i) => sum + (Number(i.product?.price) || 0) * i.quantity,
        0
      );
      setCart({
        id: 'guest-cart',
        items: guestItems,
        subtotal,
      });
    }
  }, [backendUrl, mergeGuestCart]);

  // Listen for custom event to open cart modal
  useEffect(() => {
    const handler = () => openCart();
    window.addEventListener('open-cart', handler);
    return () => window.removeEventListener('open-cart', handler);
  }, []);

  // Fetch cart on initial mount
  useEffect(() => {
    fetchCart().catch(console.error);
  }, [fetchCart]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const loadCart = async () => {
    await fetchCart();
  };

  const addItem = async (productId: string, quantity: number, productDetails?: any) => {
    if (isAuthenticated) {
      try {
        const res = await fetch(`${backendUrl}/cart/items`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity }),
        });
        if (res.ok) {
          await fetchCart();
          return;
        }
      } catch (err) {
        console.error('Error adding item while authenticated:', err);
      }
    }

    // Guest cart flow using localStorage
    let details = productDetails;
    if (!details) {
      try {
        const pRes = await fetch(`${backendUrl}/products/${productId}`);
        if (pRes.ok) {
          details = await pRes.json();
        }
      } catch (e) {
        console.error('Could not fetch product details for guest cart', e);
      }
    }

    const currentItems = getStoredGuestCart();
    const existingIndex = currentItems.findIndex((i) => i.productId === productId);

    let updatedItems: CartItem[];
    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex].quantity += quantity;
      if (details) {
        updatedItems[existingIndex].product = {
          id: productId,
          name: details.name || updatedItems[existingIndex].product.name,
          price: Number(details.price) || updatedItems[existingIndex].product.price,
          imageUrl: details.imageUrl || updatedItems[existingIndex].product.imageUrl,
        };
      }
    } else {
      const newItem: CartItem = {
        id: `guest-${productId}-${Date.now()}`,
        productId,
        quantity,
        product: {
          id: productId,
          name: details?.name || 'Product',
          price: Number(details?.price) || 0,
          imageUrl: details?.imageUrl || '',
        },
      };
      updatedItems = [...currentItems, newItem];
    }

    saveGuestCart(updatedItems);
  };

  const updateItem = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      try {
        const res = await fetch(`${backendUrl}/cart/items/${productId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) {
          await fetchCart();
          return;
        }
      } catch (err) {
        console.error('Error updating item while authenticated:', err);
      }
    }

    // Guest cart flow
    const currentItems = getStoredGuestCart();
    if (quantity <= 0) {
      const updated = currentItems.filter((i) => i.productId !== productId);
      saveGuestCart(updated);
    } else {
      const updated = currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      saveGuestCart(updated);
    }
  };

  const removeItem = async (productId: string) => {
    if (isAuthenticated) {
      try {
        const res = await fetch(`${backendUrl}/cart/items/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          await fetchCart();
          return;
        }
      } catch (err) {
        console.error('Error removing item while authenticated:', err);
      }
    }

    // Guest cart flow
    const currentItems = getStoredGuestCart();
    const updated = currentItems.filter((i) => i.productId !== productId);
    saveGuestCart(updated);
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await fetch(`${backendUrl}/cart`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (err) {
        console.error('Error clearing cart while authenticated:', err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    setCart({
      id: 'guest-cart',
      items: [],
      subtotal: 0,
    });
  };

  const value: CartContextType = {
    cart,
    isOpen,
    isAuthenticated,
    openCart,
    closeCart,
    loadCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    mergeGuestCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
