import { apiFetch } from '../../services/apiClient';
import { useState, useEffect } from 'react';
import { User, Mail, Star, Coffee, Gift, CheckCircle, Circle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = () => {
    Promise.all([
      apiFetch('/api/auth/me').then(r => r.ok ? r.json() : null).catch(() => null),
      apiFetch('/api/fidelidad/me').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([profile, fidelidad]) => {
        const beneficios = fidelidad?.beneficios || fidelidad || {};
        setData({
          ...(profile || user || {}),
          beneficios: {
            puntos: beneficios.puntos || 0,
            sellos: beneficios.sellos || 0,
            sandwiches: beneficios.sandwiches || 0,
            cafesGratis: beneficios.cafesGratis || beneficios.cafes_gratis || 0,
            sellosObjetivo: beneficios.sellosObjetivo || beneficios.sellos_objetivo || 10,
            puntosPorSol: beneficios.puntosPorSol || beneficios.puntos_por_sol || 1,
            sellosPorPedido: beneficios.sellosPorPedido || beneficios.sellos_por_pedido || 1,
            premiosDinamicos: Array.isArray(beneficios.premiosDinamicos) ? beneficios.premiosDinamicos : [],
          },
        });
        setLoading(false);
      })
      .catch(() => { toast('Error al cargar perfil', 'error'); setLoading(false); });
  };

  useEffect(() => { fetchProfile(); }, [user.id]);

  const canjearCafe = async () => {
    try {
      const res = await apiFetch(`/api/estudiante/${user.id}/canjear-cafe`, { method: 'POST' });
      const d = await res.json();
      if (d.error) { toast(d.error, 'error'); return; }
      toast('☕ ¡Café canjeado! Disfrútalo.', 'success');
      fetchProfile();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  const canjearPremioDinamico = async (progresoId, premioNombre) => {
    try {
      const res = await apiFetch(`/api/fidelidad/canjear-premio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudianteId: user.id, progresoId })
      });
      const d = await res.json();
      if (d.error) { toast(d.error, 'error'); return; }
      toast(`🎁 ¡Felicidades! Reclamaste tu ${premioNombre} gratis.`, 'success');
      fetchProfile();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando perfil...</p></div>;
  if (!data) return <div className="screen"><p className="error-msg">Error al cargar datos.</p></div>;

  const b = data.beneficios;
  const sellosObjetivo = Math.max(Number(b.sellosObjetivo || 10), 1);
  const sellosEnCiclo = b.sellos % sellosObjetivo;
  const tarjetaCompleta = b.sellos > 0 && sellosEnCiclo === 0;
  const sellosVisuales = tarjetaCompleta ? sellosObjetivo : sellosEnCiclo;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Mi Perfil</h2>
      </div>
      <div className="profile-grid">
        {/* Tarjeta de datos personales */}
        <div className="profile-card">
          <div className="pa"><User /></div>
          <h3>{data.nombre}</h3>
          {data.codigo && <p className="pd"><User size={14} /> {data.codigo}</p>}
          {data.correo && <p className="pd"><Mail size={14} /> {data.correo}</p>}
          
          <button 
            className="btn btn-outline btn-logout-profile" 
            style={{ marginTop: '20px', width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }} 
            onClick={handleLogout}
          >
            <LogOut size={14} style={{ marginRight: '6px' }} /> Cerrar sesión
          </button>
        </div>

        {/* Tarjeta de fidelidad */}
        <div className="fid-card">
          <h3><Star style={{ marginRight: '8px' }} />Programa de fidelidad</h3>

          {/* Puntos */}
          <div className="fid-item">
            <div className="fid-lbl">Puntos acumulados</div>
            <div className="fid-val">{b.puntos} <span style={{ fontSize: '18px', fontWeight: 600 }}>pts</span></div>
            <div className="fid-note">{b.puntosPorSol} punto(s) por cada S/ 1.00 en pedidos recogidos</div>
          </div>

          {/* Tarjeta de 10 sellos visual */}
          <div className="fid-item">
            <div className="fid-lbl" style={{ marginBottom: '12px' }}>
              <Coffee size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Tarjeta café gratis — {sellosVisuales}/{sellosObjetivo} sellos
            </div>

            {/* Grid de 10 sellos */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px',
              background: tarjetaCompleta ? 'linear-gradient(135deg, #B7791F, #F6D365)' : 'linear-gradient(135deg, #2D1A0E, #4A2A1A)',
              borderRadius: '12px', padding: '16px', marginBottom: '10px'
            }}>
              {Array.from({ length: sellosObjetivo }, (_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: i < sellosVisuales ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${i < sellosVisuales ? '#FFF8DC' : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', transition: 'all 0.2s'
                  }}>
                    {i < sellosVisuales ? <CheckCircle size={18} style={{ color: '#FFF8DC' }} /> : <Circle size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  </div>
                  <span style={{ fontSize: '10px', color: i < sellosVisuales ? '#FFF8DC' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="fid-note">
              {!tarjetaCompleta
                ? `Te faltan ${sellosObjetivo - sellosVisuales} sello(s) para ganar un café gratis`
                : '¡Completa! Puedes canjear tu café.'
              }
            </div>
          </div>

          {/* Cafés disponibles */}
          <div className="fid-item">
            <div className="fid-lbl">
              <Gift size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Cafés gratis disponibles
            </div>
            <div className="fid-val gold" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {b.cafesGratis}
              {b.cafesGratis > 0 && <Coffee size={28} style={{ color: '#C05E00' }} />}
            </div>
            {b.cafesGratis > 0 ? (
              <button
                className="btn btn-secondary"
                style={{ marginTop: '12px', width: '100%' }}
                onClick={canjearCafe}
              >
                <Coffee style={{ marginRight: '8px' }} /> Canjear café gratis
              </button>
            ) : (
              <div className="fid-note" style={{ marginTop: '6px' }}>
                Completa tu tarjeta de {sellosObjetivo} sellos para ganar uno.
              </div>
            )}
          </div>

          {/* Premios Dinámicos Especiales */}
          {b.premiosDinamicos && b.premiosDinamicos.length > 0 && (
            <div className="fid-item" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
              <div className="fid-lbl" style={{ marginBottom: '12px' }}>
                <Star size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#D97706' }} />
                Premios y Promociones Especiales
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {b.premiosDinamicos.map(premio => {
                  const pct = Math.min(100, Math.round((premio.cantidadAcumulada / premio.cantidadCriterio) * 100));
                  return (
                    <div key={premio.id} style={{ background: 'var(--bg)', borderRadius: '12px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 800 }}>{premio.reglaNombre}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {premio.cantidadAcumulada} / {premio.cantidadCriterio}
                        </span>
                      </div>
                      
                      {/* Barra de progreso */}
                      <div style={{ background: 'var(--border)', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', transition: 'width 0.3s' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Obtén 1 {premio.productoPremio} de regalo</span>
                        {premio.premiosDisponibles > 0 ? (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '10px', padding: '4px 10px', height: 'auto', background: 'var(--success)' }}
                            onClick={() => canjearPremioDinamico(premio.id, premio.productoPremio)}
                          >
                            Reclamar {premio.premiosDisponibles} premio(s)!
                          </button>
                        ) : (
                          <span>Falta {premio.cantidadCriterio - premio.cantidadAcumulada} para ganar</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
