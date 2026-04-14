import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export function OrderListPage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data } = await api.get('checkout/orders');
        if (!cancelled) setOrders(data.orders ?? []);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Could not load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-brand-50 text-gray-900 font-sans pb-24">
      <header className="bg-white/90 backdrop-blur-md shadow-sm relative z-20 p-4 sticky top-0 border-b border-gray-100">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => nav('/customer')} className="font-black text-brand-900 text-sm hover:underline">
              ← Back to Shop
            </button>
          </div>
          <div className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">Order History</div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl pt-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">All Orders</h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 font-semibold">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 font-semibold text-lg">
            You don't have any orders yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((o) => {
              let bgClass = "bg-white border-gray-100 hover:border-gray-300";
              let textClassPrimary = "text-gray-900";
              let textClassSecondary = "text-gray-500";
              
              if (['COMPLETED', 'DELIVERED'].includes(o.status)) {
                bgClass = "bg-green-50 border-green-200 hover:bg-green-100";
                textClassPrimary = "text-green-900";
                textClassSecondary = "text-green-700";
              } else if (['CANCELED', 'CANCELLED'].includes(o.status)) {
                bgClass = "bg-red-50 border-red-200 hover:bg-red-100";
                textClassPrimary = "text-red-900";
                textClassSecondary = "text-red-700";
              } else {
                bgClass = "bg-black hover:bg-gray-900 border-black";
                textClassPrimary = "text-white";
                textClassSecondary = "text-gray-300";
              }

              return (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className={`border shadow-sm p-5 rounded-2xl transition-all flex flex-col justify-between ${bgClass}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className={`font-black text-lg ${textClassPrimary}`}>Order {o.id.substring(0, 8)}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${textClassSecondary}`}>
                        {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className={`font-black text-xl ${textClassPrimary}`}>
                      ₹{o.totalAmount}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-bold rounded-md px-2 py-1 inline-block ${
                      ['COMPLETED', 'DELIVERED', 'CANCELED', 'CANCELLED'].includes(o.status) ? 'bg-white/50' : 'bg-white/20 text-white'
                    }`}>
                      {o.status.replace(/_/g, ' ')}
                    </div>
                    <div className={`text-sm font-black ${textClassPrimary}`}>
                      View Details →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
