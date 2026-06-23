import { apiFetch } from '../../services/apiClient';
import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { ArrowUpRight, ArrowDownLeft, Calendar, Tag, Info } from 'lucide-react';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('Todos');
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [movRes, catRes] = await Promise.all([
        apiFetch('/api/productos/movimientos'),
        apiFetch('/api/categorias')
      ]);
      const movs = await movRes.json();
      const cats = await catRes.json();
      setMovimientos(movs);
      setCategorias(cats);
      setLoading(false);
    } catch (err) {
      toast('Error al cargar movimientos de stock', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="screen"><p className="loading">Cargando movimientos...</p></div>;

  const filteredMovs = selectedCat === 'Todos'
    ? movimientos
    : movimientos.filter(m => m.categoria === selectedCat);

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getReasonLabel = (m) => {
    if (m.motivo === 'REPOSICION') return '📥 Reposición Manual';
    if (m.motivo === 'VENTA') return '📤 Venta de Pedido';
    if (m.motivo === 'CANCELACION') return '🔄 Cancelación (Devolución)';
    return '✏️ Ajuste manual';
  };

  return (
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ marginBottom: '24px' }}>
        <h2>Movimientos de Stock (Kardex)</h2>
        <p className="screen-sub">Historial detallado de entradas y salidas de productos del almacén</p>
      </div>

      {/* FILTROS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFF',
        border: '1px solid #EFE7E0',
        padding: '12px 20px',
        borderRadius: '4px',
        marginBottom: '20px',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)', marginRight: '8px' }}>Categoría:</span>
        <button
          onClick={() => setSelectedCat('Todos')}
          style={{
            padding: '6px 12px',
            border: '1px solid',
            borderColor: selectedCat === 'Todos' ? 'var(--primary)' : '#EFE7E0',
            borderRadius: '4px',
            background: selectedCat === 'Todos' ? 'var(--primary)' : '#FAF6F0',
            color: selectedCat === 'Todos' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          🍽️ Todos
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.nombre)}
            style={{
              padding: '6px 12px',
              border: '1px solid',
              borderColor: selectedCat === cat.nombre ? 'var(--primary)' : '#EFE7E0',
              borderRadius: '4px',
              background: selectedCat === cat.nombre ? 'var(--primary)' : '#FAF6F0',
              color: selectedCat === cat.nombre ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* TABLA DE MOVIMIENTOS */}
      <div className="table-wrap" style={{ border: '1px solid #EFE7E0', borderRadius: '4px', width: '100%', overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--primary-dark)' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', borderTopLeftRadius: '4px' }}><Calendar size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Fecha y Hora</th>
              <th style={{ padding: '12px 16px', fontSize: '11px' }}>Producto</th>
              <th style={{ padding: '12px 16px', fontSize: '11px' }}><Tag size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Categoría</th>
              <th style={{ padding: '12px 16px', fontSize: '11px' }}>Tipo</th>
              <th style={{ padding: '12px 16px', fontSize: '11px' }}>Cantidad</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', borderTopRightRadius: '4px' }}><Info size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Detalle / Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No se registran movimientos para este filtro.
                </td>
              </tr>
            ) : (
              filteredMovs.map(m => {
                const isIngreso = m.tipo === 'INGRESO';
                return (
                  <tr key={m.id}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {formatDateTime(m.creadoEn)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{m.productoNombre}</strong>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8A6A55', fontWeight: '500', fontSize: '13px' }}>
                      {m.categoria}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: '800',
                        background: isIngreso ? 'rgba(45, 122, 79, 0.1)' : 'rgba(154, 42, 42, 0.1)',
                        color: isIngreso ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {isIngreso ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {m.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '800', fontSize: '14px', color: isIngreso ? 'var(--success)' : 'var(--danger)' }}>
                      {isIngreso ? '+' : '-'}{m.cantidad}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {getReasonLabel(m)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
