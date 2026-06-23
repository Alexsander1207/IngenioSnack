import { useState, useEffect } from 'react';
import { Award, Plus, Trophy, Check } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function Fidelidad() {
  const [ranking, setRanking] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nombre, setNombre] = useState('');
  const [productoCriterioId, setProductoCriterioId] = useState('');
  const [cantidadCriterio, setCantidadCriterio] = useState('');
  const [productoPremioId, setProductoPremioId] = useState('');

  const { toast } = useToast();

  const loadData = () => {
    Promise.all([
      fetch('/api/fidelidad/ranking').then(r => r.json()),
      fetch('/api/fidelidad/reglas').then(r => r.json()),
      fetch('/api/productos').then(r => r.json())
    ])
      .then(([rankData, reglasData, prodData]) => {
        setRanking(rankData);
        setReglas(reglasData);
        setProductos(prodData);
        
        if (prodData.length > 0) {
          setProductoCriterioId(prodData[0].id);
          setProductoPremioId(prodData[0].id);
        }
        
        setLoading(false);
      })
      .catch(() => {
        toast('Error al cargar datos de fidelidad', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRegla = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !productoCriterioId || !cantidadCriterio || !productoPremioId) {
      toast('Por favor completa todos los campos', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/fidelidad/reglas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          productoCriterioId,
          cantidadCriterio: parseInt(cantidadCriterio, 10),
          productoPremioId
        })
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
        return;
      }
      toast('Regla de fidelidad configurada correctamente', 'success');
      setNombre('');
      setCantidadCriterio('');
      loadData();
    } catch (err) {
      toast('Error al crear regla', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando...</p></div>;

  return (
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ marginBottom: '24px' }}>
        <h2>Fidelidad y Premiación Especial</h2>
        <p className="screen-sub">Configura reglas dinámicas y visualiza los estudiantes más leales</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Columna Izquierda: Configuración de Premios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Formulario Regla de Fidelidad */}
          <div className="add-form" style={{
            margin: 0,
            background: '#FFFDFB',
            border: '1.5px solid #E6D4C3',
            borderRadius: '4px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(45, 26, 14, 0.03)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#4A2E1B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: 'var(--primary)' }} /> Nueva Regla de Fidelidad
            </h3>
            <p style={{ fontSize: '12px', color: '#8A6A55', marginBottom: '16px', borderBottom: '1px solid #E6D4C3', paddingBottom: '8px' }}>
              Ejemplo: Por cada 10 compras de "Café Americano", el estudiante recibe 1 "Jugo de Naranja" de regalo.
            </p>
            <form onSubmit={handleCreateRegla}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Nombre de la regla</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Promo Café Recurrente, Club del Triple..."
                  style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Producto a comprar</label>
                  <select value={productoCriterioId} onChange={e => setProductoCriterioId(e.target.value)} style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Cant. necesaria</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadCriterio}
                    onChange={e => setCantidadCriterio(e.target.value)}
                    placeholder="Ej: 10"
                    style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ color: '#6D4C35', fontWeight: 700, fontSize: '12px', marginBottom: '6px', display: 'block' }}>Producto de Regalo (Premio)</label>
                <select value={productoPremioId} onChange={e => setProductoPremioId(e.target.value)} style={{ borderRadius: '4px', border: '1px solid #D2B48C', padding: '10px 12px', fontSize: '13px', background: '#FFF', width: '100%' }}>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: '4px', padding: '10px 0' }}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Guardar Regla
              </button>
            </form>
          </div>

          {/* Reglas Activas */}
          <div className="rep-sec" style={{
            margin: 0,
            background: '#FFF',
            border: '1px solid #EFE7E0',
            borderRadius: '4px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid #EFE7E0', paddingBottom: '8px', marginBottom: '16px' }}>Reglas de Fidelidad Activas</h3>
            {reglas.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 10px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No hay reglas dinámicas configuradas actualmente.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reglas.map(r => {
                  const prodCriterio = productos.find(p => p.id === r.producto_criterio_id);
                  const prodPremio = productos.find(p => p.id === r.producto_premio_id);
                  return (
                    <div
                      key={r.id}
                      style={{
                        padding: '12px 14px',
                        background: '#FFFDFB',
                        border: '1.5px solid #E6D4C3',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '4px' }}>{r.nombre}</strong>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Compra <span style={{ fontWeight: 800, color: 'var(--text)' }}>{r.cantidad_criterio}</span> de "{prodCriterio?.nombre || 'Producto'}" y obtén gratis 1 "{prodPremio?.nombre || 'Premio'}".
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Ranking de Estudiantes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="rep-sec" style={{
            margin: 0,
            background: '#FFF',
            border: '1px solid #EFE7E0',
            borderRadius: '4px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid #EFE7E0', paddingBottom: '8px', marginBottom: '16px' }}>
              <Trophy size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: '#D97706' }} />
              Ranking de Estudiantes más Fieles
            </h3>
            {ranking.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 10px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No hay estudiantes registrados aún.</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ border: '1px solid #EFE7E0', borderRadius: '4px', overflow: 'hidden' }}>
                <table className="data-table" style={{ fontSize: '13px', width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'var(--primary-dark)' }}>
                      <th style={{ padding: '12px 14px' }}>Puesto</th>
                      <th style={{ padding: '12px 14px' }}>Estudiante</th>
                      <th style={{ padding: '12px 14px' }}>Código</th>
                      <th style={{ padding: '12px 14px' }}>Puntos</th>
                      <th style={{ padding: '12px 14px' }}>Sándwiches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((est, idx) => (
                      <tr key={est.id} style={{ background: idx === 0 ? 'rgba(217, 119, 6, 0.04)' : '' }}>
                        <td style={{ padding: '12px 14px' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <strong>{est.nombre}</strong>
                        </td>
                        <td style={{ padding: '12px 14px' }}><code>{est.codigo}</code></td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{est.puntos} pts</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{est.sandwiches} uds</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
