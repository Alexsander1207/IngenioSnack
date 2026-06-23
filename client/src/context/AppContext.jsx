import { createContext, useContext, useState, useEffect } from 'react';
import { clearToken } from '../services/apiClient';

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

  useEffect(() => {
    if (user) localStorage.setItem('ingeniosnack_user', JSON.stringify(user));
    else localStorage.removeItem('ingeniosnack_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ingeniosnack_cart', JSON.stringify(cart));
  }, [cart]);

  const login = (userData) => setUser(userData);
  const logout = () => {
    clearToken();
    setUser(null);
    setCart([]);
    setConfirmedOrder(null);
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
      confirmedOrder, setConfirmedOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};
