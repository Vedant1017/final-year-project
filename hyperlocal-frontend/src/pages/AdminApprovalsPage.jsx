import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export function AdminApprovalsPage() {
  const { logout } = useAuthStore();
  const [pendingSellers, setPendingSellers] = useState([]);
  const [registeredSellers, setRegisteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [pendingRes, registeredRes] = await Promise.all([
        api.get('admin/pending-sellers'),
        api.get('admin/registered-sellers')
      ]);
      setPendingSellers(pendingRes.data.sellers ?? []);
      setRegisteredSellers(registeredRes.data.sellers ?? []);
    } catch (e) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`admin/sellers/${id}/approve`, {});
      await load();
    } catch (e) {
      setError(e?.message ?? 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-black text-brand-900">Admin Dashboard</div>
            <div className="text-xs text-gray-500 font-semibold">Manage sellers on the platform</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 rounded-xl bg-brand-900 text-white font-black text-sm disabled:opacity-50"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-gray-100 font-black text-gray-700 text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-600 font-semibold">Loading…</div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-black text-brand-900 mb-4">Pending Approvals ({pendingSellers.length})</h2>
              {pendingSellers.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600 font-semibold shadow-sm">
                  No pending seller registrations.
                </div>
              ) : (
                <ul className="space-y-3">
                  {pendingSellers.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <div className="font-black text-gray-900">{s.email}</div>
                        <div className="text-xs text-gray-500 font-semibold">
                          Registered: {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => approve(s.id)}
                        className="shrink-0 px-5 py-2.5 rounded-xl bg-brand-900 text-white font-black text-sm hover:bg-brand-500 disabled:opacity-60"
                      >
                        {busyId === s.id ? 'Approving…' : 'Approve seller'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">Registered Owners ({registeredSellers.length})</h2>
              {registeredSellers.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600 font-semibold shadow-sm">
                  No registered sellers yet.
                </div>
              ) : (
                <ul className="space-y-3">
                  {registeredSellers.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <div className="font-black text-gray-900">{s.email}</div>
                        <div className="text-xs text-gray-500 font-semibold">
                          Approved since: {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold border border-green-200">
                        Active
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <Link to="/login" className="mt-8 inline-block text-sm font-bold text-gray-600 hover:text-brand-900 hover:underline">
          ← Back to Login
        </Link>
      </main>
    </div>
  );
}
