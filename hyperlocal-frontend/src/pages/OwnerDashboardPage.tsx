import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

type Order = { id: string; status: string; totalAmount: string; createdAt: string; shopId: string };
type InventoryProduct = { id: string; sku: string; name: string; description: string | null; price: string; stock: number; shopId: string };
type InventoryShop = { id: string; name: string; products: InventoryProduct[] };

export function OwnerDashboardPage() {
  const { token, logout, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'orders' | 'inventory'>('orders');
  const [shops, setShops] = useState<InventoryShop[]>([]);
  const [restockAmountByProductId, setRestockAmountByProductId] = useState<Record<string, number>>({});

  const load = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; orders: Order[] }>('/owner/orders', { token });
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; shops: InventoryShop[] }>('/owner/inventory', { token });
      setShops(data.shops);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const fulfill = async (orderId: string) => {
    if (!token) return;
    await apiFetch(`/owner/orders/${orderId}/fulfill`, { token, method: 'POST', body: {} });
    await load();
  };

  const clearAllOrders = async () => {
    if (!token) return;
    const ok = window.confirm('Clear ALL orders for all your shops? This cannot be undone.');
    if (!ok) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/owner/orders/clear`, { token, method: 'POST', body: {} });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to clear orders');
    } finally {
      setLoading(false);
    }
  };

  const restock = async (productId: string) => {
    if (!token) return;
    const amt = restockAmountByProductId[productId] ?? 10;
    await apiFetch(`/owner/products/${productId}/restock`, { token, method: 'POST', body: { amount: amt } });
    await loadInventory();
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status === 'PAID').length;
    const fulfilled = orders.filter((o) => o.status === 'FULFILLED').length;
    const pending = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
    const revenue = orders
      .filter((o) => o.status === 'PAID' || o.status === 'FULFILLED')
      .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
    return { total, paid, fulfilled, pending, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!q) return true;
      return o.id.toLowerCase().includes(q);
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-black text-brand-900">SnapCart Lite • Owner</div>
            <div className="text-sm text-gray-500 font-semibold">{user?.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (tab === 'orders' ? load() : loadInventory())}
              className="px-4 py-2 rounded-xl bg-brand-900 text-white font-black disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button onClick={logout} className="px-4 py-2 rounded-xl bg-gray-100 font-black text-gray-700">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 rounded-xl font-black border ${
              tab === 'orders' ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-brand-900 border-gray-100'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => {
              setTab('inventory');
              loadInventory().catch((e) => setError(e.message));
            }}
            className={`px-4 py-2 rounded-xl font-black border ${
              tab === 'inventory' ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-brand-900 border-gray-100'
            }`}
          >
            Inventory & Restock
          </button>
        </div>

        {tab === 'orders' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500">Total</div>
                <div className="text-2xl font-black text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500">Pending</div>
                <div className="text-2xl font-black text-gray-900">{stats.pending}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500">Paid</div>
                <div className="text-2xl font-black text-gray-900">{stats.paid}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500">Fulfilled</div>
                <div className="text-2xl font-black text-gray-900">{stats.fulfilled}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm col-span-2 md:col-span-1">
                <div className="text-xs font-semibold text-gray-500">Revenue</div>
                <div className="text-2xl font-black text-brand-900">₹{stats.revenue.toFixed(2)}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'PENDING_PAYMENT', 'PAID', 'FULFILLED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                      statusFilter === s ? 'bg-brand-900 text-white border-brand-900' : 'bg-brand-50 text-brand-900 border-brand-100'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  className="w-full md:w-64 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Search by order id…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  onClick={clearAllOrders}
                  className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 disabled:opacity-50"
                  disabled={loading || orders.length === 0}
                >
                  Clear orders
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 font-black text-gray-900 flex items-center justify-between">
                <span>Orders</span>
                <span className="text-xs font-semibold text-gray-500">{filteredOrders.length} shown</span>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="p-4 text-gray-500 font-semibold">No orders yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredOrders.map((o) => (
                    <div key={o.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-black text-gray-900">{o.id}</div>
                        <div className="text-sm text-gray-500">Status: {o.status}</div>
                        <div className="text-sm text-gray-500">Total: ₹{o.totalAmount}</div>
                        <div className="text-xs text-gray-400 font-semibold mt-1">
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                            o.status === 'PAID'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : o.status === 'FULFILLED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {o.status}
                        </span>
                        <button
                          onClick={() => fulfill(o.id)}
                          disabled={o.status !== 'PAID'}
                          className="px-4 py-2 rounded-xl bg-brand-900 text-white font-black disabled:opacity-50"
                        >
                          Mark fulfilled
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'inventory' && (
          <div className="space-y-4">
            {shops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-gray-500 font-semibold">
                No shops found.
              </div>
            ) : (
              shops.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 font-black text-gray-900 flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-xs font-semibold text-gray-500">{s.products.length} items</span>
                  </div>
                  {s.products.length === 0 ? (
                    <div className="p-4 text-gray-500 font-semibold">No products.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {s.products.map((p) => {
                        const amt = restockAmountByProductId[p.id] ?? 10;
                        return (
                          <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="font-black text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500 font-semibold">{p.sku}</div>
                              <div className="text-xs text-gray-600 font-semibold mt-1 line-clamp-2">{p.description ?? ''}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-black text-brand-900">Stock: {p.stock}</div>
                              <input
                                type="number"
                                min={1}
                                max={1000}
                                value={amt}
                                onChange={(e) =>
                                  setRestockAmountByProductId((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))
                                }
                                className="w-20 rounded-xl border border-gray-200 px-2 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <button
                                onClick={() => restock(p.id)}
                                className="px-4 py-2 rounded-xl bg-brand-900 text-white font-black"
                              >
                                Restock
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

