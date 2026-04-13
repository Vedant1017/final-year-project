import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function SellerPendingPage() {
  const nav = useNavigate();
  const { user, logout, refreshProfile } = useAuthStore();

  useEffect(() => {
    const id = setInterval(() => {
      refreshProfile().then((u) => {
        if (u?.role === 'OWNER' && u.sellerApproved) {
          nav('/owner', { replace: true });
        }
      });
    }, 8000);
    return () => clearInterval(id);
  }, [nav, refreshProfile]);

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
        <div className="text-2xl font-black text-brand-900 tracking-tight">SnapCart</div>
        <div className="mt-6 text-2xl font-black text-gray-900">Seller approval pending</div>
        <p className="mt-3 text-sm font-semibold text-gray-600 leading-relaxed">
          Your seller account (<span className="text-gray-900">{user?.email}</span>) is waiting for an administrator to
          approve it. You’ll get access to the owner dashboard after approval.
        </p>
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
          This page checks every few seconds. You can also use &quot;Refresh status&quot; after an admin approves you.
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={async () => {
              const u = await refreshProfile();
              if (u?.role === 'OWNER' && u.sellerApproved) nav('/owner', { replace: true });
            }}
            className="flex-1 rounded-2xl bg-brand-900 text-white font-black py-3 hover:bg-brand-500"
          >
            Refresh status
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              nav('/login');
            }}
            className="flex-1 rounded-2xl bg-gray-100 text-gray-800 font-black py-3 hover:bg-gray-200"
          >
            Log out
          </button>
        </div>
        <Link to="/login" className="mt-6 block text-center text-sm font-bold text-brand-900 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
