import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import GiriCoin from './GiriCoin';
import './Ecommerce.css';

const Ecommerce = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  const ggPackages = [
    { id: 'pkg1', amount: 10, price: 10, bonus: 0, ggs: 50 },
    { id: 'pkg2', amount: 25, price: 25, bonus: 5, ggs: 130 },
    { id: 'pkg3', amount: 50, price: 50, bonus: 10, ggs: 275 },
    { id: 'pkg4', amount: 100, price: 100, bonus: 15, ggs: 575 },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'inventory'));
      const items = [];
      const cats = new Set();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.quantity > 0) {
          const cat = data.category || 'Geral';
          cats.add(cat);
          items.push({
            id: doc.id,
            name: data.name,
            price: data.salePrice,
            priceGG: Math.ceil(data.salePrice * 5),
            quantity: data.quantity,
            category: cat,
            isEvent: data.isEvent || false,
          });
        }
      });
      setProducts(items.sort((a, b) => a.name.localeCompare(b.name)));
      setCategories(Array.from(cats).sort());
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item, type = 'product') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && i.type === type 
            ? { ...i, qty: i.qty + 1 } 
            : i
        );
      }
      return [...prev, { ...item, qty: 1, type }];
    });
  };

  const removeFromCart = (id, type) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const updateCartQty = (id, type, qty) => {
    if (qty <= 0) {
      removeFromCart(id, type);
      return;
    }
    setCart(prev => prev.map(i => 
      i.id === id && i.type === type ? { ...i, qty } : i
    ));
  };

  const getFilteredProducts = () => {
    let filtered = products;
    if (filter === 'favorites') {
      filtered = products.filter(p => favorites.includes(p.id));
    } else if (filter === 'events') {
      filtered = products.filter(p => p.isEvent);
    }
    return filtered;
  };

  const eventProducts = products.filter(p => p.isEvent);
  const filteredProducts = getFilteredProducts();
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.type === 'package' ? item.price : item.priceGG;
    return sum + (price * item.qty);
  }, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="ecommerce">
      <header className="ecommerce-header">
        <h1>🛒 Loja Giri</h1>
        <button className="cart-btn" onClick={() => setActiveTab('packages')}>
          <span className="coin-animated"><GiriCoin size={32} /></span> Comprar Giri Golds
        </button>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          🛍️ Produtos
        </button>
        <button
          className={activeTab === 'cart' ? 'active' : ''}
          onClick={() => setActiveTab('cart')}
        >
          🛒 Carrinho {cart.length > 0 && `(${cart.length})`}
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="products-section">
          <div className="filters">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={filter === 'favorites' ? 'active' : ''}
              onClick={() => setFilter('favorites')}
            >
              ❤️ Favoritos
            </button>
            {eventProducts.length > 0 && (
              <button 
                className={filter === 'events' ? 'active' : ''}
                onClick={() => setFilter('events')}
              >
                🎉 Eventos
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">Carregando produtos...</div>
          ) : (
            <>
              {eventProducts.length > 0 && (
                <div className="event-section">
                  <h2 className="section-title">🎉 Itens do Evento</h2>
                  <div className="products-list">
                    {eventProducts.map((product) => (
                      <div 
                        key={product.id} 
                        className="product-item event-item"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="product-image">
                          <div className="image-placeholder">🍔</div>
                          <span className="event-badge">Evento</span>
                          <button 
                            className="favorite-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavorites(prev => 
                                prev.includes(product.id) 
                                  ? prev.filter(id => id !== product.id)
                                  : [...prev, product.id]
                              );
                            }}
                          >
                            {favorites.includes(product.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                        <div className="product-details">
                          <h3 className="product-name">{product.name}</h3>
                          <span className="product-cat">{product.category}</span>
                          <div className="product-price">
                            <GiriCoin size={20} />
                            <span>{product.priceGG} GGs</span>
                          </div>
                          <div className="product-stock-info">
                            {product.quantity} disponíveis
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredProducts.length > 0 ? (
                <div className="products-list">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="product-item"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="product-image">
                        <div className="image-placeholder">🍔</div>
                        <button 
                          className="favorite-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev => 
                              prev.includes(product.id) 
                                ? prev.filter(id => id !== product.id)
                                : [...prev, product.id]
                            );
                          }}
                        >
                          {favorites.includes(product.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div className="product-details">
                        <h3 className="product-name">{product.name}</h3>
                        <span className="product-cat">{product.category}</span>
                        <div className="product-price">
                          <GiriCoin size={20} />
                          <span>{product.priceGG} GGs</span>
                        </div>
                        <div className="product-stock-info">
                          {product.quantity} disponíveis
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <p>Nenhum produto encontrado</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedProduct && (
        <div className="product-modal" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>✕</button>
            
            <div className="modal-image">
              <div className="modal-image-placeholder">🍔</div>
            </div>

            <div className="modal-info">
              <h2>{selectedProduct.name}</h2>
              {selectedProduct.category && (
                <span className="modal-category">{selectedProduct.category}</span>
              )}
              
              <div className="modal-price">
                <GiriCoin size={40} />
                <span className="modal-price-value">{selectedProduct.priceGG} GGs</span>
              </div>

              <div className="modal-stock">
                <span className="stock-label">Disponível:</span>
                <span className="stock-value">{selectedProduct.quantity} unidades</span>
              </div>

              <div className="modal-description">
                <h3>Descrição</h3>
                <p>Produto de qualidade do Instituto Giri. Adquira com seus Giri Gold e apoie nossa causa!</p>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="action-btn add-cart"
                onClick={() => {
                  addToCart(selectedProduct, 'product');
                  setSelectedProduct(null);
                }}
              >
                🛍️ Adicionar ao Carrinho
              </button>
              <button 
                className="action-btn add-favorite"
                onClick={() => {
                  setFavorites(prev => 
                    prev.includes(selectedProduct.id) 
                      ? prev.filter(id => id !== selectedProduct.id)
                      : [...prev, selectedProduct.id]
                  );
                }}
              >
                {favorites.includes(selectedProduct.id) ? '❤️ Remover dos Favoritos' : '🤍 Adicionar aos Favoritos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="packages-section">
          <div className="packages-info">
            <h2>💎 Pacotes de Giri Gold</h2>
            <p>Compre GGs e ganhe bônus!</p>
          </div>

          <div className="products-list">
            <div className="product-item donate-item">
              <div className="product-image">
                <div className="image-placeholder donate-placeholder">
                  <GiriCoin size={48} />
                </div>
                <span className="event-badge donate-badge">❤️ Doe</span>
              </div>
              <div className="product-details">
                <h3 className="product-name">Doe Giri Golds</h3>
                <span className="product-cat">Apoie o Instituto Giri</span>
                <div className="product-price" style={{color: '#ef4444'}}>
                  <span style={{fontSize: '1.25rem', fontWeight: 700}}>❤️ Faça sua doação</span>
                </div>
                <div className="product-stock-info" style={{color: '#ef4444'}}>
                  Em breve disponível
                </div>
              </div>
            </div>

            {ggPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className="product-item package-item"
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="product-image">
                  <div className="image-placeholder">
                    <GiriCoin size={48} />
                  </div>
                  {pkg.bonus > 0 && (
                    <span className="event-badge bonus-badge">+{pkg.bonus}%</span>
                  )}
                </div>
                <div className="product-details">
                  <h3 className="product-name">{pkg.ggs} GGs</h3>
                  <span className="product-cat">Pacote de Giri Gold</span>
                  <div className="product-price">
                    <span style={{fontSize: '1.25rem', fontWeight: 700}}>{formatCurrency(pkg.amount)}</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="product-stock-info" style={{color: '#10b981'}}>
                      +{Math.floor(pkg.ggs - (pkg.amount * 5))} GGs bônus!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="cart-section">
          {cart.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🛒</span>
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.type}`} className="cart-item">
                    <div className="cart-item-image">
                      {item.type === 'package' ? (
                        <GiriCoin size={40} />
                      ) : (
                        <div className="image-placeholder">🍔</div>
                      )}
                    </div>
                    <div className="cart-item-details">
                      <h3>{item.type === 'package' ? `${item.ggs} GGs` : item.name}</h3>
                      <p className="cart-item-price">
                        {item.type === 'package' ? (
                          formatCurrency(item.price)
                        ) : (
                          <><GiriCoin size={16} /> {item.priceGG} GGs</>
                        )}
                      </p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-control">
                        <button onClick={() => updateCartQty(item.id, item.type, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, item.type, item.qty + 1)}>+</button>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id, item.type)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-value">
                    <GiriCoin size={24} /> {cartTotal} GGs
                  </span>
                </div>
                <button className="checkout-btn" disabled>
                  Finalizar Compra (Em breve)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {selectedPackage && (
        <div className="product-modal" onClick={() => setSelectedPackage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPackage(null)}>✕</button>
            
            <div className="modal-image">
              <div className="modal-image-placeholder">
                <GiriCoin size={120} />
              </div>
            </div>

            <div className="modal-info">
              <h2>{selectedPackage.ggs} Giri Gold</h2>
              <span className="modal-category">Pacote de GGs</span>
              
              <div className="modal-price">
                <span className="modal-price-value">{formatCurrency(selectedPackage.amount)}</span>
              </div>

              {selectedPackage.bonus > 0 && (
                <div className="modal-stock" style={{background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981'}}>
                  <span className="stock-label">Bônus:</span>
                  <span className="stock-value" style={{color: '#10b981'}}>+{Math.floor(selectedPackage.ggs - (selectedPackage.amount * 5))} GGs grátis!</span>
                </div>
              )}

              <div className="modal-description">
                <h3>Sobre o Pacote</h3>
                <p>Adquira Giri Gold e troque por produtos incríveis na loja! {selectedPackage.bonus > 0 && `Este pacote inclui ${selectedPackage.bonus}% de bônus.`}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="action-btn add-cart"
                onClick={() => {
                  addToCart(selectedPackage, 'package');
                  setSelectedPackage(null);
                }}
              >
                🛍️ Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ecommerce;
