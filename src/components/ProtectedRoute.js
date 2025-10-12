import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Verificar status do usuário
        try {
          const usersQuery = query(collection(db, "users"), where("email", "==", currentUser.email));
          const snapshot = await getDocs(usersQuery);
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            setUserStatus(userData.status || "approved");
          } else {
            setUserStatus("pending");
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
          setUserStatus("pending");
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid var(--border-color)',
            borderTop: '4px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/conta" replace />;
  }

  // Se o usuário não está aprovado, redirecionar para conta
  if (userStatus !== "approved") {
    return <Navigate to="/conta" replace />;
  }

  return children;
};

export default ProtectedRoute;
