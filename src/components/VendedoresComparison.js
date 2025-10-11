import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import "./VendedoresComparison.css";

const VendedoresComparison = ({ onClose }) => {
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
    if (selectedUsers.length > 0) {
      loadSalesComparison();
    }
  }, [selectedUsers]);

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

  const loadSalesComparison = async () => {
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

  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

  const getTotalByUser = (userName) => {
    const userSales = salesData[userName] || [];
    return userSales.reduce((sum, day) => sum + day.total, 0);
  };

  const getCountByUser = (userName) => {
    const userSales = salesData[userName] || [];
    return userSales.reduce((sum, day) => sum + day.count, 0);
  };

  return (
    <div className="comparison-overlay">
      <div className="comparison-modal">
        <div className="comparison-header">
          <h2>📊 Comparar Vendedores</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="comparison-content">
          {/* Seletor de Vendedores */}
          <div className="user-selector">
            <h3>Selecione os vendedores para comparar:</h3>
            
            {/* Usuários Selecionados */}
            <div className="selected-users">
              {selectedUsers.map((user, index) => (
                <div key={user.id} className="selected-user-tag" style={{borderColor: colors[index]}}>
                  <span className="user-color" style={{backgroundColor: colors[index]}}></span>
                  <span>{user.displayName}</span>
                  <button onClick={() => removeUser(user.id)}>✕</button>
                </div>
              ))}
              
              {/* Botão Adicionar */}
              {selectedUsers.length < 6 && (
                <div className="add-user-btn-container">
                  <input
                    type="text"
                    placeholder="Digite o nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="user-search-input"
                  />
                  <button className="add-user-btn">➕</button>
                </div>
              )}
            </div>

            {/* Sugestões */}
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

          {/* Gráfico e Métricas */}
          {selectedUsers.length > 0 && (
            <>
              {loading ? (
                <div className="loading">Carregando dados...</div>
              ) : (
                <>
                  {/* Métricas Resumidas */}
                  <div className="metrics-summary">
                    {selectedUsers.map((user, index) => (
                      <div key={user.id} className="user-metric" style={{borderLeftColor: colors[index]}}>
                        <h4>{user.displayName}</h4>
                        <div className="metric-value">
                          R$ {getTotalByUser(user.displayName).toFixed(2)}
                        </div>
                        <div className="metric-label">
                          {getCountByUser(user.displayName)} vendas
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico de Barras */}
                  <div className="chart-container">
                    <h3>Vendas por Dia da Semana</h3>
                    <div className="bar-chart">
                      {weekData.map((day, dayIndex) => (
                        <div key={dayIndex} className="chart-day">
                          <div className="chart-bars">
                            {selectedUsers.map((user, userIndex) => {
                              const userSales = salesData[user.displayName] || [];
                              const dayData = userSales[dayIndex] || { total: 0 };
                              const maxValue = getMaxValue();
                              const height = maxValue > 0 ? (dayData.total / maxValue) * 100 : 0;
                              
                              return (
                                <div
                                  key={userIndex}
                                  className="chart-bar"
                                  style={{
                                    height: `${height}%`,
                                    backgroundColor: colors[userIndex],
                                    minHeight: dayData.total > 0 ? '5px' : '0'
                                  }}
                                  title={`${user.displayName}: R$ ${dayData.total.toFixed(2)}`}
                                >
                                  {dayData.total > 0 && (
                                    <span className="bar-value">
                                      R$ {dayData.total.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="chart-label">{day.dayName}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabela Detalhada */}
                  <div className="detailed-table">
                    <h3>Detalhamento por Dia</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Dia</th>
                          {selectedUsers.map((user, index) => (
                            <th key={user.id} style={{color: colors[index]}}>
                              {user.displayName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {weekData.map((day, dayIndex) => (
                          <tr key={dayIndex}>
                            <td><strong>{day.dayName}</strong></td>
                            {selectedUsers.map(user => {
                              const userSales = salesData[user.displayName] || [];
                              const dayData = userSales[dayIndex] || { total: 0, count: 0 };
                              return (
                                <td key={user.id}>
                                  R$ {dayData.total.toFixed(2)}
                                  <br />
                                  <small>({dayData.count} vendas)</small>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td><strong>TOTAL</strong></td>
                          {selectedUsers.map(user => (
                            <td key={user.id}>
                              <strong>R$ {getTotalByUser(user.displayName).toFixed(2)}</strong>
                              <br />
                              <small>({getCountByUser(user.displayName)} vendas)</small>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {selectedUsers.length === 0 && (
            <div className="empty-state">
              <p>👆 Selecione pelo menos um vendedor para começar a comparação</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendedoresComparison;
