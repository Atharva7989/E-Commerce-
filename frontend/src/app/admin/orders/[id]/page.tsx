'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  Clock, 
  DollarSign, 
  User, 
  AlertCircle, 
  CheckCircle2,
  Truck,
  RotateCcw
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ShippingSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderDetail {
  id: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  shippingStatus?: 'NOT_SHIPPED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  courierName?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  shippingAddressSnapshot?: ShippingSnapshot;
  shippingFullName?: string;
  shippingPhone?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingShipping, setUpdatingShipping] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [shippingStatus, setShippingStatus] = useState<string>('NOT_SHIPPED');
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchOrderDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${backendUrl}/admin/orders/${id}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Order not found');
        throw new Error('Failed to retrieve order details');
      }
      const data = await res.json();
      setOrder(data);
      setSelectedStatus(data.status);
      setShippingStatus(data.shippingStatus || 'NOT_SHIPPED');
      setCourierName(data.courierName || '');
      setTrackingNumber(data.trackingNumber || '');
    } catch (err: any) {
      setError(err.message || 'Error loading order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id, backendUrl]);

  const handleShippingUpdate = async () => {
    if (!order) return;

    try {
      setUpdatingShipping(true);
      setError(null);

      const res = await fetch(`${backendUrl}/admin/orders/${order.id}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shippingStatus,
          courierName: courierName.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update shipping details');
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setSelectedStatus(updatedOrder.status);
      setShippingStatus(updatedOrder.shippingStatus || 'NOT_SHIPPED');
      setCourierName(updatedOrder.courierName || '');
      setTrackingNumber(updatedOrder.trackingNumber || '');
      setSuccess('Shipping & courier tracking updated successfully');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error updating shipping details');
    } finally {
      setUpdatingShipping(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.status) return;

    try {
      setUpdating(true);
      setError(null);

      const res = await fetch(`${backendUrl}/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update order status');
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setSelectedStatus(updatedOrder.status);
      setSuccess(`Order status successfully changed to ${updatedOrder.status}`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'PENDING':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const getShippingBadge = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'SHIPPED':
        return { label: 'Shipped', style: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'NOT_SHIPPED':
      default:
        return { label: 'Not Shipped', style: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  return (
    <AdminLayout
      title={order ? `Order #${order.id.slice(0, 8)}` : 'Order Details'}
      subtitle={
        order
          ? `Placed on ${new Date(order.createdAt).toLocaleString()} by ${order.user?.email || order.userId || 'Customer'}`
          : ''
      }
      actions={
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      }
    >
      {/* Alert Notices */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          <div className="flex flex-col items-center gap-2">
            <RotateCcw className="w-6 h-6 animate-spin text-teal-400" />
            Loading order details...
          </div>
        </div>
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Order Details & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ordered Items Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Order Line Items ({order.items?.length || 0})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                      <th className="pb-3 font-semibold">Item</th>
                      <th className="pb-3 font-semibold text-center">Qty</th>
                      <th className="pb-3 font-semibold text-right">Unit Price</th>
                      <th className="pb-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4">
                          <div className="font-semibold text-slate-100">{item.productName}</div>
                          <div className="text-xs text-slate-500 font-mono">Product ID: {item.productId.slice(0, 8)}...</div>
                        </td>
                        <td className="py-4 text-center text-slate-300 font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-4 text-right text-slate-300 font-mono">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-4 text-right font-semibold text-slate-100 font-mono">
                          ${Number(item.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-400">Total Charged Amount</span>
                <span className="text-2xl font-extrabold text-teal-400 font-mono">
                  ${Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Address Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address Snapshot */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  Historical Shipping Snapshot
                </h3>
                {order.shippingAddressSnapshot || order.shippingFullName ? (
                  <div className="text-sm text-slate-300 space-y-1 leading-relaxed">
                    <p className="font-semibold text-white">
                      {order.shippingAddressSnapshot?.fullName || order.shippingFullName}
                    </p>
                    <p className="text-slate-400 text-xs">
                      Phone: {order.shippingAddressSnapshot?.phone || order.shippingPhone}
                    </p>
                    <p>{order.shippingAddressSnapshot?.addressLine1 || order.shippingAddressLine1}</p>
                    {(order.shippingAddressSnapshot?.addressLine2 || order.shippingAddressLine2) && (
                      <p>{order.shippingAddressSnapshot?.addressLine2 || order.shippingAddressLine2}</p>
                    )}
                    <p>
                      {order.shippingAddressSnapshot?.city || order.shippingCity},{' '}
                      {order.shippingAddressSnapshot?.state || order.shippingState}{' '}
                      {order.shippingAddressSnapshot?.postalCode || order.shippingPostalCode}
                    </p>
                    <p className="text-xs text-slate-400 uppercase">
                      {order.shippingAddressSnapshot?.country || order.shippingCountry}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No snapshot recorded</p>
                )}
              </div>

              {/* Customer Account Information */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  Customer Profile
                </h3>
                <div className="text-sm text-slate-300 space-y-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Email Address</span>
                    <span className="font-medium text-slate-200">
                      {order.user?.email || 'Customer (email unavailable)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Customer ID</span>
                    <span className="font-mono text-xs text-slate-400">{order.userId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Payment Details</span>
                    <span className="inline-flex px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update & Administration Panel */}
          <div className="space-y-6">
            {/* Shipping & Delivery Management Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-400" />
                Shipping & Delivery Tracking
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Assign courier partner, tracking code, and manage dispatch progress
              </p>

              {/* Current Shipping Status Overview */}
              <div className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current Phase:</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getShippingBadge(order.shippingStatus).style}`}>
                    <Truck className="w-3 h-3" />
                    {getShippingBadge(order.shippingStatus).label}
                  </span>
                </div>
                {order.shippedAt && (
                  <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
                    <span>Dispatched at:</span>
                    <span className="text-slate-300">{new Date(order.shippedAt).toLocaleString()}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Delivered at:</span>
                    <span className="text-emerald-400">{new Date(order.deliveredAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Shipping Status:
                  </label>
                  <select
                    value={shippingStatus}
                    onChange={(e) => setShippingStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="NOT_SHIPPED">NOT_SHIPPED (Processing)</option>
                    <option value="SHIPPED">SHIPPED (In Transit)</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Courier Partner:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FedEx, BlueDart, DHL, UPS"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tracking Number:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRK-98214210"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600"
                  />
                </div>

                <button
                  onClick={handleShippingUpdate}
                  disabled={updatingShipping}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-teal-600/20"
                >
                  {updatingShipping ? 'Updating Shipping...' : 'Update Shipping & Tracking'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-snug">
                Updating to <strong>DELIVERED</strong> automatically stamps delivery date and syncs order status.
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                Fulfillment Status
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Update the authoritative status of this customer order
              </p>

              <div className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Current Status:</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select New Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || selectedStatus === order.status}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-amber-600/20"
                >
                  {updating ? 'Updating...' : 'Apply Status Change'}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">Integrity Rules:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Historical item prices and order totals cannot be edited.</li>
                  <li>Shipping address snapshot remains permanently sealed.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
