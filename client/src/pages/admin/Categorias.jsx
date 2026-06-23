import { apiFetch } from '../../services/apiClient';
import { useState, useEffect } from 'react';
import { Plus, Trash2, FolderOpen } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const { toast } = useToast();

  const loadCategorias = () => {
    apiFetch('/api/categorias')
      .then(r => r.json())
      .then(data => {
        setCategorias(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        toast('Error al cargar categorías', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      const res = await apiFetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() })
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
        return;
      }
      toast('Categoría creada correctamente', 'success');
      setNombre('');
      loadCategorias();
    } catch (err) {
      toast('Error al crear categoría', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Los productos asociados se quedarán sin categoría.')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/categorias/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast('Categoría eliminada', 'success');
        loadCategorias();
      } else {
        const data = await res.json();
        toast(data.error || 'Error al eliminar', 'error');
      }
    } catch (err) {
      toast('Error al eliminar', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando...</p></div>;

  return (
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ marginBottom: '24px' }}>
        <h2>Categorías de Productos</h2>
        <p className="screen-sub">Crea y gestiona las categorías del menú de IngenioSnack</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Formulario */}
        <div className="add-form" style={{
          margin: 0,
          height: 'fit-content',
          background: '#FFFDFB',
          border: '1.5px solid #E6D4C3',
          borderRadius: '4px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(45, 26, 14, 0.03)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#4A2E1B', marginBottom: '16px', borderBottom: '1px solid #E6D4C3', paddingBottom: '8px' }}>Nueva Categoría</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Nombre de Categoría</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Postres, Ensaladas..."
                style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: '4px', padding: '10px 0' }}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Crear Categoría
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="rep-sec" style={{
          margin: 0,
          background: '#FFF',
          border: '1px solid #EFE7E0',
          borderRadius: '4px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid #EFE7E0', paddingBottom: '8px', marginBottom: '16px' }}>
            <FolderOpen size={16} style={{ marginRight: '8px', color: 'var(--primary)', verticalAlign: 'middle' }} />
            Categorías Disponibles ({categorias.length})
          </h3>
          {categorias.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 10px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No hay categorías registradas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categorias.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#FFFDFB',
                    border: '1.5px solid #E6D4C3',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  className="cat-list-item"
                >
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{cat.nombre}</span>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--danger)',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
