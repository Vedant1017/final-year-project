import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/useAuthStore';

export function ProtectedRoute({ role, children }: { role?: UserRole; children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

