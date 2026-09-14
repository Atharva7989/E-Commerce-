'use client';
import React from 'react';
import { useCart } from './CartContext';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
}

export default function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const inStock = stock > 0;
  const { addItem } = useCart();

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await addItem(productId, 1);
  };

  return (
    <button
      disabled={!inStock}
      className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-300 transform active:scale-95 ${
        inStock
          ? 'bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]'
          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
      }`}
      onClick={handleAdd}
    >
      {inStock ? 'Add to Cart' : 'Currently Unavailable'}
    </button>
  );
}
