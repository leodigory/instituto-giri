import React, { useState } from "react";
import { useSales } from "../hooks/useSales";
import "./TestSales.css";

const TestSales = () => {
  const {
    sales,
    loading,
    error,
    addSale,
    updateSale,
    removeSale,
    getTotalSales,
    getSalesByStatus,
  } = useSales();
  const [testMode, setTestMode] = useState("add"); // add, update, remove, stats
  const [testData, setTestData] = useState({
    id: "",
    date: new Date().toISOString().split("T")[0],
    amount: 100,
    status: "Pendente",
    customer: "Cliente Teste",
  });

  const handleAddTestSale = async () => {
    try {
      const saleData = {
        date: testData.date,
        amount: testData.amount,
        status: testData.status,
        customer: testData.customer,
      };
      await addSale(saleData);
      alert("Venda de teste adicionada com sucesso!");
      setTestData({
        ...testData,
        amount: 100,
        customer: "Cliente Teste",
      });
    } catch (err) {
      alert("Erro ao adicionar venda: " + err.message);
    }
  };

  const handleUpdateTestSale = async () => {
    if (!testData.id) {
      alert("Selecione uma venda para atualizar");
      return;
    }
    try {
      const saleData = {
        status: testData.status,
        amount: testData.amount,
      };
      await updateSale(testData.id, saleData);
      alert("Venda atualizada com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar venda: " + err.message);
    }
  };

  const handleRemoveTestSale = async () => {
    if (!testData.id) {
      alert("Selecione uma venda para remover");
      return;
    }
    if (window.confirm("Tem certeza que deseja remover esta venda?")) {
      try {
        await removeSale(testData.id);
        alert("Venda removida com sucesso!");
        setTestData({ ...testData, id: "" });
      } catch (err) {
        alert("Erro ao remover venda: " + err.message);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) return <div>Carregando vendas...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="test-sales">
      <header className="test-header">
        <h1>🧪 Teste do Sistema de Vendas</h1>
        <p>Componente para testar funcionalidades do sistema de vendas</p>
      </header>

      <div className="test-controls">
        <div className="mode-selector">
          <label>Modo de Teste:</label>
          <select
            value={testMode}
            onChange={(e) => setTestMode(e.target.value)}
          >
            <option value="add">Adicionar Venda</option>
            <option value="update">Atualizar Venda</option>
            <option value="remove">Remover Venda</option>
            <option value="stats">Estatísticas</option>
          </select>
        </div>
      </div>

      <div className="test-content">
        {testMode === "add" && (
          <div className="test-section">
            <h2>Adicionar Venda de Teste</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Data:</label>
                <input
                  type="date"
                  value={testData.date}
                  onChange={(e) =>
                    setTestData({ ...testData, date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Valor:</label>
                <input
                  type="number"
                  step="0.01"
                  value={testData.amount}
                  onChange={(e) =>
                    setTestData({
                      ...testData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Cliente:</label>
                <input
                  type="text"
                  value={testData.customer}
                  onChange={(e) =>
                    setTestData({ ...testData, customer: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={testData.status}
                  onChange={(e) =>
                    setTestData({ ...testData, status: e.target.value })
                  }
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Parcialmente Pago">Parcialmente Pago</option>
                </select>
              </div>
            </div>
            <button className="test-button add" onClick={handleAddTestSale}>
              Adicionar Venda
            </button>
          </div>
        )}

        {testMode === "update" && (
          <div className="test-section">
            <h2>Atualizar Venda</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Selecionar Venda:</label>
                <select
                  value={testData.id}
                  onChange={(e) => {
                    const selectedSale = sales.find(
                      (s) => s.id === e.target.value
                    );
                    if (selectedSale) {
                      setTestData({
                        ...testData,
                        id: selectedSale.id,
                        amount: selectedSale.amount,
                        status: selectedSale.status,
                      });
                    }
                  }}
                >
                  <option value="">Selecione uma venda</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      #{sale.id} - {sale.customer} -{" "}
                      {formatCurrency(sale.amount)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Novo Valor:</label>
                <input
                  type="number"
                  step="0.01"
                  value={testData.amount}
                  onChange={(e) =>
                    setTestData({
                      ...testData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Novo Status:</label>
                <select
                  value={testData.status}
                  onChange={(e) =>
                    setTestData({ ...testData, status: e.target.value })
                  }
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Parcialmente Pago">Parcialmente Pago</option>
                </select>
              </div>
            </div>
            <button
              className="test-button update"
              onClick={handleUpdateTestSale}
            >
              Atualizar Venda
            </button>
          </div>
        )}

        {testMode === "remove" && (
          <div className="test-section">
            <h2>Remover Venda</h2>
            <div className="form-group">
              <label>Selecionar Venda:</label>
              <select
                value={testData.id}
                onChange={(e) =>
                  setTestData({ ...testData, id: e.target.value })
                }
              >
                <option value="">Selecione uma venda</option>
                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    #{sale.id} - {sale.customer} - {formatCurrency(sale.amount)}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="test-button remove"
              onClick={handleRemoveTestSale}
            >
              Remover Venda
            </button>
          </div>
        )}

        {testMode === "stats" && (
          <div className="test-section">
            <h2>Estatísticas das Vendas</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total de Vendas</h3>
                <p className="stat-value">{sales.length}</p>
              </div>
              <div className="stat-card">
                <h3>Valor Total</h3>
                <p className="stat-value">{formatCurrency(getTotalSales())}</p>
              </div>
              <div className="stat-card">
                <h3>Vendas Pagas</h3>
                <p className="stat-value">{getSalesByStatus("Pago").length}</p>
              </div>
              <div className="stat-card">
                <h3>Vendas Pendentes</h3>
                <p className="stat-value">
                  {getSalesByStatus("Pendente").length}
                </p>
              </div>
              <div className="stat-card">
                <h3>Vendas Entregues</h3>
                <p className="stat-value">
                  {getSalesByStatus("Entregue").length}
                </p>
              </div>
              <div className="stat-card">
                <h3>Vendas Parciais</h3>
                <p className="stat-value">
                  {getSalesByStatus("Parcialmente Pago").length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sales-list-preview">
        <h2>Vendas Atuais ({sales.length})</h2>
        <div className="sales-preview">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="sale-preview-item">
              <span>#{sale.id}</span>
              <span>{sale.customer}</span>
              <span>{formatCurrency(sale.amount)}</span>
              <span
                className={`status ${sale.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {sale.status}
              </span>
            </div>
          ))}
          {sales.length > 5 && (
            <p className="more-sales">... e mais {sales.length - 5} vendas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSales;
