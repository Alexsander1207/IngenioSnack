import React, { useEffect, useState } from 'react';

const RankingClientes = () => {
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Consumimos el endpoint del backend que creamos anteriormente
    fetch('/api/fidelidad/ranking')
      .then((res) => res.json())
      .then((data) => {
        setRanking(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error('Error al obtener el ranking:', err);
        setCargando(false);
      });
  }, []);

  if (cargando) return <div className="p-5 text-center text-gray-500">Cargando ranking...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🏆 Ranking de Clientes Fieles</h2>
      <p className="text-gray-600 mb-6 text-sm">Estudiantes ordenados por puntos acumulados en IngenioSnack.</p>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase">
              <th className="px-6 py-3">Puesto</th>
              <th className="px-6 py-3">Estudiante</th>
              <th className="px-6 py-3">Código</th>
              <th className="px-6 py-3">Puntos Totales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranking.map((estudiante, index) => (
              <tr key={estudiante.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">
                  {index === 0 ? '🥇 1°' : index === 1 ? '🥈 2°' : index === 2 ? '🥉 3°' : `${index + 1}°`}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{estudiante.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{estudiante.codigo || 'S/N'}</td>
                <td className="px-6 py-4 text-sm font-bold text-orange-600">{estudiante.puntos || 0} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingClientes;