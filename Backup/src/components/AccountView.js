import React, { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import PromotionsManager from "./PromotionsManager";
import CanceledSales from "./CanceledSales";
import UsersManager from "./UsersManager";
import "./AccountView.css";

const AccountView = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPromotions, setShowPromotions] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setIsDarkTheme(newTheme === "dark");
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="account-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      {user ? (
        <div className="account-content">
          {/* Profile Section */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="avatar-container">
                <img
                  src={user.photoURL || "/logo192.png"}
                  alt="Avatar"
                  className="avatar"
                />
                <div className="status-indicator"></div>
              </div>
              <div className="profile-info">
                <h1 className="profile-name">{user.displayName || "Usuário"}</h1>
                <p className="profile-email">{user.email}</p>

              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="settings-card">
            <h2 className="settings-title">⚙️ Configurações</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Tema da Interface</span>
                <span className="setting-description">
                  {isDarkTheme ? "Modo escuro ativo" : "Modo claro ativo"}
                </span>
              </div>
              <button 
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={isDarkTheme ? "Mudar para tema claro" : "Mudar para tema escuro"}
              >
                <span className="theme-icon">
                  {isDarkTheme ? "☀️" : "🌙"}
                </span>
                <span className="theme-text">
                  {isDarkTheme ? "Claro" : "Escuro"}
                </span>
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Tipo de Usuário</span>
                <span className="setting-description">
                  Acesso total ao sistema
                </span>
              </div>
              <div className="status-badge admin">
                👑 Administrador
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Tipo de Conta</span>
                <span className="setting-description">Conta Google conectada</span>
              </div>
              <div className="account-type-badge">
                <span>🔵 Google</span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="actions-card">
            <h2 className="actions-title">🛠️ Ações Rápidas</h2>
            
            <button className="action-btn primary" onClick={() => setShowUsers(true)}>
              <span className="action-icon">👥</span>
              <div className="action-content">
                <span className="action-label">Gerenciar Usuários</span>
                <span className="action-description">Adicionar ou remover usuários</span>
              </div>
            </button>

            <button className="action-btn secondary" onClick={() => setShowPromotions(true)}>
              <span className="action-icon">🎯</span>
              <div className="action-content">
                <span className="action-label">Promoções</span>
                <span className="action-description">Configurar ofertas e descontos</span>
              </div>
            </button>

            <button className="action-btn tertiary" onClick={() => setShowCanceled(true)}>
              <span className="action-icon">🗑️</span>
              <div className="action-content">
                <span className="action-label">Cancelamentos</span>
                <span className="action-description">Ver vendas canceladas</span>
              </div>
            </button>
          </div>

          {/* Logout Section */}
          <div className="logout-section">
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">🚪</span>
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="login-content">
          <div className="login-card">
            <div className="login-header">
              <div className="login-icon">🔐</div>
              <h1>Bem-vindo!</h1>
              <p>Faça login para acessar sua conta</p>
            </div>
            
            <button className="google-login-btn" onClick={signInWithGoogle}>
              <span className="google-icon">🔵</span>
              <span>Entrar com Google</span>
            </button>
            
            <div className="login-footer">
              <p>Acesso seguro e rápido com sua conta Google</p>
            </div>
          </div>
        </div>
      )}
      
      {showPromotions && <PromotionsManager onClose={() => setShowPromotions(false)} />}
      {showCanceled && <CanceledSales onClose={() => setShowCanceled(false)} onRestore={() => window.dispatchEvent(new Event('salesUpdated'))} />}
      {showUsers && <UsersManager onClose={() => setShowUsers(false)} />}
    </div>
  );
};

export default AccountView;