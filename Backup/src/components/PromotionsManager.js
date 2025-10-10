import React, { useState, useEffect } from "react";
import { Promotion } from "../models/Promotion";
import "./PromotionsManager.css";

const PromotionsManager = ({ onClose }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    discount: 0,
    discountType: "percentage",
    isActive: true,
    startDate: "",
    endDate: "",
    criteriaType: "total_quantity",
    productName: "",
    minQuantity: 5,
    comboProducts: [],
  });
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  useEffect(() => {
    loadPromotions();
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const itemsSnapshot = await getDocs(collection(db, 'inventory'));
      const itemsList = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().name || doc.data().nome,
        ...doc.data()
      }));
      setItems(itemsList);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const searchProducts = (searchTerm) => {
    if (searchTerm.length < 1) {
      setProductSuggestions([]);
      return;
    }
    const filtered = items.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProductSuggestions(filtered);
  };

  const loadPromotions = async () => {
    setLoading(true);
    const promos = await Promotion.getAll();
    setPromotions(promos);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const criterio = [];
    if (formData.criteriaType === "product_quantity") {
      if (!formData.productName) {
        alert('Selecione um produto da lista');
        return;
      }
      criterio.push({
        type: "product_quantity",
        productName: formData.productName,
        minQuantity: parseInt(formData.minQuantity) || 1,
      });
    } else if (formData.criteriaType === "product_combo") {
      if (formData.comboProducts.length < 2) {
        alert('Adicione pelo menos 2 produtos para o combo');
        return;
      }
      criterio.push({
        type: "product_combo",
        products: formData.comboProducts,
      });
    } else if (formData.criteriaType === "total_quantity") {
      criterio.push({
        type: "total_quantity",
        minQuantity: parseInt(formData.minQuantity) || 1,
      });
    }
    
    console.log('[PROMO SAVE] Salvando com criterio:', criterio);

    const promoData = {
      name: formData.name,
      discount: parseFloat(formData.discount),
      discountType: formData.discountType,
      isActive: formData.isActive,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      criterio,
    };

    try {
      if (editingPromo) {
        await Promotion.update(editingPromo.id, promoData);
      } else {
        await Promotion.add(promoData);
      }
      await loadPromotions();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar promoção:", error);
      alert("Erro ao salvar promoção");
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    
    let criteriaType = "total_quantity";
    let productName = "";
    let minQuantity = 5;
    let comboProducts = [];

    if (promo.criterio && promo.criterio.length > 0) {
      const criterion = promo.criterio[0];
      criteriaType = criterion.type;
      if (criterion.type === "product_quantity") {
        productName = criterion.productName || "";
        minQuantity = criterion.minQuantity || 1;
        setProductSearch(productName);
      } else if (criterion.type === "product_combo") {
        comboProducts = criterion.products || [];
      } else if (criterion.type === "total_quantity") {
        minQuantity = criterion.minQuantity || 1;
      }
    }

    setFormData({
      name: promo.name,
      discount: promo.discount,
      discountType: promo.discountType,
      isActive: promo.isActive,
      startDate: promo.startDate || "",
      endDate: promo.endDate || "",
      criteriaType,
      productName,
      minQuantity,
      comboProducts,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta promoção?")) {
      try {
        await Promotion.delete(id);
        await loadPromotions();
      } catch (error) {
        console.error("Erro ao deletar promoção:", error);
        alert("Erro ao deletar promoção");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      discount: 0,
      discountType: "percentage",
      isActive: true,
      startDate: "",
      endDate: "",
      criteriaType: "total_quantity",
      productName: "",
      minQuantity: 5,
      comboProducts: [],
    });
    setProductSearch("");
    setEditingPromo(null);
    setShowForm(false);
  };

  return (
    <div className="promotions-manager">
      <div className="promo-header">
        <h2>🎯 Gerenciar Promoções</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {!showForm ? (
        <>
          <button className="add-promo-btn" onClick={() => setShowForm(true)}>
            ➕ Nova Promoção
          </button>

          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            <div className="promos-list">
              {promotions.length === 0 ? (
                <p className="empty-state">Nenhuma promoção cadastrada</p>
              ) : (
                promotions.map((promo) => (
                  <div key={promo.id} className="promo-card">
                    <div className="promo-info">
                      <h3>{promo.name}</h3>
                      <span className="promo-discount">
                        {promo.discountType === "percentage"
                          ? `${promo.discount}% de desconto`
                          : `R$ ${promo.discount.toFixed(2)} de desconto`}
                      </span>
                      {promo.criterio && promo.criterio.length > 0 && (
                        <span className="promo-criteria">
                          {promo.criterio[0].type === "product_quantity" &&
                            `Mín. ${promo.criterio[0].minQuantity}x ${promo.criterio[0].productName}`}
                          {promo.criterio[0].type === "product_combo" &&
                            `Combo: ${promo.criterio[0].products.join(", ")}`}
                          {promo.criterio[0].type === "total_quantity" &&
                            `Mín. ${promo.criterio[0].minQuantity} itens no total`}
                        </span>
                      )}
                    </div>
                    <div className="promo-card-footer">
                      <span className={`status-badge ${promo.isActive ? "active" : "inactive"}`}>
                        {promo.isActive ? "✓ Ativa" : "✕ Inativa"}
                      </span>
                      <div className="promo-actions">
                        <button onClick={() => handleEdit(promo)}>✏️</button>
                        <button onClick={() => handleDelete(promo.id)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <form className="promo-form" onSubmit={handleSubmit}>
          <h3>{editingPromo ? "Editar Promoção" : "Nova Promoção"}</h3>

          <div className="form-group">
            <label>Nome da Promoção *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Desconto *</label>
              <input
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Critério</label>
            <select
              value={formData.criteriaType}
              onChange={(e) => setFormData({ ...formData, criteriaType: e.target.value })}
            >
              <option value="total_quantity">Quantidade total de itens</option>
              <option value="product_quantity">Quantidade de produto específico</option>
              <option value="product_combo">Combinação de produtos</option>
            </select>
          </div>

          {formData.criteriaType === "product_quantity" && (
            <>
              <div className="form-group">
                <label>Nome do Produto</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      searchProducts(e.target.value);
                      setShowProductSuggestions(true);
                    }}
                    onFocus={() => setShowProductSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                    placeholder="Digite para buscar..."
                  />
                  {showProductSuggestions && productSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '4px'
                    }}>
                      {productSuggestions.map((item) => (
                        <div
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, productName: item.nome });
                            setProductSearch(item.nome);
                            setShowProductSuggestions(false);
                          }}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-light)'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-main)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          {item.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.productName && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      padding: '6px 12px',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {formData.productName}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, productName: '' });
                          setProductSearch('');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Quantidade Mínima</label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  min="1"
                />
              </div>
            </>
          )}

          {formData.criteriaType === "product_combo" && (
            <div className="form-group">
              <label>Produtos do Combo</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    searchProducts(e.target.value);
                    setShowProductSuggestions(true);
                  }}
                  onFocus={() => setShowProductSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                  placeholder="Digite para buscar e adicionar..."
                />
                {showProductSuggestions && productSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px'
                  }}>
                    {productSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!formData.comboProducts.includes(item.nome)) {
                            setFormData({ 
                              ...formData, 
                              comboProducts: [...formData.comboProducts, item.nome] 
                            });
                          }
                          setProductSearch('');
                          setShowProductSuggestions(false);
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-main)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        {item.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.comboProducts.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.comboProducts.map((product, index) => (
                    <div key={index} style={{
                      padding: '6px 12px',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {product}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            comboProducts: formData.comboProducts.filter((_, i) => i !== index)
                          });
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.criteriaType === "total_quantity" && (
            <div className="form-group">
              <label>Quantidade Mínima Total</label>
              <input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                min="1"
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Data Início</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Data Fim</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Promoção ativa
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              {editingPromo ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PromotionsManager;
