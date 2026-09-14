'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  active: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    active: true,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${backendUrl}/admin/products`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [backendUrl]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        )
      );
    }
  }, [searchTerm, products]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      imageUrl: '',
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      active: product.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        imageUrl: formData.imageUrl.trim() || undefined,
        active: formData.active,
      };

      if (isNaN(payload.price) || payload.price < 0) {
        throw new Error('Please enter a valid price >= 0');
      }
      if (isNaN(payload.stock) || payload.stock < 0) {
        throw new Error('Please enter a valid stock count >= 0');
      }

      let res;
      if (editingProduct) {
        res = await fetch(`${backendUrl}/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${backendUrl}/admin/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save product');
      }

      setActionSuccess(editingProduct ? 'Product successfully updated!' : 'Product successfully created!');
      setTimeout(() => setActionSuccess(null), 4000);
      closeModal();
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Error saving product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      setError(null);
      const res = await fetch(`${backendUrl}/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !product.active }),
      });

      if (!res.ok) throw new Error('Failed to update product visibility');

      setActionSuccess(`Product is now ${!product.active ? 'active' : 'inactive'}`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Error toggling product status');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate "${product.name}"?`)) {
      return;
    }

    try {
      setError(null);
      const res = await fetch(`${backendUrl}/admin/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to remove/deactivate product');

      const data = await res.json();
      setActionSuccess(data.message || 'Product removed/deactivated successfully');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Error deleting product');
    }
  };

  return (
    <AdminLayout
      title="Product Catalog Management"
      subtitle="Create, update, deactivate, and adjust inventory"
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      }
    >
      {/* Alert Notices */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="bg-slate-800 px-3 py-1 rounded-full font-medium">
            Showing {filteredProducts.length} of {products.length} products
          </span>
          <button
            onClick={fetchProducts}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No products match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-950/40">
                  <th className="py-3.5 px-4 font-semibold">Product</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 truncate max-w-[280px]">{p.name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[320px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.stock === 0
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : p.stock < 5
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(p)}
                          title={p.active ? 'Deactivate product' : 'Activate product'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          {p.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-teal-400" />}
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit product"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Remove or deactivate product"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingProduct ? `Updating product ID: ${editingProduct.id.slice(0, 8)}...` : 'Add an item to the storefront catalog'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product features and specifications..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="29.99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="productActive"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-950"
                />
                <label htmlFor="productActive" className="text-sm text-slate-300 select-none cursor-pointer">
                  Product is active and visible in storefront
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-teal-500/20"
                >
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
