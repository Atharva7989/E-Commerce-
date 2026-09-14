'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import CartBadge from '../cart/CartBadge';
import { Sparkles, MapPin, ShoppingBag, User, LogOut, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const checkAuth = async () => {
    try {
      const res = await fetch(`${backendUrl}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-400 bg-clip-text text-transparent">
              LUMEN
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === '/' ? 'text-teal-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Products
            </Link>
            <Link
              href="/addresses"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === '/addresses' ? 'text-teal-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              My Addresses
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <CartBadge />

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {loading ? (
            <div className="w-20 h-8 bg-slate-800 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-medium truncate max-w-[140px]">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-400" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
