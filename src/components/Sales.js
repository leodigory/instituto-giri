import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import "./Sales.css";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchSales();
  }, [filter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const salesData = [];
      const now = new Date();
      let dateRanges = [];

      // Definir intervalos de datas baseado no filtro
      switch (filter) {
        case "today":
          dateRanges = [
            {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              day: now.getDate(),
            },
          ];
          break;
        case "week":
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          dateRanges = [];
          for (
            let d = new Date(weekAgo);
            d <= now;
            d.setDate(d.getDate() + 1)
          ) {
            dateRanges.push({
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              day: d.getDate(),
            });
          }
          break;
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          dateRanges = [];
          for (
            let d = new Date(monthAgo);
            d <= now;
            d.setDate(d.getDate() + 1)
          ) {
            dateRanges.push({
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              day: d.getDate(),
            });
          }
          break;
        default: // 'all' - buscar último mês para limitar
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          dateRanges = [];
          for (
            let d = new Date(lastMonth);
            d <= now;
            d.setDate(d.getDate() + 1)
          ) {
            dateRanges.push({
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              day: d.getDate(),
            });
          }
          break;
      }

      // Buscar vendas das datas definidas
      for (const dateRange of dateRanges) {
        if (salesData.length >= 50 && filter === "all") break; // Limitar para 'all'

        try {
          const monthStr = String(dateRange.month).padStart(2, "0");
          const dayStr = String(dateRange.day).padStart(2, "0");

          const dateCollectionRef = collection(
            db,
            "Vendas",
            String(dateRange.year),
            monthStr,
            dayStr
          );
          const querySnapshot = await getDocs(dateCollectionRef);

          querySnapshot.forEach((doc) => {
            const saleData = doc.data();
            const saleDate = saleData.createdAt?.toDate
              ? saleData.createdAt.toDate()
              : new Date(saleData.createdAt);

            salesData.push({
              id: doc.id,
              ...saleData,
              date: saleDate.toLocaleDateString("pt-BR"),
              time: saleDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });

            if (salesData.length >= 50 && filter === "all") return;
          });
        } catch (error) {
          // Ignorar datas que não existem
          continue;
        }
      }

      // Ordenar por data decrescente
      salesData.sort(
        (a, b) =>
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );

      setSales(salesData);
      calculateStats(salesData);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const todaySales = salesData.filter((sale) => {
      const saleDate = sale.createdAt?.toDate?.();
      return saleDate && saleDate >= today;
    });

    const weekSales = salesData.filter((sale) => {
      const saleDate = sale.createdAt?.toDate?.();
      return saleDate && saleDate >= weekAgo;
    });

    const monthSales = salesData.filter((sale) => {
      const saleDate = sale.createdAt?.toDate?.();
      return saleDate && saleDate >= monthAgo;
    });

    setStats({
      total: salesData.length,
      today: todaySales.length,
      thisWeek: weekSales.length,
      thisMonth: monthSales.length,
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pago":
        return "paid";
      case "entregue":
        return "delivered";
      case "pendente":
        return "pending";
      case "parcialmente pago":
        return "partial";
      default:
        return "pending";
    }
  };

  if (loading) {
    return (
      <div className="sales">
        <h1>💰 Vendas</h1>
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="sales">
      <div className="sales-header">
        <h1>💰 Gestão de Vendas</h1>
        <div className="filter-buttons">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Todas
          </button>
          <button
            className={filter === "today" ? "active" : ""}
            onClick={() => setFilter("today")}
          >
            Hoje
          </button>
          <button
            className={filter === "week" ? "active" : ""}
            onClick={() => setFilter("week")}
          >
            Esta Semana
          </button>
          <button
            className={filter === "month" ? "active" : ""}
            onClick={() => setFilter("month")}
          >
            Este Mês
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total de Vendas</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Vendas Hoje</h3>
            <p className="stat-number">{stats.today}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>Esta Semana</h3>
            <p className="stat-number">{stats.thisWeek}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🗓️</div>
          <div className="stat-info">
            <h3>Este Mês</h3>
            <p className="stat-number">{stats.thisMonth}</p>
          </div>
        </div>
      </div>

      <div className="sales-list">
        <h2>📋 Lista de Vendas</h2>
        {sales.length > 0 ? (
          <div className="sales-table">
            <div className="table-header">
              <div>ID</div>
              <div>Cliente</div>
              <div>Data/Hora</div>
              <div>Total</div>
              <div>Status</div>
            </div>
            {sales.map((sale) => (
              <div key={sale.id} className="table-row">
                <div className="sale-id">#{sale.id?.slice(-8)}</div>
                <div className="sale-client">{sale.cliente?.nome || "N/A"}</div>
                <div className="sale-datetime">
                  <div>{sale.date}</div>
                  <div className="sale-time">{sale.time}</div>
                </div>
                <div className="sale-total">
                  {formatCurrency(sale.valorTotal)}
                </div>
                <div className={`sale-status ${getStatusColor(sale.status)}`}>
                  {sale.status || "Pendente"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-sales">
            <div className="no-sales-icon">💰</div>
            <h3>Nenhuma venda encontrada</h3>
            <p>
              {filter === "all"
                ? "Não há vendas cadastradas no sistema."
                : `Não há vendas para o período selecionado.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
