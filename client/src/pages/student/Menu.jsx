import { apiFetch } from '../../services/apiClient';
import { useEffect, useState } from 'react';
import { Cookie, CupSoda, Gift, Heart, Info, Pizza, Search, ShoppingCart, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const CATEGORY_ALL = 'Todos';
const CATEGORY_FAVORITES = 'Favoritos';

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
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

const getProductImageUrl = (product) => product.imagenUrl || product.imagen_url || '';

const hasValue = (value) => value !== null && value !== undefined && value !== '';

const getNutritionRows = (product) => [
  ['Calorias', hasValue(product.calorias) ? `${product.calorias} kcal` : null],
  ['Proteinas', hasValue(product.proteinas) ? `${Number(product.proteinas).toFixed(1)} g` : null],
  ['Carbohidratos', hasValue(product.carbohidratos) ? `${Number(product.carbohidratos).toFixed(1)} g` : null],
  ['Grasas', hasValue(product.grasas) ? `${Number(product.grasas).toFixed(1)} g` : null],
  ['Alergenos', hasValue(product.alergenos) ? product.alergenos : null],
].filter(([, value]) => hasValue(value));

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
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favoriteSavingId, setFavoriteSavingId] = useState(null);
  const { cart, addToCart, changeQty, puntosSaldo } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    Promise.all([
      apiFetch('/api/promociones/vigentes').then(res => res.json()).catch(() => []),
      apiFetch('/api/categorias').then(res => res.json()).catch(() => []),
    ])
      .then(([promoData, categoryData]) => {
        if (ignore) return;
        setPromociones(Array.isArray(promoData) ? promoData : []);
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
    setProductsLoading(true);

    const query = selectedCategory === CATEGORY_ALL || selectedCategory === CATEGORY_FAVORITES
      ? ''
      : `?categoriaId=${encodeURIComponent(selectedCategory)}`;

    apiFetch(`/api/productos${query}`)
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

  useEffect(() => {
    let ignore = false;

    apiFetch('/api/favoritos/productos')
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        if (ignore) return;
        setFavoriteIds(new Set(data.map((fav) => fav.producto_id || fav.producto?.id).filter(Boolean)));
      })
      .catch(() => {
        if (!ignore) setFavoriteIds(new Set());
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCategorySelect = (categoryId) => {
    if (categoryId === selectedCategory) return;
    setProductError('');
    setProductsLoading(true);
    setSelectedCategory(categoryId);
  };

  const handleAddToCart = (event, product) => {
    event.stopPropagation();
    addToCart(product);
  };

  const handleChangeQty = (event, itemId, delta) => {
    event.stopPropagation();
    changeQty(itemId, delta);
  };

  const toggleFavorite = async (event, product) => {
    event.stopPropagation();
    if (!product?.id || favoriteSavingId === product.id) return;

    const isFavorite = favoriteIds.has(product.id);
    setFavoriteSavingId(product.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.delete(product.id);
      else next.add(product.id);
      return next;
    });

    try {
      const res = await apiFetch(`/api/favoritos/productos/${product.id}`, {
        method: isFavorite ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('No se pudo actualizar favoritos.');
    } catch (_) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFavorite) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    } finally {
      setFavoriteSavingId(null);
    }
  };

  if (loading && productsLoading) {
    return (
      <div className="screen">
        <p className="loading">Cargando menu...</p>
      </div>
    );
  }

  const query = normalizeText(searchQuery);
  const categoryOptions = [
    { id: CATEGORY_ALL, nombre: 'Todos' },
    { id: CATEGORY_FAVORITES, nombre: 'Mis favoritos' },
    ...categorias,
  ];
  const selectedCategoryName = selectedCategory === CATEGORY_ALL
    ? CATEGORY_ALL
    : selectedCategory === CATEGORY_FAVORITES
      ? 'Mis favoritos'
    : categorias.find(cat => cat.id === selectedCategory)?.nombre || 'Categoria';

  const filteredProducts = productos.filter((product) => {
    const categoryName = getProductCategoryName(product, categorias);
    const matchesFavoriteFilter = selectedCategory !== CATEGORY_FAVORITES || favoriteIds.has(product.id);
    return matchesFavoriteFilter
      && (normalizeText(product.nombre).includes(query) || normalizeText(categoryName).includes(query));
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
  const modalProduct = selectedProduct
    ? productos.find(product => product.id === selectedProduct.id) || selectedProduct
    : null;

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
                const puntosReq = promo.puntos_requeridos || 0;
                const sinPuntos = puntosReq > 0 && puntosSaldo < puntosReq;

                return (
                  <article className={`store-card promo-card${sinPuntos ? ' unavailable' : ''}`} key={promo.id}>
                    <div className="store-card-img-wrap promo-bg">
                      <Gift size={42} />
                      <div className="store-card-badge badge-promo">
                        Combo <Star size={10} />
                      </div>
                      {qty > 0 && <div className="store-card-qty-badge">{qty}</div>}
                    </div>
                    <div className="store-card-body">
                      <div className="store-card-name" title={promo.nombre}>{promo.nombre}</div>
                      {promo.descripcion && (
                        <div className="store-card-desc">{promo.descripcion}</div>
                      )}
                      <div className="store-card-price-row">
                        <div>
                          <span className="store-card-price">S/ {Number(promo.precio || promo.valor || 0).toFixed(2)}</span>
                          {puntosReq > 0 && (
                            <span style={{
                              display: 'block', fontSize: '11px', marginTop: '2px',
                              color: sinPuntos ? 'var(--danger)' : '#8B5A2B', fontWeight: 700,
                            }}>
                              + {puntosReq} pts {sinPuntos ? '(insuf.)' : ''}
                            </span>
                          )}
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
                    const isAvailable = product.disponible !== false;
                    const unavailable = !isAvailable || stock <= 0;
                    const imageUrl = getProductImageUrl(product);
                    const isFavorite = favoriteIds.has(product.id);
                    const nutritionRows = getNutritionRows(product);
                    const points = Math.floor(Number(product.precio) || 0);

                    return (
                      <article
                        className={`store-card border-${slug} ${unavailable ? 'unavailable' : ''}`}
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') setSelectedProduct(product);
                        }}
                      >
                        <div className={`store-card-img-wrap bg-${slug}`}>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
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
                          <button
                            type="button"
                            className={`store-fav-btn ${isFavorite ? 'active' : ''}`}
                            onClick={(event) => toggleFavorite(event, product)}
                            aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                            disabled={favoriteSavingId === product.id}
                          >
                            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          {qty > 0 && <div className="store-card-qty-badge">{qty}</div>}
                        </div>
                        <div className="store-card-body">
                          <div className="store-card-topline">
                            <div className="store-card-name" title={product.nombre}>{product.nombre}</div>
                            {nutritionRows.length > 0 && (
                              <span className="store-nutrition-chip" title="Informacion nutricional disponible">
                                <Info size={12} />
                              </span>
                            )}
                          </div>
                          {product.descripcion && (
                            <div className="store-card-desc product-desc">{product.descripcion}</div>
                          )}
                          <span className={`store-stock-tag ${unavailable ? 'stock-none' : stock > 10 ? 'stock-full' : 'stock-low'}`}>
                            <span className="stock-dot"></span>
                            {unavailable ? 'Agotado' : stock > 10 ? `${stock} disponibles` : `Quedan ${stock}`}
                          </span>
                          <div className="store-card-price-row">
                            <div>
                              <span className="store-card-price">S/ {Number(product.precio).toFixed(2)}</span>
                              <span className="store-points">{points} pts aprox.</span>
                            </div>
                            {!unavailable && (
                              qty > 0 ? (
                                <div className="store-qty-controls">
                                  <button className="store-qty-btn minus" onClick={(event) => handleChangeQty(event, itemId, -1)}>-</button>
                                  <span className="store-qty-val">{qty}</span>
                                  <button className="store-qty-btn plus" disabled={qty >= stock} onClick={(event) => handleAddToCart(event, product)}>+</button>
                                </div>
                              ) : (
                                <button className="store-btn-add" onClick={(event) => handleAddToCart(event, product)}>+</button>
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

      {modalProduct && (() => {
        const categoryName = getProductCategoryName(modalProduct, categorias);
        const slug = getCategorySlug(categoryName);
        const itemId = modalProduct.id;
        const item = cart.find(cartItem => cartItem.itemId === itemId || cartItem.producto?.id === itemId);
        const qty = item ? item.cantidad : 0;
        const stock = modalProduct.stock ?? 0;
        const unavailable = modalProduct.disponible === false || stock <= 0;
        const imageUrl = getProductImageUrl(modalProduct);
        const nutritionRows = getNutritionRows(modalProduct);
        const isFavorite = favoriteIds.has(modalProduct.id);
        const points = Math.floor(Number(modalProduct.precio) || 0);

        return (
          <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="product-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <button type="button" className="product-modal-close" onClick={() => setSelectedProduct(null)} aria-label="Cerrar detalle">
                <X size={18} />
              </button>
              <div className={`product-modal-media bg-${slug}`}>
                {imageUrl ? (
                  <img src={imageUrl} alt={modalProduct.nombre} />
                ) : (
                  <div className="store-card-fallback-text">
                    {String(modalProduct.nombre || 'IS').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="product-modal-body">
                <div className="product-modal-title-row">
                  <div>
                    <span className="product-modal-category">{categoryName}</span>
                    <h3>{modalProduct.nombre}</h3>
                  </div>
                  <button
                    type="button"
                    className={`modal-fav-btn ${isFavorite ? 'active' : ''}`}
                    onClick={(event) => toggleFavorite(event, modalProduct)}
                    disabled={favoriteSavingId === modalProduct.id}
                  >
                    <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'Favorito' : 'Favorito'}
                  </button>
                </div>

                <div className="product-modal-meta">
                  <span className="product-modal-price">S/ {Number(modalProduct.precio).toFixed(2)}</span>
                  <span className={`store-stock-tag ${unavailable ? 'stock-none' : stock > 10 ? 'stock-full' : 'stock-low'}`}>
                    <span className="stock-dot"></span>
                    {unavailable ? 'Agotado' : `${stock} disponibles`}
                  </span>
                  <span className="product-modal-points">{points} puntos aprox.</span>
                </div>

                <p className="product-modal-description">
                  {modalProduct.descripcion || 'Sin descripcion registrada.'}
                </p>

                <div className="product-modal-section">
                  <h4>Informacion nutricional</h4>
                  {nutritionRows.length > 0 ? (
                    <div className="nutrition-grid">
                      {nutritionRows.map(([label, value]) => (
                        <div className="nutrition-item" key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="product-modal-muted">No hay informacion nutricional registrada.</p>
                  )}
                </div>

                <div className="product-modal-actions">
                  {!unavailable && (
                    qty > 0 ? (
                      <div className="store-qty-controls modal-qty-controls">
                        <button className="store-qty-btn minus" onClick={(event) => handleChangeQty(event, itemId, -1)}>-</button>
                        <span className="store-qty-val">{qty}</span>
                        <button className="store-qty-btn plus" disabled={qty >= stock} onClick={(event) => handleAddToCart(event, modalProduct)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-full" onClick={(event) => handleAddToCart(event, modalProduct)}>
                        Agregar al carrito
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
