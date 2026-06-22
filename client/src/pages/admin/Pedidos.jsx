import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { ClipboardList, Clock, CheckCircle2, Ban, Play, Check, CheckSquare } from 'lucide-react';
import { createClient } from '@supabase/supabase-client';

const supabaseUrl = 'TU_URL_DE_SUPABASE';
const supabaseKey = 'TU_ANON_KEY_DE_SUPABASE';
export const supabase = createClient(supabaseUrl, supabaseKey);



export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 1. Función de tu compañero intacta y bien cerrada
  const loadPedidos = () => {
    fetch('/api/pedidos')
      .then(r => r.json())
      .then(data => {
        setPedidos(data);
        setLoading(false);
      })
      .catch(err => {
        toast('Error al cargar pedidos', 'error');
        setLoading(false);
      });
  };

  // 2. Tu nuevo useEffect en Tiempo Real perfectamente estructurado
  useEffect(() => {
    // Carga inicial de datos
    loadPedidos();
    
    // Suscripción en Tiempo Real con Supabase
    const canalPedidos = supabase
      .channel('cambios-pedidos-vendedor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('¡Actualización en vivo detectada!', payload);
          // Re-usamos la función para refrescar la lista al instante
          loadPedidos(); 
        }
      )
      .subscribe();

    // Limpieza de la suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(canalPedidos);
    };
  }, []);

  // 3. Todo el resto de funciones y el renderizado Kanban de tu compañero quedan IGUALES
  const cambiarEstado = async (id, estado) => {
    try {
      const res = await fetch(`/api/pedidos/${id}/estado`, {
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

  if (loading) return <div className="screen"><p className="loading">Cargando pedidos...</p></div>;

  // Group columns
  const colPendiente = pedidos.filter(p => p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const colPreparacion = pedidos.filter(p => p.estado === 'EN_PREPARACION').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const colListo = pedidos.filter(p => p.estado === 'LISTO').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const colFinalizado = pedidos.filter(p => p.estado === 'RECOGIDO' || p.estado === 'CANCELADO').sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Panel Kanban de Pedidos</h2>
        <p className="screen-sub">Arrastra el flujo de los pedidos de la cafetería en tiempo real</p>
      </div>

      <div className="kanban-board">
        {/* COL 1: PENDIENTES */}
        <div className="kanban-col col-pendiente">
          <div className="kanban-col-header">
            <span><ClipboardList size={16} /> Pendientes</span>
            <span className="kanban-col-count">{colPendiente.length}</span>
          </div>
          <div className="kanban-cards">
            {!colPendiente.length ? (
              <p className="empty-state">No hay pendientes</p>
            ) : (
              colPendiente.map(p => (
                <div key={p.id} className="kanban-card">
                  <div className="kanban-card-head">
                    <span className="kanban-card-id">{p.id}</span>
                    <span className="kanban-card-time">{formatTime(p.fecha)}</span>
                  </div>
                  <div className="kanban-card-student">{p.nombreEstudiante}</div>
                  <div className="kanban-card-items">
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row">
                        <strong>{item.cantidad}x</strong> {item.producto.nombre}
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot">
                    <span className="kanban-card-total">S/ {p.total.toFixed(2)}</span>
                    <div className="kanban-card-actions">
                      <button className="btn-action ba-info" title="Preparar" onClick={() => cambiarEstado(p.id, 'EN_PREPARACION')}>
                        <Play size={14} /> Preparar
                      </button>
                      <button className="btn-action ba-danger" title="Cancelar" onClick={() => cambiarEstado(p.id, 'CANCELADO')}>
                        <Ban size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 2: EN PREPARACION */}
        <div className="kanban-col col-preparacion">
          <div className="kanban-col-header">
            <span><Clock size={16} /> En Preparación</span>
            <span className="kanban-col-count">{colPreparacion.length}</span>
          </div>
          <div className="kanban-cards">
            {!colPreparacion.length ? (
              <p className="empty-state">Nadie cocinando</p>
            ) : (
              colPreparacion.map(p => (
                <div key={p.id} className="kanban-card">
                  <div className="kanban-card-head">
                    <span className="kanban-card-id">{p.id}</span>
                    <span className="kanban-card-time">{formatTime(p.fecha)}</span>
                  </div>
                  <div className="kanban-card-student">{p.nombreEstudiante}</div>
                  <div className="kanban-card-items">
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row">
                        <strong>{item.cantidad}x</strong> {item.producto.nombre}
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot">
                    <span className="kanban-card-total">S/ {p.total.toFixed(2)}</span>
                    <div className="kanban-card-actions">
                      <button className="btn-action ba-success" title="Listo" onClick={() => cambiarEstado(p.id, 'LISTO')}>
                        <Check size={14} /> Listo
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 3: LISTO */}
        <div className="kanban-col col-listo">
          <div className="kanban-col-header">
            <span><CheckCircle2 size={16} /> Listos para Recoger</span>
            <span className="kanban-col-count">{colListo.length}</span>
          </div>
          <div className="kanban-cards">
            {!colListo.length ? (
              <p className="empty-state">Nada listo aún</p>
            ) : (
              colListo.map(p => (
                <div key={p.id} className="kanban-card">
                  <div className="kanban-card-head">
                    <span className="kanban-card-id">{p.id}</span>
                    <span className="kanban-card-time">{formatTime(p.fecha)}</span>
                  </div>
                  <div className="kanban-card-student">{p.nombreEstudiante}</div>
                  <div className="kanban-card-items">
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row">
                        <strong>{item.cantidad}x</strong> {item.producto.nombre}
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot">
                    <span className="kanban-card-total">S/ {p.total.toFixed(2)}</span>
                    <div className="kanban-card-actions">
                      <button className="btn-action ba-success" title="Entregar y Cobrar" onClick={() => cambiarEstado(p.id, 'RECOGIDO')}>
                        <CheckSquare size={14} /> Recogido
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 4: RECOGIDOS Y CANCELADOS */}
        <div className="kanban-col col-finalizado">
          <div className="kanban-col-header">
            <span>Finalizados</span>
            <span className="kanban-col-count">{colFinalizado.length}</span>
          </div>
          <div className="kanban-cards">
            {!colFinalizado.length ? (
              <p className="empty-state">Historial vacío</p>
            ) : (
              colFinalizado.map(p => (
                <div key={p.id} className="kanban-card" style={{ opacity: 0.75 }}>
                  <div className="kanban-card-head">
                    <span className="kanban-card-id">{p.id}</span>
                    <span className={`badge ${p.estado === 'RECOGIDO' ? 'badge-success' : 'badge-danger'}`}>
                      {p.estado}
                    </span>
                  </div>
                  <div className="kanban-card-student">{p.nombreEstudiante}</div>
                  <div className="kanban-card-items">
                    {p.items.map((item, i) => (
                      <div key={i} className="kanban-item-row">
                        <strong>{item.cantidad}x</strong> {item.producto.nombre}
                      </div>
                    ))}
                  </div>
                  <div className="kanban-card-foot">
                    <span className="kanban-card-total">S/ {p.total.toFixed(2)}</span>
                    <span className="kanban-card-time">{formatTime(p.fecha)}</span>
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