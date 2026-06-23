const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'ingeniosnack_token';

const endpointMap = [
  [/^\/api\/auth\/login$/, '/auth/login'],
  [/^\/api\/auth\/register$/, '/auth/register'],
  [/^\/api\/auth\/me$/, '/auth/me'],
  [/^\/api\/productos\/movimientos$/, '/stock/movimientos'],
  [/^\/api\/productos(\/.*)?$/, '/productos$1'],
  [/^\/api\/favoritos\/productos(\/.*)?$/, '/favoritos/productos$1'],
  [/^\/api\/stock(\/.*)?$/, '/stock$1'],
  [/^\/api\/clientes(\/.*)?$/, '/clientes$1'],
  [/^\/api\/promociones(\/.*)?$/, '/promociones$1'],
  [/^\/api\/fidelidad\/ranking$/, '/fidelidad/ranking'],
  [/^\/api\/fidelidad\/reglas$/, '/fidelidad/reglas'],
  [/^\/api\/fidelidad\/canjear-premio$/, '/fidelidad/canjear-premio'],
  [/^\/api\/fidelidad\/me$/, '/fidelidad/me'],
  [/^\/api\/reporte$/, '/reportes/resumen'],
  [/^\/api\/reportes\/(.*)$/, '/reportes/$1'],
  [/^\/api\/pedidos\/([^/]+)\/estado$/, '/pedidos/$1/estado'],
  [/^\/api\/pedidos\/([^/]+)$/, '/pedidos/$1'],
  [/^\/api\/pedidos$/, '/pedidos'],
  [/^\/api\/categorias(\/.*)?$/, '/categorias$1'],
  [/^\/api\/estudiante\/[^/]+\/canjear-cafe$/, '/fidelidad/canjear-cafe'],
  [/^\/api\/estudiante\/[^/]+$/, '/auth/me'],
  [/^\/api\/config\/supabase$/, '/health/config'],
];

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const normalizeEndpoint = (url, method) => {
  if (!url || /^https?:\/\//i.test(url)) return url;

  let path = url;
  for (const [pattern, replacement] of endpointMap) {
    if (pattern.test(path)) {
      path = path.replace(pattern, replacement);
      break;
    }
  }

  if (path === '/pedidos' && method === 'GET') return `${API_BASE_URL}/pedidos/admin`;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const transformBody = (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  if (/^\/api\/pedidos\/[^/]+\/estado$/.test(url) && options.body) {
    try {
      const payload = JSON.parse(options.body);
      return {
        ...options,
        method: 'PATCH',
        body: JSON.stringify({
          ...payload,
          estado: payload.estado === 'EN_PREPARACION' ? 'PREPARANDO' : payload.estado,
        }),
      };
    } catch (_) {
      return { ...options, method: 'PATCH' };
    }
  }

  if (!(url === '/api/pedidos' && method === 'POST') || !options.body) return options;

  try {
    const payload = JSON.parse(options.body);
    if (Array.isArray(payload.lineas)) {
      return {
        ...options,
        body: JSON.stringify({
          items: payload.lineas.map((linea) => ({
            producto_id: linea.productoId,
            promocion_id: linea.promocionId || null,
            cantidad: linea.cantidad,
          })),
          pickup_at: payload.pickupAt || null,
        }),
      };
    }
  } catch (_) {
    return options;
  }

  return options;
};

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const nextOptions = transformBody(url, options);
  const headers = new Headers(nextOptions.headers || {});
  const token = getToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (nextOptions.body && !(nextOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return window.fetch(normalizeEndpoint(url, method), {
    ...nextOptions,
    headers,
  });
}

export async function apiJson(url, options = {}, fallback = null) {
  const response = await apiFetch(url, options);
  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = fallback;
  }

  if (!response.ok) {
    const message = data?.detail || data?.error || `Error HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data ?? fallback;
}

export const asArray = (data) => (Array.isArray(data) ? data : []);
export const asObject = (data) => data ?? {};
