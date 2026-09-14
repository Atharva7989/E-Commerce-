"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '../cart/CartContext';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation when clicking the button
    await addItem(product.id, 1, product);
  };

  return (
    <Link href={`/products/${product.id}`} key={product.id} className="group cursor-pointer">
      <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl border border-slate-700 hover:border-teal-500">
        <div className="h-64 overflow-hidden relative">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transform transition duration-500 group-hover:scale-110" />
          {product.stock <= 20 && (
            <span className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Low Stock</span>
          )}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-100 mb-2 truncate">{product.name}</h3>
          <p className="text-teal-400 font-semibold text-lg">${product.price.toFixed(2)}</p>
          <button
            className="mt-3 w-full py-2 bg-teal-600 text-white rounded hover:bg-teal-500 transition"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};
