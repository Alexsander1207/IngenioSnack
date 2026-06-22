import { useState, useEffect } from 'react';
import { CupSoda, Cookie, Pizza } from 'lucide-react';
import { useToast } from '../../components/Toast';

const getCategoryIcon = (cat) => {
  if (cat === 'Bebida') return <CupSoda size={18} />;
  if (cat === 'Snack') return <Cookie size={18} />;
  return <Pizza size={18} />;
};

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProductos = () => {
    fetch('/api/productos')
      .then(r => r.json())
      .then(data => {
        setProductos(data);
        setLoading(false);
      })
      .catch(err => {
        toast('Error al cargar inventario', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const toggleInv = async (p, disp) => {
    if (disp) {
      const input = window.prompt(`¿Cuántas unidades de "${p.nombre}" vas a reponer?`, "12");
      if (input === null) return;
      const qty = parseInt(input, 10);
      if (isNaN(qty) || qty < 0) {
        toast("Cantidad inválida", "error");
        return;
      }
      const newStock = p.stock + qty;
      updateStock(p.id, newStock);
    } else {
      updateStock(p.id, 0);
    }
  };

  const updateStock = async (id, newStock) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        toast(`Stock actualizado a ${newStock}`);
        loadProductos();
      } else {
        toast('Error al actualizar stock', 'error');
      }
    } catch (err) {
      toast('Error de conexión', 'error');
    }
  };

  if (loading) return <div className="screen"><p className="loading">Cargando...</p></div>;

  const categories = [...new Set(productos.map(p => p.categoria))];

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Inventario Rápido</h2>
        <p className="screen-sub">Marca rápidamente lo que se agotó o ajusta el stock en tiempo real</p>
      </div>

      <div className="inv-grid">
        {categories.map(cat => {
          const prods = productos.filter(p => p.categoria === cat);
          const dispCount = prods.filter(p => p.disponible).length;

          return (
            <div key={cat} className="inv-cat">
              <div className="inv-cat-hd">
                <span>{getCategoryIcon(cat)} {cat}</span>
                <span className="inv-badge">{dispCount}/{prods.length} disponibles</span>
              </div>
              {prods.map(p => (
                <div key={p.id} className="inv-item">
                  <div className="inv-item-details">
                    <span className="inv-item-name">{p.nombre}</span>
                    <span className="inv-item-stock" style={{ color: p.stock > 0 ? 'var(--text-muted)' : 'var(--danger)' }}>
                      {p.stock > 0 ? `Stock: ${p.stock} uds` : 'Sin stock (Agotado)'}
                    </span>
                  </div>
                  <div className="inv-status">
                    <div className="stock-control">
                      <button 
                        className="btn-qty"
                        disabled={p.stock <= 0}
                        onClick={() => updateStock(p.id, p.stock - 1)}
                      >−</button>
                      <span className="stock-number">{p.stock}</span>
                      <button 
                        className="btn-qty"
                        onClick={() => updateStock(p.id, p.stock + 1)}
                      >+</button>
                    </div>
                    <span className={`dot ${p.disponible && p.stock > 0 ? 'dot-green' : 'dot-red'}`}></span>
                    <button 
                      className="btn-sm"
                      onClick={() => toggleInv(p, !(p.disponible && p.stock > 0))}
                    >
                      {p.disponible && p.stock > 0 ? 'Agotar' : 'Reponer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
