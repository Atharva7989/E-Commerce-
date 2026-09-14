'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddressManager, Address } from '../components/AddressManager';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  Info,
} from 'lucide-react';

interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
  active: boolean;
  lineTotal: number;
  isAvailable: boolean;
  error?: string | null;
}

interface CheckoutSummary {
  cartId: string | null;
  items: CheckoutItem[];
  subtotal: number;
  total: number;
  canCheckout: boolean;
  errors: string[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Selected payment method placeholder
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  // Submission / validation state
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validatedSuccess, setValidatedSuccess] = useState<{
    valid: boolean;
    message: string;
    address: Address;
    items: CheckoutItem[];
    subtotal: number;
    total: number;
  } | null>(null);

  const fetchCheckoutSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await fetch(`${backendUrl}/checkout/summary`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setSummaryError('Please sign in to access checkout.');
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to fetch checkout summary');
      }

      const data: CheckoutSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      setSummaryError(err.message || 'Unable to load checkout summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchCheckoutSummary();
  }, []);

  const handleContinue = async () => {
    setValidationError(null);

    if (!selectedAddress) {
      setValidationError('Please select or add a delivery address to continue.');
      return;
    }

    if (!summary || summary.items.length === 0) {
      setValidationError('Your cart is empty. Add products before checking out.');
      return;
    }

    if (!summary.canCheckout) {
      setValidationError(
        summary.errors?.join(' ') ||
          'Some items in your cart have stock issues or are no longer available. Please update your cart.'
      );
      return;
    }

    setValidating(true);
    try {
      const res = await fetch(`${backendUrl}/checkout/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddress.id }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Checkout validation failed');
      }

      setValidatedSuccess(data);
    } catch (err: any) {
      setValidationError(err.message || 'Checkout validation failed');
      // Re-fetch checkout summary to reflect updated database prices/stocks
      await fetchCheckoutSummary();
    } finally {
      setValidating(false);
    }
  };

  // If unauthenticated or error loading
  if (summaryError && summaryError.includes('sign in')) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
          <ShoppingBag className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 text-sm mb-6">
            You need to be signed in to review your cart and proceed to checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Prepared / Validated Screen (Phase 5 Completion State)
  if (validatedSuccess) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/90 border border-teal-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Checkout Validated!
              </h1>
              <p className="mt-2 text-slate-400 text-sm sm:text-base">
                {validatedSuccess.message}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Shipping Address Summary */}
              <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Shipping Destination
                </h3>
                <p className="text-white font-medium">{validatedSuccess.address.fullName}</p>
                <p className="text-slate-300 text-sm">{validatedSuccess.address.addressLine1}</p>
                {validatedSuccess.address.addressLine2 && (
                  <p className="text-slate-400 text-sm">{validatedSuccess.address.addressLine2}</p>
                )}
                <p className="text-slate-300 text-sm">
                  {validatedSuccess.address.city}, {validatedSuccess.address.state}{' '}
                  {validatedSuccess.address.postalCode}
                </p>
                <p className="text-slate-400 text-xs mt-1">Phone: {validatedSuccess.address.phone}</p>
              </div>

              {/* Items Verified */}
              <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Verified Items (Live Backend Pricing & Stock)
                </h3>
                <div className="space-y-3 divide-y divide-slate-800">
                  {validatedSuccess.items.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-semibold text-white">${item.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/80 flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Total Amount</span>
                  <span className="text-xl font-extrabold text-teal-400">
                    ${validatedSuccess.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Phase 6 Notice */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-xs sm:text-sm text-indigo-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">
                    Phase 5 Scope Complete: Address + Checkout Preparation
                  </p>
                  <p className="text-slate-300">
                    Your cart items, product stock, and delivery address have been strictly verified
                    against the backend database. In Phase 6, payment processing (Razorpay/COD) and
                    order fulfillment will be integrated.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setValidatedSuccess(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Back to Review
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-center"
              >
                Explore More Products
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Checkout
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Review your delivery address, live cart summary, and checkout details.
            </p>
          </div>
        </div>

        {/* Global Alert / Stock Error if present */}
        {validationError && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Cannot Proceed to Checkout</p>
              <p>{validationError}</p>
            </div>
          </div>
        )}

        {summary && summary.errors && summary.errors.length > 0 && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Stock or Availability Alert</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs sm:text-sm">
                {summary.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Address Selection & Payment Placeholder (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Address Selection */}
            <section className="bg-slate-800/60 rounded-3xl p-6 sm:p-7 border border-slate-700/60 backdrop-blur-sm">
              <AddressManager
                mode="select"
                selectedAddressId={selectedAddress?.id}
                onSelectAddress={(addr) => {
                  setSelectedAddress(addr);
                  setValidationError(null);
                }}
              />
            </section>

            {/* Step 2: Payment Method Placeholder */}
            <section className="bg-slate-800/60 rounded-3xl p-6 sm:p-7 border border-slate-700/60 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                    Payment Method
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your preferred payment channel for Phase 6 checkout.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Placeholder (Phase 6)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'bg-slate-800 border-teal-500 ring-2 ring-teal-500/40'
                      : 'bg-slate-900/40 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-white">Online Payment</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      Razorpay
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cards, UPI, NetBanking & Wallets (Ready in Phase 6).
                  </p>
                </div>

                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'bg-slate-800 border-teal-500 ring-2 ring-teal-500/40'
                      : 'bg-slate-900/40 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-white">Cash on Delivery</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      COD
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Pay when your order reaches your door.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/50 flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                <span>
                  No payment is captured at this stage. Proceeding prepares and validates stock and address.
                </span>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-700/70 backdrop-blur-sm shadow-xl sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-400" />
                Order Summary
              </h2>

              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                  <p className="text-xs text-slate-400">Fetching live prices & stock...</p>
                </div>
              ) : !summary || summary.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm mb-4">Your cart is empty.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Cart Items List */}
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {summary.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                          !item.isAvailable
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span>Qty: {item.quantity}</span>
                            <span>•</span>
                            <span className="text-teal-400 font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          {!item.isAvailable && (
                            <p className="text-[11px] text-rose-400 font-semibold mt-1">
                              {item.error || 'Stock insufficient'}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-white shrink-0">
                          ${item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="pt-4 border-t border-slate-700/80 space-y-2.5 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal (Live Prices)</span>
                      <span className="font-semibold text-white">
                        ${summary.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Shipping</span>
                      <span className="text-emerald-400 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Taxes</span>
                      <span className="text-slate-400 font-mono">$0.00</span>
                    </div>

                    <div className="pt-3 border-t border-slate-700/80 flex justify-between items-baseline">
                      <span className="text-base font-bold text-white">Total</span>
                      <span className="text-2xl font-black bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                        ${summary.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Selected Delivery Address Preview */}
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block mb-1">
                      Deliver To
                    </span>
                    {selectedAddress ? (
                      <div>
                        <p className="font-semibold text-white">{selectedAddress.fullName}</p>
                        <p className="text-slate-400 truncate">
                          {selectedAddress.addressLine1}, {selectedAddress.city}
                        </p>
                      </div>
                    ) : (
                      <p className="text-amber-400 italic">No address selected yet</p>
                    )}
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleContinue}
                    disabled={
                      validating ||
                      !summary.canCheckout ||
                      summary.items.length === 0 ||
                      !selectedAddress
                    }
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-base"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Validating with Backend...
                      </>
                    ) : !selectedAddress ? (
                      'Select an Address to Continue'
                    ) : !summary.canCheckout ? (
                      'Insufficient Stock in Cart'
                    ) : (
                      'Continue to Final Confirmation →'
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>Real-time stock verified directly with database</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
