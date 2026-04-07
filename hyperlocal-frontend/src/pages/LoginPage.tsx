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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-black text-brand-900">SnapCart Lite</h1>
        <div className="text-sm font-semibold text-gray-500 mt-0.5">Login</div>
        <p className="text-sm text-gray-500 mt-1">
          Demo accounts: <span className="font-semibold">customer@demo.com</span> / password123,{' '}
          <span className="font-semibold">owner@demo.com</span> / password123
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-bold text-gray-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              type="password"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600 font-semibold">{error}</div>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-brand-900 text-white font-bold py-2.5 hover:bg-brand-500 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

