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
    fetch(`/api/estudiante/${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) toast(d.error, 'error');
        else setData(d);
        setLoading(false);
      })
      .catch(() => { toast('Error al cargar perfil', 'error'); setLoading(false); });
  };

  useEffect(() => { fetchProfile(); }, [user.id]);

  const canjearCafe = async () => {
    try {
      const res = await fetch(`/api/estudiante/${user.id}/canjear-cafe`, { method: 'POST' });
      const d = await res.json();
      if (d.error) { toast(d.error, 'error'); return; }
      toast('☕ ¡Café canjeado! Disfrútalo.', 'success');
      fetchProfile();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando perfil...</p></div>;
  if (!data) return <div className="screen"><p className="error-msg">Error al cargar datos.</p></div>;

  const b = data.beneficios;
  const sandwichesEnCiclo = b.sandwiches % 10;

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
            <div className="fid-note">1 punto por cada S/ 1.00 gastado en pedidos entregados</div>
          </div>

          {/* Tarjeta de 10 sellos visual */}
          <div className="fid-item">
            <div className="fid-lbl" style={{ marginBottom: '12px' }}>
              <Coffee size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Tarjeta café gratis — {sandwichesEnCiclo}/10 sandwiches
            </div>

            {/* Grid de 10 sellos */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px',
              background: 'linear-gradient(135deg, #2D1A0E, #4A2A1A)',
              borderRadius: '12px', padding: '16px', marginBottom: '10px'
            }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: i < sandwichesEnCiclo ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${i < sandwichesEnCiclo ? '#F5E6D3' : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', transition: 'all 0.2s'
                  }}>
                    {i < sandwichesEnCiclo ? '🥪' : <Circle size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  </div>
                  <span style={{ fontSize: '10px', color: i < sandwichesEnCiclo ? '#F5E6D3' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="fid-note">
              {sandwichesEnCiclo < 10
                ? `Te faltan ${10 - sandwichesEnCiclo} sandwich(es) más para ganar un café gratis ☕`
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
                Completa tu tarjeta de 10 sellos para ganar uno.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
