import { useState } from 'react';
import { Coffee, GraduationCap, Clock, Award, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false); // register vs login
  
  // Form fields
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const { login } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!correo.trim() || !password) {
      toast('Correo y contraseña son requeridos.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim(), password })
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
        return;
      }
      if (data.ok) {
        if (data.admin) {
          toast('Acceso concedido al panel administrativo.', 'success');
          login({ ...data.admin, rol: 'vendedor' });
          navigate('/admin/panel');
        } else if (data.estudiante) {
          toast(`¡Bienvenido de vuelta, ${data.estudiante.nombre}!`, 'success');
          login({ ...data.estudiante, rol: 'estudiante' });
          navigate('/estudiante/menu');
        }
      }
    } catch (err) {
      toast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !password || !confirmPassword) {
      toast('Todos los campos son requeridos.', 'warning');
      return;
    }
    const correoNormalizado = correo.trim().toLowerCase();
    if (!correoNormalizado.endsWith('@uncp.edu.pe')) {
      toast('El correo debe ser institucional (@uncp.edu.pe).', 'error');
      return;
    }
    if (password.length < 8) {
      toast('La contraseña debe tener al menos 8 caracteres.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      toast('Las contraseñas no coinciden.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correoNormalizado,
          password,
          confirmPassword
        })
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
        return;
      }
      if (data.ok) {
        toast('¡Registro exitoso! Iniciando sesión...', 'success');
        login({ ...data.estudiante, rol: 'estudiante' });
        navigate('/estudiante/menu');
      }
    } catch (err) {
      toast('Error al registrar usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="page-login">
      {/* ── SECCIÓN IZQUIERDA: INFORMACIÓN Y MARKETING ── */}
      <div className="login-info-panel">
        <div className="blob-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div className="login-info-content" style={{ position: 'relative', zIndex: 2 }}>
          <h2>
            Pide antes de llegar.<br />
            Evita filas con <span>IngenioSnack</span>.
          </h2>
          <p className="lead">
            El sistema de pedidos anticipados diseñado exclusivamente para estudiantes universitarios. Optimiza tu tiempo y disfruta de tus snacks favoritos al instante.
          </p>

          <div className="info-features">
            <div className="info-feature-item">
              <div className="feature-icon-wrap">
                <Clock size={20} />
              </div>
              <div className="feature-text">
                <h4>Ahorra tiempo valioso</h4>
                <p>Haz tu pedido desde el salón de clases y simplemente recógelo cuando esté listo.</p>
              </div>
            </div>

            <div className="info-feature-item">
              <div className="feature-icon-wrap">
                <Award size={20} />
              </div>
              <div className="feature-text">
                <h4>Programa de Fidelidad</h4>
                <p>Acumula puntos con cada compra. ¡Consigue 10 sandwiches y obtén un café gratis!</p>
              </div>
            </div>

            <div className="info-feature-item">
              <div className="feature-icon-wrap">
                <Sparkles size={20} />
              </div>
              <div className="feature-text">
                <h4>Gestión en tiempo real</h4>
                <p>Entérate al instante sobre la disponibilidad de productos en el menú de la cafetería.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN DERECHA: FORMULARIOS DE AUTENTICACIÓN ── */}
      <div className="login-form-panel">
        <div className="glowing-bg-circle circle-1"></div>
        <div className="glowing-bg-circle circle-2"></div>
        
        <div className="login-box">
          <div className="login-header">
            <div className="login-logo">
              <Coffee size={40} />
            </div>
            <h1>IngenioSnack</h1>
            <p>Sistema de Pedidos Anticipados</p>
          </div>

          <div className="auth-form-animated">
            {!isRegistering ? (
              /* INICIAR SESIÓN UNIFICADO */
              <form id="form-login-est" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Correo de Usuario / Institucional</label>
                  <input 
                    type="email" 
                    value={correo} 
                    onChange={e => setCorreo(e.target.value)} 
                    placeholder="usuario@uncp.edu.pe" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required
                  />
                </div>
                
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '8px' }} disabled={loading}>
                  <GraduationCap style={{ marginRight: '8px' }} /> 
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>

                <div className="toggle-auth-link">
                  ¿No estás registrado? 
                  <span onClick={() => {
                    setIsRegistering(true);
                    setCorreo('');
                    setPassword('');
                  }}>
                    Regístrate aquí
                  </span>
                </div>
              </form>
            ) : (
              /* REGISTRAR ESTUDIANTE */
              <form id="form-register-est" onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input 
                    type="text" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    placeholder="Tus nombres y apellidos" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo Institucional</label>
                  <input 
                    type="email" 
                    value={correo} 
                    onChange={e => setCorreo(e.target.value)} 
                    placeholder="codigo@uncp.edu.pe" 
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Mín. 8 carac." 
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Confirmar" 
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn btn-secondary btn-full" style={{ marginTop: '8px' }} disabled={loading}>
                  <ShieldCheck style={{ marginRight: '8px' }} /> 
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>

                <div className="toggle-auth-link">
                  ¿Ya tienes cuenta? 
                  <span onClick={() => {
                    setIsRegistering(false);
                    setCorreo('');
                    setPassword('');
                    setConfirmPassword('');
                  }}>
                    Inicia sesión aquí
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
