import { apiFetch } from '../../services/apiClient';
import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { ClipboardList, Clock, CheckCircle2, Ban, Play, Check, CheckSquare, User, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockAlerts, setStockAlerts] = useState([]);
  const { toast } = useToast();

  const normalizePedido = (pedido) => ({
    ...pedido,
    estado: pedido.estado === 'PREPARANDO' ? 'EN_PREPARACION' : pedido.estado,
    fecha: pedido.fecha || pedido.created_at,
    pickupAt: pedido.pickup_at || pedido.pickupAt || null,
    nombreEstudiante: pedido.nombreEstudiante || pedido.usuario?.nombre || pedido.usuario_id || 'Estudiante',
    total: Number(pedido.total || 0),
    items: Array.isArray(pedido.items)
      ? pedido.items.map((item) => ({
          ...item,
          producto: item.producto || { nombre: item.nombre_producto || 'Producto' },
        }))
      : [],
  });

  const loadPedidos = (manual = false) => {
    if (manual) setRefreshing(true);
    apiFetch('/api/pedidos')
      .then(r => r.json())
      .then(data => {
        setPedidos(Array.isArray(data) ? data.map(normalizePedido) : []);
        setLoading(false);
        if (manual) setRefreshing(false);
      })
      .catch(() => {
        toast('Error al cargar pedidos', 'error');
        setLoading(false);
        if (manual) setRefreshing(false);
      });
  };

  useEffect(() => {
    loadPedidos();
    
    // Fallback: consulta cada 5 segundos si el tiempo real de Supabase no está configurado o falla
    const pollInterval = setInterval(() => {
      loadPedidos();
    }, 5000);
    
    const loadStockAlerts = () => {
      apiFetch('/api/stock/alertas')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const alerts = Array.isArray(data) ? data : [];
          setStockAlerts(alerts);
          if (alerts.length > 0) {
            toast(`${alerts.length} producto(s) con stock bajo`, 'warning');
          }
        })
        .catch(() => {});
    };
    loadStockAlerts();
    const stockInterval = setInterval(loadStockAlerts, 5000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(stockInterval);
    };
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      const res = await apiFetch(`/api/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      if (res.ok) {
        toast(`Pedido ${id} marcado como ${estado === 'EN_PREPARACION' ? 'En Preparación' : estado}`);
        loadPedidos();
      } else {
        toast('Error al cambiar estado', 'error');
      }
    } catch (err) {
      toast('Error de conexión', 'error');
    }
  };

  const revisarVencidos = async () => {
    try {
      const res = await apiFetch('/api/pedidos/vencidos');
      const data = await res.json();
      const vencidos = Array.isArray(data) ? data : [];
      toast(
        vencidos.length ? `${vencidos.length} pedido(s) vencido(s) por revisar` : 'No hay pedidos vencidos',
        vencidos.length ? 'warning' : 'success'
      );
      if (vencidos.length) loadPedidos(true);
    } catch {
      toast('Error al revisar vencidos', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando pedidos...</p></div>;

  // Group columns
  const colPendiente = pedidos.filter(p => p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const colPreparacion = pedidos.filter(p => p.estado === 'EN_PREPARACION').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const colListo = pedidos.filter(p => p.estado === 'LISTO').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const colFinalizado = pedidos.filter(p => p.estado === 'RECOGIDO' || p.estado === 'CANCELADO' || p.estado === 'NO_RECOGIDO').sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>Panel Kanban de Pedidos</h2>
            <p className="screen-sub">Gestión en tiempo real del flujo de pedidos de los estudiantes</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={revisarVencidos}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '4px', border: '1px solid rgba(217,119,6,0.35)',
                background: '#FFF7ED', color: '#9A5800', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700,
              }}
            >
              <AlertTriangle size={14} />
              Revisar vencidos
            </button>
            <button
              onClick={() => loadPedidos(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '4px', border: '1px solid #EFE7E0',
                background: '#FFF', color: 'var(--text)', cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 700, opacity: refreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {stockAlerts.length > 0 && (
        <div className="admin-feedback error" style={{ display: 'grid', gap: '6px' }}>
          <strong>Alertas de stock bajo</strong>
          {stockAlerts.slice(0, 4).map(alert => (
            <span key={alert.producto_id}>
              {alert.producto}: {alert.stock_actual} unidad(es). {alert.recomendacion}
            </span>
          ))}
        </div>
      )}

      <div className="kanban-board" style={{ gap: '20px' }}>
        {/* COL 1: PENDIENTES */}
        <div className="kanban-col col-pendiente" style={{ borderRadius: '4px', border: '1.5px solid #E6D4C3', background: '#FFFDFB', padding: '16px' }}>
          <div className="kanban-col-header" style={{ borderBottom: '2px solid #E6D4C3', paddingBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 800 }}>
              <ClipboardList size={16} /> Pendientes
            </span>
            <span className="kanban-col-count" style={{ borderRadius: '4px', background: '#D97706', padding: '2px 8px', fontSize: '11px' }}>
              {colPendiente.length}
            </span>
          </div>
          <div className="kanban-cards">
            {!colPendiente.length ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No hay pendientes</div>
            ) : (
              colPendiente.map(p => (
                <div key={p.id} className="kanban-card" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '14px', boxShadow: '0 1px 4px rgba(44,31,24,0.02)' }}>
                  <div className="kanban-card-head" style={{ borderBottom: '1px solid #FAF6F0', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span className="kanban-card-id" style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.id}</span>
                    <span className="kanban-card-time" style={{ background: '#FAF0E6', color: '#8B5A2B', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} /> Recojo {formatTime(p.pickupAt) || formatTime(p.fecha) || 'pronto'}
                    </span>
                  </div>
                  <div className="kanban-card-student" style={{ color: 'var(--text)', fontWeight: 800, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} style={{ color: 'var(--primary)' }} /> {p.nombreEstudiante}
                  </div>
                  <div className="kanban-card-items" style={{ background: '#FAF6F0', padding: '10px', borderRadius: '4px', border: '1px solid #EFE7E0', fontSize: '13px' }}>
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{item.producto?.nombre || 'Producto'}</span>
                        <strong style={{ color: 'var(--primary)' }}>x{item.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot" style={{ marginTop: '12px', borderTop: '1px solid #FAF6F0', paddingTop: '8px' }}>
                    <span className="kanban-card-total" style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>
                      S/ {p.total.toFixed(2)}
                    </span>
                    <div className="kanban-card-actions">
                      <button 
                        className="btn-action ba-info" 
                        title="Preparar" 
                        onClick={() => cambiarEstado(p.id, 'EN_PREPARACION')}
                        style={{ borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
                      >
                        <Play size={12} /> Preparar
                      </button>
                      <button 
                        className="btn-action ba-danger" 
                        title="Cancelar" 
                        onClick={() => cambiarEstado(p.id, 'CANCELADO')}
                        style={{ borderRadius: '4px', padding: '6px 8px', margin: 0 }}
                      >
                        <Ban size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 2: EN PREPARACION */}
        <div className="kanban-col col-preparacion" style={{ borderRadius: '4px', border: '1.5px solid #E6D4C3', background: '#FFFDFB', padding: '16px' }}>
          <div className="kanban-col-header" style={{ borderBottom: '2px solid #E6D4C3', paddingBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 800 }}>
              <Clock size={16} /> En Preparación
            </span>
            <span className="kanban-col-count" style={{ borderRadius: '4px', background: '#D97706', padding: '2px 8px', fontSize: '11px' }}>
              {colPreparacion.length}
            </span>
          </div>
          <div className="kanban-cards">
            {!colPreparacion.length ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Nadie cocinando</div>
            ) : (
              colPreparacion.map(p => (
                <div key={p.id} className="kanban-card" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '14px', boxShadow: '0 1px 4px rgba(44,31,24,0.02)' }}>
                  <div className="kanban-card-head" style={{ borderBottom: '1px solid #FAF6F0', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span className="kanban-card-id" style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.id}</span>
                    <span className="kanban-card-time" style={{ background: '#FAF0E6', color: '#8B5A2B', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} /> Recojo {formatTime(p.pickupAt) || formatTime(p.fecha) || 'pronto'}
                    </span>
                  </div>
                  <div className="kanban-card-student" style={{ color: 'var(--text)', fontWeight: 800, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} style={{ color: 'var(--primary)' }} /> {p.nombreEstudiante}
                  </div>
                  <div className="kanban-card-items" style={{ background: '#FAF6F0', padding: '10px', borderRadius: '4px', border: '1px solid #EFE7E0', fontSize: '13px' }}>
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{item.producto?.nombre || 'Producto'}</span>
                        <strong style={{ color: 'var(--primary)' }}>x{item.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot" style={{ marginTop: '12px', borderTop: '1px solid #FAF6F0', paddingTop: '8px' }}>
                    <span className="kanban-card-total" style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>
                      S/ {p.total.toFixed(2)}
                    </span>
                    <div className="kanban-card-actions">
                      <button 
                        className="btn-action ba-success" 
                        title="Listo" 
                        onClick={() => cambiarEstado(p.id, 'LISTO')}
                        style={{ borderRadius: '4px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
                      >
                        <Check size={12} /> Listo
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 3: LISTO */}
        <div className="kanban-col col-listo" style={{ borderRadius: '4px', border: '1.5px solid #E6D4C3', background: '#FFFDFB', padding: '16px' }}>
          <div className="kanban-col-header" style={{ borderBottom: '2px solid #E6D4C3', paddingBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 800 }}>
              <CheckCircle2 size={16} /> Listos para Recoger
            </span>
            <span className="kanban-col-count" style={{ borderRadius: '4px', background: 'var(--success)', padding: '2px 8px', fontSize: '11px' }}>
              {colListo.length}
            </span>
          </div>
          <div className="kanban-cards">
            {!colListo.length ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Nada listo aún</div>
            ) : (
              colListo.map(p => (
                <div key={p.id} className="kanban-card" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '14px', boxShadow: '0 1px 4px rgba(44,31,24,0.02)' }}>
                  <div className="kanban-card-head" style={{ borderBottom: '1px solid #FAF6F0', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span className="kanban-card-id" style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.id}</span>
                    <span className="kanban-card-time" style={{ background: '#FAF0E6', color: '#8B5A2B', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} /> Recojo {formatTime(p.pickupAt) || formatTime(p.fecha) || 'pronto'}
                    </span>
                  </div>
                  <div className="kanban-card-student" style={{ color: 'var(--text)', fontWeight: 800, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} style={{ color: 'var(--primary)' }} /> {p.nombreEstudiante}
                  </div>
                  <div className="kanban-card-items" style={{ background: '#FAF6F0', padding: '10px', borderRadius: '4px', border: '1px solid #EFE7E0', fontSize: '13px' }}>
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{item.producto?.nombre || 'Producto'}</span>
                        <strong style={{ color: 'var(--primary)' }}>x{item.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot" style={{ marginTop: '12px', borderTop: '1px solid #FAF6F0', paddingTop: '8px' }}>
                    <span className="kanban-card-total" style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>
                      S/ {p.total.toFixed(2)}
                    </span>
                    <div className="kanban-card-actions">
                      <button 
                        className="btn-action ba-success" 
                        title="Entregar y Cobrar" 
                        onClick={() => cambiarEstado(p.id, 'RECOGIDO')}
                        style={{ borderRadius: '4px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
                      >
                        <CheckSquare size={12} /> Recogido
                      </button>
                      <button
                        className="btn-action ba-danger"
                        title="No recogido"
                        onClick={() => cambiarEstado(p.id, 'NO_RECOGIDO')}
                        style={{ borderRadius: '4px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
                      >
                        <Ban size={12} /> No recogido
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 4: RECOGIDOS Y CANCELADOS */}
        <div className="kanban-col col-finalizado" style={{ borderRadius: '4px', border: '1.5px solid #E6D4C3', background: '#FFFDFB', padding: '16px' }}>
          <div className="kanban-col-header" style={{ borderBottom: '2px solid #E6D4C3', paddingBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 800 }}>
              Finalizados
            </span>
            <span className="kanban-col-count" style={{ borderRadius: '4px', background: 'var(--text-muted)', padding: '2px 8px', fontSize: '11px' }}>
              {colFinalizado.length}
            </span>
          </div>
          <div className="kanban-cards">
            {!colFinalizado.length ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Historial vacío</div>
            ) : (
              colFinalizado.map(p => (
                <div key={p.id} className="kanban-card" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '14px', boxShadow: '0 1px 4px rgba(44,31,24,0.02)', opacity: 0.8 }}>
                  <div className="kanban-card-head" style={{ borderBottom: '1px solid #FAF6F0', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span className="kanban-card-id" style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.id}</span>
                    <span className={`badge ${p.estado === 'RECOGIDO' ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '3px', fontSize: '10px', padding: '2px 6px' }}>
                      {p.estado}
                    </span>
                  </div>
                  <div className="kanban-card-student" style={{ color: 'var(--text)', fontWeight: 800, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} style={{ color: 'var(--primary)' }} /> {p.nombreEstudiante}
                  </div>
                  <div className="kanban-card-items" style={{ background: '#FAF6F0', padding: '10px', borderRadius: '4px', border: '1px solid #EFE7E0', fontSize: '13px' }}>
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{item.producto?.nombre || 'Producto'}</span>
                        <strong style={{ color: 'var(--primary)' }}>x{item.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot" style={{ marginTop: '12px', borderTop: '1px solid #FAF6F0', paddingTop: '8px' }}>
                    <span className="kanban-card-total" style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>
                      S/ {p.total.toFixed(2)}
                    </span>
                    <span className="kanban-card-time" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} /> {formatTime(p.pickupAt) || formatTime(p.fecha) || 'Reciente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
