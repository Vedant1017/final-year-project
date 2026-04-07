import React, { useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'COD';

function FakeQr({ value }: { value: string }) {
  // Simple deterministic “QR-like” pattern (demo only)
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
    const size = 29;
    const out: boolean[] = [];
    for (let i = 0; i < size * size; i++) {
      h = (h * 1664525 + 1013904223) >>> 0;
      out.push((h & 1) === 1);
    }
    return { size, out };
  }, [value]);

  const s = cells.size;
  const block = 6;
  const pad = 14;
  const dim = s * block + pad * 2;

  const isFinder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    return inBox(0, 0) || inBox(s - 7, 0) || inBox(0, s - 7);
  };

  return (
    <svg width="100%" viewBox={`0 0 ${dim} ${dim}`} className="rounded-2xl bg-white border border-gray-100">
      <rect x="0" y="0" width={dim} height={dim} fill="#ffffff" />
      {Array.from({ length: s * s }).map((_, idx) => {
        const x = idx % s;
        const y = Math.floor(idx / s);
        const on = cells.out[idx];
        const finder = isFinder(x, y);
        const color = finder ? '#0F172A' : on ? '#16A34A' : '#ffffff';
        // draw finder squares as a solid pattern
        if (finder) {
          const inBorder = x === 0 || y === 0 || x === 6 || y === 6 || x === s - 7 || y === s - 7 || x === s - 1 || y === s - 1;
          const inCenter = (x === 3 && y === 3) || (x === s - 4 && y === 3) || (x === 3 && y === s - 4);
          const fill = inBorder || inCenter ? '#0F172A' : '#ffffff';
          return (
            <rect
              key={idx}
              x={pad + x * block}
              y={pad + y * block}
              width={block}
              height={block}
              fill={fill}
            />
          );
        }
        if (!on) return null;
        return (
          <rect
            key={idx}
            x={pad + x * block}
            y={pad + y * block}
            width={block}
            height={block}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

export function CheckoutPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { token } = useAuthStore();
  const orderId = params.get('orderId');
  const [status, setStatus] = useState<'PENDING_PAYMENT' | 'PAID' | 'ERROR'>('PENDING_PAYMENT');
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [netbanking, setNetbanking] = useState({ bank: '', userId: '' });

  const isCardValid =
    card.number.replace(/\s/g, '').length >= 12 &&
    card.name.trim().length >= 2 &&
    /^\d{2}\/\d{2}$/.test(card.expiry.trim()) &&
    /^\d{3,4}$/.test(card.cvv.trim());

  const isNetbankingValid = netbanking.bank.trim().length > 0 && netbanking.userId.trim().length >= 3;

  const confirm = async () => {
    if (!token || !orderId) return;
    setError(null);
    try {
      const data = await apiFetch<{ success: boolean; order: { id: string; status: 'PAID'; method?: PaymentMethod } }>(
        '/checkout/payments/mock/confirm',
        { token, method: 'POST', body: { orderId, method } }
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
        <div className="text-sm text-gray-500 font-semibold">Payment</div>
        <div className="text-xl font-black text-gray-900 mt-1">Order {orderId}</div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}

        <div className="mt-4">
          <div className="text-sm font-black text-gray-900 mb-2">Choose a payment method</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'UPI', label: 'UPI (QR)' },
              { id: 'CARD', label: 'Card' },
              { id: 'NETBANKING', label: 'NetBanking' },
              { id: 'COD', label: 'Cash on Delivery' }
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`px-3 py-2 rounded-xl border text-sm font-black ${
                  method === m.id ? 'bg-brand-900 text-white border-brand-900' : 'bg-brand-50 text-brand-900 border-brand-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {method === 'UPI' && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">Scan the QR (fake) to pay</div>
            <FakeQr value={`snapcart-lite|${orderId}`} />
            <div className="mt-2 text-xs text-gray-500 font-semibold">
              UPI ID: <span className="font-black text-brand-900">snapcartlite@upi</span> (demo)
            </div>
          </div>
        )}

        {method === 'COD' && (
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-gray-700 font-semibold">
            You’ll pay cash to the delivery partner at your doorstep.
          </div>
        )}

        {method === 'CARD' && (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-sm font-black text-gray-900 mb-3">Enter card details (demo)</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-gray-700">Card number</label>
                <input
                  value={card.number}
                  onChange={(e) => setCard((p) => ({ ...p, number: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-700">Name on card</label>
                <input
                  value={card.name}
                  onChange={(e) => setCard((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Vedant Sharma"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-700">Expiry (MM/YY)</label>
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard((p) => ({ ...p, expiry: e.target.value }))}
                    placeholder="08/28"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-700">CVV</label>
                  <input
                    value={card.cvv}
                    onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value }))}
                    placeholder="123"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                This is a demo form. No real payment is processed.
              </div>
            </div>
          </div>
        )}

        {method === 'NETBANKING' && (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-sm font-black text-gray-900 mb-3">NetBanking details (demo)</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-gray-700">Select bank</label>
                <select
                  value={netbanking.bank}
                  onChange={(e) => setNetbanking((p) => ({ ...p, bank: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Choose a bank</option>
                  <option value="SBI">SBI</option>
                  <option value="HDFC">HDFC</option>
                  <option value="ICICI">ICICI</option>
                  <option value="AXIS">Axis</option>
                  <option value="KOTAK">Kotak</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-700">User ID</label>
                <input
                  value={netbanking.userId}
                  onChange={(e) => setNetbanking((p) => ({ ...p, userId: e.target.value }))}
                  placeholder="your-netbanking-id"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                This is a demo form. No real bank login is performed.
              </div>
            </div>
          </div>
        )}

        {(method === 'CARD' || method === 'NETBANKING') && (
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-gray-700 font-semibold">
            This is a demo. Click confirm to simulate a successful {method === 'CARD' ? 'card' : 'netbanking'} payment.
          </div>
        )}

        <button
          onClick={confirm}
          disabled={
            !token ||
            status === 'PAID' ||
            (method === 'CARD' && !isCardValid) ||
            (method === 'NETBANKING' && !isNetbankingValid)
          }
          className="mt-5 w-full rounded-xl bg-brand-900 text-white font-black py-2.5 disabled:opacity-60"
        >
          {status === 'PAID' ? 'Payment confirmed' : method === 'COD' ? 'Place COD order' : 'Confirm payment'}
        </button>

        <Link to="/customer" className="block text-center mt-4 text-gray-600 font-bold hover:underline">
          Back to shopping
        </Link>
      </div>
    </div>
  );
}

