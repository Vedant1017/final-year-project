import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function SignupPage() {
  const nav = useNavigate();
  const { signup, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('customer');
  const [localError, setLocalError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    try {
      const user = await signup(email.trim().toLowerCase(), password, accountType);
      if (user.role === 'OWNER' && user.sellerApproved === false) {
        nav('/seller/pending', { replace: true });
      } else if (user.role === 'DELIVERY_MAN') {
        nav('/delivery', { replace: true });
      } else {
        nav('/customer', { replace: true });
      }
    } catch {
      // Error message is in auth store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden grid md:grid-cols-2">
        <div className="p-7 md:p-10">
          <div className="flex items-center justify-between">
            <div className="text-2xl md:text-3xl font-black text-brand-900 tracking-tight">SnapCart</div>
            <div className="text-xs font-bold text-gray-500">New here</div>
          </div>

          <div className="mt-6">
            <div className="text-3xl md:text-4xl font-black text-gray-900">Create account</div>
            <div className="text-sm font-semibold text-gray-500 mt-2">Choose how you’ll use SnapCart.</div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <div className="text-sm font-black text-gray-700 mb-2">I am signing up as</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('customer')}
                  className={`rounded-2xl border-2 px-4 py-3 text-left font-black text-sm transition-colors ${
                    accountType === 'customer'
                      ? 'border-brand-900 bg-brand-50 text-brand-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Customer
                  <div className="text-xs font-semibold text-gray-500 mt-1 font-normal">Shop & checkout</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('delivery_man')}
                  className={`rounded-2xl border-2 px-4 py-3 text-left font-black text-sm transition-colors ${
                    accountType === 'delivery_man'
                      ? 'border-brand-900 bg-brand-50 text-brand-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Delivery Man
                  <div className="text-xs font-semibold text-gray-500 mt-1 font-normal">Deliver orders fast</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('seller')}
                  className={`rounded-2xl border-2 px-4 py-3 text-left font-black text-sm transition-colors ${
                    accountType === 'seller'
                      ? 'border-brand-900 bg-brand-50 text-brand-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Seller
                  <div className="text-xs font-semibold text-gray-500 mt-1 font-normal">Needs admin approval</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-black text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-black text-gray-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm font-black text-gray-700">Confirm password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                type="password"
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />
            </div>

            {accountType === 'seller' && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs font-semibold text-amber-900">
                Seller accounts require admin approval before you can open the owner dashboard.
              </div>
            )}

            {displayError && <div className="text-sm text-red-600 font-semibold">{displayError}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-900 text-white font-black py-3 hover:bg-brand-500 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>

            <div className="text-center text-sm font-semibold text-gray-600 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-900 font-black hover:underline">
                Log in
              </Link>
            </div>

            <div className="text-xs text-gray-500 font-semibold pt-2">
              By continuing, you agree this is a demo project (mock payments, simulated tracking).
            </div>
          </form>
        </div>

        <div className="relative hidden md:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80')"
            }}
          />
          <div className="absolute inset-0 bg-black/45" />

          <div className="absolute inset-0 p-10 flex flex-col justify-center">
            <div className="text-white/90 font-black text-3xl leading-tight">
              Join SnapCart Lite
              <div className="text-white/80 text-base font-semibold mt-2">Customers shop fast. Sellers get approved.</div>
            </div>

            <div className="mt-8 text-white/80 text-xs font-semibold">
              SnapCart Lite • Fast essentials • Simple checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
