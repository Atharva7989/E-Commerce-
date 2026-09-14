// Server component - no client directive needed
import Link from 'next/link';
import { notFound } from 'next/navigation';
// Removed client‑only hooks; cart actions are handled in a separate client component
import AddToCartButton from '../../cart/AddToCartButton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
}

export default async function ProductDetails({ params }: { params: { id: string } }) {
  let product: Product | null = null;
  
  const { id } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return notFound();
      throw new Error('Failed to fetch product');
    }
    product = await res.json();
  } catch (error) {
    console.error(error);
    return notFound();
  }

  if (!product) return notFound();

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center text-teal-400 hover:text-teal-300 transition-colors mb-8 font-medium">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Products
        </Link>

        <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col md:flex-row">
          <div className="md:w-1/2 h-96 md:h-auto relative">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold mb-4 border border-emerald-500/30">
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm font-semibold mb-4 border border-rose-500/30">
                  Out of Stock
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{product.name}</h1>
              <p className="text-4xl text-teal-400 font-bold mb-6">${product.price.toFixed(2)}</p>
            </div>
            
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-slate-300 text-lg leading-relaxed">{product.description}</p>
            </div>
            
            {/* Client component handling Add to Cart */}
            <AddToCartButton productId={product.id} stock={product.stock} product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
