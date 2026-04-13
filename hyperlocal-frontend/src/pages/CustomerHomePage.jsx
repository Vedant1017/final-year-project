import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useCartStore } from '../store/useCartStore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LiveMapDelivery } from '../components/LiveMapDelivery';

const imageBySku = {
  'MILK-500': '/organic_milk_product.png',
  'BREAD-001': 'https://www.themealdb.com/images/ingredients/Bread.png',
  'TOMATO-01': 'https://www.themealdb.com/images/ingredients/Tomatoes.png',
  'BANANA-01': 'https://www.themealdb.com/images/ingredients/Banana.png',
  'EGGS-12': 'https://www.themealdb.com/images/ingredients/Eggs.png',
  'CARROT-01': 'https://www.themealdb.com/images/ingredients/Carrots.png',
  'APPLE-01': 'https://www.themealdb.com/images/ingredients/Apple.png',
  'RICE-5KG': 'https://www.themealdb.com/images/ingredients/Rice.png',
  'COFFEE-01': 'https://www.themealdb.com/images/ingredients/Coffee.png',
  'CHIPS-01': 'https://images.unsplash.com/photo-1621939514649-280e2aa3c0a9?auto=format&fit=crop&w=800&q=80',
  'COLA-01': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  'ONION-01': 'https://www.themealdb.com/images/ingredients/Onions.png',
  'YOGURT-01': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'
};

function ProductImage({ src, alt }) {
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
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [orders, setOrders] = useState([]);
  const { items, refresh, setQuantity } = useCartStore();

  const cartQtyByProductId = useMemo(() => {
    const map = new Map();
    for (const i of items) map.set(i.productId, i.quantity);
    return map;
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);
    (async () => {
      try {
        const [prodRes, ordRes] = await Promise.all([
          api.get('products'),
          api.get('checkout/orders')
        ]);
        if (!cancelled) {
          setProducts(prodRes.data.products ?? []);
          setOrders(ordRes.data.orders ?? []);
        }
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setProductsError(e?.message ?? 'Could not load products');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
  );

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
        {/* Search + products first so they’re visible right after login/signup */}
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
              aria-label="Search products"
            />
          </div>
        </div>

        {orders.length > 0 && (
          <div className="mb-6">
            <div className="text-lg font-black text-gray-900 mb-3">Your active orders</div>
            <div className="grid gap-3 md:grid-cols-2">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="bg-white border text-left border-gray-100 shadow-sm p-4 rounded-2xl hover:border-brand-500 hover:shadow-md transition-all flex justify-between items-center"
                >
                  <div>
                    <div className="font-black text-gray-900 text-sm">Order {o.id.substring(0, 8)}</div>
                    <div className="text-xs text-brand-900 font-bold bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5 inline-block mt-1">
                      {o.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-gray-900">₹{o.totalAmount}</div>
                    <div className="text-xs text-gray-500 font-semibold">{new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-lg font-black text-gray-900">Popular items</div>
            <div className="text-xs font-semibold text-gray-500">
              {productsLoading ? 'Loading…' : `${filtered.length} items`}
            </div>
          </div>
          <Link to="/cart" className="text-sm font-black text-brand-900 hover:underline">
            View cart
          </Link>
        </div>

        {productsError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {productsError}
          </div>
        )}

        {productsLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 font-semibold">
            Loading products…
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {filtered.map((p) => {
              const qty = cartQtyByProductId.get(p.id) ?? 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => nav(`/product/${p.id}`)}
                  className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-square bg-gray-50">
                    <ProductImage src={imageBySku[p.sku]} alt={p.name} />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-black text-gray-900 line-clamp-2">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-semibold">{p.sku}</div>
                      <div className="text-xs text-gray-600 mt-1 font-semibold line-clamp-2">
                        {p.description ?? 'Tap to view details'}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-brand-900">₹{p.price}</span>
                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setQuantity(p.id, qty - 1);
                            }}
                            className="bg-brand-50 hover:bg-brand-100 text-brand-900 w-8 h-8 rounded-full flex items-center justify-center border border-brand-100"
                          >
                            <span className="text-lg leading-none">-</span>
                          </button>
                        )}
                        {qty > 0 && <span className="font-black text-sm text-gray-900 w-3 text-center">{qty}</span>}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuantity(p.id, qty + 1);
                          }}
                          className="bg-brand-900 hover:bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          <span className="text-xl leading-none">+</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-semibold">{p.stock} left</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-10 mb-6 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-900 border border-brand-100">
              Blinkit-style quick shop
            </div>
            <div className="mt-3 text-3xl md:text-4xl font-black text-gray-900 leading-tight">
              Welcome to <span className="text-brand-900">SnapCart Lite</span>
            </div>
            <div className="mt-2 text-sm md:text-base text-gray-600 font-semibold max-w-2xl">
              Add items to your cart, checkout, and confirm payment in seconds. Designed for your final-year demo—clean, fast,
              and friendly.
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-brand-900 via-brand-500 to-brand-300" />
        </div>

        <div className="mb-6">
          <LiveMapDelivery />
        </div>
      </main>
    </div>
  );
}
