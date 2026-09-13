import Link from 'next/link';
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
  let products: Product[] = [];
  
  try {
    const res = await fetch('http://localhost:3000/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    products = await res.json();
  } catch (error) {
    console.error(error);
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
              <Link href={`/products/${product.id}`} key={product.id} className="group cursor-pointer">
                <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl border border-slate-700 hover:border-teal-500">
                  <div className="h-64 overflow-hidden relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transform transition duration-500 group-hover:scale-110"
                    />
                    {product.stock <= 20 && (
                      <span className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-100 mb-2 truncate">{product.name}</h3>
                    <p className="text-teal-400 font-semibold text-lg">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
