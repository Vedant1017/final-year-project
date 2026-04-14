import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useCartStore } from '../store/useCartStore';

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

function Img({ src, alt }) {
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
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const { items, refresh, setQuantity, loading } = useCartStore();

  const storeQty = useMemo(() => {
    if (!product) return 0;
    const it = items.find((i) => i.productId === product.id);
    return it?.quantity ?? 0;
  }, [items, product]);

  const [localQty, setLocalQty] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLocalQty(storeQty);
  }, [storeQty]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        await refresh();
      } catch (e) {
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

  const handleUpdateCart = async () => {
    setUpdating(true);
    try {
      await setQuantity(product.id, localQty);
      // Wait for store to refresh it
      await refresh();
    } finally {
      setUpdating(false);
    }
  };

  const isChanged = localQty !== storeQty;

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => nav(-1)} className="font-black text-brand-900 tracking-tight">
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
              <Img src={product.imageUrl || imageBySku[product.sku]} alt={product.name} />
            </div>
          </div>
          <div className="md:w-1/2 p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{product.sku}</div>
              <div className="text-3xl font-black text-gray-900 mt-2 leading-tight">{product.name}</div>
              <div className="text-sm text-gray-600 font-semibold mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">{product.description ?? 'No description available.'}</div>
              
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-500">Price</div>
                  <div className="text-3xl font-black text-brand-900">₹{product.price}</div>
                </div>
                <div className="text-sm font-black text-green-700 bg-green-100 px-3 py-1.5 rounded-full">{product.stock} in stock</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl w-max border border-gray-200">
                  <button
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm font-black text-brand-900 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                    disabled={localQty <= 0}
                    onClick={() => setLocalQty(Math.max(0, localQty - 1))}
                  >
                    -
                  </button>
                  <div className="w-12 text-center text-xl font-black">{localQty}</div>
                  <button
                    className="w-12 h-12 rounded-xl bg-brand-900 shadow-sm text-white font-black disabled:opacity-50 hover:bg-brand-800 transition-colors"
                    disabled={product.stock <= 0}
                    onClick={() => setLocalQty(localQty + 1)}
                  >
                    +
                  </button>
                </div>
                
                <div className="flex gap-3 mt-2">
                  <button
                    disabled={!isChanged || updating}
                    onClick={handleUpdateCart}
                    className="flex-1 px-5 py-4 rounded-2xl bg-brand-900 text-white font-black hover:bg-brand-500 disabled:opacity-50 transition-all text-lg"
                  >
                    {updating ? 'Updating...' : isChanged ? 'Update Cart' : 'In Cart'}
                  </button>

                  <Link
                    to="/cart"
                    className="flex-1 text-center px-5 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-gray-800 transition-all text-lg"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
