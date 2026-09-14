'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Calendar,
  Banknote,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  Truck,
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  shippingFullName: string;
  shippingCity: string;
  shippingState: string;
  shippingStatus?: 'NOT_SHIPPED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  courierName?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/orders`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load your orders');
      }

      const data: Order[] = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-sm">
          <Package className="w-12 h-12 text-teal-400 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 text-sm mb-6">
            Please sign in to view your order history and track recent purchases.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Package className="w-8 h-8 text-teal-400" />
              My Orders
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track and review all your past physical product purchases.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-medium rounded-xl border border-slate-700 transition-colors w-fit"
          >
            <ShoppingBag className="w-4 h-4 text-teal-400" />
            Continue Shopping
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchOrders}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-32 bg-slate-700 rounded-md" />
                  <div className="h-6 w-24 bg-slate-700 rounded-full" />
                </div>
                <div className="h-4 w-48 bg-slate-700/60 rounded-md" />
                <div className="h-10 w-full bg-slate-700/40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* Empty Orders State */
          <div className="border-2 border-dashed border-slate-700/80 rounded-3xl p-12 text-center bg-slate-800/30">
            <div className="w-16 h-16 bg-slate-800 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <ShoppingBag className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">No Orders Placed Yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              You haven't ordered any products yet. Browse our curated collection to place your first order.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all text-sm"
            >
              Explore Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-5">
            {orders.map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/70 rounded-3xl p-5 sm:p-6 transition-all backdrop-blur-sm shadow-lg space-y-4"
                >
                  {/* Top Bar: Order ID, Date, Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-mono font-bold text-white text-sm sm:text-base">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Order Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          order.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : order.status === 'DELIVERED'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : order.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {order.status}
                      </span>

                      {/* Shipping Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          order.shippingStatus === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : order.shippingStatus === 'OUT_FOR_DELIVERY'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : order.shippingStatus === 'SHIPPED'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        {order.shippingStatus ? order.shippingStatus.replace(/_/g, ' ') : 'NOT SHIPPED'}
                      </span>

                      {/* COD Payment Status Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <Banknote className="w-3.5 h-3.5 text-amber-400" />
                        COD ({order.paymentStatus})
                      </span>
                    </div>
                  </div>

                  {/* Middle Section: Items Summary & Thumbnails */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-400 font-medium">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'} in this order
                        </p>
                        {(order.courierName || order.trackingNumber) && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/60 px-2.5 py-0.5 rounded-lg border border-slate-700/60">
                            <Truck className="w-3 h-3 text-teal-400" />
                            <span>{order.courierName || 'Courier'}</span>
                            {order.trackingNumber && (
                              <span className="font-mono text-teal-300">#{order.trackingNumber}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Product Thumbnails or Names */}
                      <div className="flex flex-wrap items-center gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs"
                          >
                            {item.product?.imageUrl && (
                              <img
                                src={item.product.imageUrl}
                                alt={item.productName}
                                className="w-6 h-6 object-cover rounded-md"
                              />
                            )}
                            <span className="text-slate-200 font-medium truncate max-w-[150px]">
                              {item.productName}
                            </span>
                            <span className="text-slate-400">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total and View Details Link */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0">
                      <div>
                        <span className="text-xs text-slate-400 block sm:text-right">Order Total</span>
                        <span className="text-xl font-extrabold text-teal-400">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-teal-500/10 transition-all group"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
