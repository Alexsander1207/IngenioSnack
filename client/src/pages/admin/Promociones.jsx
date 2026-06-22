import { useState, useEffect } from 'react';
import { Gift, Trash2, Check, Slash, Plus, Minus } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function Promociones() {
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '' });
  const [selectedProducts, setSelectedProducts] = useState([]); // [{ productoId, cantidad, producto }]
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

  useEffect(() => { loadPromociones(); loadProductos(); }, []);

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

  const precioOriginal = selectedProducts.reduce(
    (sum, sp) => sum + (sp.producto.precio * sp.cantidad), 0
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast('Agrega al menos un producto al combo', 'warning');
      return;
    }
    try {
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        precio: parseFloat(form.precio),
        productos: selectedProducts.map(sp => ({
          productoId: sp.productoId,
          cantidad: sp.cantidad,
        })),
      };
      const res = await fetch('/api/promociones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { toast(data.error, 'error'); return; }
      toast('¡Promoción creada exitosamente!', 'success');
      setShowForm(false);
      setForm({ nombre: '', descripcion: '', precio: '' });
      setSelectedProducts([]);
      loadPromociones();
    } catch (err) {
      toast('Error al guardar la promoción', 'error');
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
        toast(promo.disponible ? 'Promoción desactivada' : 'Promoción activada', 'success');
        loadPromociones();
      }
    } catch (err) {
      toast('Error', 'error');
    }
  };

  const eliminarPromo = async (id) => {
    try {
      const res = await fetch(`/api/promociones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Promoción eliminada', 'success');
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

  return (
    <div className="screen">
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>🎁 Promociones y Combos</h2>
          <p className="screen-sub">Crea ofertas especiales combinando productos</p>
        </div>
        <div className="section-act">
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setSelectedProducts([]); }}>
            {showForm ? 'Cancelar' : '+ Crear combo'}
          </button>
        </div>
      </div>

      {/* ── Formulario de creación de combo ── */}
      {showForm && (
        <div className="add-form" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <h3><Gift size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Nuevo Combo / Promoción</h3>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del combo</label>
                <input
                  type="text"
                  placeholder="Ej: Combo Estudiante"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio especial (S/)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  placeholder="Ej: 8.00"
                  value={form.precio}
                  onChange={e => setForm({ ...form, precio: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Sandwich de pollo + Café americano"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            {/* Selector de productos */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Productos del combo
              </label>

              {/* Productos seleccionados */}
              {selectedProducts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {selectedProducts.map(sp => (
                    <div key={sp.productoId} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.2)'
                    }}>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>
                        {sp.producto.nombre}
                        <span style={{ color: '#8A6A55', fontWeight: 400, marginLeft: '6px', fontSize: '12px' }}>
                          S/ {sp.producto.precio.toFixed(2)} c/u
                        </span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => changeProductQty(sp.productoId, -1)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            border: '1px solid #E8D5C4', background: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        ><Minus size={14} /></button>
                        <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{sp.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => changeProductQty(sp.productoId, 1)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            border: '1px solid #E8D5C4', background: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        ><Plus size={14} /></button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(sp.productoId)}
                        style={{
                          background: 'none', border: 'none', color: '#9A2A2A',
                          cursor: 'pointer', padding: '4px'
                        }}
                      ><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {/* Resumen de precios */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 14px',
                    fontSize: '13px', color: '#8A6A55', borderTop: '1px dashed #E8D5C4', marginTop: '4px'
                  }}>
                    <span>Precio individual total: <strong style={{ textDecoration: 'line-through' }}>S/ {precioOriginal.toFixed(2)}</strong></span>
                    {form.precio && (
                      <span style={{ color: '#4CAF50', fontWeight: 700 }}>
                        Ahorro: S/ {(precioOriginal - parseFloat(form.precio || 0)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Botones para agregar productos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableProducts.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addProduct(p)}
                    style={{
                      padding: '8px 14px', borderRadius: '8px',
                      border: '1px solid #E8D5C4', background: '#FAF7F4',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#F0E6DA'; e.currentTarget.style.borderColor = '#C4A882'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#FAF7F4'; e.currentTarget.style.borderColor = '#E8D5C4'; }}
                  >
                    <Plus size={14} /> {p.nombre} — S/ {p.precio.toFixed(2)}
                  </button>
                ))}
                {availableProducts.length === 0 && selectedProducts.length > 0 && (
                  <p style={{ fontSize: '13px', color: '#8A6A55', fontStyle: 'italic' }}>
                    Todos los productos han sido agregados al combo.
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                <Gift size={14} style={{ marginRight: '6px' }} />Guardar combo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Listado de promociones existentes ── */}
      {promociones.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🎁</span>
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>No hay promociones aún</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Crea tu primer combo para ofrecer ofertas especiales a los estudiantes.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Productos incluidos</th>
                <th>Precio combo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promociones.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.descripcion && (
                      <div style={{ fontSize: '12px', color: '#8A6A55', marginTop: '2px' }}>
                        {p.descripcion}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {p.items && p.items.map((item, idx) => (
                        <span key={idx} style={{ fontSize: '13px' }}>
                          {item.cantidad}× {item.producto?.nombre || 'Producto'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#4CAF50' }}>S/ {p.precio.toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${p.disponible ? 'badge-success' : 'badge-danger'}`}>
                      {p.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        className={`btn-toggle ${p.disponible ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => toggleDisponibilidad(p)}
                      >
                        {p.disponible ? <><Slash size={14} /> Pausar</> : <><Check size={14} /> Activar</>}
                      </button>
                      <button
                        className="btn-toggle btn-disable"
                        onClick={() => eliminarPromo(p.id)}
                        style={{ color: '#9A2A2A' }}
                      >
                        <Trash2 size={14} /> Eliminar
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
