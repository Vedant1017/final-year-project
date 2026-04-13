import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CustomerHomePage } from './pages/CustomerHomePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { SellerPendingPage } from './pages/SellerPendingPage';
import { AdminApprovalsPage } from './pages/AdminApprovalsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SellerPendingGate } from './components/SellerPendingGate';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { DeliveryDashboardPage } from './pages/DeliveryDashboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/seller/pending"
        element={
          <SellerPendingGate>
            <SellerPendingPage />
          </SellerPendingGate>
        }
      />

      <Route
        path="/customer"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product/:id"
        element={
          <ProtectedRoute role="CUSTOMER">
            <ProductDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute role="CUSTOMER">
            <OrderTrackingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner"
        element={
          <ProtectedRoute role="OWNER" requireSellerApproved>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminApprovalsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/delivery"
        element={
          <ProtectedRoute role="DELIVERY_MAN">
            <DeliveryDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
