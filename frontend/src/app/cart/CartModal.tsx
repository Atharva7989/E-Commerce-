"use client";

import { useCart } from './CartContext';

export const CartModal: React.FC = () => {
  const { cart, isOpen, closeCart, updateItem, removeItem, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeCart}>
      <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-600 rounded-xl w-11/12 max-w-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-gray-300 hover:text-white" onClick={closeCart} aria-label="Close cart">
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-white">Your Cart</h2>
        {cart && cart.items.length > 0 ? (
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 hover:shadow-lg transition-shadow">
                <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 ml-4">
                  <h3 className="text-white font-medium">{item.product.name}</h3>
                  <p className="text-gray-300 text-sm">${item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="px-2 py-1 bg-teal-600 text-white rounded disabled:opacity-50"
                    onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                  >
                    –
                  </button>
                  <span className="text-white mx-1">{item.quantity}</span>
                  <button
                    className="px-2 py-1 bg-teal-600 text-white rounded disabled:opacity-50"
                    onClick={() => updateItem(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="ml-3 text-red-400 hover:text-red-200"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">Your cart is empty.</p>
        )}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-slate-600 pt-4 flex justify-between items-center">
            <span className="text-white font-semibold">Subtotal:</span>
            <span className="text-white font-bold">${cart.subtotal.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={clearCart}
            disabled={!cart || cart.items.length === 0}
          >
            Clear Cart
          </button>
          <button
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-500"
            onClick={closeCart}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
