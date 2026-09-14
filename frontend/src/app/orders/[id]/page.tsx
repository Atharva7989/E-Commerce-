'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  Banknote,
  Truck,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShoppingBag,
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

interface OrderDetails {
  id: string;
  userId: string;
  status: string;
  shippingStatus?: 'NOT_SHIPPED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  courierName?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  shippingFullName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchOrderDetails = async () => {
    if (!id) return;
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`${backendUrl}/orders/${id}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setErrorStatus(401);
        return;
      }

      if (res.status === 404) {
        setErrorStatus(404);
        setErrorMessage('Order not found or does not belong to your account.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to fetch order details');
      }

      const data: OrderDetails = await res.json();
      setOrder(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Unauthenticated State
  if (errorStatus === 401) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-sm">
          <Package className="w-12 h-12 text-teal-400 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 text-sm mb-6">
            Please sign in to your account to view this order.
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
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 404 Not Found / Cross-user Access State
  if (errorStatus === 404) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            {errorMessage || 'This order could not be located or belongs to another account.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/orders"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all text-sm"
            >
              Back to My Orders
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all text-sm"
            >
              Catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Loading State
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 animate-pulse space-y-6">
            <div className="h-8 w-64 bg-slate-700 rounded" />
            <div className="h-32 w-full bg-slate-700/40 rounded-2xl" />
            <div className="h-48 w-full bg-slate-700/40 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to My Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Package className="w-7 h-7 text-teal-400" />
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Placed on {formattedDate}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {order.status}
              </span>
              {order.shippingStatus && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    order.shippingStatus === 'DELIVERED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : order.shippingStatus === 'OUT_FOR_DELIVERY'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : order.shippingStatus === 'SHIPPED'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  {order.shippingStatus === 'DELIVERED'
                    ? 'Delivered'
                    : order.shippingStatus === 'OUT_FOR_DELIVERY'
                    ? 'Out for Delivery'
                    : order.shippingStatus === 'SHIPPED'
                    ? 'Shipped'
                    : 'Processing'}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                COD ({order.paymentStatus})
              </span>
            </div>
          </div>
        </div>

        {/* Order Details Container */}
        <div className="space-y-6">
          {/* Delivery Progress Indicator Card */}
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-slate-700/60">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" />
                  Delivery & Shipment Progress
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time status updates for your package delivery
                </p>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                  <span className="text-xs text-slate-400 font-medium">Tracking #:</span>
                  <span className="text-xs font-mono font-bold text-teal-300">{order.trackingNumber}</span>
                  {order.courierName && (
                    <span className="text-xs text-slate-400">({order.courierName})</span>
                  )}
                </div>
              )}
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {[
                {
                  id: 1,
                  title: 'Order Confirmed',
                  desc: 'Placed & inventory reserved',
                  date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                  completed: true,
                  active: (!order.shippingStatus || order.shippingStatus === 'NOT_SHIPPED') && order.status !== 'CANCELLED',
                },
                {
                  id: 2,
                  title: 'Dispatched / Shipped',
                  desc: order.courierName ? `In transit via ${order.courierName}` : 'Handed over to carrier',
                  date: order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
                  completed: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.shippingStatus || ''),
                  active: order.shippingStatus === 'SHIPPED',
                },
                {
                  id: 3,
                  title: 'Out for Delivery',
                  desc: 'Package is with local courier',
                  date: null,
                  completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.shippingStatus || ''),
                  active: order.shippingStatus === 'OUT_FOR_DELIVERY',
                },
                {
                  id: 4,
                  title: 'Delivered',
                  desc: 'Package delivered to recipient',
                  date: order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
                  completed: order.shippingStatus === 'DELIVERED',
                  active: order.shippingStatus === 'DELIVERED',
                },
              ].map((step, idx, arr) => {
                const isPast = step.completed;
                const isCurrent = step.active;

                return (
                  <div key={step.id} className="flex sm:flex-col items-start gap-3.5 relative">
                    <div className="flex items-center sm:w-full">
                      {/* Circle Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all shadow-md ${
                          isPast
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-2 ring-emerald-500/20'
                            : isCurrent
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse ring-2 ring-teal-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>

                      {/* Connecting Line (hidden on last item, visible on desktop) */}
                      {idx < arr.length - 1 && (
                        <div
                          className={`hidden sm:block flex-1 h-1 mx-2 rounded ${
                            arr[idx + 1].completed
                              ? 'bg-emerald-500/60'
                              : 'bg-slate-700/60'
                          }`}
                        />
                      )}
                    </div>

                    {/* Step Text */}
                    <div className="space-y-0.5">
                      <h4
                        className={`text-sm font-semibold ${
                          isPast || isCurrent ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-snug">{step.desc}</p>
                      {step.date && (
                        <p className="text-[11px] font-medium text-teal-400/90 pt-0.5">
                          {step.date}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Top Info Cards: Shipping Destination & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Shipping Address Snapshot Card */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-3xl p-6 backdrop-blur-sm shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Shipping Destination (Snapshot)
              </h3>
              <div className="space-y-1 text-sm text-slate-200">
                <p className="font-semibold text-white text-base">{order.shippingFullName}</p>
                <p className="text-slate-300">{order.shippingAddressLine1}</p>
                {order.shippingAddressLine2 && (
                  <p className="text-slate-400">{order.shippingAddressLine2}</p>
                )}
                <p className="text-slate-300">
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </p>
                <p className="text-slate-400 font-medium">{order.shippingCountry}</p>
                <p className="text-xs text-slate-400 pt-2 flex items-center gap-1">
                  <span>Phone:</span>
                  <span className="text-slate-200 font-mono">{order.shippingPhone}</span>
                </p>
              </div>
            </div>

            {/* Payment & Status Card */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-3xl p-6 backdrop-blur-sm shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" /> Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Channel</span>
                    <span className="font-semibold text-white">Cash on Delivery (COD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Status</span>
                    <span className="font-medium text-amber-300">{order.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Verification</span>
                    <span className="font-medium text-emerald-400">Confirmed & Reserved</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-amber-200/90 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                Please keep <span className="font-bold text-amber-300">${order.totalAmount.toFixed(2)}</span> cash ready.
                Payment is collected upon package delivery.
              </div>
            </div>
          </div>

          {/* Ordered Products Section */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-3xl p-6 sm:p-7 backdrop-blur-sm shadow-md space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-400" />
              Ordered Items ({order.items.length})
            </h3>

            <div className="divide-y divide-slate-700/60">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.productName}
                        className="w-14 h-14 object-cover rounded-xl shrink-0 border border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 text-slate-500">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-white text-sm sm:text-base">{item.productName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-white text-base shrink-0">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-slate-700/80 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-semibold text-white">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shipping Fee</span>
                <span className="text-emerald-400 font-medium">Free</span>
              </div>
              <div className="pt-3 border-t border-slate-700/80 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Grand Total</span>
                <span className="text-2xl font-black bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <Link
            href="/orders"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Orders
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop More Products
          </Link>
        </div>
      </div>
    </main>
  );
}
