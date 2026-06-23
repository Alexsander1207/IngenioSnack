import { useState, useEffect, useRef } from 'react';
import { Gift, Trash2, Check, Slash, Plus, Minus, ImageIcon, X } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function Promociones() {
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', imagen: null });
  const [preview, setPreview] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{ productoId, cantidad, producto }]
  const [categorias, setCategorias] = useState([]);
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodFilterCategory, setProdFilterCategory] = useState('Todos');
  
  const fileRef = useRef();
  const { toast } = useToast();

  const loadPromociones = () => {
    fetch('/api/promociones')
      .then(r => r.json())
      .then(data => { setPromociones(data); setLoading(false); })
      .catch(() => { toast('Error al cargar promociones', 'error'); setLoading(false); });
  };

  const loadProductos = () => {
    fetch('/api/productos')
      .then(r => r.json())
      .then(data => setProductos(data))
      .catch(() => toast('Error al cargar productos', 'error'));
  };

  const loadCategorias = () => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(data => setCategorias(data))
      .catch(() => {});
  };

  useEffect(() => { loadPromociones(); loadProductos(); loadCategorias(); }, []);

  const addProduct = (producto) => {
    const exists = selectedProducts.find(sp => sp.productoId === producto.id);
    if (exists) {
      setSelectedProducts(prev =>
        prev.map(sp => sp.productoId === producto.id
          ? { ...sp, cantidad: sp.cantidad + 1 }
          : sp
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { productoId: producto.id, cantidad: 1, producto }]);
    }
  };

  const removeProduct = (productoId) => {
    setSelectedProducts(prev => prev.filter(sp => sp.productoId !== productoId));
  };

  const changeProductQty = (productoId, delta) => {
    setSelectedProducts(prev =>
      prev.map(sp => {
        if (sp.productoId === productoId) {
          const newQty = sp.cantidad + delta;
          return newQty > 0 ? { ...sp, cantidad: newQty } : sp;
        }
        return sp;
      })
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, imagen: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setForm(prev => ({ ...prev, imagen: null }));
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const precioOriginal = selectedProducts.reduce(
    (sum, sp) => sum + (sp.producto.precio * sp.cantidad), 0
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (selectedProducts.length === 0) {
      toast('Agrega al menos un producto al combo', 'warning');
      return;
    }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre.trim());
      if (form.descripcion) formData.append('descripcion', form.descripcion.trim());
      formData.append('precio', form.precio);
      formData.append('productos', JSON.stringify(selectedProducts.map(sp => ({
        productoId: sp.productoId,
        cantidad: sp.cantidad,
      }))));
      if (form.imagen) formData.append('imagen', form.imagen);

      const res = await fetch('/api/promociones', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) { toast(data.error, 'error'); return; }
      
      toast('¡Combo creado correctamente!', 'success');
      setShowForm(false);
      setForm({ nombre: '', descripcion: '', precio: '', imagen: null });
      setPreview(null);
      setSelectedProducts([]);
      loadPromociones();
    } catch (err) {
      toast('Error al guardar la promoción', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDisponibilidad = async (promo) => {
    try {
      const res = await fetch(`/api/promociones/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: !promo.disponible }),
      });
      if (res.ok) {
        toast(promo.disponible ? 'Combo pausado' : 'Combo activado', 'success');
        loadPromociones();
      }
    } catch (err) {
      toast('Error', 'error');
    }
  };

  const eliminarPromo = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este combo?')) return;
    try {
      const res = await fetch(`/api/promociones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Combo eliminado', 'success');
        loadPromociones();
      }
    } catch (err) {
      toast('Error', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando promociones...</p></div>;

  const availableProducts = productos.filter(
    p => p.disponible && !selectedProducts.find(sp => sp.productoId === p.id)
  );

  const filteredAvailableProducts = availableProducts.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(prodSearchQuery.toLowerCase());
    const matchesCategory = prodFilterCategory === 'Todos' || p.categoria === prodFilterCategory || p.categoriaId === prodFilterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2><Gift size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} />Promociones y Combos</h2>
          <p className="screen-sub">Crea ofertas especiales combinando productos del menú</p>
        </div>
        <div className="section-act">
          <button className="btn btn-primary" style={{ borderRadius: '4px' }} onClick={() => { setShowForm(!showForm); setSelectedProducts([]); setPreview(null); }}>
            {showForm ? 'Cancelar' : '+ Crear combo'}
          </button>
        </div>
      </div>

      {/* ── Formulario de creación de combo ── */}
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
            Registrar Nuevo Combo / Promoción
          </h3>
          <form onSubmit={handleSave}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Nombre del combo</label>
                <input
                  type="text"
                  placeholder="Ej: Combo Estudiante"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Precio especial (S/)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  placeholder="Ej: 8.00"
                  value={form.precio}
                  onChange={e => setForm({ ...form, precio: e.target.value })}
                  style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                  required
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Descripción (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Sandwich de pollo + Café americano"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
              />
            </div>

            {/* Área de subida de foto de combo */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px' }}>Foto del combo</label>
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

            {/* Selector de productos */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #E6D4C3', paddingTop: '16px' }}>
              <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '13px', marginBottom: '12px', display: 'block' }}>
                Selecciona los productos a incluir:
              </label>

              {/* Controles de Filtro y Búsqueda de Productos */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                background: '#FAF6F0',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #EFE7E0'
              }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={prodSearchQuery}
                    onChange={e => setProdSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #D2B48C',
                      fontSize: '13px',
                      background: '#FFF'
                    }}
                  />
                </div>
                <div style={{ minWidth: '150px' }}>
                  <select
                    value={prodFilterCategory}
                    onChange={e => setProdFilterCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #D2B48C',
                      fontSize: '13px',
                      background: '#FFF',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="Todos">Categoría: Todas</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Productos seleccionados */}
              {selectedProducts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {selectedProducts.map(sp => (
                    <div key={sp.productoId} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '4px',
                      background: '#FAF6F0', border: '1px solid #EFE7E0'
                    }}>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: '13.5px', color: 'var(--text)' }}>
                        {sp.producto.nombre}
                        <span style={{ color: '#8A6A55', fontWeight: 400, marginLeft: '8px', fontSize: '12px' }}>
                          (S/ {sp.producto.precio.toFixed(2)} c/u)
                        </span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => changeProductQty(sp.productoId, -1)}
                          style={{
                            width: '26px', height: '26px', borderRadius: '4px',
                            border: '1px solid #D2B48C', background: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        ><Minus size={12} /></button>
                        <span style={{ fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>{sp.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => changeProductQty(sp.productoId, 1)}
                          style={{
                            width: '26px', height: '26px', borderRadius: '4px',
                            border: '1px solid #D2B48C', background: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        ><Plus size={12} /></button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(sp.productoId)}
                        style={{
                          background: 'none', border: 'none', color: '#9A2A2A',
                          cursor: 'pointer', padding: '4px', marginLeft: '6px'
                        }}
                      ><Trash2 size={15} /></button>
                    </div>
                  ))}
                  {/* Resumen de precios */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 14px',
                    fontSize: '13px', color: '#8A6A55', borderTop: '1px dashed #E6D4C3', marginTop: '4px'
                  }}>
                    <span>Precio individual total: <strong style={{ textDecoration: 'line-through' }}>S/ {precioOriginal.toFixed(2)}</strong></span>
                    {form.precio && (
                      <span style={{ color: 'var(--success)', fontWeight: 800 }}>
                        Ahorro: S/ {(precioOriginal - parseFloat(form.precio || 0)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Botones para agregar productos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {filteredAvailableProducts.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addProduct(p)}
                    style={{
                      padding: '6px 12px', borderRadius: '4px',
                      border: '1px solid #D2B48C', background: '#FAF6F0',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.15s ease', color: '#8B5A2B'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FAF0E6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FAF6F0'; }}
                  >
                    <Plus size={12} /> {p.nombre} — S/ {p.precio.toFixed(2)}
                  </button>
                ))}
                {filteredAvailableProducts.length === 0 && availableProducts.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#8A6A55', fontStyle: 'italic', padding: '4px 8px' }}>
                    No se encontraron productos que coincidan con la búsqueda.
                  </p>
                )}
                {availableProducts.length === 0 && selectedProducts.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#8A6A55', fontStyle: 'italic' }}>
                    Todos los productos han sido agregados al combo.
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid #E6D4C3', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '4px', padding: '10px 24px' }} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar combo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Listado de promociones existentes ── */}
      {promociones.length === 0 ? (
        <div className="empty-state" style={{ background: '#fff', border: '1px solid #EFE7E0', borderRadius: '4px', padding: '60px 20px', textAlign: 'center' }}>
          <Gift size={40} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)', display: 'block' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>No hay promociones aún</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Crea tu primer combo para ofrecer ofertas especiales a los estudiantes.
          </p>
        </div>
      ) : (
        <div className="table-wrap" style={{ border: '1px solid #EFE7E0', borderRadius: '4px', width: '100%' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--primary-dark)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', borderTopLeftRadius: '4px' }}>Foto</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Nombre</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Productos incluidos</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Precio combo</th>
                <th style={{ padding: '12px 16px', fontSize: '11px' }}>Estado</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', borderTopRightRadius: '4px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promociones.map(p => (
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
                        <Gift size={16} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <strong style={{ fontSize: '14.5px', color: 'var(--text)' }}>{p.nombre}</strong>
                    {p.descripcion && (
                      <div style={{ fontSize: '12px', color: '#8A6A55', marginTop: '2px' }}>
                        {p.descripcion}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {p.items && p.items.map((item, idx) => (
                        <span key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          <strong>{item.cantidad}×</strong> {item.producto?.nombre || 'Producto'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>S/ {p.precio.toFixed(2)}</strong>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge ${p.disponible ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '3px', fontSize: '11px', padding: '3px 8px' }}>
                      {p.disponible ? 'Disponible' : 'Pausado'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className={`btn-toggle ${p.disponible ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => toggleDisponibilidad(p)}
                        style={{ margin: 0, padding: '4px 10px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {p.disponible ? <><Slash size={12} /> Pausar</> : <><Check size={12} /> Activar</>}
                      </button>
                      <button
                        onClick={() => eliminarPromo(p.id)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
