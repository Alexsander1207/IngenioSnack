import React, { useState } from 'react';

const ConfigurarPremios = () => {
  const [nombre, setNombre] = useState('');
  const [productoCriterioId, setProductoCriterioId] = useState('');
  const [cantidadCriterio, setCantidadCriterio] = useState('');
  const [productoPremioId, setProductoPremioId] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  const asociarRegla = async (e) => {
    e.preventDefault();
    setNotificacion(null);

    const reglaPayload = {
      nombre,
      productoCriterioId,
      cantidadCriterio: parseInt(cantidadCriterio),
      productoPremioId
    };

    try {
      const respuesta = await fetch('/api/fidelidad/reglas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reglaPayload)
      });

      if (respuesta.ok) {
        setNotificacion({ tipo: 'success', mensaje: '¡Nueva regla de fidelidad registrada!' });
        setNombre('');
        setProductoCriterioId('');
        setCantidadCriterio('');
        setProductoPremioId('');
      } else {
        const errorData = await respuesta.json();
        setNotificacion({ tipo: 'error', mensaje: errorData.error || 'No se pudo guardar la regla.' });
      }
    } catch (err) {
      setNotificacion({ tipo: 'error', mensaje: 'Error de comunicación con el servidor.' });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-1 text-gray-800">⚙️ Configuración de Premios</h2>
      <p className="text-xs text-gray-500 mb-6">Establece qué producto activa la promoción y cuál se entrega gratis.</p>

      {notificacion && (
        <div className={`p-3 rounded mb-4 text-xs text-center font-medium ${notificacion.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {notificacion.mensaje}
        </div>
      )}

      <form onSubmit={asociarRegla} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Descriptivo de la Promoción</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ej: Por cada 10 Cafés, el 11 va gratis" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ID Producto Base (A)</label>
            <input type="text" value={productoCriterioId} onChange={(e) => setProductoCriterioId(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="UUID Producto A" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meta de Unidades</label>
            <input type="number" value={cantidadCriterio} onChange={(e) => setCantidadCriterio(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ej: 10" required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">ID Producto Recompensa (B de regalo)</label>
          <input type="text" value={productoPremioId} onChange={(e) => setProductoPremioId(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="UUID Producto B" required />
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white p-2.5 rounded text-sm font-bold hover:bg-orange-700 transition-colors shadow">
          Guardar Regla Dinámica
        </button>
      </form>
    </div>
  );
};

export default ConfigurarPremios;
