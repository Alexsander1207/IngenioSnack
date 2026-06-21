import { createContext, useContext, useState, useEffect } from 'react';

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
    setUser(null);
    setCart([]);
    setConfirmedOrder(null);
  };

  const addToCart = (producto) => {
    setCart(prev => {
      const ex = prev.find(c => c.producto.id === producto.id);
      if (ex) {
        return prev.map(c => c.producto.id === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const changeQty = (productoId, delta) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.producto.id === productoId) {
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
