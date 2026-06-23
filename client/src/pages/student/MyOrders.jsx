import { apiFetch } from '../../services/apiClient';
import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { Clock, ChefHat, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function MyOrders() {
  const { user } = useAppContext();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { toast } = useToast();

  const normalizeOrder = (pedido) => ({
    ...pedido,
    estado: pedido.estado === 'PREPARANDO' ? 'EN_PREPARACION' : pedido.estado,
    fecha: pedido.fecha || pedido.created_at,
    items: Array.isArray(pedido.items)
      ? pedido.items.map((item) => ({
          ...item,
          producto: item.producto || { nombre: item.nombre_producto || 'Producto' },
        }))
      : [],
    total: Number(pedido.total || 0),
  });

  const loadPedidos = () => {
    apiFetch('/api/pedidos/mis-pedidos')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          toast(data.error, 'error');
        } else {
          const list = Array.isArray(data) ? data : (Array.isArray(data.pedidos) ? data.pedidos : []);
          setPedidos(list.map(normalizeOrder));
        }
        setLoading(false);
      })
      .catch(err => {
        toast('Error al cargar pedidos', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPedidos();
  }, [user.id]);

  // Find the most recent active order (PENDIENTE, CONFIRMADO, EN_PREPARACION, or LISTO)
  const mostRecentActive = pedidos
    .slice()
    .reverse()
    .find(p => p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO' || p.estado === 'EN_PREPARACION' || p.estado === 'LISTO');

  const activeOrder = pedidos.find(p => p.id === selectedOrderId) || mostRecentActive;
  const activeOrderId = activeOrder?.id;

  // Poll for the active order's details every 5 seconds
  useEffect(() => {
    if (!activeOrderId) return;

    const interval = setInterval(() => {
      apiFetch(`/api/pedidos/${activeOrderId}`)
        .then(r => r.json())
        .then(updatedOrder => {
          if (updatedOrder && !updatedOrder.error) {
            // Update the orders state with the polled data
            setPedidos(prev =>
              prev.map(p => (p.id === updatedOrder.id ? normalizeOrder(updatedOrder) : p))
            );
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [activeOrderId]);

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'badge-warning';
      case 'CONFIRMADO': return 'badge-info';
      case 'EN_PREPARACION': return 'badge-primary';
      case 'LISTO': return 'badge-success';
      case 'RECOGIDO': return 'badge-success';
      case 'CANCELADO': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getEstadoLabel = (estado) => {
    if (estado === 'EN_PREPARACION') return 'EN PREPARACIÓN';
    if (estado === 'CONFIRMADO') return 'CONFIRMADO';
    return estado;
  };

  const steps = [
    { key: 'PENDIENTE', label: 'Pedido', desc: 'En cola', icon: Clock },
    { key: 'EN_PREPARACION', label: 'Preparando', desc: 'En cocina', icon: ChefHat },
    { key: 'LISTO', label: 'Listo', desc: '¡Recógelo ya!', icon: CheckCircle2 },
    { key: 'RECOGIDO', label: 'Recogido', desc: 'Entregado', icon: ShoppingBag }
  ];

  const getStepIndex = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 0;
      case 'CONFIRMADO': return 0;
      case 'EN_PREPARACION': return 1;
      case 'LISTO': return 2;
      case 'RECOGIDO': return 3;
      default: return -1;
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando pedidos...</p></div>;

  const currentStep = activeOrder ? getStepIndex(activeOrder.estado) : -1;

  // Filter out the active order from the general list if we display it separately,
  // or keep it and show everything below. Keeping it in history is fine, but marking it as active is great.
  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Mis Pedidos</h2>
        <p className="screen-sub">Sigue el estado de tus pedidos en tiempo real</p>
      </div>

      <div id="myorders-content">
        {/* ACTIVE ORDER TRACKER */}
        {activeOrder && (
          <div className="stepper-container">
            <div className="stepper-header">
              <div className="stepper-order-info">
                <h3>Seguimiento en Vivo</h3>
                <span className="stepper-order-id">{activeOrder.id}</span>
              </div>
              <div className="stepper-order-summary">
                <span className="items-text">
                  {activeOrder.items.map(i => `${i.producto.nombre} ×${i.cantidad}`).join(', ')}
                </span>
                <strong>Total: S/ {activeOrder.total.toFixed(2)}</strong>
              </div>
            </div>
            {activeOrder.estado === 'CANCELADO' ? (
              <div style={{
                padding: '16px', background: 'rgba(154,42,42,0.1)', color: 'var(--danger)',
                borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', border: '1px solid rgba(154,42,42,0.2)'
              }}>
                ❌ Este pedido ha sido cancelado por la cafetería.
              </div>
            ) : (
              <div className="status-stepper">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep;
                  const isActive = idx === currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                      <div className="step-line"></div>
                      <div className="step-circle">
                        <Icon size={18} />
                      </div>
                      <div className="step-label">{step.label}</div>
                      <div className="step-desc">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ALL ORDERS HISTORY */}
        {!pedidos.length ? (
          <div className="empty-state"><p>Aún no tienes pedidos realizados.</p></div>
        ) : (
          <div className="orders-list-wrapper">
            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', marginTop: activeOrder ? '24px' : '0' }}>
              Historial de Pedidos
            </h3>
            <div className="orders-list">
              {pedidos.slice().reverse().map(p => (
                <div 
                  key={p.id} 
                  className="order-card" 
                  style={{
                    cursor: 'pointer',
                    border: p.id === activeOrderId ? '2px solid var(--secondary)' : '1px solid var(--border)',
                    boxShadow: p.id === activeOrderId ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.15s ease'
                  }} 
                  onClick={() => setSelectedOrderId(p.id)}
                >
                  <div className="oc-head">
                    <span className="oc-id">{p.id}</span>
                    <span className={`badge ${getBadgeClass(p.estado)}`}>
                      {getEstadoLabel(p.estado)}
                    </span>
                  </div>
                  <div className="oc-items">
                    {p.items.map(i => `${i.producto.nombre} ×${i.cantidad}`).join(' • ')}
                  </div>
                  <div className="oc-foot">
                    <span className="oc-date">
                      {new Date(p.fecha).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} a las{' '}
                      {new Date(p.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <strong>S/ {p.total.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
