import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import "./UsersManager.css";

const UsersManager = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
          status: "approved",
          createdAt: new Date(),
        });
        await loadUsers();
      } else {
        const userDoc = snapshot.docs[0];
        const updates = {};
        if (userDoc.data().role !== "admin") updates.role = "admin";
        if (userDoc.data().status !== "approved") updates.status = "approved";
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
          name: data.displayName || data.name || data.email?.split('@')[0] || 'Usuário',
          status: data.status || "approved"
        };
      });
      
      // Ordenar: pendentes primeiro, depois aprovados, depois negados
      usersList.sort((a, b) => {
        const statusOrder = { pending: 0, approved: 1, denied: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "approved"
      });
      await loadUsers();
      alert("Usuário aprovado com sucesso!");
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
      alert("Erro ao aprovar usuário");
    }
  };

  const handleDeny = async (userId) => {
    if (window.confirm("Deseja realmente negar o acesso deste usuário?")) {
      try {
        await updateDoc(doc(db, "users", userId), {
          status: "denied"
        });
        await loadUsers();
        alert("Acesso negado com sucesso!");
      } catch (error) {
        console.error("Erro ao negar usuário:", error);
        alert("Erro ao negar usuário");
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Editar usuário existente
        await updateDoc(doc(db, "users", editingUser.id), {
          name: formData.name,
          role: formData.role,
        });
        alert("Usuário atualizado com sucesso!");
      } else {
        // Adicionar novo usuário
        const existingQuery = query(collection(db, "users"), where("email", "==", formData.email));
        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty) {
          alert("Este email já está cadastrado!");
          return;
        }
        
        await addDoc(collection(db, "users"), {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: "approved",
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

  const handleDelete = async (userId, userEmail) => {
    // Proteger admin
    if (userEmail === '01leonardoaraujo@gmail.com') {
      alert("O administrador principal não pode ser excluído!");
      return;
    }
    
    if (window.confirm("Deseja realmente excluir este usuário? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        await loadUsers();
        alert("Usuário excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao excluir usuário");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "user" });
    setEditingUser(null);
    setShowForm(false);
  };

  const isAdmin = (email) => email === '01leonardoaraujo@gmail.com';

  const pendingUsers = users.filter(u => u.status === "pending");
  const approvedUsers = users.filter(u => u.status === "approved");
  const deniedUsers = users.filter(u => u.status === "denied");

  return (
    <div className="users-manager-overlay" onClick={onClose}>
      <div className="users-manager" onClick={(e) => e.stopPropagation()}>
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
              <div className="users-content">
                {/* Usuários Pendentes */}
                {pendingUsers.length > 0 && (
                  <div className="users-section">
                    <h3 className="section-title pending">⏳ Aguardando Aprovação ({pendingUsers.length})</h3>
                    <div className="users-list">
                      {pendingUsers.map((user) => (
                        <div key={user.id} className="user-card pending">
                          <div className="user-info">
                            <h4>{user.name}</h4>
                            <span className="user-email">{user.email}</span>
                            <span className="status-badge pending">⏳ Pendente</span>
                          </div>
                          <div className="user-actions">
                            <button 
                              className="approve-btn" 
                              onClick={() => handleApprove(user.id)}
                              title="Aprovar usuário"
                            >
                              ✓
                            </button>
                            <button 
                              className="deny-btn" 
                              onClick={() => handleDeny(user.id)}
                              title="Negar acesso"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usuários Aprovados */}
                {approvedUsers.length > 0 && (
                  <div className="users-section">
                    <h3 className="section-title approved">✓ Usuários Ativos ({approvedUsers.length})</h3>
                    <div className="users-list">
                      {approvedUsers.map((user) => (
                        <div key={user.id} className="user-card approved">
                          <div className="user-info">
                            <h4>{user.name}</h4>
                            <span className="user-email">{user.email}</span>
                            <span className={`role-badge ${user.role}`}>
                              {user.role === "admin" ? "👑 Admin" : 
                               user.role === "gerente" ? "📊 Gerente" :
                               user.role === "voluntario" ? "🤝 Voluntário" : "👤 Usuário"}
                            </span>
                            {isAdmin(user.email) && (
                              <span className="protected-badge">🔒 Protegido</span>
                            )}
                          </div>
                          {!isAdmin(user.email) && (
                            <div className="user-actions">
                              <button 
                                className="edit-btn" 
                                onClick={() => handleEdit(user)}
                                title="Editar usuário"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usuários Negados */}
                {deniedUsers.length > 0 && (
                  <div className="users-section">
                    <h3 className="section-title denied">✕ Acesso Negado ({deniedUsers.length})</h3>
                    <div className="users-list">
                      {deniedUsers.map((user) => (
                        <div key={user.id} className="user-card denied">
                          <div className="user-info">
                            <h4>{user.name}</h4>
                            <span className="user-email">{user.email}</span>
                            <span className="status-badge denied">✕ Negado</span>
                          </div>
                          <div className="user-actions">
                            <button 
                              className="approve-btn" 
                              onClick={() => handleApprove(user.id)}
                              title="Aprovar usuário"
                            >
                              ✓
                            </button>
                            <button 
                              className="delete-btn" 
                              onClick={() => handleDelete(user.id, user.email)}
                              title="Excluir usuário"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {users.length === 0 && (
                  <p className="empty-state">Nenhum usuário cadastrado</p>
                )}
              </div>
            )}
          </>
        ) : (
          <form className="user-form" onSubmit={handleSubmit}>
            <h3>{editingUser ? "Editar Usuário" : "Adicionar Usuário"}</h3>

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
                readOnly={editingUser !== null}
              />
            </div>

            <div className="form-group">
              <label>Função</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Usuário</option>
                <option value="voluntario">Voluntário</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {editingUser && !isAdmin(editingUser.email) && (
              <button 
                type="button" 
                className="delete-user-btn"
                onClick={() => {
                  handleDelete(editingUser.id, editingUser.email);
                  resetForm();
                }}
              >
                🗑️ Excluir Usuário
              </button>
            )}

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancelar
              </button>
              <button type="submit" className="save-btn">
                {editingUser ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
