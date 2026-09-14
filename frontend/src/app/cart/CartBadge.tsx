// src/app/cart/CartBadge.tsx
"use client";
import React from 'react';
import { useCart } from './CartContext';
import { ShoppingCart } from 'lucide-react'; // optional icon library, replace if not installed

const CartBadge: React.FC = () => {
  const { cart, openCart } = useCart();
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const handleClick = () => {
    openCart();
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center p-2 rounded-full hover:bg-slate-700 transition-colors"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-6 w-6 text-white" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white border-2 border-slate-800">
          {itemCount}
        </span>
      )}
    </button>
  );
};

export default CartBadge;
