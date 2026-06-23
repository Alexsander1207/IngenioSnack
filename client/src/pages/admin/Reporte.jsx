import { apiFetch } from '../../services/apiClient';
import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Package, BarChart3, AlertCircle, Calendar, PieChart, Percent } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { LineChart, DonutChart, BarChart } from '../../components/Charts';

export default function Reporte() {
  const [data, setData] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      apiFetch('/api/reporte').then(r => r.json()),
      apiFetch('/api/pedidos').then(r => r.json()),
    ])
      .then(([reporteData, pedidosData]) => {
        setData(reporteData ?? {});
        setPedidos(Array.isArray(pedidosData) ? pedidosData.map(p => ({
          ...p,
          estado: p.estado === 'PREPARANDO' ? 'EN_PREPARACION' : p.estado,
          fecha: p.fecha || p.created_at,
          total: Number(p.total || 0),
        })) : []);
        setLoading(false);
      })
      .catch(() => {
        toast('Error al cargar reporte económico', 'error');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="screen">
        <p className="loading">Cargando reporte económico...</p>
      </div>
    );
  }

  const { estadisticas: s = {}, masVendidos = [] } = data ?? {};

  // Cálculos de KPIs Recomendados
  const totalPedidos = pedidos.length;
  const pedidosRecogidos = pedidos.filter(p => p.estado === 'RECOGIDO');
  const pedidosCancelados = pedidos.filter(p => p.estado === 'CANCELADO');

  // Ingresos totales basados en recogidos
  const ingresosRecogidos = pedidosRecogidos.reduce((acc, p) => acc + p.total, 0);

  // KPI 1: Ticket Medio (Ingresos Totales / Pedidos Recogidos)
  const ticketMedio = pedidosRecogidos.length > 0 ? ingresosRecogidos / pedidosRecogidos.length : 0;

  // KPI 2: Tasa de Cancelación (Pedidos Cancelados / Pedidos Totales)
  const tasaCancelacion = totalPedidos > 0 ? (pedidosCancelados.length / totalPedidos) * 100 : 0;

  // Caja del día (Pedidos entregados/recogidos hoy)
  const hoy = new Date().toDateString();
  const entregadosHoy = pedidos.filter(p =>
    p.estado === 'RECOGIDO' && new Date(p.fecha).toDateString() === hoy
  );
  const cajaHoy = entregadosHoy.reduce((acc, p) => acc + p.total, 0);

  const pendientesHoy = pedidos.filter(p =>
    ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO'].includes(p.estado) &&
    new Date(p.fecha).toDateString() === hoy
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
      'Sandwiches': 'var(--primary)',
      'Bebidas': 'var(--secondary)',
      'Snacks': 'var(--orange)',
      'Combos': 'var(--success)',
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
    { label: 'Ingresos Totales (Recogidos)', value: `S/ ${ingresosRecogidos.toFixed(2)}`, icon: DollarSign, color: 'c-success' },
    { label: 'Ticket Medio (KPI)', value: `S/ ${ticketMedio.toFixed(2)}`, icon: TrendingUp, color: 'c-primary' },
    { label: 'Tasa Cancelación (KPI)', value: `${tasaCancelacion.toFixed(1)}%`, icon: Percent, color: 'c-warning' },
    { label: 'Pedidos Totales', value: totalPedidos, icon: ShoppingBag, color: 'c-info' },
    { label: 'Estudiantes Activos', value: s.estudiantesRegistrados, icon: Users, color: 'c-orange' },
    { label: 'Productos en Menú', value: s.totalProductos, icon: Package, color: 'c-neutral' },
  ];

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Informe Económico</h2>
        <p className="screen-sub">Control de ventas, rentabilidad y KPIs financieros de IngenioSnack</p>
      </div>

      {/* Tarjetas de Estadísticas Principales */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`stat-card ${c.color}`} style={{ borderRadius: '4px' }}>
              <div className="si" style={{ color: 'var(--text)' }}><Icon size={20} /></div>
              <div className="sv" style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0' }}>{c.value}</div>
              <div className="sl" style={{ textTransform: 'uppercase', fontSize: '10px', tracking: '0.5px', color: 'var(--text-muted)' }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Fila de gráficos principales */}
      <div className="charts-section-grid" style={{ gap: '24px', marginBottom: '24px' }}>
        <div className="chart-card" style={{ borderRadius: '4px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
            Tendencia de Ventas (Últimos 7 días)
          </h3>
          <LineChart data={getLast7DaysSales(pedidos)} prefix="S/ " />
        </div>
        <div className="chart-card" style={{ borderRadius: '4px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={16} style={{ color: 'var(--secondary)' }} />
            Estructura de Pedidos por Estado
          </h3>
          <BarChart data={getOrdersByStatus(pedidos)} />
        </div>
      </div>

      <div className="rep-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Caja del día */}
        <div className="rep-sec" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} /> Caja Diaria
          </h3>
          <div style={{
            background: 'var(--primary)',
            borderRadius: '4px',
            padding: '24px 16px',
            color: 'var(--surface)',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Cobrado Hoy
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900 }}>S/ {cajaHoy.toFixed(2)}</div>
            <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '6px' }}>
              {entregadosHoy.length} pedidos entregados
            </div>
          </div>
          <div className="stats-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span>Pendientes activos hoy</span>
              <strong style={{ fontWeight: 800 }}>{pendientesHoy.length}</strong>
            </div>
            <div className="stat-row hl" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
              <span>Ingresos en espera</span>
              <strong>S/ {pendientesHoy.reduce((a, p) => a + p.total, 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Rendimiento de Productos & Distribución */}
        <div className="rep-sec" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieChart size={16} style={{ color: 'var(--secondary)' }} /> Desglose de Ventas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Categorías */}
            <div>
              <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                Ventas por Categoría
              </h4>
              <DonutChart data={getSalesByCategory(masVendidos)} prefix="S/ " />
            </div>

            {/* Top Ventas */}
            <div>
              <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                Top 5 Más Vendidos
              </h4>
              {!masVendidos.length ? (
                <div className="empty-state" style={{ padding: '24px 10px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No hay ventas registradas aún.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {masVendidos.slice(0, 5).map((mv, i) => {
                    const maxCant = masVendidos[0].cantidad;
                    const pct = Math.round((mv.cantidad / maxCant) * 100);
                    return (
                      <div key={i} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontWeight: 800 }}>#{i + 1}</span>
                            {mv.nombre}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '11px' }}>
                            {mv.cantidad} uds · S/ {mv.ingresos.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ background: 'var(--border)', height: '4px', overflow: 'hidden', borderRadius: '2px' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--primary)',
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
