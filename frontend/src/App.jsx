import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import Executives from "./pages/Executives";
import ExecutiveDetails from "./pages/ExecutiveDetails";
import Store from "./pages/Store";
import Profile from "./pages/Profile";

import Reports from "./pages/Reports";
import PF from "./pages/PF";
import CollectionHistory from "./pages/CollectionHistory";

function RootPage() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Dashboard /> : <ExecutiveDashboard />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <RootPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/executives" element={
            <ProtectedRoute>
              <AdminRoute>
                <Layout>
                  <Executives />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/executives/:id" element={
            <ProtectedRoute>
              <AdminRoute>
                <Layout>
                  <ExecutiveDetails />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          } />

          <Route path="/store" element={
            <ProtectedRoute>
              <AdminRoute>
                <Layout>
                  <Store />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute>
              <Layout>
                <CollectionHistory />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/pf" element={
            <ProtectedRoute>
              <AdminRoute>
                <Layout>
                  <PF />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
