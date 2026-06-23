import { apiFetch } from '../../services/apiClient';
import { useState } from 'react';
import { ShoppingBasket, Wallet, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';

export default function Cart() {
  const { cart, changeQty, user, setConfirmedOrder, clearCart } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, c) => {
    if (c.tipo === 'promocion') return acc + (c.promocion.precio * c.cantidad);
    const precio = c.producto?.precio || 0;
    return acc + (precio * c.cantidad);
  }, 0);

  const confirmOrder = async () => {
    if (!cart.length) { toast('El carrito está vacío', 'warning'); return; }
    setLoading(true);
    try {
      const lineas = cart.map(c => {
        if (c.tipo === 'promocion') {
          return { promocionId: c.promocion.id, cantidad: c.cantidad };
        }
        return { productoId: c.producto.id, cantidad: c.cantidad };
      });
      const res = await apiFetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudianteId: user.id, lineas })
      });
      const created = await res.json();
      if (created.error) { toast('Error: ' + created.error, 'error'); setLoading(false); return; }
      
      setConfirmedOrder(created);
      clearCart();
      toast('¡Pedido confirmado! Ve a recogerlo a la cafetería.', 'success');
      // Redirigir a pantalla de confirmación o quedarse aquí
    } catch (err) {
      toast('Error al confirmar el pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h2>Mi Pedido</h2>
        </div>
        <div className="empty-cart">
          <span className="empty-icon"><ShoppingBasket /></span>
          <h3>Tu pedido está vacío</h3>
          <p>Ve al menú y selecciona lo que quieres pedir</p>
          <button className="btn btn-primary" onClick={() => navigate('/estudiante/menu')}>Ver menú</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Mi Pedido</h2>
      </div>
      <div className="cart-wrap">
        <div className="cart-items">
          {cart.map(c => {
            const isPromo = c.tipo === 'promocion';
            const nombre = isPromo ? c.promocion.nombre : c.producto.nombre;
            const precio = isPromo ? c.promocion.precio : c.producto.precio;
            const itemId = c.itemId || c.producto?.id;
            const imagenUrl = isPromo ? null : c.producto.imagenUrl;

            return (
              <div key={itemId} className="cart-item" style={isPromo ? {
                background: 'rgba(76, 175, 80, 0.04)',
                border: '1px solid rgba(76, 175, 80, 0.15)',
                borderRadius: '12px',
              } : {}}>
                <span className="ci-icon">
                  {isPromo ? (
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px'
                    }}>🎁</div>
                  ) : imagenUrl ? (
                    <img src={imagenUrl} alt={nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                  ) : null}
                </span>
                <div className="ci-info">
                  <div className="ci-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {nombre}
                    {isPromo && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#fff',
                        background: '#4CAF50', padding: '1px 6px', borderRadius: '4px'
                      }}>COMBO</span>
                    )}
                  </div>
                  {isPromo && c.promocion.items && (
                    <div style={{ fontSize: '11px', color: '#8A6A55', marginTop: '2px' }}>
                      {c.promocion.items.map((it, idx) => (
                        <span key={idx}>
                          {it.cantidad}× {it.producto?.nombre || 'Producto'}
                          {idx < c.promocion.items.length - 1 ? ' + ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="ci-price">S/ {precio.toFixed(2)} × {c.cantidad}</div>
                </div>
                <div className="ci-ctrl">
                  <button onClick={() => changeQty(itemId, -1)}>−</button>
                  <span>{c.cantidad}</span>
                  <button 
                    disabled={!isPromo && c.cantidad >= (c.producto?.stock || 999)}
                    onClick={() => changeQty(itemId, 1)}
                  >+</button>
                </div>
                <div className="ci-sub">S/ {(precio * c.cantidad).toFixed(2)}</div>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <div className="s-row s-total"><span>Total a pagar:</span><strong>S/ {total.toFixed(2)}</strong></div>
          <p className="payment-note"><Wallet /> El pago es contra entrega al recoger tu pedido</p>
          <button className="btn btn-primary btn-full" onClick={confirmOrder} disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar pedido'}
          </button>
          <button className="btn btn-outline btn-full" style={{ marginTop: '8px' }} onClick={() => navigate('/estudiante/menu')}>
            + Agregar más
          </button>
        </div>
      </div>
    </div>
  );
}
