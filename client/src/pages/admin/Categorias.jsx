import { apiFetch } from '../../services/apiClient';
import { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../components/Toast';

async function fetchCategoriasRequest() {
  const res = await apiFetch('/api/categorias');
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || 'No se pudieron cargar las categorias.');
  }

  return Array.isArray(data) ? data : [];
}

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [feedback, setFeedback] = useState(null);
  const { toast } = useToast();

  const loadCategorias = async ({ preserveFeedback = false } = {}) => {
    setLoading(true);
    if (!preserveFeedback) setFeedback(null);

    try {
      const data = await fetchCategoriasRequest();
      setCategorias(data);
    } catch (err) {
      const message = err.message || 'Error al cargar categorias.';
      setFeedback({ type: 'error', message });
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    fetchCategoriasRequest()
      .then((data) => {
        if (!ignore) setCategorias(data);
      })
      .catch((err) => {
        if (!ignore) {
          const message = err.message || 'Error al cargar categorias.';
          setFeedback({ type: 'error', message });
          toast(message, 'error');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [toast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio || saving) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreLimpio })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'No se pudo crear la categoria.');
      }

      const message = 'Categoria creada correctamente.';
      setNombre('');
      setFeedback({ type: 'success', message });
      toast(message, 'success');
      await loadCategorias({ preserveFeedback: true });
    } catch (err) {
      const message = err.message || 'Error al crear categoria.';
      setFeedback({ type: 'error', message });
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nombreCategoria) => {
    const confirmed = confirm(
      `Eliminar la categoria "${nombreCategoria}"? Los productos asociados quedaran sin categoria.`
    );
    if (!confirmed) return;

    setFeedback(null);

    try {
      const res = await apiFetch(`/api/categorias/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || 'No se pudo eliminar la categoria.');
      }

      const message = 'Categoria eliminada correctamente.';
      setFeedback({ type: 'success', message });
      toast(message, 'success');
      await loadCategorias({ preserveFeedback: true });
    } catch (err) {
      const message = err.message || 'Error al eliminar categoria.';
      setFeedback({ type: 'error', message });
      toast(message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="screen">
        <p className="loading">Cargando categorias...</p>
      </div>
    );
  }

  return (
    <div className="screen admin-category-screen">
      <div className="screen-header">
        <h2>Categorias de productos</h2>
        <p className="screen-sub">Crea, revisa y elimina las categorias del menu.</p>
      </div>

      {feedback && (
        <div className={`admin-feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="admin-category-layout">
        <section className="glass-panel category-form-panel">
          <h3>Nueva categoria</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Postres, cafes, ensaladas"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              <Plus size={16} />
              {saving ? 'Creando...' : 'Crear categoria'}
            </button>
          </form>
        </section>

        <section className="glass-panel category-list-panel">
          <div className="panel-title-row">
            <h3>
              <FolderOpen size={18} />
              Categorias disponibles
            </h3>
            <span>{categorias.length}</span>
          </div>

          {categorias.length === 0 ? (
            <div className="empty-state category-empty">
              <p>No hay categorias registradas.</p>
            </div>
          ) : (
            <div className="category-list">
              {categorias.map((cat) => (
                <div className="category-list-item" key={cat.id}>
                  <span>{cat.nombre}</span>
                  <button
                    type="button"
                    className="icon-danger-btn"
                    onClick={() => handleDelete(cat.id, cat.nombre)}
                    title="Eliminar categoria"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
