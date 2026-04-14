import React, { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export function CartPage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const { items, refresh, loading } = useCartStore();
  const [error, setError] = useState(null);
  
  const [localItems, setLocalItems] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLocalItems(items.map(i => ({...i})));
  }, [items]);

  const total = useMemo(() => {
    return localItems.reduce((sum, i) => sum + (i.product ? Number(i.product.price) * i.quantity : 0), 0);
  }, [localItems]);

  const handleLocalChange = (productId, newQty) => {
    setLocalItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, newQty) } : i));
  };

  const isChanged = localItems.some(li => {
    const si = items.find(i => i.productId === li.productId);
    return si && si.quantity !== li.quantity;
  });

  const handleUpdateCart = async () => {
    setUpdating(true);
    setError(null);
    try {
      for (const li of localItems) {
        const storeItem = items.find(i => i.productId === li.productId);
        if (storeItem && storeItem.quantity !== li.quantity) {
          await api.post('/cart/items', { productId: li.productId, quantity: li.quantity });
        }
      }
      await refresh();
    } catch(e) {
      setError(e.message || 'Failed to update cart');
    } finally {
      setUpdating(false);
    }
  };

  const checkout = async () => {
    if (!token) return;
    if (isChanged) {
      await handleUpdateCart();
    }
    setError(null);
    nav(`/checkout`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/customer" className="font-black text-brand-900">
            ← Back to Shop
          </Link>
          <div className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">Your Cart</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading && items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-semibold">Loading your cart…</div>
          ) : localItems.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-semibold text-lg">Your cart is empty.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {localItems.map((i) => (
                <div key={i.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-black text-gray-900 line-clamp-1">{i.product?.name ?? 'Unknown product'}</div>
                    <div className="text-sm text-gray-500 font-semibold">{i.product?.sku}</div>
                    <div className="text-sm font-black text-brand-900 mt-1">₹{Number(i.product?.price ?? 0)}/ea</div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="font-black text-gray-900 text-lg">₹{(Number(i.product?.price ?? 0) * i.quantity).toFixed(2)}</div>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl border border-gray-200">
                      <button
                        onClick={() => handleLocalChange(i.productId, i.quantity - 1)}
                        className="w-10 h-10 rounded-xl bg-transparent text-gray-700 hover:bg-gray-200 font-black"
                      >
                        -
                      </button>
                      <div className="w-8 text-center font-black">{i.quantity}</div>
                      <button
                        onClick={() => handleLocalChange(i.productId, i.quantity + 1)}
                        className="w-10 h-10 rounded-xl bg-transparent text-gray-700 hover:bg-gray-200 font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {localItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 sticky bottom-4">
            <div>
              <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Amount</div>
              <div className="text-3xl font-black text-brand-900">₹{total.toFixed(2)}</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {isChanged && (
                <button
                  onClick={handleUpdateCart}
                  disabled={updating}
                  className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-gray-900 text-white font-black whitespace-nowrap hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Cart'}
                </button>
              )}
              <button
                onClick={checkout}
                disabled={!token || localItems.length === 0 || updating}
                className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-brand-900 text-white font-black hover:bg-brand-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
