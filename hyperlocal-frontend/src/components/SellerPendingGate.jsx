import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/** Only unapproved OWNER accounts; everyone else is redirected away. */
export function SellerPendingGate({ children }) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'CUSTOMER') return <Navigate to="/customer" replace />;
  if (user.role === 'OWNER' && user.sellerApproved) return <Navigate to="/owner" replace />;
  if (user.role !== 'OWNER') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
