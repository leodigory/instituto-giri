import React, { useState, useEffect } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import VendedoresComparison from "./VendedoresComparison";
import GiriCoin from "./GiriCoin";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalDonations: 0,
    todaySales: 0,
    todayPaid: 0,
    todayDonations: 0,
    monthSales: 0,
    monthRevenue: 0,
    weeklyData: [],
    projectedRevenue: 0,
    projectionHelp: "",
    giriGold: 0,
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [viewMode, setViewMode] = useState('usuario');
  const [userRole, setUserRole] = useState('user');
  const [showComparison, setShowComparison] = useState(false);
  const [rankingData, setRankingData] = useState([]);
  const [showAllRanking, setShowAllRanking] = useState(false);

  useEffect(() => {
    loadUserRole();
    fetchDashboardData();
  }, [viewMode]);

  const loadUserRole = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
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
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      const currentUser = auth.currentUser;
      const currentUserName = currentUser ? (currentUser.displayName || currentUser.email) : null;

      let todaySales = 0;
      let todayPaid = 0;
      let todayDonations = 0;
      let monthSales = 0;
      let monthRevenue = 0;
      let monthDonations = 0;
      const weeklyData = [];
      const recentSales = [];
      const userGoldMap = {};

      // Buscar todas as vendas
      const salesSnapshot = await getDocs(collection(db, "Vendas"));
      const allSales = [];

      salesSnapshot.forEach((saleDoc) => {
        const saleData = saleDoc.data();
        
        if (viewMode === 'usuario' && saleData.vendedor !== currentUserName) {
          return;
        }

        let saleDate;
        try {
          saleDate = saleData.createdAt?.toDate
            ? saleData.createdAt.toDate()
            : saleData.createdAt
            ? new Date(saleData.createdAt)
            : new Date();
        } catch {
          saleDate = new Date();
        }

        allSales.push({
          id: saleDoc.id,
          ...saleData,
          date: saleDate
        });
      });

      // Processar dados dos últimos 7 dias
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const targetDateStr = targetDate.toDateString();
        
        const daySales = allSales.filter(sale => 
          sale.date.toDateString() === targetDateStr
        );
        
        let dayPaid = 0;
        daySales.forEach(sale => {
          dayPaid += sale.valorPago || 0;
          
          if (i === 0) {
            todaySales++;
            todayPaid += sale.valorPago || 0;
            todayDonations += sale.doacao || 0;
          }
          
          if (recentSales.length < 5) {
            recentSales.push({
              ...sale,
              date: sale.date.toLocaleDateString("pt-BR")
            });
          }
        });
        
        weeklyData.push({
          day: targetDate.toLocaleDateString("pt-BR", { weekday: 'short' }),
          revenue: dayPaid,
          sales: daySales.length
        });
      }

      // Calcular vendas do mês
      const thisMonth = allSales.filter(sale => 
        sale.date.getMonth() === currentMonth - 1 && 
        sale.date.getFullYear() === currentYear
      );
      
      thisMonth.forEach(sale => {
        monthSales++;
        monthRevenue += sale.valorTotal || 0;
        monthDonations += sale.doacao || 0;
      });

      // Calcular Giri Gold
      // Voluntário: R$ 1 = 1.75 GGs (35% de 5)
      // Outros: R$ 1 = 5 GGs
      const giriGoldRate = userRole === 'voluntario' ? 1.75 : 5;
      const giriGold = Math.floor(monthRevenue * giriGoldRate);

      // Calcular projeção
      const avgDailyRevenue = monthRevenue / currentDay;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const projectedRevenue = avgDailyRevenue * daysInMonth;
      
      // Calcular meta diária para atingir projeção
      const remainingDays = daysInMonth - currentDay;
      const dailyGoal = remainingDays > 0 ? (projectedRevenue - monthRevenue) / remainingDays : 0;
      const projectionHelp = remainingDays > 0 
        ? `Venda ${formatCurrency(dailyGoal)}/dia para atingir a meta!`
        : "Mês finalizado!";

      // Calcular ranking de todos os usuários (apenas no modo usuário)
      if (viewMode === 'usuario') {
        const allUsersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = allUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Buscar todas as vendas do mês para calcular Giri Gold de cada usuário
        const allMonthSales = await getDocs(collection(db, "Vendas"));
        
        allMonthSales.forEach(saleDoc => {
          const sale = saleDoc.data();
          let saleDate;
          try {
            saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date();
          } catch {
            saleDate = new Date();
          }

          if (saleDate.getMonth() === currentMonth - 1 && saleDate.getFullYear() === currentYear) {
            const vendedor = sale.vendedor || "Desconhecido";
            const saleValue = sale.valorTotal || 0;
            // Buscar role do vendedor para calcular GGs correto
            const gold = Math.floor(saleValue * 5); // Padrão 5 GGs
            
            if (!userGoldMap[vendedor]) {
              userGoldMap[vendedor] = 0;
            }
            userGoldMap[vendedor] += gold;
          }
        });

        // Criar ranking
        const ranking = Object.entries(userGoldMap)
          .map(([name, gold]) => ({ name, gold }))
          .sort((a, b) => b.gold - a.gold);

        const totalGold = ranking.reduce((sum, user) => sum + user.gold, 0);
        
        const rankingWithPercentage = ranking.map((user, index) => ({
          ...user,
          position: index + 1,
          percentage: totalGold > 0 ? (user.gold / totalGold) * 100 : 0,
          isCurrentUser: user.name === currentUserName
        }));

        setRankingData(rankingWithPercentage);
      }

      setStats({
        totalPaid: todayPaid,
        totalDonations: todayDonations,
        todaySales,
        todayPaid,
        todayDonations,
        monthSales,
        monthRevenue,
        monthDonations,
        weeklyData,
        projectedRevenue,
        projectionHelp,
        giriGold,
        recentSales,
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'today':
        return { 
          sales: stats.todaySales, 
          paid: stats.todayPaid,
          revenue: stats.todaySales > 0 ? stats.todayPaid / stats.todaySales : 0,
          label: 'Hoje' 
        };
      case 'month':
        return { 
          sales: stats.monthSales, 
          paid: stats.monthRevenue,
          revenue: stats.monthSales > 0 ? stats.monthRevenue / stats.monthSales : 0,
          label: 'Este Mês' 
        };
      default:
        return { 
          sales: stats.todaySales, 
          paid: stats.todayPaid,
          revenue: stats.todaySales > 0 ? stats.todayPaid / stats.todaySales : 0,
          label: 'Hoje' 
        };
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="skeleton-header"></div>
        <div className="skeleton-cards">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
        <div className="skeleton-chart"></div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="view-selector">
          <button 
            className={viewMode === 'usuario' ? 'active' : ''}
            onClick={() => setViewMode('usuario')}
          >
            Usuário
          </button>
          {(userRole === 'admin' || userRole === 'gerente') && (
            <button 
              className={viewMode === 'global' ? 'active' : ''}
              onClick={() => setViewMode('global')}
            >
              Global
            </button>
          )}
          {userRole === 'admin' && viewMode === 'global' && (
            <button 
              className="comparison-btn"
              onClick={() => setShowComparison(true)}
            >
              📊 Comparar Vendedores
            </button>
          )}
        </div>
        <div className="period-selector">
          <button 
            className={selectedPeriod === 'today' ? 'active' : ''}
            onClick={() => setSelectedPeriod('today')}
          >
            Hoje
          </button>
          <button 
            className={selectedPeriod === 'month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('month')}
          >
            Mês
          </button>
        </div>
      </div>

      {/* Card Giri Gold - Destaque no topo para voluntários */}
      {viewMode === 'usuario' && (
        <div className="giri-gold-highlight">
          <div className="metric-card giri-gold-main">
            <div className="metric-icon">
              <GiriCoin size={64} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Seu Giri Gold</span>
              <span className="metric-value" style={{fontSize: 'var(--font-3xl)'}}>{stats.giriGold.toLocaleString()}</span>
              <span className="metric-help">
                {userRole === 'voluntario' ? '💰 R$ 1 = 1.75 GGs (35%)' : '💰 R$ 1 = 5 GGs'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cards principais */}
      <div className="main-stats">
        <div className="stat-card primary">
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Faturamento {currentData.label}</span>
          </div>
          <div className="stat-value">{formatCurrency(currentData.paid)}</div>
          <div className="stat-subtitle">💵 Valor recebido em dinheiro</div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-header">
            <span className="stat-icon">🛒</span>
            <span className="stat-label">Vendas {currentData.label}</span>
          </div>
          <div className="stat-value">{currentData.sales}</div>
          <div className="stat-subtitle">
            📊 Média por venda: {formatCurrency(currentData.revenue)}
          </div>
        </div>
      </div>

      {/* Gráfico de vendas semanais */}
      <div className="chart-card">
        <h3>📈 Vendas dos Últimos 7 Dias</h3>
        <div className="chart-container">
          <div className="chart">
            {stats.weeklyData.map((day, index) => {
              const maxRevenue = Math.max(...stats.weeklyData.map(d => d.revenue));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ height: `${height}%` }}
                    title={`${day.day}: ${formatCurrency(day.revenue)}`}
                  ></div>
                  <span className="bar-label">{day.day}</span>
                  <span className="bar-value">{formatCurrency(day.revenue)}</span>
                </div>
              );
            })}</div>
        </div>
      </div>

      {/* Ranking Giri Gold - Logo após o destaque */}
      {viewMode === 'usuario' && rankingData.length > 0 && (
        <div className="ranking-card">
          <div className="ranking-header">
            <h3>🏆 Ranking Giri Gold - Mês Atual</h3>
            {rankingData.length > 10 && (
              <button 
                className="show-all-btn"
                onClick={() => setShowAllRanking(!showAllRanking)}
              >
                {showAllRanking ? 'Ver Top 10' : `Ver Todos (${rankingData.length})`}
              </button>
            )}
          </div>
          <div className="ranking-list">
            {(showAllRanking ? rankingData : rankingData.slice(0, 10)).map((user, index) => (
              <div 
                key={index} 
                className={`ranking-item ${user.isCurrentUser ? 'current-user' : ''} ${
                  index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''
                }`}
              >
                <div className="ranking-position">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.position}`}
                </div>
                <div className="ranking-info">
                  <span className="ranking-name">{user.name}</span>
                  <div className="ranking-bar">
                    <div 
                      className="ranking-bar-fill" 
                      style={{ width: `${user.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ranking-stats">
                  <span className="ranking-gold">
                    <GiriCoin size={16} /> {user.gold.toLocaleString()}
                  </span>
                  <span className="ranking-percentage">{user.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💝</div>
          <div className="metric-info">
            <span className="metric-label">Doações {selectedPeriod === 'today' ? 'Hoje' : 'Mês'}</span>
            <span className="metric-value">
              {formatCurrency(selectedPeriod === 'today' ? stats.todayDonations : stats.monthDonations)}
            </span>
            <span className="metric-help">❤️ Contribuições dos clientes</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <span className="metric-label">Total do Mês</span>
            <span className="metric-value">{formatCurrency(stats.monthRevenue)}</span>
            <span className="metric-help">📅 Soma de todas as vendas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-info">
            <span className="metric-label">Projeção Mensal</span>
            <span className="metric-value">{formatCurrency(stats.projectedRevenue)}</span>
            <span className="metric-help">🔮 Estimativa baseada na média</span>
          </div>
        </div>

        <div className="metric-card projection-help">
          <div className="metric-icon">💡</div>
          <div className="metric-info">
            <span className="metric-label">Meta Diária</span>
            <span className="metric-value" style={{fontSize: 'var(--font-base)'}}>{stats.projectionHelp}</span>
            <span className="metric-help">🎯 Para atingir a projeção</span>
          </div>
        </div>
      </div>

      {/* Vendas recentes */}
      <div className="recent-sales-card">
        <h3>🕐 Vendas Recentes</h3>
        {stats.recentSales.length > 0 ? (
          <div className="sales-list">
            {stats.recentSales.map((sale) => {
              const valorPago = sale.valorPago || 0;
              const valorTotal = sale.valorTotal || 0;
              const paymentStatus = valorPago === 0 ? 'unpaid' : valorPago < valorTotal ? 'partial' : 'paid';
              
              return (
                <div key={sale.id} className="sale-item">
                  <div className="sale-info">
                    <span className="sale-id">#{sale.id?.slice(-6)}</span>
                    <span className="sale-client">
                      {sale.cliente?.name || "Cliente"}
                    </span>
                    {viewMode === 'global' && (
                      <span className="sale-vendor">
                        👤 {sale.vendedor || "N/A"}
                      </span>
                    )}
                    <span className="sale-date">{sale.date}</span>
                  </div>
                  <div className={`sale-amount ${paymentStatus}`}>
                    {formatCurrency(valorPago)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-data">
            <span className="no-data-icon">📭</span>
            <p>Nenhuma venda encontrada</p>
          </div>
        )}
      </div>

      {/* Modal de Comparação */}
      {showComparison && (
        <VendedoresComparison onClose={() => setShowComparison(false)} />
      )}
    </div>
  );
};

export default Dashboard;
