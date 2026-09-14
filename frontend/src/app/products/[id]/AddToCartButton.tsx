"use client";

import { useState } from "react";
import { useCart } from "../../cart/CartContext";

interface Props {
  productId: string;
  stock: number;
}

export default function AddToCartButton({ productId, stock }: Props) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (stock === 0) return;
    setIsAdding(true);
    try {
      await addItem(productId, 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      disabled={stock === 0 || isAdding}
      onClick={handleAdd}
      className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-300 transform active:scale-95 ${
        stock > 0
          ? "bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]"
          : "bg-slate-700 text-slate-500 cursor-not-allowed"
      }`}
    >
      {isAdding ? "Adding..." : stock > 0 ? "Add to Cart" : "Currently Unavailable"}
    </button>
  );
}
