import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Coffee, BookOpen, ShoppingCart, ClipboardList, UserCircle, Menu as MenuIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Menu from './student/Menu';
import Cart from './student/Cart';
import MyOrders from './student/MyOrders';
import Profile from './student/Profile';

export default function StudentPortal() {
  const { user, logout, cart } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'menu', path: '/estudiante/menu', icon: BookOpen, label: 'Menú' },
    { id: 'cart', path: '/estudiante/cart', icon: ShoppingCart, label: 'Mi Pedido' },
    { id: 'myorders', path: '/estudiante/myorders', icon: ClipboardList, label: 'Mis Pedidos' },
    { id: 'profile', path: '/estudiante/profile', icon: UserCircle, label: 'Mi Perfil' },
  ];

  const totalItems = cart.reduce((acc, c) => acc + c.cantidad, 0);

  return (
    <div id="page-est" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <nav id="sidebar-est" className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><Coffee /> IngenioSnack</div>
          <div id="est-user-info">
            <div className="user-avatar"><UserCircle /></div>
            <div className="user-name">{user?.nombre}</div>
            <div className="user-code">{user?.codigo || user?.correo}</div>
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
                  {item.id === 'cart' && totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
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
          <span className="mobile-title">IngenioSnack</span>
        </header>

        <Routes>
          <Route path="menu" element={<Menu />} />
          <Route path="cart" element={<Cart />} />
          <Route path="myorders" element={<MyOrders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="menu" />} />
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
                {item.id === 'cart' && totalItems > 0 && (
                  <span className="bottom-cart-badge">{totalItems}</span>
                )}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
