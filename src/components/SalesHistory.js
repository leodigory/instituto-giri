import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./SalesHistory.css";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const scannerRef = useRef(null);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('usuario');
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email === '01leonardoaraujo@gmail.com') {
          setUserRole('admin');
        }
        fetchSales();
      }
    });
    
    const handleSalesUpdate = () => {
      fetchSales();
    };
    
    window.addEventListener('salesUpdated', handleSalesUpdate);
    
    return () => {
      unsubscribe();
      window.removeEventListener('salesUpdated', handleSalesUpdate);
    };
  }, [timeFilter, viewMode]);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setSales([]);
      setFilteredSales([]);
      
      const salesData = [];
      const today = new Date();
      const currentUser = auth.currentUser;
      
      console.log('[FETCH SALES] Iniciando busca...');
      console.log('[FETCH SALES] currentUser:', currentUser?.email);
      console.log('[FETCH SALES] viewMode:', viewMode);
      console.log('[FETCH SALES] timeFilter:', timeFilter);
      
      if (!currentUser) {
        console.log('[FETCH SALES] Usuário não autenticado, aguardando...');
        setLoading(false);
        return;
      }
      
      const currentUserName = currentUser.displayName || currentUser.email;
      console.log('[FETCH SALES] currentUserName:', currentUserName);
      
      let daysToFetch = 1;
      if (timeFilter === "week") daysToFetch = 7;
      if (timeFilter === "month") daysToFetch = 30;
      if (timeFilter === "year") daysToFetch = 365;
      
      const salesCollection = collection(db, "Vendas");
      const querySnapshot = await getDocs(salesCollection);
      
      console.log('[FETCH SALES] Total de documentos no Firebase:', querySnapshot.size);

      querySnapshot.forEach((docSnap) => {
        console.log('[FETCH SALES] Processando doc:', docSnap.id);
        const saleData = docSnap.data();
        console.log('[FETCH SALES] saleData:', saleData);
        
        if (saleData) {
          console.log('[FETCH SALES] vendedor na venda:', saleData.vendedor);
          console.log('[FETCH SALES] currentUserName:', currentUserName);
          console.log('[FETCH SALES] viewMode:', viewMode);
          
          if (viewMode === 'usuario') {
            // Se a venda não tem vendedor, considera como do usuário atual (vendas antigas)
            if (saleData.vendedor && saleData.vendedor !== currentUserName) {
              console.log('[FETCH SALES] Venda ignorada: vendedor diferente');
              return;
            }
          }
          
          const saleDate = saleData.createdAt?.toDate ? saleData.createdAt.toDate() : new Date();
          
          // Filter by time period
          const daysDiff = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));
          if (daysDiff <= daysToFetch) {
            salesData.push({
              id: saleData.id || docSnap.id,
              cliente: saleData.cliente || {},
              itens: saleData.itens || [],
              valorTotal: saleData.valorTotal || 0,
              valorPago: saleData.valorPago || 0,
              troco: saleData.troco || 0,
              doacao: saleData.doacao || 0,
              desconto: saleData.desconto || 0,
              status: saleData.statusPagamento || saleData.status || "Pendente",
              deliveryStatus: saleData.deliveryStatus || "Pendente",
              totalItens: (saleData.itens || []).length,
              date: saleDate.toLocaleDateString("pt-BR"),
              time: saleDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              fullDate: saleDate,
              createdAt: saleData.createdAt,
            });
          }
        }
      });

      console.log('[FETCH SALES] Total de vendas processadas:', salesData.length);
      
      const uniqueSales = salesData.filter((sale, index, self) => 
        index === self.findIndex(s => s.id === sale.id)
      );
      
      console.log('[FETCH SALES] Vendas únicas após filtro:', uniqueSales.length);
      
      uniqueSales.sort((a, b) => b.fullDate - a.fullDate);
      setSales(uniqueSales);
      
      console.log('[FETCH SALES] Vendas definidas no estado:', uniqueSales.length);
    } catch (error) {
      console.error("Erro:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.cliente?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.date.includes(searchTerm)
      );
    }

    // Filtro de status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(sale => {
        const entregues = sale.itens?.filter(i => i.entregue).length || 0;
        const total = sale.totalItens;
        
        switch(statusFilter) {
          case "pago":
            return sale.status?.toLowerCase() === "pago";
          case "pendente":
            return sale.status?.toLowerCase() === "pendente";
          case "parcial":
            return sale.status?.toLowerCase() === "parcial";
          case "entregue":
            return entregues === total;
          case "nao-entregue":
            return entregues === 0;
          case "parcial-entregue":
            return entregues > 0 && entregues < total;
          default:
            return true;
        }
      });
    }

    setFilteredSales(filtered);
  };

  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const handleCancelSale = async () => {
    if (cancelReason.trim().length < 10) {
      alert('O motivo deve ter pelo menos 10 caracteres');
      return;
    }
    
    try {
      await addDoc(collection(db, "VendasCanceladas"), {
        ...selectedSale,
        canceladoPor: auth.currentUser?.displayName || "Usuário",
        canceladoEm: new Date(),
        motivoCancelamento: cancelReason
      });
      
      const salesQuery = query(collection(db, "Vendas"), where("id", "==", selectedSale.id));
      const querySnapshot = await getDocs(salesQuery);
      querySnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "Vendas", docSnap.id));
      });
      
      alert('Venda cancelada com sucesso!');
      setShowCancelPopup(false);
      setCancelReason("");
      closeModal();
      fetchSales();
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
      alert('Erro ao cancelar venda');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "concluida":
        return "#22c55e";
      case "pago":
        return "#10b981";
      case "entregue":
        return "#06d6a0";
      case "pendente":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const handleQRScan = async () => {
    setShowQRScanner(true);
    const devices = await Html5Qrcode.getCameras();
    setCameras(devices);
    const savedIndex = parseInt(localStorage.getItem('lastCameraIndex')) || 0;
    const initialIndex = savedIndex < devices.length ? savedIndex : 0;
    setCurrentCameraIndex(initialIndex);
    setTimeout(() => startScanner(initialIndex, devices), 100);
  };

  const startScanner = async (cameraIndex, cameraList = cameras) => {
    try {
      setScanning(true);
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      const cameraId = cameraList[cameraIndex]?.id || { facingMode: "environment" };
      
      await html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleQRResult(decodedText);
        },
        (error) => {}
      );
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);
      setScanning(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {}
    }
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    localStorage.setItem('lastCameraIndex', nextIndex);
    setTimeout(() => startScanner(nextIndex, cameras), 300);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {}
    }
    setScanning(false);
    setShowQRScanner(false);
  };

  const handleQRResult = async (result) => {
    await stopScanner();
    const sale = sales.find(s => s.id === result);
    if (sale) {
      handleSaleClick(sale);
    } else {
      alert(`Venda ${result} não encontrada`);
    }
  };

  if (loading) {
    return (
      <div className="history">
        <div className="skeleton-header"></div>
        <div className="skeleton-filters"></div>
        <div className="skeleton-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="history">
      <div className="history-header">
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
        </div>
        <div className="search-section">
          <input
            type="text"
            placeholder="Buscar por cliente, ID ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="qr-btn" onClick={handleQRScan}>
            📱 QR Code
          </button>
        </div>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${timeFilter === "today" ? "active" : ""}`}
            onClick={() => setTimeFilter("today")}
          >
            Hoje
          </button>
          <button 
            className={`filter-tab ${timeFilter === "week" ? "active" : ""}`}
            onClick={() => setTimeFilter("week")}
          >
            Semana
          </button>
          <button 
            className={`filter-tab ${timeFilter === "month" ? "active" : ""}`}
            onClick={() => setTimeFilter("month")}
          >
            Mês
          </button>
          <button 
            className={`filter-tab ${timeFilter === "year" ? "active" : ""}`}
            onClick={() => setTimeFilter("year")}
          >
            Ano
          </button>
        </div>
        <div className="results-count">
          {filteredSales.length} vendas encontradas
        </div>
      </div>

      <div className="sales-grid">
        {filteredSales.map((sale, index) => (
          <div
            key={`${timeFilter}-${sale.id}-${index}`}
            className="sale-card"
            onClick={() => handleSaleClick(sale)}
          >
              <div className="card-body">
                <div className="client-name">
                  {sale.cliente?.name || "Cliente"}
                </div>
                <div className="sale-info">
                  <span className="sale-date">{sale.date} • {sale.time}</span>
                  <span className="item-count">📦 {sale.totalItens} itens</span>
                </div>
                <div className="sale-bottom">
                  <div className="sale-total">
                    {formatCurrency((sale.valorTotal || 0) - (sale.desconto || 0))}
                  </div>
                  <div className="status-badges">
                    <div 
                      className="status-badge payment"
                      style={{ 
                        backgroundColor: (() => {
                          const s = sale.status?.toLowerCase();
                          if (s === "pago") return "#22c55e";
                          if (s === "parcial") return "#eab308";
                          return "#ef4444";
                        })()
                      }}
                    >
                      💰 {sale.status || "Pendente"}
                    </div>
                    <div 
                      className="status-badge delivery"
                      style={{ 
                        backgroundColor: (() => {
                          const entregues = sale.itens?.filter(i => i.entregue).length || 0;
                          const total = sale.totalItens;
                          if (entregues === total) return "#22c55e";
                          if (entregues > 0) return "#eab308";
                          return "#ef4444";
                        })()
                      }}
                    >
                      📦 {(() => {
                        const entregues = sale.itens?.filter(i => i.entregue).length || 0;
                        const total = sale.totalItens;
                        if (entregues === total) return "Entregue";
                        if (entregues > 0) return `${entregues}/${total}`;
                        return "Pendente";
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        
        {filteredSales.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Nenhuma venda encontrada</h3>
            <p>
              {searchTerm 
                ? "Tente ajustar o termo de busca" 
                : "Não há vendas cadastradas no sistema"
              }
            </p>
          </div>
        )}
      </div>

      <button 
        className="floating-filter-btn"
        onClick={() => setShowFilterMenu(!showFilterMenu)}
      >
        📊
      </button>

      {showQRScanner && (
        <div className="qr-scanner-modal" onClick={stopScanner}>
          <div className="qr-scanner-content" onClick={(e) => e.stopPropagation()}>
            <div className="qr-scanner-header">
              <h3>Escanear QR Code</h3>
              <button className="close-btn" onClick={stopScanner}>✕</button>
            </div>
            <div className="qr-scanner-body">
              <div id="qr-reader" style={{ width: '100%' }}></div>
              {cameras.length > 1 && scanning && (
                <button className="switch-camera-btn" onClick={switchCamera}>
                  🔄 Trocar Câmera
                </button>
              )}
              {!scanning && (
                <div className="qr-input-section">
                  <p>Ou digite o ID da venda:</p>
                  <input
                    type="text"
                    placeholder="ID da venda"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleQRResult(e.target.value);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFilterMenu && (
        <div className="filter-menu" onClick={() => setShowFilterMenu(false)}>
          <div className="filter-menu-content" onClick={(e) => e.stopPropagation()}>
            <h3>Filtrar por Status</h3>
            <button 
              className={`filter-menu-item ${statusFilter === "todos" ? "active" : ""}`}
              onClick={() => { setStatusFilter("todos"); setShowFilterMenu(false); }}
            >
              Todos
            </button>
            <button 
              className={`filter-menu-item ${statusFilter === "pago" ? "active" : ""}`}
              onClick={() => { setStatusFilter("pago"); setShowFilterMenu(false); }}
            >
              🟢 Pago
            </button>
            <button 
              className={`filter-menu-item ${statusFilter === "parcial" ? "active" : ""}`}
              onClick={() => { setStatusFilter("parcial"); setShowFilterMenu(false); }}
            >
              🟡 Parcial
            </button>
            <button 
              className={`filter-menu-item ${statusFilter === "pendente" ? "active" : ""}`}
              onClick={() => { setStatusFilter("pendente"); setShowFilterMenu(false); }}
            >
              🔴 Pendente
            </button>
            <button 
              className={`filter-menu-item ${statusFilter === "entregue" ? "active" : ""}`}
              onClick={() => { setStatusFilter("entregue"); setShowFilterMenu(false); }}
            >
              🟢 Entregue
            </button>
            <button 
              className={`filter-menu-item ${statusFilter === "parcial-entregue" ? "active" : ""}`}
              onClick={() => { setStatusFilter("parcial-entregue"); setShowFilterMenu(false); }}
            >
              🟡 Parcial Entregue
            </button>
            <button 
              className={`filter-menu-item ${statusFilter === "nao-entregue" ? "active" : ""}`}
              onClick={() => { setStatusFilter("nao-entregue"); setShowFilterMenu(false); }}
            >
              🔴 Não Entregue
            </button>
          </div>
        </div>
      )}

      {showModal && selectedSale && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Venda #{selectedSale.id}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <div className="info-row">
                  <span>Cliente:</span>
                  <span>{selectedSale.cliente?.name || "N/A"}</span>
                </div>
                <div className="info-row">
                  <span>Data:</span>
                  <span>{selectedSale.date} às {selectedSale.time}</span>
                </div>
                <div className="info-row">
                  <span>Status:</span>
                  <span 
                    className="status-text"
                    style={{ color: getStatusColor(selectedSale.status) }}
                  >
                    {selectedSale.status || "Pendente"}
                  </span>
                </div>
              </div>

              <div className="items-section">
                <h4>Itens</h4>
                {selectedSale.itens?.map((item, index) => (
                  <div key={`item-${index}-${item.id || item.nome}`} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.nome}</span>
                      <span className="item-qty">Qtd: {item.quantidade}</span>
                    </div>
                    <div className="item-total">
                      {formatCurrency(item.preco * item.quantidade)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="totals-section">
                <div className="total-row">
                  <span>Total:</span>
                  <span className="total-value">
                    {formatCurrency(selectedSale.valorTotal || 0)}
                  </span>
                </div>
                {selectedSale.valorPago > 0 && (
                  <div className="total-row">
                    <span>Pago:</span>
                    <span>{formatCurrency(selectedSale.valorPago)}</span>
                  </div>
                )}
                {selectedSale.troco > 0 && (
                  <div className="total-row">
                    <span>Troco:</span>
                    <span>{formatCurrency(selectedSale.troco)}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowCancelPopup(true)}>
                  ❌ Cancelar Venda
                </button>
                {!(selectedSale.status?.toLowerCase() === "pago" && 
                   selectedSale.itens?.filter(i => i.entregue).length === selectedSale.totalItens) && (
                  <button className="btn-update" onClick={() => {
                    navigate('/vendas', { state: { editSale: selectedSale } });
                  }}>
                    🔄 Atualizar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelPopup && (
        <div className="cancel-popup" onClick={() => setShowCancelPopup(false)}>
          <div className="cancel-popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar Venda</h3>
            <p>Tem certeza que deseja cancelar esta venda?</p>
            <textarea
              placeholder="Motivo do cancelamento (mínimo 10 caracteres)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
            <div className="cancel-popup-actions">
              <button className="btn-cancel-action" onClick={() => setShowCancelPopup(false)}>
                Voltar
              </button>
              <button className="btn-confirm-action" onClick={handleCancelSale}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;