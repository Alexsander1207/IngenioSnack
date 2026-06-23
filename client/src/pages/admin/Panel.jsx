import { apiFetch } from '../../services/apiClient';
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
      apiFetch('/api/reporte').then(r => r.json()),
      apiFetch('/api/pedidos').then(r => r.json())
    ])
      .then(([rep, pedidos]) => {
        const pedidosList = Array.isArray(pedidos) ? pedidos.map(p => ({
          ...p,
          estado: p.estado === 'PREPARANDO' ? 'EN_PREPARACION' : p.estado,
          fecha: p.fecha || p.created_at,
          total: Number(p.total || 0),
        })) : [];
        const s = rep?.estadisticas || {};
        const masVendidos = Array.isArray(rep?.masVendidos) ? rep.masVendidos : [];
        const pend = pedidosList.filter(p => p.estado === 'PENDIENTE').length;
        const activosList = pedidosList.filter(p => !['RECOGIDO', 'CANCELADO'].includes(p.estado));
        setData({
          s,
          pend,
          activos: activosList.length,
          activosList,
          pedidos: pedidosList,
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
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ marginBottom: '24px' }}>
        <h2>Panel Principal</h2>
        <p className="screen-sub">Métricas clave, ventas y pedidos activos del negocio</p>
      </div>

      <div id="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Fila 1: Tarjetas de estadísticas */}
        <div className="stats-grid" style={{ gap: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div className="stat-card c-primary" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', borderLeft: '4px solid var(--primary)', padding: '16px' }}>
            <div className="si" style={{ color: 'var(--primary)', marginBottom: '8px' }}><Receipt /></div>
            <div className="sv" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{s.totalPedidos}</div>
            <div className="sl" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total pedidos</div>
          </div>
          <div className="stat-card c-warning" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', borderLeft: '4px solid var(--warning)', padding: '16px' }}>
            <div className="si" style={{ color: 'var(--warning)', marginBottom: '8px' }}><Hourglass /></div>
            <div className="sv" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{pend}</div>
            <div className="sl" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pendientes</div>
          </div>
          <div className="stat-card c-orange" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', borderLeft: '4px solid var(--orange)', padding: '16px' }}>
            <div className="si" style={{ color: 'var(--orange)', marginBottom: '8px' }}><Zap /></div>
            <div className="sv" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{activos}</div>
            <div className="sl" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Activos</div>
          </div>
          <div className="stat-card c-success" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', borderLeft: '4px solid var(--success)', padding: '16px' }}>
            <div className="si" style={{ color: 'var(--success)', marginBottom: '8px' }}><CheckCircle /></div>
            <div className="sv" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{s.pedidosEntregados}</div>
            <div className="sl" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recogidos</div>
          </div>
          <div className="stat-card c-info" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', borderLeft: '4px solid var(--info)', padding: '16px' }}>
            <div className="si" style={{ color: 'var(--info)', marginBottom: '8px' }}><DollarSign /></div>
            <div className="sv" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>S/ {s.ingresosTotales.toFixed(2)}</div>
            <div className="sl" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ingresos</div>
          </div>
          <div className="stat-card c-neutral" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', borderLeft: '4px solid var(--neutral)', padding: '16px' }}>
            <div className="si" style={{ color: 'var(--neutral)', marginBottom: '8px' }}><Users /></div>
            <div className="sv" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{s.estudiantesRegistrados}</div>
            <div className="sl" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estudiantes</div>
          </div>
        </div>

        {/* Fila 2: Ventas y Caja */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Gráfico de tendencia de ventas semanal */}
          <div className="chart-card" style={{ gridColumn: 'span 2', borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>
              <TrendingUp size={18} style={{ color: 'var(--secondary)' }} />
              Tendencia de Ventas (Últimos 7 días)
            </h3>
            <LineChart data={getLast7DaysSales(pedidos)} prefix="S/ " />
          </div>

          {/* Caja de hoy */}
          <div className="rep-sec" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              Caja de hoy
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #2D7A4F, #1A4D32)',
              borderRadius: '4px', padding: '20px', color: '#fff', marginBottom: '14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total cobrado hoy
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900 }}>S/ {cajaHoy.toFixed(2)}</div>
              <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
                {entregadosHoy.length} pedidos entregados
              </div>
            </div>
            <div className="stats-list" style={{ gap: '4px' }}>
              <div className="stat-row" style={{ padding: '8px 12px', fontSize: '13px', background: '#FAF6F0', border: '1px solid #EFE7E0', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pendientes activos hoy</span>
                <strong style={{ color: 'var(--text)' }}>{pendientesHoy.length}</strong>
              </div>
              <div className="stat-row hl" style={{ padding: '8px 12px', fontSize: '13px', background: '#FAF0E6', border: '1px solid #E6D4C3', borderRadius: '4px', fontWeight: 800 }}>
                <span style={{ color: '#8B5A2B' }}>Total esperado (activos)</span>
                <strong style={{ color: '#8B5A2B' }}>S/ {pendientesHoy.reduce((a, p) => a + p.total, 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 3: Gráficos auxiliares y Rankings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Pedidos por Estado */}
          <div className="chart-card" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>
              <BarChart3 size={18} style={{ color: 'var(--success)' }} />
              Pedidos por Estado
            </h3>
            <BarChart data={getOrdersByStatus(pedidos)} />
          </div>

          {/* Ventas por Categoría */}
          <div className="rep-sec" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: 'var(--primary)' }} />
              Ventas por Categoría
            </h3>
            <div style={{ marginTop: '12px' }}>
              <DonutChart data={getSalesByCategory(masVendidos)} prefix="S/ " />
            </div>
          </div>

          {/* Top 5 Más Vendidos */}
          <div className="rep-sec" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              Top 5 Más Vendidos
            </h3>
            {!masVendidos.length ? (
              <div className="empty-state" style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No hay ventas aún.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {masVendidos.slice(0, 5).map((mv, i) => {
                  const maxCant = masVendidos[0].cantidad;
                  const pct = Math.round((mv.cantidad / maxCant) * 100);
                  return (
                    <div key={i} style={{ padding: '10px 12px', background: '#FAF6F0', border: '1px solid #EFE7E0', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', color: 'var(--text)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontWeight: 900 }}>#{i + 1}</span>
                          {mv.nombre}
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '12px' }}>
                          {mv.cantidad} uds · S/ {mv.ingresos.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ background: '#EFE7E0', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
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

        {/* Fila 4: Pedidos activos a ancho completo */}
        <div className="panel-section" style={{ borderRadius: '4px', border: '1px solid #EFE7E0', background: '#FFF', padding: '20px', width: '100%' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>Pedidos activos ({activos})</h3>
          {activos === 0 ? (
            <div className="empty-state" style={{ padding: '32px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No hay pedidos activos en este momento.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: '1px solid #EFE7E0', borderRadius: '4px', width: '100%' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: 'var(--primary-dark)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', borderTopLeftRadius: '4px' }}>ID Pedido</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px' }}>Estudiante</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px' }}>Total</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', borderTopRightRadius: '4px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {activosList.map(p => (
                    <tr key={p.id}>
                      <td style={{ padding: '12px 16px' }}><strong>{p.id}</strong></td>
                      <td style={{ padding: '12px 16px' }}>{p.nombreEstudiante}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>S/ {p.total.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}><span className={`badge ${getBadgeClass(p.estado)}`} style={{ borderRadius: '3px', fontSize: '10px' }}>{p.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
