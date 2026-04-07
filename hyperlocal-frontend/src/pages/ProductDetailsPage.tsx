import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useCartStore } from '../store/useCartStore';

type Product = { id: string; sku: string; name: string; description: string | null; price: string; stock: number; shopId: string };

const imageBySku: Record<string, string> = {
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
  'COLA-01': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'
};

function Img({ src, alt }: { src?: string; alt: string }) {
  const [current, setCurrent] = useState(src && src.trim() ? src : '/product_placeholder.svg');
  useEffect(() => {
    setCurrent(src && src.trim() ? src : '/product_placeholder.svg');
  }, [src]);
  return (
    <img
      src={current}
      alt={alt}
      className="w-full h-full object-contain"
      onError={() => current !== '/product_placeholder.svg' && setCurrent('/product_placeholder.svg')}
    />
  );
}

export function ProductDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { items, refresh, setQuantity } = useCartStore();

  const qty = useMemo(() => {
    if (!product) return 0;
    const it = items.find((i) => i.productId === product.id);
    return it?.quantity ?? 0;
  }, [items, product]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await apiFetch<{ success: boolean; product: Product }>(`/products/${id}`);
        setProduct(data.product);
        await refresh();
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load product');
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-md w-full">
          <div className="font-black text-gray-900">Could not load product</div>
          <div className="text-sm text-gray-600 font-semibold mt-1">{error}</div>
          <Link to="/customer" className="inline-block mt-4 text-brand-900 font-black underline">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="text-gray-600 font-semibold">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => nav(-1)} className="font-black text-brand-900">
            ← Back
          </button>
          <Link to="/cart" className="font-black text-brand-900 hover:underline">
            Cart
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden md:flex md:gap-6">
          <div className="md:w-1/2 bg-gray-50 p-6">
            <div className="aspect-square">
              <Img src={imageBySku[product.sku]} alt={product.name} />
            </div>
          </div>
          <div className="md:w-1/2 p-6">
            <div className="text-xs font-semibold text-gray-500">{product.sku}</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{product.name}</div>
            <div className="text-sm text-gray-600 font-semibold mt-3">{product.description ?? 'No description available.'}</div>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500">Price</div>
                <div className="text-2xl font-black text-brand-900">₹{product.price}</div>
              </div>
              <div className="text-sm font-semibold text-gray-500">{product.stock} in stock</div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 font-black text-brand-900 disabled:opacity-50"
                disabled={qty <= 0}
                onClick={() => setQuantity(product.id, Math.max(0, qty - 1))}
              >
                -
              </button>
              <div className="w-10 text-center text-lg font-black">{qty}</div>
              <button
                className="w-10 h-10 rounded-full bg-brand-900 text-white font-black disabled:opacity-50"
                disabled={product.stock <= 0}
                onClick={() => setQuantity(product.id, qty + 1)}
              >
                +
              </button>

              <Link
                to="/cart"
                className="ml-auto px-5 py-3 rounded-2xl bg-brand-900 text-white font-black hover:bg-brand-500"
              >
                Go to cart
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

