import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Package, BarChart3, AlertCircle, Calendar, PieChart } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { LineChart, DonutChart, BarChart } from '../../components/Charts';

export default function Reporte() {
  const [data, setData] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/reporte').then(r => r.json()),
      fetch('/api/pedidos').then(r => r.json()),
    ])
      .then(([reporteData, pedidosData]) => {
        setData(reporteData);
        setPedidos(pedidosData);
        setLoading(false);
      })
      .catch(() => { toast('Error al cargar reporte', 'error'); setLoading(false); });
  }, []);

  if (loading) return <div className="screen"><p className="loading">Cargando reporte...</p></div>;

  const { estadisticas: s, masVendidos } = data;

  // Calcular caja del día (pedidos recogidos hoy)
  const hoy = new Date().toDateString();
  const entregadosHoy = pedidos.filter(p =>
    p.estado === 'RECOGIDO' && new Date(p.fecha).toDateString() === hoy
  );
  const cajaHoy = entregadosHoy.reduce((acc, p) => acc + p.total, 0);
  const pendientesHoy = pedidos.filter(p =>
    (p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO' || p.estado === 'EN_PREPARACION' || p.estado === 'LISTO')
    && new Date(p.fecha).toDateString() === hoy
  );

  const getLast7DaysSales = (pedidosList) => {
    const salesByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toDateString();
      salesByDay[dayKey] = {
        label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        value: 0
      };
    }
    pedidosList.forEach(p => {
      if (p.estado === 'RECOGIDO') {
        const dateStr = new Date(p.fecha).toDateString();
        if (salesByDay[dateStr]) {
          salesByDay[dateStr].value += p.total;
        }
      }
    });
    return Object.values(salesByDay);
  };

  const getSalesByCategory = (mvList) => {
    const categories = {};
    mvList.forEach(mv => {
      const cat = mv.categoria || 'Otros';
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat] += mv.ingresos;
    });

    const colors = {
      'Sandwich': 'var(--secondary)',
      'Bebida': 'var(--primary-light)',
      'Snack': 'var(--orange)',
      'Otros': 'var(--neutral)'
    };

    return Object.keys(categories).map(cat => ({
      label: cat,
      value: categories[cat],
      color: colors[cat] || 'var(--neutral)'
    }));
  };

  const getOrdersByStatus = (pedidosList) => {
    const counts = {
      'Pendientes': 0,
      'En Proceso': 0,
      'Entregados': 0,
      'Cancelados': 0
    };
    pedidosList.forEach(p => {
      if (p.estado === 'PENDIENTE') counts['Pendientes']++;
      else if (['CONFIRMADO', 'EN_PREPARACION', 'LISTO'].includes(p.estado)) counts['En Proceso']++;
      else if (p.estado === 'RECOGIDO') counts['Entregados']++;
      else if (p.estado === 'CANCELADO') counts['Cancelados']++;
    });
    return Object.keys(counts).map(key => ({
      label: key,
      value: counts[key],
      color: key === 'Pendientes' ? 'var(--warning)' :
             key === 'En Proceso' ? 'var(--secondary)' :
             key === 'Entregados' ? 'var(--success)' : 'var(--danger)'
    }));
  };

  const statCards = [
    { label: 'Ingresos totales', value: `S/ ${s.ingresosTotales.toFixed(2)}`, icon: DollarSign, color: 'c-success' },
    { label: 'Pedidos totales', value: s.totalPedidos, icon: ShoppingBag, color: 'c-primary' },
    { label: 'Recogidos', value: s.pedidosEntregados, icon: TrendingUp, color: 'c-info' },
    { label: 'Activos ahora', value: s.pedidosActivos, icon: AlertCircle, color: 'c-warning' },
    { label: 'Estudiantes', value: s.estudiantesRegistrados, icon: Users, color: 'c-orange' },
    { label: 'Productos disponibles', value: `${s.productosDisponibles}/${s.totalProductos}`, icon: Package, color: 'c-primary' },
  ];

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Reporte de Ventas</h2>
        <p className="screen-sub">Métricas clave e historial de ventas</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`stat-card ${c.color}`}>
              <div className="si"><Icon size={24} /></div>
              <div className="sv">{c.value}</div>
              <div className="sl">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Fila de gráficos principales */}
      <div className="charts-section-grid">
        <div className="chart-card">
          <h3>
            <TrendingUp size={18} style={{ color: 'var(--secondary)' }} />
            Tendencia de Ventas (Últimos 7 días)
          </h3>
          <LineChart data={getLast7DaysSales(pedidos)} prefix="S/ " />
        </div>
        <div className="chart-card">
          <h3>
            <BarChart3 size={18} style={{ color: 'var(--success)' }} />
            Pedidos por Estado
          </h3>
          <BarChart data={getOrdersByStatus(pedidos)} />
        </div>
      </div>

      <div className="rep-grid">
        {/* Caja del día */}
        <div className="rep-sec">
          <h3><Calendar size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} /> Caja de hoy</h3>
          <div style={{
            background: 'linear-gradient(135deg, #2D7A4F, #1A4D32)',
            borderRadius: '12px', padding: '20px', color: '#fff', marginBottom: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Total cobrado hoy
            </div>
            <div style={{ fontSize: '36px', fontWeight: 900 }}>S/ {cajaHoy.toFixed(2)}</div>
            <div style={{ fontSize: '13px', opacity: 0.75, marginTop: '4px' }}>
              {entregadosHoy.length} pedidos entregados
            </div>
          </div>
          <div className="stats-list">
            <div className="stat-row">
              <span>Pendientes activos hoy</span>
              <strong>{pendientesHoy.length}</strong>
            </div>
            <div className="stat-row hl">
              <span>Total esperado (activos)</span>
              <strong>S/ {pendientesHoy.reduce((a, p) => a + p.total, 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Rendimiento de Productos & Distribución */}
        <div className="rep-sec">
          <h3><BarChart3 size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} /> Ventas y Distribución</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '16px' }}>
            {/* Categorías */}
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                <PieChart size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Ventas por Categoría
              </h4>
              <DonutChart data={getSalesByCategory(masVendidos)} prefix="S/ " />
            </div>

            {/* Top Ventas */}
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                Top 5 Más Vendidos
              </h4>
              {!masVendidos.length ? (
                <div className="empty-state" style={{ padding: '24px 10px' }}>
                  <p>No hay ventas aún.<br /><small>Aparecen cuando los pedidos se marcan como <strong>Recogidos</strong>.</small></p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {masVendidos.slice(0, 5).map((mv, i) => {
                    const maxCant = masVendidos[0].cantidad;
                    const pct = Math.round((mv.cantidad / maxCant) * 100);
                    return (
                      <div key={i} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontWeight: 900 }}>#{i + 1}</span>
                            {mv.nombre}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '12px' }}>
                            {mv.cantidad} uds · S/ {mv.ingresos.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ background: 'var(--border)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`, height: '100%', borderRadius: '99px',
                            background: i === 0
                              ? 'linear-gradient(90deg, var(--secondary), var(--primary))'
                              : 'var(--primary-light)',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
