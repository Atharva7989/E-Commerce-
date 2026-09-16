
import { ProductCard } from './components/ProductCard';
export const dynamic = "force-dynamic";
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
}

export default async function Home() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  let products: Product[] = [];
  
  try {
    const res = await fetch(`${backendUrl}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    products = await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">
            Featured Products
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Discover our curated collection of premium essentials.
          </p>
        </header>

        {products.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-slate-500 text-xl animate-pulse">Loading products or no products found...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>


        )}
      </div>
    </main>
  );
}
