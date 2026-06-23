import { useState, useEffect, useRef } from 'react';
import { Slash, Check, ImageIcon, X, Plus, Minus, Trash2, LayoutGrid, List } from 'lucide-react';
import { useToast } from '../../components/Toast';

const PRODUCTOS_ADMIN_URL = '/api/productos?admin=true';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'
  
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    categoria: '',
    categoriaId: '',
    stock: '',
    imagen: null
  });
  
  const [preview, setPreview] = useState(null);
  const [razonModal, setRazonModal] = useState(null); // { id, nombre }
  const [razon, setRazon] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const fileRef = useRef();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(PRODUCTOS_ADMIN_URL),
        fetch('/api/categorias')
      ]);
      
      const prods = await prodRes.json();
      const cats = await catRes.json();
      
      setProductos(prods);
      setCategorias(cats);
      
      if (cats.length > 0) {
        setForm(prev => ({
          ...prev,
          categoriaId: cats[0].id,
          categoria: cats[0].nombre
        }));
      }
      setLoading(false);
    } catch (err) {
      toast('Error al cargar datos', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, imagen: file });
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setForm({ ...form, imagen: null });
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.categoriaId) {
      toast('Por favor, selecciona o crea una categoría primero.', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('precio', form.precio);
      formData.append('categoria', form.categoria);
      formData.append('categoria_id', form.categoriaId);
      if (form.stock) formData.append('stock', form.stock);
      if (form.imagen) formData.append('imagen', form.imagen);

      const res = await fetch('/api/productos', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.error) {
        toast(data.error, 'error');
        return;
      }
      
      toast('Producto agregado correctamente', 'success');
      setShowForm(false);
      setForm({
        nombre: '',
        precio: '',
        categoria: categorias[0]?.nombre || '',
        categoriaId: categorias[0]?.id || '',
        stock: '',
        imagen: null
      });
      setPreview(null);
      
      // Reload products
      const pRes = await fetch(PRODUCTOS_ADMIN_URL);
      const prods = await pRes.json();
      setProductos(prods);
    } catch (err) {
      toast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = (producto) => {
    setRazonModal({ id: producto.id, nombre: producto.nombre });
    setRazon('');
  };

  const confirmarDesactivar = async () => {
    try {
      const res = await fetch(`/api/productos/${razonModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: false, razon: razon.trim() || 'Sin stock' })
      });
      if (res.ok) {
        toast(`Producto desactivado${razon ? ': ' + razon : ''}`);
        setRazonModal(null);
        
        // Reload products
        const pRes = await fetch(PRODUCTOS_ADMIN_URL);
        const prods = await pRes.json();
        setProductos(prods);
      } else {
        const d = await res.json();
        toast(d.error || 'Error', 'error');
      }
    } catch (err) {
      toast('Error', 'error');
    }
  };

  const activarProd = async (id) => {
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: true })
      });
      if (res.ok) {
        toast('Producto activado', 'success');
        
        // Reload products
        const pRes = await fetch(PRODUCTOS_ADMIN_URL);
        const prods = await pRes.json();
        setProductos(prods);
      }
    } catch (err) {
      toast('Error', 'error');
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"? Esta acción lo removerá del menú.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast('Producto eliminado correctamente', 'success');
        // Reload products
        const pRes = await fetch(PRODUCTOS_ADMIN_URL);
        const prods = await pRes.json();
        setProductos(prods);
      } else {
        const d = await res.json();
        toast(d.error || 'Error al eliminar', 'error');
      }
    } catch (err) {
      toast('Error al eliminar', 'error');
    }
  };

  const handleStockAdjust = async (id, currentStock, difference) => {
    const newStock = Math.max(0, currentStock + difference);
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        toast(`Stock actualizado a ${newStock}`, 'success');
        // Reload products
        const pRes = await fetch(PRODUCTOS_ADMIN_URL);
        const prods = await pRes.json();
        setProductos(prods);
      } else {
        const d = await res.json();
        toast(d.error || 'Error al actualizar stock', 'error');
      }
    } catch (err) {
      toast('Error al actualizar stock', 'error');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"? Los productos asociados se quedarán sin categoría.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast('Categoría eliminada correctamente', 'success');
        
        // Reload categories list
        const r = await fetch('/api/categorias');
        const cats = await r.json();
        setCategorias(cats);
        
        // Reload products just in case category names/ids changed
        const pRes = await fetch(PRODUCTOS_ADMIN_URL);
        const prods = await pRes.json();
        setProductos(prods);

        // Adjust form state if selected category was deleted
        if (cats.length > 0) {
          setForm(prev => ({
            ...prev,
            categoriaId: cats[0].id,
            categoria: cats[0].nombre
          }));
        } else {
          setForm(prev => ({
            ...prev,
            categoriaId: '',
            categoria: ''
          }));
        }
      } else {
        const data = await res.json();
        toast(data.error || 'Error al eliminar categoría', 'error');
      }
    } catch (err) {
      toast('Error al eliminar categoría', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCatName.trim() })
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
        return;
      }
      
      toast('Categoría creada', 'success');
      setNewCatName('');
      setShowCatModal(false);
      
      // Reload categories list
      const r = await fetch('/api/categorias');
      const cats = await r.json();
      setCategorias(cats);
      
      // Select the newly created category
      const newCat = cats.find(c => c.nombre === data.nombre || c.id === data.id);
      if (newCat) {
        setForm(prev => ({
          ...prev,
          categoriaId: newCat.id,
          categoria: newCat.nombre
        }));
      }
    } catch (err) {
      toast('Error al crear categoría', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando...</p></div>;

  const getProductCategoryName = (producto) => {
    return producto.categoria
      || categorias.find(cat => cat.id === (producto.categoriaId || producto.categoria_id))?.nombre
      || 'Sin categoria';
  };

  // Filtrar productos
  const filteredProducts = selectedCat === 'Todos'
    ? productos
    : productos.filter(p => getProductCategoryName(p) === selectedCat || p.categoriaId === selectedCat);

  // Lista de categorías para las pestañas de filtrado
  const categoriesList = ['Todos', ...new Set([
    ...categorias.map(c => c.nombre),
    ...productos.map(getProductCategoryName).filter(Boolean)
  ])];

  return (
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      {/* Modal de razón de agotamiento */}
      {razonModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '400px',
            width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #E6D4C3'
          }}>
            <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 800 }}>¿Por qué se agotó?</h3>
            <p style={{ color: '#8A6A55', fontSize: '14px', marginBottom: '16px' }}>
              Indícale a los estudiantes la razón para <strong>"{razonModal.nombre}"</strong>
            </p>
            <div className="form-group">
              <label>Razón (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Sin pan, Sin pollo, Stock terminado..."
                value={razon}
                onChange={e => setRazon(e.target.value)}
                style={{ borderRadius: '4px', border: '1px solid #D2B48C' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ flex: 1, borderRadius: '4px' }} onClick={confirmarDesactivar}>
                <Slash size={14} style={{ marginRight: 6 }} />Confirmar agotamiento
              </button>
              <button className="btn btn-outline" style={{ borderRadius: '4px' }} onClick={() => setRazonModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Productos (Menú)</h2>
          <p className="screen-sub">Agrega y gestiona los productos ofrecidos</p>
        </div>
        <div className="section-act">
          <button className="btn btn-primary" style={{ borderRadius: '4px' }} onClick={() => { setShowForm(!showForm); setPreview(null); }}>
            {showForm ? 'Cancelar' : '+ Agregar producto'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="add-form" style={{
          animation: 'slideIn 0.25s ease-out',
          background: '#FFFDFB',
          border: '1.5px solid #E6D4C3',
          borderRadius: '4px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(45, 26, 14, 0.05)',
          marginBottom: '24px',
          width: '100%'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#4A2E1B', marginBottom: '18px', borderBottom: '1px solid #E6D4C3', paddingBottom: '8px' }}>
            ✨ Registrar Nuevo Producto
          </h3>
          <form onSubmit={handleSave}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Nombre del Producto</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                  required
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Precio (S/)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  value={form.precio}
                  onChange={e => setForm({ ...form, precio: e.target.value })}
                  style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                  required
                />
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0, color: '#6D4C35', fontWeight: 700, fontSize: '12px' }}>Categoría</label>
                  <button
                    type="button"
                    onClick={() => setShowCatModal(true)}
                    style={{
                      background: '#FAF0E6',
                      color: '#8B5A2B',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #D2B48C',
                    }}
                  >
                    + Nueva
                  </button>
                </div>
                <select
                  value={form.categoriaId}
                  disabled={categorias.length === 0}
                  onChange={e => {
                    const selectedCatObj = categorias.find(c => c.id === e.target.value);
                    setForm({
                      ...form,
                      categoriaId: e.target.value,
                      categoria: selectedCatObj ? selectedCatObj.nombre : ''
                    });
                  }}
                  style={{
                    borderRadius: '4px',
                    border: '1px solid #D2B48C',
                    padding: '10px 12px',
                    fontSize: '13px',
                    background: '#FFF',
                    width: '100%'
                  }}
                >
                  {categorias.length === 0 ? (
                    <option value="">⚠️ Crea una categoría</option>
                  ) : (
                    categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="form-group">
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Stock Inicial</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  placeholder="Ej: 15"
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                />
              </div>
            </div>

            {/* Área de subida de foto */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px' }}>Foto del producto</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                <div
                  style={{
                    width: '70px', height: '70px', borderRadius: '4px', border: '1.5px dashed #D2B48C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', background: '#FFF', flexShrink: 0
                  }}
                  onClick={() => fileRef.current.click()}
                >
                  {preview
                    ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImageIcon size={22} style={{ color: '#8B5A2B' }} />
                  }
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  <button type="button" className="btn btn-outline" onClick={() => fileRef.current.click()} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '4px' }}>
                    {preview ? 'Cambiar foto' : 'Seleccionar foto'}
                  </button>
                  {preview && (
                    <button type="button" onClick={clearImage} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#9A2A2A', cursor: 'pointer', fontSize: '12px' }}>
                      <X size={12} style={{ marginRight: 2 }} /> Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid #E6D4C3', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '4px', padding: '10px 24px' }} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTROS Y CONTROLES DE VISTA */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFF',
        border: '1px solid #EFE7E0',
        padding: '12px 20px',
        borderRadius: '4px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Pestañas de categorías */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categoriesList.map(catName => {
            const isActive = selectedCat === catName;
            return (
              <button
                key={catName}
                onClick={() => setSelectedCat(catName)}
                style={{
                  padding: '6px 14px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--primary)' : '#EFE7E0',
                  borderRadius: '4px',
                  background: isActive ? 'var(--primary)' : '#FAF6F0',
                  color: isActive ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? '800' : '500',
                  transition: 'all 0.15s ease'
                }}
              >
                {catName === 'Todos' ? '🍽️ Todos' : catName}
              </button>
            );
          })}
        </div>

        {/* Alternador de vista */}
        <div style={{ display: 'flex', gap: '4px', border: '1px solid #EFE7E0', borderRadius: '4px', padding: '2px', background: '#FAF6F0' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', border: 'none', borderRadius: '3px',
              background: viewMode === 'grid' ? '#fff' : 'transparent',
              color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <LayoutGrid size={13} /> Mosaico (Grid)
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', border: 'none', borderRadius: '3px',
              background: viewMode === 'list' ? '#fff' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <List size={13} /> Lista (Tabla)
          </button>
        </div>
      </div>

      {/* MODO GRID (Mosaico) */}
      {viewMode === 'grid' ? (
        filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ background: '#fff', border: '1px solid #EFE7E0', borderRadius: '4px', padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>📦</span>
            <p style={{ marginTop: '10px', fontWeight: '700', color: 'var(--text)' }}>No hay productos en esta categoría</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(p => {
              const ua = !p.disponible;
              return (
                <div
                  key={p.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${ua ? '#EFE7E0' : '#E6D4C3'}`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: ua ? 0.75 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 4px rgba(44,31,24,0.02)'
                  }}
                >
                  {/* Imagen */}
                  <div style={{ position: 'relative', height: '140px', background: '#FDFBF9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid #EFE7E0' }}>
                    {p.imagenUrl ? (
                      <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.card-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : null}
                    <div
                      className="card-fallback"
                      style={{
                        display: p.imagenUrl ? 'none' : 'flex',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FAF0E6',
                        color: '#8B5A2B',
                        fontWeight: '800',
                        fontSize: '32px'
                      }}
                    >
                      {p.nombre ? p.nombre.substring(0, 2).toUpperCase() : 'IS'}
                    </div>

                    {/* Badge de Estado */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <span className={`badge ${p.disponible && p.stock > 0 ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '3px', fontSize: '10px' }}>
                        {p.disponible && p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}
                      </span>
                    </div>
                  </div>

                  {/* Datos */}
                  <div style={{ padding: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: '#8A6A55', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>{getProductCategoryName(p)}</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)', margin: '4px 0 8px 0', minHeight: '40px' }}>{p.nombre}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto', borderTop: '1px solid #FDF3EA', paddingTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#B0A090' }}>Precio</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>S/ {p.precio.toFixed(2)}</span>
                    </div>
                    {p.razonAgotamiento && !p.disponible && (
                      <p style={{ fontSize: '11px', color: '#9A2A2A', background: '#FDF2F2', padding: '4px 8px', marginTop: '8px', borderLeft: '2.5px solid #9A2A2A' }}>
                        Motivo: {p.razonAgotamiento}
                      </p>
                    )}
                    {/* Control de Stock rápido */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FAF6F0',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      marginTop: '10px',
                      border: '1px solid #EFE7E0'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6D4C35' }}>Stock:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(p.id, p.stock, -1)}
                          style={{
                            width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #D2B48C',
                            background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#8B5A2B', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF0E6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text)', minWidth: '24px', textAlign: 'center' }}>
                          {p.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(p.id, p.stock, 1)}
                          style={{
                            width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #D2B48C',
                            background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#8B5A2B', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF0E6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', borderTop: '1px solid #EFE7E0', background: '#FAF8F6' }}>
                    {p.disponible ? (
                      <button
                        onClick={() => handleDesactivar(p)}
                        style={{
                          flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
                          color: '#8A6A55', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <Slash size={12} /> Agotar
                      </button>
                    ) : (
                      <button
                        onClick={() => activarProd(p.id)}
                        style={{
                          flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
                          color: 'var(--success)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <Check size={12} /> Activar
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(p.id, p.nombre)}
                      style={{
                        padding: '10px 14px', background: 'transparent', border: 'none',
                        borderLeft: '1px solid #EFE7E0', color: 'var(--danger)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* MODO LISTA (Tabla clásica pero estilizada y compacta con bordes planos) */
        <div className="table-wrap" style={{ border: '1px solid #EFE7E0', borderRadius: '4px', width: '100%' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--primary-dark)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', borderTopLeftRadius: '4px' }}>Foto</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Nombre</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Categoría</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Precio</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Estado</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', borderTopRightRadius: '4px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No hay productos en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ position: 'relative', width: '40px', height: '40px', overflow: 'hidden' }}>
                        {p.imagenUrl ? (
                          <img
                            src={p.imagenUrl}
                            alt={p.nombre}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.img-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '3px', display: 'block' }}
                          />
                        ) : null}
                        <div
                          className="img-fallback"
                          style={{
                            display: p.imagenUrl ? 'none' : 'flex',
                            width: '40px',
                            height: '40px',
                            borderRadius: '3px',
                            background: '#FAF0E6',
                            border: '1px solid #E6D4C3',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8B5A2B',
                            fontWeight: '800',
                            fontSize: '12px'
                          }}
                        >
                          {p.nombre ? p.nombre.substring(0, 2).toUpperCase() : 'IS'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{p.nombre}</strong>
                      {p.razonAgotamiento && !p.disponible && (
                        <div style={{ fontSize: '11px', color: '#9A2A2A', marginTop: '2px', fontStyle: 'italic' }}>
                          Agotado: {p.razonAgotamiento}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#8A6A55', fontWeight: '500' }}>{getProductCategoryName(p)}</td>
                    <td style={{ padding: '10px 16px', fontWeight: '700' }}>S/ {p.precio.toFixed(2)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(p.id, p.stock, -1)}
                          style={{
                            width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #D2B48C',
                            background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#8B5A2B', transition: 'all 0.2s', padding: 0
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF0E6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                        >
                          <Minus size={10} />
                        </button>
                        <span className={`badge ${p.disponible && p.stock > 0 ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '3px', fontSize: '11px', padding: '3px 8px', minWidth: '105px', display: 'inline-block', textAlign: 'center' }}>
                          {p.disponible && p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(p.id, p.stock, 1)}
                          style={{
                            width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #D2B48C',
                            background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#8B5A2B', transition: 'all 0.2s', padding: 0
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF0E6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {p.disponible ? (
                          <button
                            className="btn-toggle btn-disable"
                            onClick={() => handleDesactivar(p)}
                            style={{ margin: 0, padding: '4px 10px', fontSize: '12px', borderRadius: '4px' }}
                          >
                            <Slash size={12} style={{ marginRight: 4 }} /> Agotar
                          </button>
                        ) : (
                          <button
                            className="btn-toggle btn-enable"
                            onClick={() => activarProd(p.id)}
                            style={{ margin: 0, padding: '4px 10px', fontSize: '12px', borderRadius: '4px' }}
                          >
                            <Check size={12} style={{ marginRight: 4 }} /> Activar
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminar(p.id, p.nombre)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            border: 'none',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCatModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '420px',
            width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #E6D4C3'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
              Gestión de Categorías
            </h3>

            {/* Listado de categorías existentes */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                Categorías Existentes ({categorias.length})
              </label>
              {categorias.length === 0 ? (
                <div style={{ padding: '12px', background: '#FDFBF9', border: '1px solid #EFE7E0', borderRadius: '4px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No hay categorías registradas.
                </div>
              ) : (
                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #EFE7E0',
                  borderRadius: '4px',
                  background: '#FFF',
                  padding: '4px'
                }}>
                  {categorias.map(cat => (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid #FAF6F0',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{cat.nombre}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: 'var(--danger)',
                          border: 'none',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario de creación */}
            <form onSubmit={handleCreateCategory} style={{ borderTop: '1px solid #EFE7E0', paddingTop: '16px' }}>
              <div className="form-group">
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                  Crear Nueva Categoría
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ej: Dulces, Cafés..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    style={{ borderRadius: '4px', border: '1px solid #D2B48C', flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '4px', padding: '0 16px', fontSize: '13px' }}>
                    + Agregar
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ borderRadius: '4px', padding: '8px 18px', fontSize: '13px' }} onClick={() => setShowCatModal(false)}>
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
