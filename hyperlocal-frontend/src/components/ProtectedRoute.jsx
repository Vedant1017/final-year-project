import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LocationPrompt } from './LocationPrompt';

/**
 * @param {object} props
 * @param {'CUSTOMER' | 'OWNER' | 'ADMIN'} [props.role]
 * @param {boolean} [props.requireSellerApproved] — for OWNER routes: block unapproved sellers
 * @param {React.ReactNode} props.children
 */
export function ProtectedRoute({ role, requireSellerApproved, children }) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  if (role === 'OWNER' && requireSellerApproved && user.role === 'OWNER' && user.sellerApproved === false) {
    return <Navigate to="/seller/pending" replace />;
  }
  
  if (user.role !== 'ADMIN' && !user.locationPrompted) {
    return <LocationPrompt onComplete={() => window.location.reload()} />;
  }

  return <>{children}</>;
}
