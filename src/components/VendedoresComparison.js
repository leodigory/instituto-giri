import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import "./VendedoresComparison.css";

const VendedoresComparison = ({ onClose }) => {
  const [viewMode, setViewMode] = useState('all');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (viewMode === 'all' && allUsers.length > 0) {
      loadAllUsersSales();
    } else if (viewMode === 'compare' && selectedUsers.length > 0) {
      loadSelectedUsersSales();
    }
  }, [viewMode, allUsers, selectedUsers]);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        displayName: doc.data().name || doc.data().email?.split('@')[0]
      }));
      setAllUsers(usersList);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const loadAllUsersSales = async () => {
    setLoading(true);
    try {
      const salesByUser = {};
      
      // Buscar todas as vendas do Firebase
      const salesSnapshot = await getDocs(collection(db, "Vendas"));
      
      salesSnapshot.forEach((doc) => {
        const sale = doc.data();
        const vendedor = sale.vendedor || "Desconhecido";
        const valorPago = sale.valorPago || 0;
        
        if (!salesByUser[vendedor]) {
          salesByUser[vendedor] = {
            total: 0,
            count: 0
          };
        }
        
        salesByUser[vendedor].total += valorPago;
        salesByUser[vendedor].count += 1;
      });
      
      setSalesData(salesByUser);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedUsersSales = async () => {
    setLoading(true);
    try {
      const salesByUser = {};
      
      // Buscar todas as vendas do Firebase
      const salesSnapshot = await getDocs(collection(db, "Vendas"));
      
      salesSnapshot.forEach((doc) => {
        const sale = doc.data();
        const vendedor = sale.vendedor || "Desconhecido";
        const valorPago = sale.valorPago || 0;
        
        // Apenas processar vendedores selecionados
        if (selectedUsers.find(u => u.displayName === vendedor)) {
          if (!salesByUser[vendedor]) {
            salesByUser[vendedor] = {
              total: 0,
              count: 0
            };
          }
          
          salesByUser[vendedor].total += valorPago;
          salesByUser[vendedor].count += 1;
        }
      });
      
      setSalesData(salesByUser);
    } catch (error) {
      console.error("Erro ao carregar comparação:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchTerm("");
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const filteredUsers = allUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedUsers.find(u => u.id === user.id)
  );

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  const getTotalByUser = (userName) => {
    const userData = salesData[userName];
    return userData ? userData.total : 0;
  };

  const getCountByUser = (userName) => {
    const userData = salesData[userName];
    return userData ? userData.count : 0;
  };
  
  const getMaxTotal = () => {
    let max = 0;
    Object.values(salesData).forEach(data => {
      if (data.total > max) max = data.total;
    });
    return max;
  };

  const displayUsers = viewMode === 'all' ? allUsers : selectedUsers;

  return (
    <div className="comparison-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>📊 Comparar Vendedores</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="comparison-content">
          {/* Toggle de Modo */}
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'all' ? 'active' : ''}
              onClick={() => setViewMode('all')}
            >
              👥 Todos os Vendedores
            </button>
            <button 
              className={viewMode === 'compare' ? 'active' : ''}
              onClick={() => setViewMode('compare')}
            >
              🎯 Comparar Selecionados
            </button>
          </div>

          {/* Seletor de Vendedores (apenas no modo compare) */}
          {viewMode === 'compare' && (
            <div className="user-selector">
              <div className="selected-users">
                {selectedUsers.map((user, index) => (
                  <div key={user.id} className="selected-user-tag" style={{borderColor: colors[index]}}>
                    <span className="user-color" style={{backgroundColor: colors[index]}}></span>
                    <span>{user.displayName}</span>
                    <button onClick={() => removeUser(user.id)}>✕</button>
                  </div>
                ))}
                
                {selectedUsers.length < 8 && (
                  <div className="add-user-container">
                    <input
                      type="text"
                      placeholder="Adicionar vendedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="user-search-input"
                    />
                  </div>
                )}
              </div>

              {searchTerm && filteredUsers.length > 0 && (
                <div className="user-suggestions">
                  {filteredUsers.slice(0, 5).map(user => (
                    <div
                      key={user.id}
                      className="user-suggestion"
                      onClick={() => addUser(user)}
                    >
                      {user.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando dados...</p>
            </div>
          ) : displayUsers.length > 0 ? (
            <>
              {/* Lista de Vendedores */}
              <div className="sellers-list-section">
                <h3>👥 Vendedores Selecionados</h3>
                <div className="sellers-list">
                  {displayUsers.map((user, index) => (
                    <div key={user.id} className="seller-item" style={{borderLeftColor: colors[index % colors.length]}}>
                      <div className="seller-info">
                        <span className="seller-color" style={{backgroundColor: colors[index % colors.length]}}></span>
                        <span className="seller-name">{user.displayName}</span>
                      </div>
                      <div className="seller-stats">
                        <span className="seller-value">R$ {getTotalByUser(user.displayName).toFixed(2)}</span>
                        <span className="seller-count">{getCountByUser(user.displayName)} vendas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico de Barras Horizontais */}
              <div className="chart-section">
                <h3>📈 Comparação de Vendas</h3>
                <div className="horizontal-chart">
                  {displayUsers.map((user, index) => {
                    const total = getTotalByUser(user.displayName);
                    const maxTotal = getMaxTotal();
                    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                    
                    return (
                      <div key={user.id} className="chart-row">
                        <div className="chart-user-info">
                          <span className="chart-user-color" style={{backgroundColor: colors[index % colors.length]}}></span>
                          <span className="chart-user-name">{user.displayName}</span>
                        </div>
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          >
                            {percentage > 20 && (
                              <span className="chart-bar-label">R$ {total.toFixed(2)}</span>
                            )}
                          </div>
                          {percentage <= 20 && total > 0 && (
                            <span className="chart-bar-label-outside">R$ {total.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Selecione vendedores para comparar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendedoresComparison;
