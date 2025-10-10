import React from "react";
import "./SalesView.css";

const SalesView = ({ sale, onBack }) => {
  if (!sale) {
    return (
      <div className="sales-view">
        <div className="no-sale">
          <h2>Venda não encontrada</h2>
          <button onClick={onBack}>Voltar</button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="sales-view">
      <header className="view-header">
        <button className="back-button" onClick={onBack}>
          ← Voltar
        </button>
        <h1>Detalhes da Venda #{sale.id}</h1>
        <div className={`sale-status ${getStatusColor(sale.status)}`}>
          {sale.status || "Pendente"}
        </div>
      </header>

      <div className="sale-details">
        <section className="sale-info-section">
          <h2>Informações Gerais</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Cliente:</label>
              <span>{sale.cliente?.nome || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Telefone:</label>
              <span>{sale.cliente?.telefone || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Data:</label>
              <span>
                {sale.createdAt?.toDate?.().toLocaleDateString("pt-BR") ||
                  "N/A"}
              </span>
            </div>
            <div className="info-item">
              <label>Hora:</label>
              <span>
                {sale.createdAt?.toDate?.().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) || "N/A"}
              </span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className={`status ${getStatusColor(sale.status)}`}>
                {sale.status || "Pendente"}
              </span>
            </div>
            <div className="info-item">
              <label>Status Pagamento:</label>
              <span>{sale.statusPagamento || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Status Entrega:</label>
              <span>{sale.deliveryStatus || "N/A"}</span>
            </div>
          </div>
        </section>

        <section className="sale-items-section">
          <h2>Itens da Venda</h2>
          <div className="items-table">
            <div className="table-header">
              <span>Item</span>
              <span>Qtd</span>
              <span>Preço Unit.</span>
              <span>Total</span>
              <span>Pago</span>
              <span>Entregue</span>
            </div>
            {sale.itens?.map((item, index) => (
              <div key={index} className="table-row">
                <span className="item-name">{item.nome}</span>
                <span>{item.quantidade}</span>
                <span>{formatCurrency(item.preco)}</span>
                <span>{formatCurrency(item.preco * item.quantidade)}</span>
                <span className={item.pago ? "yes" : "no"}>
                  {item.pago ? "✓" : "✗"}
                </span>
                <span className={item.entregue ? "yes" : "no"}>
                  {item.entregue ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="sale-totals-section">
          <h2>Resumo Financeiro</h2>
          <div className="totals-grid">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.valorTotal || 0)}</span>
            </div>
            {sale.doacao > 0 && (
              <div className="total-row">
                <span>Doação:</span>
                <span>{formatCurrency(sale.doacao)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Valor Pago:</span>
              <span>{formatCurrency(sale.valorPago || 0)}</span>
            </div>
            {sale.troco > 0 && (
              <div className="total-row">
                <span>Troco:</span>
                <span>{formatCurrency(sale.troco)}</span>
              </div>
            )}
            <div className="total-row final">
              <span>Total Líquido:</span>
              <span>
                {formatCurrency((sale.valorTotal || 0) + (sale.doacao || 0))}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalesView;
