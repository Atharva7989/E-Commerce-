'use client';

import React from 'react';
import Link from 'next/link';
import { AddressManager } from '../components/AddressManager';
import { ArrowLeft } from 'lucide-react';

export default function AddressesPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Products
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Manage Addresses
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Keep your shipping destinations updated for seamless checkout experiences.
          </p>
        </div>

        <div className="bg-slate-850/60 rounded-3xl p-6 sm:p-8 border border-slate-800 backdrop-blur-sm">
          <AddressManager mode="manage" />
        </div>
      </div>
    </main>
  );
}
