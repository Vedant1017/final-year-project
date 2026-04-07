import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const nav = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState('customer@demo.com');
  const [password, setPassword] = useState('password123');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(email, password);
    nav(user.role === 'OWNER' ? '/owner' : '/customer', { replace: true });
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden grid md:grid-cols-2">
        {/* Left: form */}
        <div className="p-7 md:p-10">
          <div className="flex items-center justify-between">
            <div className="text-2xl md:text-3xl font-black text-brand-900 tracking-tight">SnapCart</div>
            <div className="text-xs font-bold text-gray-500">Welcome back</div>
          </div>

          <div className="mt-6">
            <div className="text-3xl md:text-4xl font-black text-gray-900">Log in</div>
            <div className="text-sm font-semibold text-gray-500 mt-2">Please enter your details to continue.</div>
            <div className="text-xs text-gray-500 mt-3">
              Demo: <span className="font-bold">customer@demo.com</span> / password123 •{' '}
              <span className="font-bold">owner@demo.com</span> / password123
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-black text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-black text-gray-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="text-sm text-red-600 font-semibold">{error}</div>}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-brand-900 text-white font-black py-3 hover:bg-brand-500 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="text-xs text-gray-500 font-semibold pt-2">
              By continuing, you agree this is a demo project (mock payments, simulated tracking).
            </div>
          </form>
        </div>

        {/* Right: image panel */}
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
              Craving something?
              <div className="text-white/80 text-base font-semibold mt-2">Let’s get you started.</div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setEmail('customer@demo.com');
                  setPassword('password123');
                }}
                className="px-6 py-3 rounded-2xl bg-brand-500 text-white font-black hover:opacity-95"
              >
                Get started
              </button>
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

