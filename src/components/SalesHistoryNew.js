import React, { useState } from "react";
import { useSales } from "../hooks/useSales";
import QRCodeComponent from "./QRCode";
import SalesCreation from "./SalesCreation";
import "./SalesHistory.css";

const SalesHistoryNew = () => {
  const { sales, loading, error } = useSales();
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showSalesList, setShowSalesList] = useState(false);

  const filteredSales = showAll
    ? sales
    : sales.filter(
        (sale) =>
          sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const toggleView = () => {
    setShowSalesList(!showSalesList);
  };

  if (loading) return <div>Carregando vendas...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="sales-history">
      {/* Header com botões para alternar entre formulário e lista */}
      <header className="history-header">
        <button className="back-button" onClick={toggleView}>
          {showSalesList ? "← Nova Venda" : "← Ver Vendas"}
        </button>
        <div className="header-content">
          <h1>{showSalesList ? "📋 Histórico de Vendas" : "🛒 Nova Venda"}</h1>
          {!showSalesList && (
            <button
              className="new-sale-button"
              onClick={() => setShowSalesList(true)}
            >
              📋 Ver Vendas
            </button>
          )}
        </div>
        <div className="sales-count">
          {showSalesList
            ? `${filteredSales.length} vendas`
            : "Formulário de Vendas"}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="sales-content-main">
        {!showSalesList ? (
          /* Formulário de Nova Venda */
          <div className="new-sale-form-container">
            <SalesCreation onBack={toggleView} />
          </div>
        ) : (
          /* Lista de Vendas */
          <>
            <section className="filters-section">
              <div className="filters-bar">
                <input
                  type="text"
                  placeholder="Buscar vendas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="history-search-input"
                />
                <label className="show-all-toggle">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                  />
                  <span>Mostrar todas</span>
                </label>
              </div>
            </section>

            <div className="sales-list">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="sale-card"
                  onClick={() => handleSaleClick(sale)}
                >
                  <div className="sale-info">
                    <h3>Venda #{sale.id}</h3>
                    <p>Data: {sale.getFormattedDate()}</p>
                    <p>Valor: {sale.getFormattedAmount()}</p>
                    <p>Status: {sale.status}</p>
                    <p>Cliente: {sale.getFormattedCustomer()}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalhes da Venda */}
      {showModal && selectedSale && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="sale-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Detalhes da Venda #{selectedSale.id}</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Data:</strong> {selectedSale.getFormattedDate()}
              </p>
              <p>
                <strong>Valor:</strong> {selectedSale.getFormattedAmount()}
              </p>
              <p>
                <strong>Status:</strong> {selectedSale.status}
              </p>
              <p>
                <strong>Cliente:</strong> {selectedSale.getFormattedCustomer()}
              </p>
              <p>
                <strong>Status do Pagamento:</strong> {selectedSale.getPaymentStatus()}
              </p>
              <p>
                <strong>Status da Entrega:</strong> {selectedSale.getDeliveryStatus()}
              </p>
              {selectedSale.doacao > 0 && (
                <p>
                  <strong>Doação:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedSale.doacao)}
                </p>
              )}
              <div className="qr-code-section">
                <h3>QR Code da Venda</h3>
                <QRCodeComponent
                  value={JSON.stringify({
                    id: selectedSale.id,
                    date: selectedSale.date,
                    amount: selectedSale.amount,
                    status: selectedSale.status,
                    customer: selectedSale.customer,
                  })}
                  size={150}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryNew;
