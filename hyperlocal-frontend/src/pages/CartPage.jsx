import React, { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export function CartPage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const { items, refresh, setQuantity, loading } = useCartStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.product ? Number(i.product.price) * i.quantity : 0), 0);
  }, [items]);

  const checkout = async () => {
    if (!token) return;
    setError(null);
    nav(`/checkout`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/customer" className="font-black text-brand-900">
            HyperLocal
          </Link>
          <div className="text-sm font-bold text-gray-700">Cart</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500 font-semibold">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-gray-500 font-semibold">Your cart is empty.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((i) => (
                <div key={i.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-black text-gray-900">{i.product?.name ?? 'Unknown product'}</div>
                    <div className="text-sm text-gray-500">{i.product?.sku}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(i.productId, i.quantity - 1)}
                      className="w-9 h-9 rounded-full bg-red-50 text-red-700 font-black"
                    >
                      -
                    </button>
                    <div className="w-6 text-center font-black">{i.quantity}</div>
                    <button
                      onClick={() => setQuantity(i.productId, i.quantity + 1)}
                      className="w-9 h-9 rounded-full bg-brand-50 text-brand-900 font-black"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-black text-brand-900">₹{(Number(i.product?.price ?? 0) * i.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 font-semibold">Total</div>
            <div className="text-2xl font-black text-gray-900">₹{total.toFixed(2)}</div>
          </div>
          <button
            onClick={checkout}
            disabled={!token || items.length === 0}
            className="px-6 py-3 rounded-xl bg-brand-900 text-white font-black disabled:opacity-50"
          >
            Checkout
          </button>
        </div>
      </main>
    </div>
  );
}
