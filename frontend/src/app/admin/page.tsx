'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from './AdminLayout';
import { 
  Package, 
  CheckCircle, 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Metrics {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalSales: number;
}

interface OrderSummary {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: {
    email: string;
  };
  _count?: {
    items: number;
  };
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsRes, ordersRes] = await Promise.all([
          fetch(`${backendUrl}/admin/metrics`, { credentials: 'include' }),
          fetch(`${backendUrl}/admin/orders`, { credentials: 'include' }),
        ]);

        if (!metricsRes.ok || !ordersRes.ok) {
          throw new Error('Failed to load administrative analytics');
        }

        const metricsData = await metricsRes.json();
        const ordersData = await ordersRes.json();

        setMetrics(metricsData);
        setRecentOrders(ordersData.slice(0, 5));
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendUrl]);

  const getStatusColor = (status: string) => {
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

  return (
    <AdminLayout 
      title="Store Analytics & Overview" 
      subtitle="Real-time operational metrics and customer order tracking"
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Products</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{metrics.totalProducts}</div>
              <p className="text-xs text-slate-500 mt-1">Catalog items</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Products</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{metrics.activeProducts}</div>
              <p className="text-xs text-emerald-400/80 mt-1">Visible in storefront</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{metrics.totalOrders}</div>
              <p className="text-xs text-slate-500 mt-1">Lifetime customer orders</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Orders</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-amber-400">{metrics.pendingOrders}</div>
              <p className="text-xs text-slate-500 mt-1">Requires fulfillment</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gross Sales</span>
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">${metrics.totalSales.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Non-cancelled revenue</p>
            </div>
          </div>

          {/* Quick Actions & Recent Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Quick Management
              </h2>

              <Link
                href="/admin/products"
                className="block p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">Catalog Management</h3>
                      <p className="text-xs text-slate-400">Create, edit, adjust stock & pricing</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              <Link
                href="/admin/orders"
                className="block p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">Order Processing</h3>
                      <p className="text-xs text-slate-400">Update status, verify addresses & totals</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200">Security Rule Enforced:</div>
                <p>Public registration grants <span className="text-teal-400 font-mono">USER</span> role only. Admin privileges cannot be client-supplied and are guarded by backend <span className="text-amber-400 font-mono">AdminGuard</span>.</p>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Recent Customer Orders</h2>
                  <p className="text-xs text-slate-400">Latest orders placed across all storefront users</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  View all ({metrics.totalOrders})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No orders placed yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                        <th className="pb-3 font-semibold">Order ID</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 font-mono text-xs text-slate-300">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 text-slate-200 text-xs truncate max-w-[160px]">
                            {order.user?.email}
                          </td>
                          <td className="py-3.5 text-xs text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 font-semibold text-slate-100">
                            ${Number(order.totalAmount).toFixed(2)}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="text-xs font-semibold text-teal-400 hover:text-teal-300"
                            >
                              Manage &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}
