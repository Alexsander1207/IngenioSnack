import { useEffect, useState } from 'react';
import { Mail, ShieldAlert, Star, UserRound } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { useToast } from '../../components/Toast';

const estadoClass = {
  buena: 'cliente-card buena',
  media: 'cliente-card media',
  mala: 'cliente-card mala',
  baneado: 'cliente-card baneado',
};

const estadoLabel = {
  buena: 'Buena conducta',
  media: 'Conducta media',
  mala: 'Mala conducta',
  baneado: 'Baneado temporalmente',
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadClientes = () => {
    apiFetch('/api/clientes/estudiantes')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setClientes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        toast('Error al cargar clientes', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadClientes();
    const interval = setInterval(loadClientes, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="screen"><p className="loading">Cargando clientes...</p></div>;

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Clientes / Estudiantes</h2>
        <p className="screen-sub">Historial operativo para decidir atencion y seguimiento.</p>
      </div>

      <div className="clientes-grid">
        {clientes.map(cliente => (
          <article key={cliente.id} className={estadoClass[cliente.estado_conducta] || 'cliente-card'}>
            <div className="cliente-card-head">
              <div className="cliente-avatar"><UserRound size={20} /></div>
              <div>
                <h3>{cliente.nombre}</h3>
                <p><Mail size={13} /> {cliente.correo}</p>
              </div>
            </div>
            <div className="cliente-status">
              <span>{estadoLabel[cliente.estado_conducta] || cliente.estado_conducta}</span>
              <strong>{cliente.conducta_score}/100</strong>
            </div>
            {cliente.estado_conducta === 'baneado' && (
              <div className="cliente-ban">
                <ShieldAlert size={14} />
                {cliente.ban_reason || 'Bloqueo temporal activo'}
              </div>
            )}
            <div className="cliente-metrics">
              <div><span>Pedidos</span><strong>{cliente.pedidos_realizados}</strong></div>
              <div><span>No recogidos</span><strong>{cliente.pedidos_no_recogidos}</strong></div>
              <div><span>Puntos</span><strong>{cliente.puntos}</strong></div>
              <div><span>Sellos</span><strong>{cliente.sellos}</strong></div>
            </div>
            <div className="cliente-foot">
              <Star size={14} />
              {cliente.codigo_estudiante || 'Sin codigo'}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
