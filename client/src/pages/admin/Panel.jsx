import { useState, useEffect } from 'react';
import {
  Receipt,
  Hourglass,
  Zap,
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  PieChart
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { LineChart, DonutChart, BarChart } from '../../components/Charts';

export default function Panel() {
  const [data, setData] = useState({
    s: null,
    pend: 0,
    activos: 0,
    activosList: [],
    pedidos: [],
    masVendidos: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/reporte').then(r => r.json()),
      fetch('/api/pedidos').then(r => r.json())
    ])
      .then(([rep, pedidos]) => {
        const s = rep.estadisticas;
        const masVendidos = rep.masVendidos || [];
        const pend = pedidos.filter(p => p.estado === 'PENDIENTE').length;
        const activosList = pedidos.filter(p => !['RECOGIDO', 'CANCELADO'].includes(p.estado));
        setData({
          s,
          pend,
          activos: activosList.length,
          activosList,
          pedidos,
          masVendidos
        });
        setLoading(false);
      })
      .catch(err => {
        toast('Error al cargar panel', 'error');
        setLoading(false);
      });
  }, [toast]);

  if (loading) return <div className="screen"><p className="loading">Cargando...</p></div>;

  const getBadgeClass = (estado) => {
    if (!estado) return 'badge-neutral';
    switch (estado.toUpperCase()) {
      case 'PENDIENTE': return 'badge-warning';
      case 'CONFIRMADO': return 'badge-info';
      case 'EN_PREPARACION': return 'badge-orange';
      case 'LISTO': return 'badge-success';
      case 'RECOGIDO': return 'badge-neutral';
      case 'CANCELADO': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

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

  const { s, pend, activos, activosList, pedidos, masVendidos } = data;

  // Caja del día (Pedidos cobrados hoy)
  const hoy = new Date().toDateString();
  const entregadosHoy = pedidos.filter(p =>
    p.estado === 'RECOGIDO' && new Date(p.fecha).toDateString() === hoy
  );
  const cajaHoy = entregadosHoy.reduce((acc, p) => acc + p.total, 0);
  const pendientesHoy = pedidos.filter(p =>
    (p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO' || p.estado === 'EN_PREPARACION' || p.estado === 'LISTO')
    && new Date(p.fecha).toDateString() === hoy
  );

  return (
    <div className="screen" style={{ maxWidth: '1200px' }}>
      <div className="screen-header" style={{ marginBottom: '16px' }}>
        <h2>Panel Principal</h2>
        <p className="screen-sub">Métricas clave, ventas y pedidos activos</p>
      </div>
      <div id="panel-content">
        {/* Tarjetas de estadísticas */}
        <div className="stats-grid">
          <div className="stat-card c-primary">
            <div className="si"><Receipt /></div>
            <div className="sv">{s.totalPedidos}</div>
            <div className="sl">Total pedidos</div>
          </div>
          <div className="stat-card c-warning">
            <div className="si"><Hourglass /></div>
            <div className="sv">{pend}</div>
            <div className="sl">Pendientes</div>
          </div>
          <div className="stat-card c-orange">
            <div className="si"><Zap /></div>
            <div className="sv">{activos}</div>
            <div className="sl">Activos</div>
          </div>
          <div className="stat-card c-success">
            <div className="si"><CheckCircle /></div>
            <div className="sv">{s.pedidosEntregados}</div>
            <div className="sl">Recogidos</div>
          </div>
          <div className="stat-card c-info">
            <div className="si"><DollarSign /></div>
            <div className="sv">S/ {s.ingresosTotales.toFixed(2)}</div>
            <div className="sl">Ingresos</div>
          </div>
          <div className="stat-card c-neutral">
            <div className="si"><Users /></div>
            <div className="sv">{s.estudiantesRegistrados}</div>
            <div className="sl">Estudiantes</div>
          </div>
        </div>

        {/* Dashboard Grid Principal */}
        <div className="dashboard-main-grid">
          {/* Columna Izquierda: Tendencia y Pedidos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            {/* Gráfico de tendencia de ventas semanal */}
            <div className="chart-card">
              <h3>
                <TrendingUp size={18} style={{ color: 'var(--secondary)' }} />
                Tendencia de Ventas (Últimos 7 días)
              </h3>
              <LineChart data={getLast7DaysSales(pedidos)} prefix="S/ " />
            </div>

            {/* Pedidos activos */}
            <div className="panel-section" style={{ alignSelf: 'stretch' }}>
              <h3>Pedidos activos ({activos})</h3>
              {activos === 0 ? (
                <div className="empty-state" style={{ padding: '32px 10px' }}>
                  <p>No hay pedidos activos en este momento.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID Pedido</th>
                        <th>Estudiante</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activosList.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.id}</strong></td>
                          <td>{p.nombreEstudiante}</td>
                          <td>S/ {p.total.toFixed(2)}</td>
                          <td><span className={`badge ${getBadgeClass(p.estado)}`}>{p.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Caja, Pedidos por Estado, Categorías y Top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            {/* Caja de hoy */}
            <div className="rep-sec">
              <h3>
                <Calendar size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                Caja de hoy
              </h3>
              <div style={{
                background: 'linear-gradient(135deg, #2D7A4F, #1A4D32)',
                borderRadius: '12px', padding: '16px', color: '#fff', marginBottom: '14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Total cobrado hoy
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900 }}>S/ {cajaHoy.toFixed(2)}</div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>
                  {entregadosHoy.length} pedidos entregados
                </div>
              </div>
              <div className="stats-list">
                <div className="stat-row" style={{ padding: '6px 8px', fontSize: '12.5px' }}>
                  <span>Pendientes activos hoy</span>
                  <strong>{pendientesHoy.length}</strong>
                </div>
                <div className="stat-row hl" style={{ padding: '6px 8px', fontSize: '12.5px' }}>
                  <span>Total esperado (activos)</span>
                  <strong>S/ {pendientesHoy.reduce((a, p) => a + p.total, 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Pedidos por Estado */}
            <div className="chart-card">
              <h3>
                <BarChart3 size={18} style={{ color: 'var(--success)' }} />
                Pedidos por Estado
              </h3>
              <BarChart data={getOrdersByStatus(pedidos)} />
            </div>

            {/* Ventas por Categoría (Dona) */}
            <div className="rep-sec">
              <h3>
                <PieChart size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                Ventas por Categoría
              </h3>
              <div style={{ marginTop: '12px' }}>
                <DonutChart data={getSalesByCategory(masVendidos)} prefix="S/ " />
              </div>
            </div>

            {/* Top 5 Más Vendidos */}
            <div className="rep-sec">
              <h3>
                <TrendingUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                Top 5 Más Vendidos
              </h3>
              {!masVendidos.length ? (
                <div className="empty-state" style={{ padding: '20px 10px' }}>
                  <p>No hay ventas aún.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {masVendidos.slice(0, 5).map((mv, i) => {
                    const maxCant = masVendidos[0].cantidad;
                    const pct = Math.round((mv.cantidad / maxCant) * 100);
                    return (
                      <div key={i} style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontWeight: 900 }}>#{i + 1}</span>
                            {mv.nombre}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '11px' }}>
                            {mv.cantidad} uds · S/ {mv.ingresos.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ background: 'var(--border)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
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
