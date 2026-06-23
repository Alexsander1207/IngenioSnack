import { useEffect, useState } from 'react';
import { Cookie, CupSoda, Gift, Pizza, Search, ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const CATEGORY_ALL = 'Todos';

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const getCategorySlug = (categoryName) => {
  const normalized = normalizeText(categoryName);
  if (normalized.includes('bebida')) return 'bebida';
  if (normalized.includes('snack')) return 'snack';
  if (normalized.includes('sandwich')) return 'sandwich';
  return 'general';
};

const getCategoryIcon = (categoryName) => {
  const slug = getCategorySlug(categoryName);
  if (slug === 'bebida') return <CupSoda size={18} />;
  if (slug === 'snack') return <Cookie size={18} />;
  return <Pizza size={18} />;
};

const getProductCategoryName = (product, categories) => {
  return product.categoria
    || categories.find(cat => cat.id === (product.categoriaId || product.categoria_id))?.nombre
    || 'Sin categoria';
};

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [productError, setProductError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL);
  const { cart, addToCart, changeQty } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    Promise.all([
      fetch('/api/promociones').then(res => res.json()).catch(() => []),
      fetch('/api/categorias').then(res => res.json()).catch(() => []),
    ])
      .then(([promoData, categoryData]) => {
        if (ignore) return;
        setPromociones(Array.isArray(promoData) ? promoData.filter(promo => promo.disponible) : []);
        setCategorias(Array.isArray(categoryData) ? categoryData : []);
      })
      .catch(() => {
        if (!ignore) setMenuError('No se pudieron cargar categorias o promociones.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const query = selectedCategory === CATEGORY_ALL
      ? ''
      : `?categoriaId=${encodeURIComponent(selectedCategory)}`;

    fetch(`/api/productos${query}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'No se pudieron cargar los productos.');
        }
        if (!ignore) {
          setProductError('');
          setProductos(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setProductos([]);
          setProductError(err.message || 'Error al cargar productos.');
        }
      })
      .finally(() => {
        if (!ignore) setProductsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategory]);

  const handleCategorySelect = (categoryId) => {
    if (categoryId === selectedCategory) return;
    setProductError('');
    setProductsLoading(true);
    setSelectedCategory(categoryId);
  };

  if (loading && productsLoading) {
    return (
      <div className="screen">
        <p className="loading">Cargando menu...</p>
      </div>
    );
  }

  const query = normalizeText(searchQuery);
  const categoryOptions = [{ id: CATEGORY_ALL, nombre: 'Todos' }, ...categorias];
  const selectedCategoryName = selectedCategory === CATEGORY_ALL
    ? CATEGORY_ALL
    : categorias.find(cat => cat.id === selectedCategory)?.nombre || 'Categoria';

  const filteredProducts = productos.filter((product) => {
    const categoryName = getProductCategoryName(product, categorias);
    return normalizeText(product.nombre).includes(query) || normalizeText(categoryName).includes(query);
  });

  const filteredPromos = selectedCategory === CATEGORY_ALL
    ? promociones.filter((promo) => (
        normalizeText(promo.nombre).includes(query)
        || normalizeText(promo.descripcion).includes(query)
      ))
    : [];

  const productSections = selectedCategory === CATEGORY_ALL
    ? [...new Set(filteredProducts.map(product => getProductCategoryName(product, categorias)))]
        .map(nombre => ({
          nombre,
          productos: filteredProducts.filter(product => getProductCategoryName(product, categorias) === nombre)
        }))
    : [{ nombre: selectedCategoryName, productos: filteredProducts }];

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalAmount = cart.reduce((acc, item) => {
    if (item.tipo === 'promocion') return acc + ((item.promocion?.precio || 0) * item.cantidad);
    return acc + ((item.producto?.precio || 0) * item.cantidad);
  }, 0);

  const hasResults = filteredPromos.length > 0 || filteredProducts.length > 0;

  return (
    <div className="screen menu-screen">
      <div className="screen-header">
        <h2>Menu del dia</h2>
        <p className="screen-sub">Elige tus favoritos y arma tu pedido antes de llegar a la cafeteria.</p>
      </div>

      <div className="search-container">
        <div className="search-icon-wrap">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Buscar producto o categoria..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="category-pills" aria-label="Categorias del menu">
        {categoryOptions.map((category) => {
          const active = selectedCategory === category.id;
          const slug = getCategorySlug(category.nombre);

          return (
            <button
              type="button"
              key={category.id}
              className={`category-pill ${active ? `active cat-${slug}` : ''}`}
              onClick={() => handleCategorySelect(category.id)}
              aria-pressed={active}
            >
              {category.nombre}
            </button>
          );
        })}
      </div>

      <div id="menu-content">
        {(menuError || productError) && (
          <div className="admin-feedback error">
            {menuError || productError}
          </div>
        )}

        {productsLoading && (
          <div className="menu-loading-inline">Actualizando productos...</div>
        )}

        {filteredPromos.length > 0 && (
          <section className="menu-category">
            <div className="category-title">
              <Gift size={18} />
              Combos y promociones
            </div>
            <div className="product-grid">
              {filteredPromos.map((promo) => {
                const promoItemId = `promo_${promo.id}`;
                const cartItem = cart.find(item => item.itemId === promoItemId);
                const qty = cartItem ? cartItem.cantidad : 0;
                const precioOriginal = Array.isArray(promo.items)
                  ? promo.items.reduce((sum, item) => sum + ((item.producto?.precio || 0) * item.cantidad), 0)
                  : 0;

                return (
                  <article className="store-card promo-card" key={promo.id}>
                    <div className="store-card-img-wrap promo-bg">
                      <Gift size={42} />
                      <div className="store-card-badge badge-promo">
                        Combo <Star size={10} />
                      </div>
                      {qty > 0 && <div className="store-card-qty-badge">{qty}</div>}
                    </div>
                    <div className="store-card-body">
                      <div className="store-card-name" title={promo.nombre}>{promo.nombre}</div>
                      {Array.isArray(promo.items) && (
                        <div className="store-card-desc">
                          {promo.items.map((item, index) => (
                            <span key={`${promo.id}-${index}`}>
                              {item.cantidad}x {item.producto?.nombre || 'Producto'}
                              {index < promo.items.length - 1 ? ' + ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="store-card-price-row">
                        <div>
                          {precioOriginal > promo.precio && (
                            <span className="store-card-old-price">S/ {precioOriginal.toFixed(2)}</span>
                          )}
                          <span className="store-card-price">S/ {Number(promo.precio).toFixed(2)}</span>
                        </div>
                        {qty > 0 ? (
                          <div className="store-qty-controls">
                            <button className="store-qty-btn minus" onClick={() => changeQty(promoItemId, -1)}>-</button>
                            <span className="store-qty-val">{qty}</span>
                            <button className="store-qty-btn plus" onClick={() => addToCart(promo, 'promocion')}>+</button>
                          </div>
                        ) : (
                          <button className="store-btn-add" onClick={() => addToCart(promo, 'promocion')}>+</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {!hasResults ? (
          <div className="empty-state menu-empty">
            <h3>No se encontraron productos</h3>
            <p>Prueba con otra busqueda o selecciona otra categoria.</p>
          </div>
        ) : (
          productSections.map((section) => {
            if (section.productos.length === 0) return null;

            return (
              <section className="menu-category" key={section.nombre}>
                <div className="category-title">
                  {getCategoryIcon(section.nombre)}
                  {section.nombre}
                </div>
                <div className="product-grid">
                  {section.productos.map((product) => {
                    const categoryName = getProductCategoryName(product, categorias);
                    const slug = getCategorySlug(categoryName);
                    const itemId = product.id;
                    const item = cart.find(cartItem => cartItem.itemId === itemId || cartItem.producto?.id === itemId);
                    const qty = item ? item.cantidad : 0;
                    const stock = product.stock ?? 0;
                    const unavailable = !product.disponible || stock <= 0;

                    return (
                      <article className={`store-card border-${slug} ${unavailable ? 'unavailable' : ''}`} key={product.id}>
                        <div className={`store-card-img-wrap bg-${slug}`}>
                          {product.imagenUrl ? (
                            <img
                              src={product.imagenUrl}
                              alt={product.nombre}
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="store-card-fallback-text">
                              {String(product.nombre || 'IS').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {stock > 0 && stock < 5 && (
                            <div className="store-card-badge badge-promo">Ultimos {stock}</div>
                          )}
                          {qty > 0 && <div className="store-card-qty-badge">{qty}</div>}
                        </div>
                        <div className="store-card-body">
                          <div className="store-card-name" title={product.nombre}>{product.nombre}</div>
                          <span className={`store-stock-tag ${unavailable ? 'stock-none' : stock > 10 ? 'stock-full' : 'stock-low'}`}>
                            <span className="stock-dot"></span>
                            {unavailable ? 'Agotado' : stock > 10 ? 'Disponible' : 'Pocas unidades'}
                          </span>
                          <div className="store-card-price-row">
                            <span className="store-card-price">S/ {Number(product.precio).toFixed(2)}</span>
                            {!unavailable && (
                              qty > 0 ? (
                                <div className="store-qty-controls">
                                  <button className="store-qty-btn minus" onClick={() => changeQty(itemId, -1)}>-</button>
                                  <span className="store-qty-val">{qty}</span>
                                  <button className="store-qty-btn plus" disabled={qty >= stock} onClick={() => addToCart(product)}>+</button>
                                </div>
                              ) : (
                                <button className="store-btn-add" onClick={() => addToCart(product)}>+</button>
                              )
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {totalItems > 0 && (
          <div className="cart-float store-cart-float" onClick={() => navigate('/estudiante/cart')}>
            <span className="cf-info">
              <ShoppingCart size={18} />
              {totalItems} item{totalItems > 1 ? 's' : ''}
            </span>
            <span className="cf-total">S/ {totalAmount.toFixed(2)}</span>
            <button className="cf-btn" onClick={(event) => { event.stopPropagation(); navigate('/estudiante/cart'); }}>
              Ver pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
