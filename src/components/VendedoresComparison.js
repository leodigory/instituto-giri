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
  const [weekData, setWeekData] = useState([]);

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
      const today = new Date();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' })
        });
      }

      const salesByUser = {};
      
      for (const user of allUsers) {
        const userSales = [];
        
        for (const day of last7Days) {
          const [year, month, dayNum] = day.date.split('-');
          const salesRef = collection(db, `Vendas/${year}/${month}/${dayNum}`);
          const q = query(salesRef, where("vendedor", "==", user.displayName));
          const snapshot = await getDocs(q);
          
          const dayTotal = snapshot.docs.reduce((sum, doc) => {
            const data = doc.data();
            return sum + (data.valorTotal || 0);
          }, 0);
          
          userSales.push({
            date: day.date,
            dayName: day.dayName,
            total: dayTotal,
            count: snapshot.docs.length
          });
        }
        
        salesByUser[user.displayName] = userSales;
      }
      
      setSalesData(salesByUser);
      setWeekData(last7Days);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedUsersSales = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' })
        });
      }

      const salesByUser = {};
      
      for (const user of selectedUsers) {
        const userSales = [];
        
        for (const day of last7Days) {
          const [year, month, dayNum] = day.date.split('-');
          const salesRef = collection(db, `Vendas/${year}/${month}/${dayNum}`);
          const q = query(salesRef, where("vendedor", "==", user.displayName));
          const snapshot = await getDocs(q);
          
          const dayTotal = snapshot.docs.reduce((sum, doc) => {
            const data = doc.data();
            return sum + (data.valorTotal || 0);
          }, 0);
          
          userSales.push({
            date: day.date,
            dayName: day.dayName,
            total: dayTotal,
            count: snapshot.docs.length
          });
        }
        
        salesByUser[user.displayName] = userSales;
      }
      
      setSalesData(salesByUser);
      setWeekData(last7Days);
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

  const getMaxValue = () => {
    let max = 0;
    Object.values(salesData).forEach(userSales => {
      userSales.forEach(day => {
        if (day.total > max) max = day.total;
      });
    });
    return max;
  };

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  const getTotalByUser = (userName) => {
    const userSales = salesData[userName] || [];
    return userSales.reduce((sum, day) => sum + day.total, 0);
  };

  const getCountByUser = (userName) => {
    const userSales = salesData[userName] || [];
    return userSales.reduce((sum, day) => sum + day.count, 0);
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
              {/* Cards de Métricas */}
              <div className="metrics-grid">
                {displayUsers.map((user, index) => (
                  <div key={user.id} className="metric-card" style={{borderLeftColor: colors[index % colors.length]}}>
                    <div className="metric-header">
                      <span className="metric-color" style={{backgroundColor: colors[index % colors.length]}}></span>
                      <h4>{user.displayName}</h4>
                    </div>
                    <div className="metric-value">
                      R$ {getTotalByUser(user.displayName).toFixed(2)}
                    </div>
                    <div className="metric-label">
                      {getCountByUser(user.displayName)} vendas nos últimos 7 dias
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráfico de Barras */}
              <div className="chart-section">
                <h3>📈 Vendas por Dia da Semana</h3>
                <div className="bar-chart">
                  {weekData.map((day, dayIndex) => (
                    <div key={dayIndex} className="chart-column">
                      <div className="chart-bars-container">
                        {displayUsers.map((user, userIndex) => {
                          const userSales = salesData[user.displayName] || [];
                          const dayData = userSales[dayIndex] || { total: 0 };
                          const maxValue = getMaxValue();
                          const height = maxValue > 0 ? (dayData.total / maxValue) * 100 : 0;
                          
                          return (
                            <div
                              key={userIndex}
                              className="chart-bar"
                              style={{
                                height: `${Math.max(height, dayData.total > 0 ? 5 : 0)}%`,
                                backgroundColor: colors[userIndex % colors.length]
                              }}
                              title={`${user.displayName}: R$ ${dayData.total.toFixed(2)}`}
                            >
                              {dayData.total > 0 && height > 15 && (
                                <span className="bar-label">
                                  R$ {dayData.total.toFixed(0)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="chart-day-label">{day.dayName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela Detalhada */}
              <div className="table-section">
                <h3>📋 Detalhamento Completo</h3>
                <div className="table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Dia</th>
                        {displayUsers.map((user, index) => (
                          <th key={user.id}>
                            <span className="table-user-color" style={{backgroundColor: colors[index % colors.length]}}></span>
                            {user.displayName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weekData.map((day, dayIndex) => (
                        <tr key={dayIndex}>
                          <td className="day-cell">{day.dayName}</td>
                          {displayUsers.map(user => {
                            const userSales = salesData[user.displayName] || [];
                            const dayData = userSales[dayIndex] || { total: 0, count: 0 };
                            return (
                              <td key={user.id}>
                                <div className="cell-value">R$ {dayData.total.toFixed(2)}</div>
                                <div className="cell-count">{dayData.count} vendas</div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td className="day-cell"><strong>TOTAL</strong></td>
                        {displayUsers.map(user => (
                          <td key={user.id}>
                            <div className="cell-value"><strong>R$ {getTotalByUser(user.displayName).toFixed(2)}</strong></div>
                            <div className="cell-count">{getCountByUser(user.displayName)} vendas</div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
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
