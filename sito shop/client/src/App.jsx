import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutConfirmPage from "./pages/CheckoutConfirmPage";
import PaypalReturnPage from "./pages/PaypalReturnPage";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminProductsPage from "./admin/AdminProductsPage";
import AdminOrdersPage from "./admin/AdminOrdersPage";
import AdminDiscountsPage from "./admin/AdminDiscountsPage";
import AdminSettingsPage from "./admin/AdminSettingsPage";
import { apiFetch } from "./lib/api";

export default function App() {
  const [settings, setSettings] = useState({});
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    apiFetch("/store/settings").then(setSettings);
    apiFetch("/store/products/featured").then(setFeatured);
  }, []);

  useEffect(() => {
    if (settings.storeName) {
      document.title = settings.storeName;
    }
  }, [settings]);

  return (
    <Layout settings={settings}>
      <Routes>
        <Route path="/" element={<HomePage featured={featured} settings={settings} />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/paypal-return" element={<PaypalReturnPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage settings={settings} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/confirm"
          element={
            <ProtectedRoute>
              <CheckoutConfirmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="discounts" element={<AdminDiscountsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
