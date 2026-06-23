import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearToken, apiFetch } from '../services/apiClient';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ingeniosnack_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('ingeniosnack_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [puntosSaldo, setPuntosSaldo] = useState(0);

  const refreshPuntos = useCallback(async () => {
    if (!user) { setPuntosSaldo(0); return; }
    try {
      const res = await apiFetch('/api/fidelidad/me');
      if (res.ok) {
        const data = await res.json();
        setPuntosSaldo(data.puntos ?? 0);
      }
    } catch {
      // silently ignore — puntos display is non-critical
    }
  }, [user]);

  useEffect(() => {
    if (user) localStorage.setItem('ingeniosnack_user', JSON.stringify(user));
    else { localStorage.removeItem('ingeniosnack_user'); setPuntosSaldo(0); }
  }, [user]);

  useEffect(() => {
    if (user) refreshPuntos();
  }, [user, refreshPuntos]);

  useEffect(() => {
    localStorage.setItem('ingeniosnack_cart', JSON.stringify(cart));
  }, [cart]);

  const login = (userData) => setUser(userData);
  const logout = () => {
    clearToken();
    setUser(null);
    setCart([]);
    setConfirmedOrder(null);
    setPuntosSaldo(0);
  };

  const addToCart = (item, tipo = 'producto') => {
    setCart(prev => {
      const itemId = tipo === 'promocion' ? `promo_${item.id}` : item.id;
      const ex = prev.find(c => c.itemId === itemId);
      if (ex) {
        return prev.map(c => c.itemId === itemId ? { ...c, cantidad: c.cantidad + 1 } : c);
      }
      if (tipo === 'promocion') {
        return [...prev, { itemId, tipo: 'promocion', promocion: item, cantidad: 1 }];
      }
      return [...prev, { itemId, tipo: 'producto', producto: item, cantidad: 1 }];
    });
  };

  const changeQty = (itemId, delta) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.itemId === itemId) {
          return { ...c, cantidad: c.cantidad + delta };
        }
        // Legacy support: match by producto.id for items without itemId
        if (!c.itemId && c.producto && c.producto.id === itemId) {
          return { ...c, cantidad: c.cantidad + delta };
        }
        return c;
      }).filter(c => c.cantidad > 0);
    });
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      cart, addToCart, changeQty, clearCart,
      confirmedOrder, setConfirmedOrder,
      puntosSaldo, refreshPuntos,
    }}>
      {children}
    </AppContext.Provider>
  );
};
