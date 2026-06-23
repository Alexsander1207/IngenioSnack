import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, Archive, ClipboardList, UserCircle, Menu as MenuIcon, Gift, Star, RefreshCw, BarChart3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Panel from './admin/Panel';
import Productos from './admin/Productos';
import Pedidos from './admin/Pedidos';
import Promociones from './admin/Promociones';
import Fidelidad from './admin/Fidelidad';
import Movimientos from './admin/Movimientos';
import Reporte from './admin/Reporte';

export default function AdminPortal() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'panel', path: '/admin/panel', icon: LayoutDashboard, label: 'Panel Principal', shortLabel: 'Panel' },
    { id: 'productos', path: '/admin/productos', icon: Package, label: 'Productos (Menú)', shortLabel: 'Menú' },
    { id: 'movimientos', path: '/admin/movimientos', icon: RefreshCw, label: 'Kardex / Movimientos', shortLabel: 'Kardex' },
    { id: 'pedidos', path: '/admin/pedidos', icon: ClipboardList, label: 'Gestión Pedidos', shortLabel: 'Pedidos' },
    { id: 'promociones', path: '/admin/promociones', icon: Gift, label: 'Promociones', shortLabel: 'Combos' },
    { id: 'fidelidad', path: '/admin/fidelidad', icon: Star, label: 'Fidelidad y Premios', shortLabel: 'Premios' },
    { id: 'reporte', path: '/admin/reporte', icon: BarChart3, label: 'Informe Económico', shortLabel: 'Reporte' },
  ];

  return (
    <div id="page-admin" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <nav id="sidebar-adm" className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><LayoutDashboard /> Portal Admin</div>
          <div id="adm-user-info">
            <div className="user-avatar"><UserCircle /></div>
            <div className="user-name">{user?.nombre}</div>
            <div className="user-code">Vendedor / Admin</div>
          </div>
        </div>
        <ul className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname.includes(item.id);
            return (
              <li key={item.id}>
                <a className={`nav-link ${active ? 'active' : ''}`} onClick={() => { setSidebarOpen(false); navigate(item.path); }}>
                  <Icon /> {item.label}
                </a>
              </li>
            );
          })}
        </ul>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut /> Cerrar sesión
          </button>
        </div>
      </nav>
 
      <div className="portal-main">
        <header className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <MenuIcon size={24} />
          </button>
          <span className="mobile-title">Portal Admin</span>
          <button className="mobile-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </header>
 
        <Routes>
          <Route path="panel" element={<Panel />} />
          <Route path="productos" element={<Productos />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="promociones" element={<Promociones />} />
          <Route path="fidelidad" element={<Fidelidad />} />
          <Route path="reporte" element={<Reporte />} />
          <Route path="*" element={<Navigate to="panel" />} />
        </Routes>
      </div>

      {/* Barra de navegación inferior para dispositivos móviles */}
      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname.includes(item.id);
          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon size={20} />
              </div>
              <span className="bottom-nav-label">{item.shortLabel || item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
