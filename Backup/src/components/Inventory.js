import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import "./Inventory.css";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email === '01leonardoaraujo@gmail.com') {
      setIsAdmin(true);
    }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "inventory"));
      const itemsData = [];
      snapshot.forEach((docSnap) => {
        itemsData.push({
          firebaseId: docSnap.id,
          ...docSnap.data(),
        });
      });
      itemsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      console.log("Itens com IDs:", itemsData.map(i => ({ firebaseId: i.firebaseId, name: i.name })));
      setItems(itemsData);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: formData.name,
        salePrice: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        updatedAt: new Date(),
      };

      if (editingItem) {
        console.log("Tentando atualizar:", editingItem.firebaseId, editingItem);
        const docRef = doc(db, "inventory", editingItem.firebaseId);
        const docSnap = await getDocs(query(collection(db, "inventory")));
        const exists = docSnap.docs.find(d => d.id === editingItem.firebaseId);
        
        if (!exists) {
          alert('Documento n\u00e3o encontrado no Firebase. ID: ' + editingItem.firebaseId);
          return;
        }
        
        await updateDoc(docRef, itemData);
        alert('Item atualizado com sucesso!');
      } else {
        itemData.createdAt = new Date();
        await addDoc(collection(db, "inventory"), itemData);
        alert('Item adicionado com sucesso!');
      }

      setFormData({ name: "", price: "", quantity: "", category: "" });
      setShowModal(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.salePrice.toString(),
      quantity: item.quantity.toString(),
      category: item.category || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm("Excluir este item?")) {
      try {
        await deleteDoc(doc(db, "inventory", item.firebaseId));
        fetchItems();
      } catch (error) {
        console.error("Erro ao excluir item:", error);
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: "Esgotado", color: "#ef4444", class: "out" };
    if (quantity <= 5) return { status: "Baixo", color: "#f59e0b", class: "low" };
    return { status: "Disponível", color: "#22c55e", class: "ok" };
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const stock = getStockStatus(item.quantity);
    
    if (filter === "all") return matchesSearch;
    if (filter === "available") return matchesSearch && stock.class === "ok";
    if (filter === "low") return matchesSearch && stock.class === "low";
    if (filter === "out") return matchesSearch && stock.class === "out";
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="inventory">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory">
      <header className="header">
        <div className="search">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <button 
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Todos ({items.length})
          </button>
          <button 
            className={filter === "available" ? "active" : ""}
            onClick={() => setFilter("available")}
          >
            Disp. ({items.filter(i => getStockStatus(i.quantity).class === "ok").length})
          </button>
          <button 
            className={filter === "low" ? "active" : ""}
            onClick={() => setFilter("low")}
          >
            Baixo ({items.filter(i => getStockStatus(i.quantity).class === "low").length})
          </button>
          <button 
            className={filter === "out" ? "active" : ""}
            onClick={() => setFilter("out")}
          >
            Esg. ({items.filter(i => getStockStatus(i.quantity).class === "out").length})
          </button>
        </div>
      </header>

      <main className="content">
        {filteredItems.length > 0 ? (
          <div className="grid">
            {filteredItems.map((item) => {
              const stock = getStockStatus(item.quantity);
              return (
                <div key={item.firebaseId} className={`card ${stock.class}`}>
                  <div className="card-header">
                    <div className="quantity" style={{ backgroundColor: stock.color }}>
                      {item.quantity}
                    </div>
                    <div className="header-content">
                      <h3>{item.name}</h3>
                      {item.category && (
                        <div className="category">{item.category}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="price-section">
                      <span className="price-label">Valor do item:</span>
                      <span className="price">{formatPrice(item.salePrice)}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => isAdmin && handleEdit(item)}
                      disabled={!isAdmin}
                      style={{ opacity: isAdmin ? 1 : 0.5, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                    >
                      ✎
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => isAdmin && handleDelete(item)}
                      disabled={!isAdmin}
                      style={{ opacity: isAdmin ? 1 : 0.5, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente ajustar os filtros ou adicione novos produtos</p>
          </div>
        )}
      </main>

      <button
        className="fab"
        onClick={() => {
          setShowModal(true);
          setEditingItem(null);
          setFormData({ name: "", price: "", quantity: "", category: "" });
        }}
      >
        +
      </button>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Editar Produto" : "Novo Produto"}</h3>
              <button className="close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="row">
                <div className="field">
                  <label>Preço *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Quantidade *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Categoria</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="actions">
                <button type="submit" className="btn-save">
                  {editingItem ? "Atualizar" : "Adicionar"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;