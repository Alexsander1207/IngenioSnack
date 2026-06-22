import { useState, useEffect, useRef } from 'react';
import { Slash, Check, ImageIcon, X } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', precio: '', categoria: 'Sandwich', stock: '', imagen: null });
  const [preview, setPreview] = useState(null);
  const [razonModal, setRazonModal] = useState(null); // { id, nombre }
  const [razon, setRazon] = useState('');
  const fileRef = useRef();
  const { toast } = useToast();

  const loadProductos = () => {
    fetch('/api/productos')
      .then(r => r.json())
      .then(data => { setProductos(data); setLoading(false); })
      .catch(() => { toast('Error al cargar productos', 'error'); setLoading(false); });
  };

  useEffect(() => { loadProductos(); }, []);

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
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('precio', form.precio);
      formData.append('categoria', form.categoria);
      if (form.stock) formData.append('stock', form.stock);
      if (form.imagen) formData.append('imagen', form.imagen);

      const res = await fetch('/api/productos', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) { toast(data.error, 'error'); return; }
      toast('Producto agregado correctamente', 'success');
      setShowForm(false);
      setForm({ nombre: '', precio: '', categoria: 'Sandwich', stock: '', imagen: null });
      setPreview(null);
      loadProductos();
    } catch (err) {
      toast('Error al guardar', 'error');
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
        loadProductos();
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
      if (res.ok) { toast('Producto activado', 'success'); loadProductos(); }
    } catch (err) {
      toast('Error', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando...</p></div>;

  return (
    <div className="screen">
      {/* Modal de razón de agotamiento */}
      {razonModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '400px',
            width: '90%', boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
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
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmarDesactivar}>
                <Slash size={14} style={{ marginRight: 6 }} />Confirmar agotamiento
              </button>
              <button className="btn btn-outline" onClick={() => setRazonModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Productos (Menú)</h2>
          <p className="screen-sub">Agrega y gestiona los productos ofrecidos</p>
        </div>
        <div className="section-act">
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setPreview(null); }}>
            {showForm ? 'Cancelar' : '+ Agregar producto'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="add-form" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <h3>Nuevo Producto</h3>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Precio (S/)</label>
                <input type="number" step="0.50" min="0.50" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  <option value="Sandwich">Sandwich</option>
                  <option value="Bebida">Bebida</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
              <div className="form-group">
                <label>Stock Inicial</label>
                <input type="number" min="0" value={form.stock} placeholder="Ej: 15" onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>

            {/* Área de subida de foto */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Foto del producto (cuadrada 1:1 recomendada)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <div
                  style={{
                    width: '80px', height: '80px', borderRadius: '10px', border: '2px dashed #E8D5C4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', background: '#FAF7F4', flexShrink: 0
                  }}
                  onClick={() => fileRef.current.click()}
                >
                  {preview
                    ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImageIcon size={28} style={{ color: '#C4A882' }} />
                  }
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  <button type="button" className="btn btn-outline" onClick={() => fileRef.current.click()} style={{ fontSize: '13px', padding: '7px 14px' }}>
                    {preview ? 'Cambiar foto' : 'Seleccionar foto'}
                  </button>
                  {preview && (
                    <button type="button" onClick={clearImage} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#9A2A2A', cursor: 'pointer', fontSize: '13px' }}>
                      <X size={14} /> Quitar
                    </button>
                  )}
                  <p style={{ fontSize: '12px', color: '#8A6A55', marginTop: '6px' }}>
                    Sube una foto cuadrada (1:1). Formatos: JPG, PNG, WEBP
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">Guardar producto</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td>
                  {p.imagenUrl
                    ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} />
                    : <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F5E6D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} style={{ color: '#C4A882' }} /></div>
                  }
                </td>
                <td><code>{p.id}</code></td>
                <td>
                  <strong>{p.nombre}</strong>
                  {p.razonAgotamiento && !p.disponible && (
                    <div style={{ fontSize: '11px', color: '#9A2A2A', marginTop: '2px' }}>
                      {p.razonAgotamiento}
                    </div>
                  )}
                </td>
                <td>{p.categoria}</td>
                <td>S/ {p.precio.toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.disponible && p.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {p.disponible && p.stock > 0 ? `Disponible (${p.stock} uds)` : 'Agotado'}
                  </span>
                </td>
                <td>
                  {p.disponible
                    ? <button className="btn-toggle btn-disable" onClick={() => handleDesactivar(p)}><Slash size={14} /> Desactivar</button>
                    : <button className="btn-toggle btn-enable" onClick={() => activarProd(p.id)}><Check size={14} /> Activar</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
