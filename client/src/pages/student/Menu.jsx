import { useState, useEffect } from 'react';
import { Pizza, CupSoda, Cookie, ShoppingCart, Search, Gift, Star } from 'lucide-react';
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
  const [promociones, setPromociones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const { cart, addToCart, changeQty } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/productos').then(r => r.json()),
      fetch('/api/promociones').then(r => r.json()).catch(() => []),
      fetch('/api/categorias').then(r => r.json()).catch(() => []),
    ])
      .then(([prodData, promoData, catData]) => {
        setProductos(prodData);
        setPromociones(Array.isArray(promoData) ? promoData.filter(p => p.disponible) : []);
        setCategorias(Array.isArray(catData) ? catData : []);
        setLoading(false);
      })
      .catch(() => { toast('Error al cargar menú', 'error'); setLoading(false); });
  }, []);

  if (loading) return <div className="screen"><p className="loading">Cargando menú...</p></div>;

  const categoriesList = ['Todos', ...new Set([
    ...categorias.map(c => c.nombre),
    ...productos.map(p => p.categoria)
  ])];

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
  const totalAmount = cart.reduce((acc, c) => {
    if (c.tipo === 'promocion') return acc + (c.promocion.precio * c.cantidad);
    const precio = c.producto?.precio || 0;
    return acc + (precio * c.cantidad);
  }, 0);

  // Filtrar promociones por búsqueda
  const filteredPromos = promociones.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        {/* ── SECCIÓN DE PROMOCIONES ── */}
        {filteredPromos.length > 0 && selectedCategory === 'Todos' && (
          <div className="menu-category" style={{ marginBottom: '32px' }}>
            <div className="category-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Gift size={18} /> 🎁 Combos y Promociones
            </div>
            <div className="product-grid">
              {filteredPromos.map(promo => {
                const promoItemId = `promo_${promo.id}`;
                const cartItem = cart.find(c => c.itemId === promoItemId);
                const qty = cartItem ? cartItem.cantidad : 0;

                // Calcular precio original sumando los productos
                const precioOriginal = promo.items
                  ? promo.items.reduce((sum, it) => sum + ((it.producto?.precio || 0) * it.cantidad), 0)
                  : 0;

                return (
                  <div
                    key={promo.id}
                    className="store-card"
                    style={{ border: '2px solid rgba(76, 175, 80, 0.25)' }}
                  >
                    {/* Imagen del combo */}
                    <div className="store-card-img-wrap" style={{
                      background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                      position: 'relative'
                    }}>
                      <span className="store-card-emoji" style={{ fontSize: '36px' }}>🎁</span>
                      <div className="store-card-badge badge-promo" style={{
                        background: 'linear-gradient(135deg, #FF6B35 0%, #F44336 100%)',
                        color: '#fff', fontWeight: 800
                      }}>
                        COMBO <Star size={10} style={{ marginLeft: '2px' }} />
                      </div>
                      {qty > 0 && <div className="store-card-qty-badge">{qty}</div>}
                    </div>

                    {/* Body */}
                    <div className="store-card-body">
                      <div className="store-card-name" title={promo.nombre} style={{ fontWeight: 800 }}>
                        {promo.nombre}
                      </div>

                      {/* Productos incluidos */}
                      <div style={{ fontSize: '11px', color: '#8A6A55', lineHeight: '1.4', margin: '4px 0' }}>
                        {promo.items && promo.items.map((it, idx) => (
                          <span key={idx}>
                            {it.cantidad}× {it.producto?.nombre || 'Producto'}
                            {idx < promo.items.length - 1 ? ' + ' : ''}
                          </span>
                        ))}
                      </div>

                      {/* Precio */}
                      <div className="store-card-price-row">
                        <div>
                          {precioOriginal > promo.precio && (
                            <span style={{
                              textDecoration: 'line-through', color: '#B0A090',
                              fontSize: '12px', marginRight: '6px'
                            }}>
                              S/ {precioOriginal.toFixed(2)}
                            </span>
                          )}
                          <span className="store-card-price" style={{ color: '#4CAF50' }}>
                            S/ {promo.precio.toFixed(2)}
                          </span>
                        </div>

                        {qty > 0 ? (
                          <div className="store-qty-controls">
                            <button
                              className="store-qty-btn minus"
                              onClick={() => changeQty(promoItemId, -1)}
                            >
                              −
                            </button>
                            <span className="store-qty-val">{qty}</span>
                            <button
                              className="store-qty-btn plus"
                              onClick={() => addToCart(promo, 'promocion')}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="store-btn-add"
                            onClick={() => addToCart(promo, 'promocion')}
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PRODUCTOS INDIVIDUALES ── */}
        {filteredProducts.length === 0 && filteredPromos.length === 0 ? (
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
                    const itemId = p.id;
                    const item = cart.find(c => (c.itemId === itemId) || (c.producto && c.producto.id === p.id));
                    const qty = item ? item.cantidad : 0;
                    const ua = !p.disponible;

                    return (
                      <div
                        key={p.id}
                        className={`store-card border-${p.categoria.toLowerCase()} ${ua ? 'unavailable' : ''}`}
                      >
                        {/* Contenedor de Imagen con fondo temático */}
                        <div className={`store-card-img-wrap bg-${p.categoria.toLowerCase()}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {p.imagenUrl ? (
                            <img
                              src={p.imagenUrl}
                              alt={p.nombre}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement.querySelector('.store-card-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : null}
                          <div
                            className="store-card-fallback"
                            style={{
                              display: p.imagenUrl ? 'none' : 'flex',
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'absolute',
                              inset: 0
                            }}
                          >
                            <span className="store-card-emoji" style={{ fontSize: '32px' }}>{getCategoryEmoji(p.categoria)}</span>
                          </div>

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
                                    onClick={() => changeQty(itemId, -1)}
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
