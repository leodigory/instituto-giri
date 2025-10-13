import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate,
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
import Ecommerce from "./components/Ecommerce";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        // Carregar role do usuário
        try {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('./firebase/config');
          const usersQuery = query(collection(db, "users"), where("email", "==", user.email));
          const snapshot = await getDocs(usersQuery);
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            setUserRole(userData.role || "user");
          }
        } catch (error) {
          console.error("Erro ao carregar role:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loja"
            element={
              <ProtectedRoute>
                <Ecommerce />
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

      {/* Bottom Navigation - sempre visível */}
      <nav className="app-nav">
        {/* Botões padrão - apenas se autenticado */}
        {isAuthenticated && (userRole === 'admin' || userRole === 'gerente' || userRole === 'voluntario') && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-label">Dashboard</span>
            </NavLink>
            {(userRole === 'admin' || userRole === 'gerente') && (
              <NavLink
                to="/estoque"
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">📦</span>
                <span className="nav-label">Estoque</span>
              </NavLink>
            )}
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
          </>
        )}
        
        {/* Botão Loja - para todos os usuários */}
        {isAuthenticated && (
          <NavLink
            to="/loja"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">🛍️</span>
            <span className="nav-label">Loja</span>
          </NavLink>
        )}
        
        {/* Botão Conta - sempre visível */}
        <NavLink
          to="/conta"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Conta</span>
        </NavLink>
      </nav>
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
