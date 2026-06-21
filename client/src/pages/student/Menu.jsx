import { useState, useEffect } from 'react';
import { Pizza, CupSoda, Cookie, ShoppingCart, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';

const getCategoryIcon = (cat) => {
  if (cat === 'Bebida') return <CupSoda size={18} />;
  if (cat === 'Snack') return <Cookie size={18} />;
  return <Pizza size={18} />;
};

const getCategoryEmoji = (cat) => {
  if (cat === 'Bebida') return '☕';
  if (cat === 'Snack') return '🍪';
  return '🥪';
};

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const { cart, addToCart, changeQty } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/productos')
      .then(r => r.json())
      .then(data => { setProductos(data); setLoading(false); })
      .catch(() => { toast('Error al cargar menú', 'error'); setLoading(false); });
  }, []);

  if (loading) return <div className="screen"><p className="loading">Cargando menú...</p></div>;

  const categoriesList = ['Todos', ...new Set(productos.map(p => p.categoria))];

  const filteredProducts = productos.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesToRender = selectedCategory === 'Todos'
    ? [...new Set(filteredProducts.map(p => p.categoria))]
    : [selectedCategory];

  const totalItems = cart.reduce((acc, c) => acc + c.cantidad, 0);
  const totalAmount = cart.reduce((acc, c) => acc + (c.producto.precio * c.cantidad), 0);

  return (
    <div className="screen">
      <div className="screen-header" style={{ marginBottom: '20px' }}>
        <h2>Menú del día 🏪</h2>
        <p className="screen-sub">Explora nuestra variedad de sándwiches, bebidas y snacks frescos</p>
      </div>

      {/* Buscador y Filtro por Categoría */}
      <div className="search-container">
        <div className="search-icon-wrap">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="¿Qué te provoca pedir hoy? Buscar..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="category-pills">
        {categoriesList.map(cat => {
          const isSelected = selectedCategory === cat;
          let catClass = '';
          if (cat === 'Sandwich') catClass = 'cat-sandwich';
          else if (cat === 'Bebida') catClass = 'cat-bebida';
          else if (cat === 'Snack') catClass = 'cat-snack';

          return (
            <button
              key={cat}
              className={`category-pill ${isSelected ? `active ${catClass}` : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'Todos' && '🍽️ Todos'}
              {cat === 'Sandwich' && '🥪 Sándwiches'}
              {cat === 'Bebida' && '🥤 Bebidas'}
              {cat === 'Snack' && '🍪 Snacks'}
              {cat !== 'Todos' && cat !== 'Sandwich' && cat !== 'Bebida' && cat !== 'Snack' && cat}
            </button>
          );
        })}
      </div>

      <div id="menu-content">
        {filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>No se encontraron productos</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Prueba con otra búsqueda o selecciona otra categoría.</p>
          </div>
        ) : (
          categoriesToRender.map(cat => {
            const catProducts = filteredProducts.filter(p => p.categoria === cat);
            if (catProducts.length === 0) return null;

            return (
              <div key={cat} className="menu-category" style={{ marginBottom: '32px' }}>
                <div className="category-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  {getCategoryIcon(cat)} {cat}s
                </div>
                <div className="product-grid">
                  {catProducts.map(p => {
                    const item = cart.find(c => c.producto.id === p.id);
                    const qty = item ? item.cantidad : 0;
                    const ua = !p.disponible;

                    return (
                      <div
                        key={p.id}
                        className={`store-card border-${p.categoria.toLowerCase()} ${ua ? 'unavailable' : ''}`}
                      >
                        {/* Contenedor de Imagen con fondo temático */}
                        <div className={`store-card-img-wrap bg-${p.categoria.toLowerCase()}`}>
                          {p.imagenUrl ? (
                            <img src={p.imagenUrl} alt={p.nombre} />
                          ) : (
                            <span className="store-card-emoji">{getCategoryEmoji(p.categoria)}</span>
                          )}

                          {/* Floating Badges */}
                          {ua ? (
                            <div className="store-card-badge badge-agotado">Agotado</div>
                          ) : p.stock < 5 ? (
                            <div className="store-card-badge badge-promo">Últimos {p.stock}</div>
                          ) : p.id === 'S1' || p.id === 'B1' ? (
                            <div className="store-card-badge badge-popular">Popular 🔥</div>
                          ) : p.id === 'S2' || p.id === 'K1' ? (
                            <div className="store-card-badge badge-nuevo">Recomendado ⭐</div>
                          ) : null}

                          {/* Quantity Badge */}
                          {qty > 0 && <div className="store-card-qty-badge">{qty}</div>}
                        </div>

                        {/* Body */}
                        <div className="store-card-body">
                          <div className="store-card-name" title={p.nombre}>{p.nombre}</div>
                          
                          {/* Stock Tag */}
                          {ua ? (
                            <span className="store-stock-tag stock-none">
                              <span className="stock-dot"></span>Agotado
                            </span>
                          ) : p.stock > 10 ? (
                            <span className="store-stock-tag stock-full">
                              <span className="stock-dot"></span>Disponible
                            </span>
                          ) : (
                            <span className="store-stock-tag stock-low">
                              <span className="stock-dot"></span>Pocas unidades
                            </span>
                          )}

                          {/* Price and actions */}
                          <div className="store-card-price-row">
                            <span className="store-card-price">S/ {p.precio.toFixed(2)}</span>
                            
                            {!ua && (
                              qty > 0 ? (
                                <div className="store-qty-controls">
                                  <button
                                    className="store-qty-btn minus"
                                    onClick={() => changeQty(p.id, -1)}
                                  >
                                    −
                                  </button>
                                  <span className="store-qty-val">{qty}</span>
                                  <button
                                    className="store-qty-btn plus"
                                    disabled={qty >= p.stock}
                                    onClick={() => addToCart(p)}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="store-btn-add"
                                  disabled={p.stock <= 0}
                                  onClick={() => addToCart(p)}
                                >
                                  +
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Floating Cart CTA banner */}
        {totalItems > 0 && (
          <div className="cart-float store-cart-float" onClick={() => navigate('/estudiante/cart')}>
            <span className="cf-info">
              <ShoppingCart size={18} style={{ marginRight: '6px' }} />
              {totalItems} item{totalItems > 1 ? 's' : ''}
            </span>
            <span className="cf-total" style={{ marginRight: '12px' }}>
              S/ {totalAmount.toFixed(2)}
            </span>
            <button className="cf-btn" onClick={(e) => { e.stopPropagation(); navigate('/estudiante/cart'); }}>
              Ver pedido →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
