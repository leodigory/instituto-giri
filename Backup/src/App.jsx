import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
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

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);
  return (
    <Router>
      <div className="app">
        {/* Top Header */}
        <header className="app-header">
          <h1>Sistema de Vendas Instituto Giri</h1>
        </header>

        {/* Main Content */}
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/estoque" element={<Inventory />} />
            <Route path="/vendas" element={<SalesCreation />} />
            <Route path="/historico" element={<SalesHistory />} />
            <Route path="/conta" element={<AccountView />} />
            <Route path="/view" element={<SalesView />} />
            <Route path="/test" element={<TestSales />} />
            <Route path="/account" element={<AccountView />} />
            <Route
              path="/progress"
              element={
                <ProgressBar progress={75} label="Progresso de Vendas" />
              }
            />
          </Routes>
        </div>

        {/* Bottom Navigation */}
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
      </div>
    </Router>
  );
}

export default App;
