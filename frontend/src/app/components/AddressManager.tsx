'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  Building,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: string;
}

interface AddressManagerProps {
  mode?: 'manage' | 'select';
  selectedAddressId?: string;
  onSelectAddress?: (address: Address) => void;
  onAddressesLoaded?: (addresses: Address[]) => void;
}

export const AddressManager: React.FC<AddressManagerProps> = ({
  mode = 'manage',
  selectedAddressId,
  onSelectAddress,
  onAddressesLoaded,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/addresses`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load addresses');
      }

      const data: Address[] = await res.json();
      setAddresses(data);
      if (onAddressesLoaded) {
        onAddressesLoaded(data);
      }

      // Auto-select first address if in select mode and none currently selected
      if (mode === 'select' && onSelectAddress && data.length > 0 && !selectedAddressId) {
        onSelectAddress(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this address?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${backendUrl}/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete address');
      }

      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      if (onAddressesLoaded) onAddressesLoaded(updated);

      if (selectedAddressId === id && onSelectAddress) {
        onSelectAddress(updated[0] || null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client validation
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setFormError('Full name must be at least 2 characters long.');
      return;
    }
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setFormError('Please enter a valid phone number (7-20 digits).');
      return;
    }
    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 3) {
      setFormError('Address Line 1 must be at least 3 characters.');
      return;
    }
    if (!formData.city.trim()) {
      setFormError('City is required.');
      return;
    }
    if (!formData.state.trim()) {
      setFormError('State is required.');
      return;
    }
    const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
    if (!postalRegex.test(formData.postalCode.trim())) {
      setFormError('Please enter a valid postal code (3-10 alphanumeric characters).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
      };

      const url = editingAddress
        ? `${backendUrl}/addresses/${editingAddress.id}`
        : `${backendUrl}/addresses`;
      const method = editingAddress ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to save address');
      }

      setIsModalOpen(false);
      await fetchAddresses();

      // If we just added or updated and it's select mode, select it
      if (mode === 'select' && onSelectAddress) {
        onSelectAddress(resData);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (unauthorized) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center">
        <MapPin className="w-12 h-12 text-teal-400 mx-auto mb-4 opacity-75" />
        <h3 className="text-xl font-bold text-white mb-2">Authentication Required</h3>
        <p className="text-slate-400 mb-6">
          Please sign in to your account to view, add, and manage your delivery addresses.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading your addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" />
            {mode === 'select' ? 'Select Delivery Address' : 'Saved Addresses'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {mode === 'select'
              ? 'Choose where you want your order delivered or add a new location.'
              : 'Manage your saved delivery locations for fast checkout.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600/90 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="border-2 border-dashed border-slate-700/80 rounded-2xl p-8 text-center bg-slate-800/30">
          <Building className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-slate-200 font-semibold mb-1">No saved addresses yet</h4>
          <p className="text-slate-400 text-sm mb-4">
            Add your delivery address to proceed with checkout.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Address
          </button>
        </div>
      ) : (
        <div
          className={
            mode === 'select'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
          }
        >
          {addresses.map((addr) => {
            const isSelected = mode === 'select' && selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => {
                  if (mode === 'select' && onSelectAddress) {
                    onSelectAddress(addr);
                  }
                }}
                className={`relative rounded-2xl p-5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800/90 border-teal-500 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/50'
                    : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {mode === 'select' && (
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'border-teal-400 bg-teal-400' : 'border-slate-500'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                      </div>
                    )}
                    <h3 className="font-bold text-white text-base tracking-tight">{addr.fullName}</h3>
                  </div>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditModal(addr, e)}
                      className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(addr.id, e)}
                      disabled={deletingId === addr.id}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete address"
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-300 space-y-1">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-slate-400">{addr.addressLine2}</p>}
                  <p>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-slate-400 font-medium">{addr.country}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{addr.phone}</span>
                </div>

                {isSelected && (
                  <span className="absolute bottom-3 right-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Delivering here
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-1">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Enter your accurate delivery details for swift shipping.
            </p>

            {formError && (
              <div className="mb-6 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555-019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="123 Main Street, Apt 4B"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Suite, building, landmark"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10001"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Country *</label>
                <input
                  type="text"
                  required
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
