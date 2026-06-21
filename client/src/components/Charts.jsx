import { useState } from 'react';

/**
 * LineChart component
 * Draws an interactive area line chart.
 * @param {Array} data - Array of { label: string, value: number }
 * @param {string} prefix - Optional prefix for values (e.g., "S/ ")
 */
export function LineChart({ data = [], prefix = '' }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, val: '' });

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Sin datos para graficar</div>;
  }

  // Dimensiones
  const width = 500;
  const height = 220;
  const padX = 40;
  const padY = 30;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const minVal = 0;
  const range = maxVal - minVal;

  // Calcular puntos
  const points = data.map((d, i) => {
    const x = padX + (i * (width - 2 * padX)) / (data.length - 1 || 1);
    const y = height - padY - ((d.value - minVal) / range) * (height - 2 * padY);
    return { x, y, label: d.label, value: d.value };
  });

  // Generar path de la línea
  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }
    // Para el area, cerramos el path en el eje X
    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;
  }

  const handleMouseMove = (pt, i, e) => {
    // Coordenadas relativas al contenedor
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    // Calcular posición para el tooltip
    const x = ((pt.x - padX) / (width - 2 * padX)) * rect.width + 40;
    const y = pt.y - 10;
    setActiveIdx(i);
    setTooltip({
      visible: true,
      x,
      y,
      val: `${prefix}${pt.value.toFixed(2)}`
    });
  };

  const handleMouseLeave = () => {
    setActiveIdx(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  // Líneas de cuadrícula horizontal
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="chart-svg-container" style={{ position: 'relative' }}>
      {tooltip.visible && (
        <div
          className="chart-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            opacity: 1
          }}
        >
          {tooltip.val}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Cuadrícula de fondo */}
        {gridLines.map((gl, idx) => {
          const y = padY + gl * (height - 2 * padY);
          const val = maxVal - gl * range;
          return (
            <g key={idx}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fontWeight="700"
                fill="var(--text-muted)"
              >
                {prefix}{val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Área rellenada */}
        {areaPath && <path d={areaPath} fill="url(#area-grad)" />}

        {/* Línea principal */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Puntos y manejadores de interacción */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={activeIdx === i ? 6 : 4.5}
              fill="var(--surface)"
              stroke="var(--secondary)"
              strokeWidth="2.5"
              className="chart-dot"
            />
            {/* Círculo invisible más grande para facilitar el hover */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r="16"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseMove={(e) => handleMouseMove(pt, i, e)}
              onMouseLeave={handleMouseLeave}
            />
            {/* Etiquetas del eje X */}
            <text
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--text-muted)"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * DonutChart component
 * Draws an interactive category donut/pie chart.
 * @param {Array} data - Array of { label: string, value: number, color: string }
 * @param {string} prefix - Optional prefix for values
 */
export function DonutChart({ data = [], prefix = '' }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>Sin ventas registradas</div>;
  }

  // Parámetros círculo
  const size = 160;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.159
  const center = size / 2;

  let accumulatedPercent = 0;

  const slices = data.map((d, i) => {
    const percent = (d.value / total) * 100;
    const strokeDashoffset = circumference - (percent * circumference) / 100;
    const rotation = (accumulatedPercent * 360) / 100;
    accumulatedPercent += percent;

    return {
      ...d,
      percent,
      strokeDashoffset,
      rotation,
      index: i
    };
  });

  const displayLabel = hoveredSlice !== null ? slices[hoveredSlice].label : 'Total Ventas';
  const displayValue = hoveredSlice !== null
    ? `${prefix}${slices[hoveredSlice].value.toFixed(2)}`
    : `${prefix}${total.toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredSlice === i ? strokeWidth + 2 : strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={slice.strokeDashoffset}
              transform={`rotate(${slice.rotation - 90} ${center} ${center})`}
              style={{
                transition: 'stroke-width 0.2s ease, stroke 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredSlice(i)}
              onMouseLeave={() => setHoveredSlice(null)}
            />
          ))}
        </svg>

        {/* Centro del donut */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            width: '90px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-muted)',
              fontWeight: 800
            }}
          >
            {displayLabel}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)', marginTop: '2px' }}>
            {displayValue}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="chart-legend">
        {slices.map((slice, i) => (
          <div
            key={i}
            className="legend-item"
            style={{
              opacity: hoveredSlice === null || hoveredSlice === i ? 1 : 0.6,
              transition: 'opacity 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredSlice(i)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div className="legend-dot" style={{ backgroundColor: slice.color }} />
            <span>
              {slice.label} ({Math.round(slice.percent)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * BarChart component
 * Renders vertical bar chart comparing counts.
 * @param {Array} data - Array of { label: string, value: number, color: string }
 */
export function BarChart({ data = [] }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, val: '' });

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Sin datos</div>;
  }

  const width = 400;
  const height = 220;
  const padX = 40;
  const padY = 30;

  const maxVal = Math.max(...data.map(d => d.value), 4);
  const graphHeight = height - padY - 10;

  const handleMouseMove = (d, i, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const barX = padX + i * ((width - 2 * padX) / data.length) + ((width - 2 * padX) / data.length) / 2;
    const barY = height - padY - (d.value / maxVal) * graphHeight;

    const tooltipX = (i * rect.width) / data.length + rect.width / (2 * data.length);
    setActiveIdx(i);
    setTooltip({
      visible: true,
      x: tooltipX + 35,
      y: barY - 10,
      val: `${d.value} pedidos`
    });
  };

  const handleMouseLeave = () => {
    setActiveIdx(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  const barWidth = Math.min(35, (width - 2 * padX) / data.length - 20);

  return (
    <div className="chart-svg-container" style={{ position: 'relative' }}>
      {tooltip.visible && (
        <div
          className="chart-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            opacity: 1
          }}
        >
          {tooltip.val}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" style={{ overflow: 'visible' }}>
        {/* Líneas horizontales de referencia */}
        {[0, 0.5, 1].map((gl, idx) => {
          const y = height - padY - gl * graphHeight;
          const val = Math.round(gl * maxVal);
          return (
            <g key={idx}>
              <line
                x1={padX - 5}
                y1={y}
                x2={width - padX + 5}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={padX - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fontWeight="700"
                fill="var(--text-muted)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Barras */}
        {data.map((d, i) => {
          const colWidth = (width - 2 * padX) / data.length;
          const x = padX + i * colWidth + (colWidth - barWidth) / 2;
          const barValHeight = (d.value / maxVal) * graphHeight;
          const y = height - padY - barValHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barValHeight, 2)}
                rx="4"
                ry="4"
                fill={d.color}
                className="chart-interactive-bar"
                opacity={activeIdx === null || activeIdx === i ? 1 : 0.6}
                onMouseMove={(e) => handleMouseMove(d, i, e)}
                onMouseLeave={handleMouseLeave}
                style={{
                  transition: 'y 0.3s ease, height 0.3s ease, fill 0.2s ease, opacity 0.2s ease',
                  cursor: 'pointer'
                }}
              />
              {/* Eje X Labels */}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="var(--text-muted)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
