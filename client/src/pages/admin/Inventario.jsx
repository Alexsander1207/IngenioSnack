import { useState, useEffect } from 'react';
import { CupSoda, Cookie, Pizza } from 'lucide-react';
import { useToast } from '../../components/Toast';

const getCategoryIcon = (cat) => {
  if (cat === 'Bebida') return <CupSoda size={16} />;
  if (cat === 'Snack') return <Cookie size={16} />;
  return <Pizza size={16} />;
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
    <div className="screen" style={{ width: '100%', maxWidth: '100%', padding: '20px 40px' }}>
      <div className="screen-header" style={{ marginBottom: '24px' }}>
        <h2>Inventario Rápido</h2>
        <p className="screen-sub">Marca rápidamente lo que se agotó o ajusta el stock en tiempo real</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {categories.map(cat => {
          const prods = productos.filter(p => p.categoria === cat);
          const dispCount = prods.filter(p => p.disponible).length;

          return (
            <div key={cat} style={{
              background: '#fff',
              border: '1px solid #EFE7E0',
              borderRadius: '4px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(44,31,24,0.02)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #EFE7E0',
                paddingBottom: '12px',
                marginBottom: '16px'
              }}>
                <span style={{ fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getCategoryIcon(cat)} {cat}s
                </span>
                <span style={{ fontSize: '11px', fontWeight: '800', background: '#FAF0E6', color: '#8B5A2B', padding: '3px 8px', borderRadius: '3px', border: '1px solid #E6D4C3' }}>
                  {dispCount}/{prods.length} disp.
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {prods.map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#FFFDFB',
                    border: '1px solid #E6D4C3',
                    borderRadius: '4px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{p.nombre}</span>
                      <span style={{ fontSize: '11px', color: p.stock > 0 ? 'var(--text-muted)' : 'var(--danger)', marginTop: '2px' }}>
                        {p.stock > 0 ? `Stock: ${p.stock} uds` : 'Agotado (0 uds)'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D2B48C', borderRadius: '4px', background: '#FFF' }}>
                        <button 
                          style={{ border: 'none', background: 'transparent', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}
                          disabled={p.stock <= 0}
                          onClick={() => updateStock(p.id, p.stock - 1)}
                        >−</button>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', width: '32px', textAlign: 'center' }}>{p.stock}</span>
                        <button 
                          style={{ border: 'none', background: 'transparent', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => updateStock(p.id, p.stock + 1)}
                        >+</button>
                      </div>
                      
                      <button 
                        style={{
                          padding: '6px 12px',
                          border: '1px solid',
                          borderColor: p.disponible && p.stock > 0 ? '#EFE7E0' : '#D2B48C',
                          borderRadius: '4px',
                          background: p.disponible && p.stock > 0 ? '#FAF6F0' : 'var(--primary)',
                          color: p.disponible && p.stock > 0 ? 'var(--text)' : '#fff',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          width: '70px',
                          textAlign: 'center'
                        }}
                        onClick={() => toggleInv(p, !(p.disponible && p.stock > 0))}
                      >
                        {p.disponible && p.stock > 0 ? 'Agotar' : 'Reponer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
