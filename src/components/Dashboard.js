import React, { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import VendedoresComparison from "./VendedoresComparison";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    recentSales: [],
    dailyCashFlow: 0,
    monthlyCashFlow: 0,
    todaySales: 0,
    monthSales: 0,
    weeklyData: [],
    topProducts: [],
    projectedRevenue: 0,
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [viewMode, setViewMode] = useState('usuario');
  const [userRole, setUserRole] = useState('user');
  const [showComparison, setShowComparison] = useState(false);

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

      let totalSales = 0;
      let totalRevenue = 0;
      let dailyCashFlow = 0;
      let monthlyCashFlow = 0;
      let todaySales = 0;
      let monthSales = 0;
      const recentSales = [];
      const weeklyData = [];
      const productSales = {};

      // Buscar todas as vendas
      const salesCollectionRef = collection(db, "Vendas");
      const salesSnapshot = await getDocs(salesCollectionRef);
      
      const currentUser = auth.currentUser;
      const currentUserName = currentUser ? (currentUser.displayName || currentUser.email) : null;
      
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
        
        let dayRevenue = 0;
        daySales.forEach(sale => {
          const saleAmount = sale.valorTotal || 0;
          dayRevenue += saleAmount;
          
          if (sale.itens) {
            sale.itens.forEach(item => {
              const productName = item.nome || 'Produto';
              productSales[productName] = (productSales[productName] || 0) + item.quantidade;
            });
          }
          
          if (i === 0) {
            todaySales++;
            dailyCashFlow += saleAmount;
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
          revenue: dayRevenue,
          sales: daySales.length
        });
      }

      // Calcular vendas do mês
      const thisMonth = allSales.filter(sale => 
        sale.date.getMonth() === currentMonth - 1 && 
        sale.date.getFullYear() === currentYear
      );
      
      thisMonth.forEach(sale => {
        const saleAmount = sale.valorTotal || 0;
        monthSales++;
        monthlyCashFlow += saleAmount;
        totalSales++;
        totalRevenue += saleAmount;
      });

      // Top produtos
      const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      // Calcular projeção e crescimento
      const avgDailyRevenue = monthlyCashFlow / currentDay;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const projectedRevenue = avgDailyRevenue * daysInMonth;
      
      const lastWeekRevenue = weeklyData.slice(0, 3).reduce((sum, day) => sum + day.revenue, 0);
      const thisWeekRevenue = weeklyData.slice(4, 7).reduce((sum, day) => sum + day.revenue, 0);
      const growthRate = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      // Buscar itens do inventário
      const itemsQuery = query(collection(db, "inventory"));
      const itemsSnapshot = await getDocs(itemsQuery);
      const totalItems = itemsSnapshot.size;

      setStats({
        totalSales,
        totalRevenue,
        totalItems,
        recentSales,
        dailyCashFlow,
        monthlyCashFlow,
        todaySales,
        monthSales,
        weeklyData,
        topProducts,
        projectedRevenue,
        growthRate,
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

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'today':
        return { sales: stats.todaySales, revenue: stats.dailyCashFlow, label: 'Hoje' };
      case 'month':
        return { sales: stats.monthSales, revenue: stats.monthlyCashFlow, label: 'Este Mês' };
      default:
        return { sales: stats.todaySales, revenue: stats.dailyCashFlow, label: 'Hoje' };
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
        <div className="skeleton-list">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className="dashboard">
      {/* Header com seletor de visão */}
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

      {/* Cards principais */}
      <div className="main-stats">
        <div className="stat-card primary">
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Faturamento {currentData.label}</span>
          </div>
          <div className="stat-value">{formatCurrency(currentData.revenue)}</div>
          <div className="stat-growth positive">
            <span className="growth-icon">📈</span>
            <span>{formatPercent(stats.growthRate)}</span>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-header">
            <span className="stat-icon">🛒</span>
            <span className="stat-label">Vendas {currentData.label}</span>
          </div>
          <div className="stat-value">{currentData.sales}</div>
          <div className="stat-subtitle">
            Média: {formatCurrency(currentData.sales > 0 ? currentData.revenue / currentData.sales : 0)}
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
            })}
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-info">
            <span className="metric-label">Projeção Mensal</span>
            <span className="metric-value">{formatCurrency(stats.projectedRevenue)}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-info">
            <span className="metric-label">Produtos</span>
            <span className="metric-value">{stats.totalItems}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <span className="metric-label">Total Geral</span>
            <span className="metric-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Top produtos */}
      {stats.topProducts.length > 0 && (
        <div className="top-products-card">
          <h3>🏆 Produtos Mais Vendidos</h3>
          <div className="products-list">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="product-item">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-quantity">{product.quantity} vendidos</span>
                </div>
                <div className="product-bar">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${(product.quantity / stats.topProducts[0].quantity) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendas recentes */}
      <div className="recent-sales-card">
        <h3>🕐 Vendas Recentes</h3>
        {stats.recentSales.length > 0 ? (
          <div className="sales-list">
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="sale-item">
                <div className="sale-info">
                  <span className="sale-id">#{sale.id?.slice(-6)}</span>
                  <span className="sale-client">
                    {sale.cliente?.name || "Cliente"}
                  </span>
                  <span className="sale-date">{sale.date}</span>
                </div>
                <div className="sale-amount">
                  {formatCurrency(sale.valorTotal)}
                </div>
              </div>
            ))}
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