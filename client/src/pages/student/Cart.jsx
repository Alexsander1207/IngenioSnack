import { useState } from 'react';
import { ShoppingBasket, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';

export default function Cart() {
  const { cart, changeQty, user, setConfirmedOrder, clearCart } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, c) => acc + (c.producto.precio * c.cantidad), 0);

  const confirmOrder = async () => {
    if (!cart.length) { toast('El carrito está vacío', 'warning'); return; }
    setLoading(true);
    try {
      const lineas = cart.map(c => ({ productoId: c.producto.id, cantidad: c.cantidad }));
      const res = await fetch('/api/pedidos', {
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
          {cart.map(c => (
            <div key={c.producto.id} className="cart-item">
              <span className="ci-icon">
                {c.producto.imagenUrl && (
                  <img src={c.producto.imagenUrl} alt={c.producto.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                )}
              </span>
              <div className="ci-info">
                <div className="ci-name">{c.producto.nombre}</div>
                <div className="ci-price">S/ {c.producto.precio.toFixed(2)} × {c.cantidad}</div>
              </div>
              <div className="ci-ctrl">
                <button onClick={() => changeQty(c.producto.id, -1)}>−</button>
                <span>{c.cantidad}</span>
                <button 
                  disabled={c.cantidad >= c.producto.stock}
                  onClick={() => changeQty(c.producto.id, 1)}
                >+</button>
              </div>
              <div className="ci-sub">S/ {(c.producto.precio * c.cantidad).toFixed(2)}</div>
            </div>
          ))}
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
