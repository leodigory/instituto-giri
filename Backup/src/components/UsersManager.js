import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import "./UsersManager.css";

const UsersManager = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
  });

  useEffect(() => {
    loadUsers();
    syncCurrentUser();
  }, []);

  const syncCurrentUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === '01leonardoaraujo@gmail.com') {
      const usersQuery = query(collection(db, "users"), where("email", "==", currentUser.email));
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        await addDoc(collection(db, "users"), {
          name: currentUser.displayName || "Leonardo Araujo",
          email: currentUser.email,
          role: "admin",
          createdAt: new Date(),
        });
        await loadUsers();
      } else {
        const userDoc = snapshot.docs[0];
        const updates = {};
        if (userDoc.data().role !== "admin") updates.role = "admin";
        if (!userDoc.data().name && currentUser.displayName) updates.name = currentUser.displayName;
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, "users", userDoc.id), updates);
          await loadUsers();
        }
      }
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          name: data.displayName || data.name || data.email?.split('@')[0] || 'Usuário'
        };
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const existingQuery = query(collection(db, "users"), where("email", "==", formData.email));
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const userDoc = existingSnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          name: formData.name,
          role: formData.role,
        });
        alert("Usuário atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "users"), {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          createdAt: new Date(),
        });
        alert("Usuário adicionado com sucesso!");
      }
      await loadUsers();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Deseja realmente remover este usuário?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        await loadUsers();
        alert("Usuário removido com sucesso!");
      } catch (error) {
        console.error("Erro ao remover usuário:", error);
        alert("Erro ao remover usuário");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "user" });
    setShowForm(false);
  };

  return (
    <div className="users-manager">
      <div className="users-header">
        <h2>👥 Gerenciar Usuários</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {!showForm ? (
        <>
          <button className="add-user-btn" onClick={() => setShowForm(true)}>
            ➕ Adicionar Usuário
          </button>

          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            <div className="users-list">
              {users.length === 0 ? (
                <p className="empty-state">Nenhum usuário cadastrado</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <h3>{user.name}</h3>
                      <span className="user-email">{user.email}</span>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === "admin" ? "👑 Admin" : 
                         user.role === "gerente" ? "📊 Gerente" : "👤 Usuário"}
                      </span>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className="edit-btn" onClick={() => {
                        setFormData({
                          name: user.displayName || user.name || user.email.split('@')[0],
                          email: user.email,
                          role: user.role
                        });
                        setShowForm(true);
                      }}>
                        ✏️
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(user.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>Adicionar Usuário</h3>

          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nome do usuário"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
              readOnly={formData.email !== ""}
            />
          </div>

          <div className="form-group">
            <label>Função</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user">Usuário</option>
              <option value="gerente">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              Adicionar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UsersManager;
