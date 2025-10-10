import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import "./CanceledSales.css";

const CanceledSales = ({ onClose, onRestore }) => {
  const [canceledSales, setCanceledSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanceledSales();
  }, []);

  const fetchCanceledSales = async () => {
    try {
      const snapshot = await getDocs(collection(db, "VendasCanceladas"));
      const sales = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setCanceledSales(sales);
    } catch (error) {
      console.error("Erro ao buscar vendas canceladas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (sale) => {
    if (!window.confirm('Restaurar esta venda?')) return;
    
    try {
      const { docId, canceladoPor, canceladoEm, motivoCancelamento, ...saleData } = sale;
      
      // Restaurar com createdAt original ou atual
      const restoredSale = {
        ...saleData,
        createdAt: saleData.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(collection(db, "Vendas"), restoredSale);
      await deleteDoc(doc(db, "VendasCanceladas", docId));
      alert('Venda restaurada com sucesso!');
      if (onRestore) onRestore();
      fetchCanceledSales();
    } catch (error) {
      console.error("Erro ao restaurar venda:", error);
      alert('Erro ao restaurar venda');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="canceled-modal" onClick={onClose}>
      <div className="canceled-content" onClick={(e) => e.stopPropagation()}>
        <div className="canceled-header">
          <h2>🗑️ Vendas Canceladas</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="canceled-body">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : canceledSales.length === 0 ? (
            <div className="empty">Nenhuma venda cancelada</div>
          ) : (
            canceledSales.map((sale) => (
              <div key={sale.docId} className="canceled-card">
                <div className="canceled-card-header">
                  <span className="canceled-client">{sale.cliente?.name || "Cliente"}</span>
                  <span className="canceled-total">{formatCurrency(sale.valorTotal || 0)}</span>
                </div>
                <div className="canceled-info">
                  <span>📅 {sale.date} • {sale.time}</span>
                  <span>📦 {sale.totalItens} itens</span>
                </div>
                <div className="canceled-reason">
                  <strong>Motivo:</strong> {sale.motivoCancelamento}
                </div>
                <div className="canceled-user">
                  <strong>Cancelado por:</strong> {sale.canceladoPor}
                </div>
                <button className="restore-btn" onClick={() => handleRestore(sale)}>
                  ♻️ Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CanceledSales;
