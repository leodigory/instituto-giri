import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import SalesCreation from "./components/SalesCreation";
import SalesHistory from "./components/SalesHistory";
import SalesHistoryNew from "./components/SalesHistoryNew";
import SalesView from "./components/SalesView";
import TestSales from "./components/TestSales";
import AccountView from "./components/AccountView";
import ProgressBar from "./components/ProgressBar";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const showNavigation = isAuthenticated && location.pathname !== "/conta";

  return (
    <div className="app">
      {/* Top Header - apenas se autenticado */}
      {isAuthenticated && (
        <header className="app-header">
          <h1>Sistema de Vendas Instituto Giri</h1>
        </header>
      )}

      {/* Main Content */}
      <div className="app-content">
        <Routes>
          {/* Rota pública - Login */}
          <Route path="/conta" element={<AccountView />} />
          <Route path="/account" element={<AccountView />} />

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <ProtectedRoute>
                <SalesCreation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historico"
            element={
              <ProtectedRoute>
                <SalesHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view"
            element={
              <ProtectedRoute>
                <SalesView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <TestSales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressBar progress={75} label="Progresso de Vendas" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* Bottom Navigation - apenas se autenticado */}
      {showNavigation && (
        <nav className="app-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/estoque"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-label">Estoque</span>
          </NavLink>
          <NavLink
            to="/vendas"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-label">Vendas</span>
          </NavLink>
          <NavLink
            to="/historico"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Histórico</span>
          </NavLink>
          <NavLink
            to="/conta"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Conta</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
