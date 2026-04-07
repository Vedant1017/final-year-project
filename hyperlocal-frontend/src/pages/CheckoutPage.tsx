import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export function CheckoutPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { token } = useAuthStore();
  const orderId = params.get('orderId');
  const [status, setStatus] = useState<'PENDING_PAYMENT' | 'PAID' | 'ERROR'>('PENDING_PAYMENT');
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!token || !orderId) return;
    setError(null);
    try {
      const data = await apiFetch<{ success: boolean; order: { id: string; status: 'PAID' } }>(
        '/checkout/payments/mock/confirm',
        { token, method: 'POST', body: { orderId } }
      );
      setStatus(data.order.status);
      setTimeout(() => nav('/customer'), 800);
    } catch (e: any) {
      setStatus('ERROR');
      setError(e?.message ?? 'Payment confirmation failed');
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-md w-full">
          <div className="font-black text-gray-900 text-lg">Missing orderId</div>
          <Link to="/cart" className="text-brand-900 font-bold underline mt-2 inline-block">
            Back to cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-md w-full">
        <div className="text-sm text-gray-500 font-semibold">Mock payment</div>
        <div className="text-xl font-black text-gray-900 mt-1">Order {orderId}</div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}

        <div className="mt-4 text-sm text-gray-600">
          Click confirm to mark this order as <span className="font-black">PAID</span>.
        </div>

        <button
          onClick={confirm}
          disabled={!token || status === 'PAID'}
          className="mt-5 w-full rounded-xl bg-brand-900 text-white font-black py-2.5 disabled:opacity-60"
        >
          {status === 'PAID' ? 'Paid' : 'Confirm payment'}
        </button>

        <Link to="/customer" className="block text-center mt-4 text-gray-600 font-bold hover:underline">
          Back to shopping
        </Link>
      </div>
    </div>
  );
}

