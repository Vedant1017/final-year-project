import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useCartStore } from '../store/useCartStore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

type Product = { id: string; sku: string; name: string; price: string; stock: number; shopId: string };

const imageBySku: Record<string, string> = {
  'MILK-500': '/organic_milk_product.png',
  // Use TheMealDB ingredient images where possible (stable hotlinks), otherwise Unsplash.
  'BREAD-001': 'https://www.themealdb.com/images/ingredients/Bread.png',
  'TOMATO-01': 'https://www.themealdb.com/images/ingredients/Tomatoes.png',
  'BANANA-01': 'https://www.themealdb.com/images/ingredients/Banana.png',
  'EGGS-12': 'https://www.themealdb.com/images/ingredients/Eggs.png',
  'CARROT-01': 'https://www.themealdb.com/images/ingredients/Carrots.png',
  'APPLE-01': 'https://www.themealdb.com/images/ingredients/Apple.png',
  'RICE-5KG': 'https://www.themealdb.com/images/ingredients/Rice.png',
  'COFFEE-01': 'https://www.themealdb.com/images/ingredients/Coffee.png',
  'CHIPS-01': 'https://images.unsplash.com/photo-1621939514649-280e2aa3c0a9?auto=format&fit=crop&w=800&q=80',
  'COLA-01': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'
};

function ProductImage({ src, alt }: { src: string | undefined; alt: string }) {
  const [current, setCurrent] = useState(src && src.trim() ? src : '/product_placeholder.svg');
  useEffect(() => {
    setCurrent(src && src.trim() ? src : '/product_placeholder.svg');
  }, [src]);

  return (
    <img
      src={current}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => {
        if (current !== '/product_placeholder.svg') setCurrent('/product_placeholder.svg');
      }}
    />
  );
}

export function CustomerHomePage() {
  const nav = useNavigate();
  const { token, logout } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const { items, refresh, setQuantity } = useCartStore();

  const cartQtyByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) map.set(i.productId, i.quantity);
    return map;
  }, [items]);

  useEffect(() => {
    (async () => {
      const data = await apiFetch<{ success: boolean; products: Product[] }>('/products');
      setProducts(data.products);
      await refresh();
    })();
  }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()));

  const totalCartItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-brand-50 text-gray-900 font-sans pb-24">
      <header className="bg-white/90 backdrop-blur-md shadow-sm relative z-20 p-4 shrink-0 flex items-center justify-between sticky top-0 border-b border-gray-100">
        <div className="container mx-auto max-w-7xl flex items-center justify-between px-4 md:px-8">
          <div>
            <h1 className="text-xl font-black tracking-tight text-brand-900">SnapCart Lite</h1>
            <div className="text-xs font-semibold text-gray-500">Fast essentials • Simple checkout</div>
          </div>
          <div className="flex items-center gap-2">
            {token ? (
              <button
                onClick={() => {
                  logout();
                  nav('/login');
                }}
                className="px-3 py-2 rounded-xl bg-brand-50 text-brand-900 border border-brand-100 font-black text-sm hover:bg-brand-100"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl bg-brand-900 text-white font-black text-sm hover:bg-brand-500"
              >
                Login
              </Link>
            )}

            <Link to="/cart" className="relative cursor-pointer hover:opacity-80 transition-opacity p-2">
              <ShoppingCart size={22} className="text-gray-700" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 max-w-7xl pt-6">
        {/* Welcome banner */}
        <div className="mb-6 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-900 border border-brand-100">
              Blinkit-style quick shop
            </div>
            <div className="mt-3 text-3xl md:text-4xl font-black text-gray-900 leading-tight">
              Welcome to <span className="text-brand-900">SnapCart Lite</span>
            </div>
            <div className="mt-2 text-sm md:text-base text-gray-600 font-semibold max-w-2xl">
              Add items to your cart, checkout, and confirm payment in seconds. Designed for your final-year demo—clean, fast, and friendly.
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-brand-900 via-brand-500 to-brand-300" />
        </div>

        {/* Search */}
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search milk, bread, eggs, fruits…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-lg font-black text-gray-900">Popular items</div>
            <div className="text-xs font-semibold text-gray-500">{filtered.length} items</div>
          </div>
          <Link to="/cart" className="text-sm font-black text-brand-900 hover:underline">
            View cart
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map((p) => {
            const qty = cartQtyByProductId.get(p.id) ?? 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="aspect-square bg-gray-50">
                  <ProductImage src={imageBySku[p.sku]} alt={p.name} />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-sm font-black text-gray-900 line-clamp-2">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-semibold">{p.sku}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-black text-brand-900">₹{p.price}</span>
                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <button
                          onClick={() => setQuantity(p.id, qty - 1)}
                          className="bg-brand-50 hover:bg-brand-100 text-brand-900 w-8 h-8 rounded-full flex items-center justify-center border border-brand-100"
                        >
                          <span className="text-lg leading-none">-</span>
                        </button>
                      )}
                      {qty > 0 && <span className="font-black text-sm text-gray-900 w-3 text-center">{qty}</span>}
                      <button
                        onClick={() => setQuantity(p.id, qty + 1)}
                        className="bg-brand-900 hover:bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center"
                      >
                        <span className="text-xl leading-none">+</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 font-semibold">{p.stock} left</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

