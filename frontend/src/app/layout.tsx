import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from './cart/CartContext';
import { CartModal } from './cart/CartModal';
import { Navbar } from './components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUMEN — Premium Physical Essentials",
  description: "Curated collection of high-end physical products.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100">
        <CartProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <CartModal />
        </CartProvider>
      </body>
    </html>
  );
}
