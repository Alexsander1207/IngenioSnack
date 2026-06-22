
/* ─── STATE ─────────────────────────────────────────────────── */
const S = {
  role: null, user: null, cart: [], productos: [],
  confirmedOrder: null, activeAdmScreen: null, pedidosTab: 'TODOS',
};

/* ─── API ───────────────────────────────────────────────────── */
const api = {
  async get(url)        { return (await fetch(url)).json(); },
  async post(url, body) { return (await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })).json(); },
  async put(url, body)  { return (await fetch(url, { method:'PUT',  headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })).json(); },
};

/* ─── TOAST ─────────────────────────────────────────────────── */
let _tt;
function toast(msg, type='info') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `toast toast-${type} show`;
  clearTimeout(_tt); _tt = setTimeout(() => el.classList.remove('show'), 3600);
}

/* ─── AUTH ──────────────────────────────────────────────────── */
document.getElementById('form-login-est').addEventListener('submit', async e => {
  e.preventDefault();
  const id  = document.getElementById('est-id').value.trim();
  const nom = document.getElementById('est-nombre').value.trim();
  if (!id) return;
  const body = id.includes('@') ? { correo: id } : { codigo: id };
  if (nom) body.nombre = nom;
  const data = await api.post('/api/auth/estudiante', body);
  if (data.error) {
    if (data.registro) {
      document.getElementById('field-nombre').style.display = 'block';
      document.getElementById('est-nombre').focus();
      toast('Estudiante no encontrado. Ingresa tu nombre para registrarte.', 'warning');
    } else { toast(data.error, 'error'); }
    return;
  }
  S.role = 'estudiante'; S.user = data.estudiante;
  enterStudent();
});

document.getElementById('form-login-admin').addEventListener('submit', async e => {
  e.preventDefault();
  const data = await api.post('/api/auth/admin', { pin: document.getElementById('admin-pin').value });
  if (data.error) { toast(data.error, 'error'); return; }
  S.role = 'admin'; S.user = data.admin;
  enterAdmin();
});

function logout() {
  S.role = S.user = S.confirmedOrder = null; S.cart = [];
  ['page-login','page-student','page-admin'].forEach((id,i) => {
    document.getElementById(id).style.display = i===0 ? 'flex' : 'none';
  });
  document.getElementById('admin-pin').value = '';
  document.getElementById('est-id').value = '';
  document.getElementById('est-nombre').value = '';
  document.getElementById('field-nombre').style.display = 'none';
  updateBadge();
}

/* ─── STUDENT PORTAL ────────────────────────────────────────── */
async function enterStudent() {
  document.getElementById('page-login').style.display   = 'none';
  document.getElementById('page-student').style.display = 'flex';
  document.getElementById('est-user-info').innerHTML = `
    <div class="user-avatar"><i data-lucide="graduation-cap"></i></div>
    <div class="user-name">${esc(S.user.nombre)}</div>
    <div class="user-code">${esc(S.user.codigo || S.user.correo || '')}</div>`;
  S.productos = await api.get('/api/productos');
  showEst('menu');
}

const EST_SC = ['menu','cart','myorders','profile'];
function showEst(sc) {
  EST_SC.forEach(s => { document.getElementById(`sc-${s}`).style.display = s===sc ? 'block' : 'none'; });
  document.querySelectorAll('#sidebar-est .nav-link').forEach((l,i) => l.classList.toggle('active', EST_SC[i]===sc));
  closeSidebarEst();
  if      (sc==='menu')     renderMenu();
  else if (sc==='cart')     renderCart();
  else if (sc==='myorders') renderMyOrders();
  else if (sc==='profile')  renderProfile();
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}

/* MENU (HU-02) */
function renderMenu() {
  const el = document.getElementById('menu-content');
  if (!S.productos.length) { el.innerHTML='<p class="loading">Cargando menú...</p>'; return; }
  const cats = [...new Set(S.produtos ? S.produtos.map(p=>p.categoria) : S.productos.map(p=>p.categoria))];
  // use S.productos
  const categories = [...new Set(S.productos.map(p => p.categoria))];
  let html = '';
  categories.forEach(cat => {
    html += `<div class="menu-category"><div class="category-title">${catIcon(cat)}&nbsp;${cat}</div><div class="product-grid">`;
    S.productos.filter(p => p.categoria===cat).forEach(p => {
      const item = S.cart.find(c => c.producto.id===p.id);
      const qty  = item ? item.cantidad : 0;
      const ua   = !p.disponible;
      html += `<div class="product-card${ua?' unavailable':''}">
        <div class="product-icon">${prodIcon(p.categoria)}</div>
        <div class="product-info">
          <div class="product-name">${esc(p.nombre)}</div>
          <div class="product-price">S/ ${p.precio.toFixed(2)}</div>
          ${ua?'<span class="badge badge-danger" style="margin-top:4px">Agotado</span>':''}
        </div>
        <div class="product-actions">
          ${ua ? '<span class="no-stock">No disponible</span>'
               : qty===0
                 ? `<button class="btn-add" onclick="addToCart('${p.id}')">+ Agregar</button>`
                 : `<div class="qty-controls"><button onclick="changeQty('${p.id}',-1)">−</button><span>${qty}</span><button onclick="changeQty('${p.id}',1)">+</button></div>`}
        </div>
      </div>`;
    });
    html += '</div></div>';
  });
  if (S.cart.length > 0) {
    const ni = S.cart.reduce((s,c)=>s+c.cantidad,0);
    const tot = S.cart.reduce((s,c)=>s+c.producto.precio*c.cantidad,0);
    html += `<div class="cart-float" onclick="showEst('cart')">
      <span class="cf-info"><i data-lucide="shopping-cart"></i> ${ni} item${ni>1?'s':''}</span>
      <span class="cf-total">S/ ${tot.toFixed(2)}</span>
      <button class="cf-btn" onclick="event.stopPropagation();showEst('cart')">Ver pedido →</button>
    </div>`;
  }
  el.innerHTML = html;
  updateBadge();
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}

function addToCart(id) {
  const prod = S.productos.find(p=>p.id===id); if(!prod) return;
  const ex = S.cart.find(c=>c.producto.id===id);
  if(ex) ex.cantidad++; else S.cart.push({producto:prod, cantidad:1});
  updateBadge(); renderMenu();
}
function changeQty(id, delta) {
  const idx = S.cart.findIndex(c=>c.producto.id===id); if(idx===-1) return;
  S.cart[idx].cantidad += delta;
  if(S.cart[idx].cantidad<=0) S.cart.splice(idx,1);
  updateBadge(); renderMenu();
}
function updateBadge() {
  const b = document.getElementById('cart-badge'); if(!b) return;
  const n = S.cart.reduce((s,c)=>s+c.cantidad,0);
  b.textContent = n; b.style.display = n>0?'inline':'none';
}

/* CART (HU-03, HU-04) */
function renderCart() {
  const el = document.getElementById('cart-content');
  if (S.confirmedOrder) {
    const o = S.confirmedOrder;
    el.innerHTML = `<div class="order-confirmed">
      <span class="cf-icon-big"><i data-lucide="check-circle"></i></span>
      <h3>¡Pedido confirmado!</h3>
      <div class="oid-tag">ID: ${o.id}</div>
      <div class="oi-box">
        <div class="oi-row"><span>Estado:</span><span class="badge ${estatBadge(o.estado)}">${estatLabel(o.estado)}</span></div>
        <div class="oi-row"><span>Total:</span><strong>S/ ${o.total.toFixed(2)}</strong></div>
        <div class="oi-row"><span>Fecha:</span><span>${fmtDate(o.fecha)}</span></div>
      </div>
      <p class="payment-note"><i data-lucide="dollar-sign"></i> Paga al recoger en la cafetería — no se cobra por adelantado</p>
      <button class="btn btn-primary" onclick="newOrder()">Hacer otro pedido</button>
    </div>`;
    return;
  }
  if (!S.cart.length) {
    el.innerHTML = `<div class="empty-cart">
      <span class="empty-icon"><i data-lucide="shopping-cart"></i></span>
      <h3>Tu pedido está vacío</h3>
      <p>Ve al menú y selecciona lo que quieres pedir</p>
      <button class="btn btn-primary" onclick="showEst('menu')">Ver menú</button>
    </div>`;
    return;
  }
  const total = S.cart.reduce((s,c)=>s+c.producto.precio*c.cantidad,0);
  el.innerHTML = `<div class="cart-wrap">
    <div class="cart-items">
      ${S.cart.map(c=>`<div class="cart-item">
        <span class="ci-icon">${prodIcon(c.producto.categoria)}</span>
        <div class="ci-info">
          <div class="ci-name">${esc(c.producto.nombre)}</div>
          <div class="ci-price">S/ ${c.producto.precio.toFixed(2)} × ${c.cantidad}</div>
        </div>
        <div class="ci-ctrl">
          <button onclick="cqCart('${c.producto.id}',-1)">−</button>
          <span>${c.cantidad}</span>
          <button onclick="cqCart('${c.producto.id}',1)">+</button>
        </div>
        <div class="ci-sub">S/ ${(c.producto.precio*c.cantidad).toFixed(2)}</div>
      </div>`).join('')}
    </div>
    <div class="cart-summary">
      <div class="s-row s-total"><span>Total a pagar:</span><strong>S/ ${total.toFixed(2)}</strong></div>
      <p class="payment-note"><i data-lucide="dollar-sign"></i> El pago es contra entrega al recoger tu pedido</p>
      <button class="btn btn-primary btn-full" onclick="confirmOrder()">Confirmar pedido</button>
      <button class="btn btn-outline btn-full" style="margin-top:8px" onclick="showEst('menu')">+ Agregar más</button>
    </div>
  </div>`;
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}
function cqCart(id, delta) { changeQty(id, delta); renderCart(); }

async function confirmOrder() {
  if (!S.cart.length) { toast('El carrito está vacío','warning'); return; }
  const lineas = S.cart.map(c=>({productoId:c.producto.id, cantidad:c.cantidad}));
  const created = await api.post('/api/pedidos', {estudianteId:S.user.id, lineas});
  if (created.error) { toast('Error: '+created.error,'error'); return; }
  const confirmed = await api.post(`/api/pedidos/${created.id}/confirmar`, {});
  if (confirmed.error) { toast('No se pudo confirmar: '+confirmed.error,'error'); return; }
  S.confirmedOrder = confirmed; S.cart = []; updateBadge();
  S.productos = await api.get('/api/productos');
  renderCart();
  toast('¡Pedido confirmado! Ve a recogerlo a la cafetería.','success');
}
function newOrder() { S.confirmedOrder = null; showEst('menu'); }

/* MIS PEDIDOS */
async function renderMyOrders() {
  const el = document.getElementById('myorders-content');
  el.innerHTML = '<p class="loading">Cargando pedidos...</p>';
  const data = await api.get(`/api/estudiante/${S.user.id}`);
  if (data.error) { el.innerHTML=`<p class="error-msg">${data.error}</p>`; return; }
  const pedidos = data.pedidos;
  if (!pedidos.length) { el.innerHTML='<div class="empty-state"><p>Aún no tienes pedidos realizados.</p></div>'; return; }
  el.innerHTML = '<div class="orders-list">'+
    pedidos.slice().reverse().map(p=>`<div class="order-card">
      <div class="oc-head">
        <span class="oc-id">${p.id}</span>
        <span class="badge ${estatBadge(p.estado)}">${estatLabel(p.estado)}</span>
      </div>
      <div class="oc-items">${p.items.map(i=>`${esc(i.producto.nombre)} ×${i.cantidad}`).join(' · ')}</div>
      <div class="oc-foot"><span class="oc-date">${fmtDate(p.fecha)}</span><strong>S/ ${p.total.toFixed(2)}</strong></div>
    </div>`).join('')+'</div>';
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}

/* PERFIL (HU-07) */
async function renderProfile() {
  const el = document.getElementById('profile-content');
  const data = await api.get(`/api/estudiante/${S.user.id}`);
  if (data.error) { el.innerHTML=`<p class="error-msg">${data.error}</p>`; return; }
  const b = data.beneficios;
  const pct = Math.min((b.sandwiches/10)*100,100).toFixed(1);
  el.innerHTML = `<div class="profile-grid">
    <div class="profile-card">
      <span class="pa"><i data-lucide="graduation-cap"></i></span>
      <h3>${esc(data.nombre)}</h3>
      ${data.codigo?`<p class="pd"><i data-lucide="clipboard-list"></i> ${esc(data.codigo)}</p>`:''}
      ${data.correo ?`<p class="pd">✉️ ${esc(data.correo)}</p>`:''}
    </div>
    <div class="fid-card">
      <h3>⭐ Programa de fidelidad</h3>
      <div class="fid-item">
        <div class="fid-lbl">Puntos acumulados</div>
        <div class="fid-val">${b.puntos} pts</div>
        <div class="fid-note">1 punto por cada S/ 1.00 gastado en pedidos entregados</div>
      </div>
      <div class="fid-item">
        <div class="fid-lbl">🥪 Progreso café gratis</div>
        <div class="progress-bar" style="margin:8px 0 4px"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-txt">${b.sandwiches} / 10 sandwiches</div>
        <div class="fid-note">Cada 10 sandwiches = 1 café americano gratis <i data-lucide="coffee"></i></div>
      </div>
      <div class="fid-item">
        <div class="fid-lbl"><i data-lucide="coffee"></i> Cafés gratis disponibles</div>
        <div class="fid-val gold">${b.cafesGratis}</div>
        ${b.cafesGratis>0
          ? `<button class="btn btn-secondary" style="margin-top:10px" onclick="canjearCafe()"><i data-lucide="coffee"></i> Canjear café gratis</button>`
          : `<div class="fid-note">Compra ${b.sandwichesParaSiguienteCafe} sandwich(es) más para ganar uno</div>`}
      </div>
    </div>
  </div>`;
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}
async function canjearCafe() {
  const data = await api.post(`/api/estudiante/${S.user.id}/canjear-cafe`, {});
  if (data.error) { toast(data.error,'error'); return; }
  toast('<i data-lucide="coffee"></i> ¡Café canjeado! Disfrútalo.','success');
  renderProfile();
}

/* ─── ADMIN PORTAL ──────────────────────────────────────────── */
function enterAdmin() {
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('page-admin').style.display = 'flex';
  showAdm('panel');
}

const ADM_SC = ['panel','productos','inventario','pedidos','reporte'];
function showAdm(sc) {
  ADM_SC.forEach(s => { document.getElementById(`sc-${s}`).style.display = s===sc ? 'block' : 'none'; });
  document.querySelectorAll('#sidebar-adm .nav-link').forEach((l,i) => l.classList.toggle('active', ADM_SC[i]===sc));
  S.activeAdmScreen = sc;
  closeSidebarAdm();
  if      (sc==='panel')     renderPanel();
  else if (sc==='productos') renderProductos();
  else if (sc==='inventario')renderInventario();
  else if (sc==='pedidos')   renderPedidos();
  else if (sc==='reporte')   renderReporte();
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}

/* PANEL */
async function renderPanel() {
  const el = document.getElementById('panel-content');
  el.innerHTML = '<p class="loading">Cargando...</p>';
  const [rep, pedidos] = await Promise.all([api.get('/api/reporte'), api.get('/api/pedidos')]);
  const s = rep.estadisticas;
  const pend = pedidos.filter(p=>p.estado==='PENDIENTE').length;
  const activos = pedidos.filter(p=>!['ENTREGADO','CANCELADO'].includes(p.estado)).length;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card c-primary"><div class="si"><i data-lucide="receipt"></i></div><div class="sv">${s.totalPedidos}</div><div class="sl">Total pedidos</div></div>
      <div class="stat-card c-warning"><div class="si"><i data-lucide="hourglass"></i></div><div class="sv">${pend}</div><div class="sl">Pendientes</div></div>
      <div class="stat-card c-orange"><div class="si"><i data-lucide="zap"></i></div><div class="sv">${activos}</div><div class="sl">Activos</div></div>
      <div class="stat-card c-success"><div class="si"><i data-lucide="check-circle"></i></div><div class="sv">${s.pedidosEntregados}</div><div class="sl">Entregados</div></div>
      <div class="stat-card c-info"><div class="si">💰</div><div class="sv">S/ ${s.ingresosTotales.toFixed(2)}</div><div class="sl">Ingresos</div></div>
      <div class="stat-card"><div class="si"><i data-lucide="graduation-cap"></i></div><div class="sv">${s.estudiantesRegistrados}</div><div class="sl">Estudiantes</div></div>
    </div>
    ${activos===0 ? '<div class="empty-state"><p>No hay pedidos activos en este momento.</p></div>'
      : `<div class="panel-section"><h3>Pedidos activos (${activos})</h3>${buildTable(pedidos.filter(p=>!['ENTREGADO','CANCELADO'].includes(p.estado)),false)}</div>`}`;
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}

/* PRODUCTOS (HU-05) */
async function renderProductos() {
  const el = document.getElementById('productos-content');
  const productos = await api.get('/api/productos');
  el.innerHTML = `
    <div class="section-act">
      <button class="btn btn-primary" onclick="toggleAddForm()">+ Agregar producto</button>
    </div>
    <div id="add-form" class="add-form" style="display:none">
      <h3>Nuevo producto</h3>
      <form id="form-add-prod">
        <div class="form-row">
          <div class="form-group"><label>Nombre</label><input type="text" id="pn" required placeholder="Ej: Empanada de queso"></div>
          <div class="form-group"><label>Precio (S/)</label><input type="number" id="pp" step="0.50" min="0.50" required placeholder="0.00"></div>
          <div class="form-group"><label>Categoría</label>
            <select id="pc" required>
              <option value="">Seleccionar...</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Bebida">Bebida</option>
              <option value="Snack">Snack</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Guardar</button>
        <button type="button" class="btn btn-outline" style="margin-left:8px" onclick="toggleAddForm()">Cancelar</button>
      </form>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>ID</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acción</th></tr></thead>
        <tbody>
          ${productos.map(p=>`<tr>
            <td><code>${esc(String(p.id))}</code></td>
            <td>${prodIcon(p.categoria)} ${esc(p.nombre)}</td>
            <td>${p.categoria}</td>
            <td>S/ ${p.precio.toFixed(2)}</td>
            <td><span class="badge ${p.disponible?'badge-success':'badge-danger'}">${p.disponible?'Disponible':'Agotado'}</span></td>
            <td><button class="btn-toggle ${p.disponible?'btn-disable':'btn-enable'}" onclick="toggleProd('${p.id}',${!p.disponible})">${p.disponible?'⛔ Desactivar':'<i data-lucide="check-circle"></i> Activar'}</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  document.getElementById('form-add-prod').addEventListener('submit', async ev => {
    ev.preventDefault();
    const data = await api.post('/api/productos', { nombre:document.getElementById('pn').value.trim(), precio:document.getElementById('pp').value, categoria:document.getElementById('pc').value });
    if (data.error) { toast(data.error,'error'); return; }
    toast(`<i data-lucide="check-circle"></i> "${esc(data.nombre)}" agregado`,'success');
    renderProductos();
  });
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}
function toggleAddForm() { const f=document.getElementById('add-form'); if(f) f.style.display=f.style.display==='none'?'block':'none'; }
async function toggleProd(id, disp) {
  const data = await api.put(`/api/productos/${id}`, {disponible:disp});
  if (data.error) { toast(data.error,'error'); return; }
  toast(`${esc(data.nombre)}: ${disp?'Activado <i data-lucide="check-circle"></i>':'Desactivado ⛔'}`, disp?'success':'warning');
  renderProductos();
}

/* INVENTARIO */
async function renderInventario() {
  const el = document.getElementById('inventario-content');
  const productos = await api.get('/api/productos');
  const cats = [...new Set(productos.map(p=>p.categoria))];
  el.innerHTML = '<div class="inv-grid">'+cats.map(cat => {
    const prods = productos.filter(p=>p.categoria===cat);
    const disp  = prods.filter(p=>p.disponible).length;
    return `<div class="inv-cat">
      <div class="inv-cat-hd"><span>${catIcon(cat)} ${cat}</span><span class="inv-badge">${disp}/${prods.length} disponibles</span></div>
      ${prods.map(p=>`<div class="inv-item">
        <span class="inv-item-name">${esc(p.nombre)}</span>
        <div class="inv-status">
          <span class="dot ${p.disponible?'dot-green':'dot-red'}"></span>
          <span>${p.disponible?'En stock':'Agotado'}</span>
          <button class="btn-sm" onclick="toggleInv('${p.id}',${!p.disponible})">${p.disponible?'Agotar':'Reponer'}</button>
        </div>
      </div>`).join('')}
    </div>`;
  }).join('')+'</div>';
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}
async function toggleInv(id, disp) {
  const data = await api.put(`/api/productos/${id}`, {disponible:disp});
  if (data.error) { toast(data.error,'error'); return; }
  toast(`${esc(data.nombre)}: ${disp?'Repuesto <i data-lucide="check-circle"></i>':'Marcado agotado ⛔'}`, disp?'success':'warning');
  renderInventario();
}

/* PEDIDOS ADMIN (HU-06, HU-09) */
async function renderPedidos() {
  const el = document.getElementById('pedidos-content');
  el.innerHTML = '<p class="loading">Cargando pedidos...</p>';
  const pedidos = await api.get('/api/pedidos');
  const tabs = ['TODOS','PENDIENTE','CONFIRMADO','EN_PREPARACION','LISTO','ENTREGADO','CANCELADO'];
  const active = S.pedidosTab;
  const filtered = active==='TODOS' ? pedidos : pedidos.filter(p=>p.estado===active);
  el.innerHTML = `
    <div class="tabs">
      ${tabs.map(t=>{
        const cnt = t==='TODOS' ? pedidos.length : pedidos.filter(p=>p.estado===t).length;
        return `<button class="tab${t===active?' active':''}" onclick="filterTab('${t}')">${t==='TODOS'?'Todos':estatLabel(t)} <span class="tab-cnt">${cnt}</span></button>`;
      }).join('')}
    </div>
    ${buildTable(filtered, true)}`;
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}
function filterTab(t) { S.pedidosTab=t; renderPedidos(); }

function buildTable(pedidos, withAct) {
  if (!pedidos.length) return '<div class="empty-state"><p>No hay pedidos en este estado.</p></div>';
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>ID</th><th>Estudiante</th><th>Productos</th><th>Total</th><th>Estado</th>${withAct?'<th>Acciones</th>':''}</tr></thead>
    <tbody>
      ${pedidos.map(p=>`<tr>
        <td><code>${p.id}</code></td>
        <td>${esc(p.nombreEstudiante)}</td>
        <td class="items-cell">${p.items.map(i=>`${esc(i.producto.nombre)} ×${i.cantidad}`).join(', ')}</td>
        <td><strong>S/ ${p.total.toFixed(2)}</strong></td>
        <td><span class="badge ${estatBadge(p.estado)}">${estatLabel(p.estado)}</span></td>
        ${withAct?`<td>${pedidoActs(p)}</td>`:''}
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}
function pedidoActs(p) {
  const next = {
    PENDIENTE:    [['CONFIRMADO','Confirmar','ba-success'],['CANCELADO','Cancelar','ba-danger']],
    CONFIRMADO:   [['EN_PREPARACION','En preparación','ba-warning'],['CANCELADO','Cancelar','ba-danger']],
    EN_PREPARACION:[['LISTO','Marcar listo','ba-info']],
    LISTO:        [['ENTREGADO','<i data-lucide="dollar-sign"></i> Entregar y cobrar','ba-success']],
    ENTREGADO:[], CANCELADO:[],
  };
  const acts = next[p.estado]||[];
  if (!acts.length) return '<span style="color:var(--text-muted);font-size:13px">—</span>';
  return acts.map(([est,lbl,cls])=>`<button class="btn-action ${cls}" onclick="cambiarEstado('${p.id}','${est}')">${lbl}</button>`).join('');
}
async function cambiarEstado(id, estado) {
  const data = await api.put(`/api/pedidos/${id}/estado`, {estado});
  if (data.error) { toast('Error: '+data.error,'error'); return; }
  const msgs = {CONFIRMADO:'<i data-lucide="check-circle"></i> Pedido confirmado',EN_PREPARACION:'🍳 En preparación',LISTO:'🔔 Pedido listo para recoger',ENTREGADO:'<i data-lucide="dollar-sign"></i> Entregado y pagado. Puntos acreditados.',CANCELADO:'❌ Pedido cancelado'};
  toast(msgs[estado]||`Estado: ${estado}`, estado==='CANCELADO'?'warning':'success');
  if (S.activeAdmScreen==='pedidos') renderPedidos();
  else if (S.activeAdmScreen==='panel') renderPanel();
}

/* REPORTE (HU-08) */
async function renderReporte() {
  const el = document.getElementById('reporte-content');
  el.innerHTML = '<p class="loading">Cargando reporte...</p>';
  const {masVendidos, estadisticas:s} = await api.get('/api/reporte');
  el.innerHTML = `<div class="rep-grid">
    <div class="rep-sec">
      <h3>📊 Estadísticas generales</h3>
      <div class="stats-list">
        <div class="stat-row"><span>Total de pedidos</span><strong>${s.totalPedidos}</strong></div>
        <div class="stat-row"><span>Pedidos entregados</span><strong>${s.pedidosEntregados}</strong></div>
        <div class="stat-row"><span>Pedidos activos</span><strong>${s.pedidosActivos}</strong></div>
        <div class="stat-row hl"><span>Ingresos totales</span><strong>S/ ${s.ingresosTotales.toFixed(2)}</strong></div>
        <div class="stat-row"><span>Estudiantes</span><strong>${s.estudiantesRegistrados}</strong></div>
        <div class="stat-row"><span>Productos disponibles</span><strong>${s.productosDisponibles} de ${s.totalProductos}</strong></div>
      </div>
    </div>
    <div class="rep-sec">
      <h3>🏆 Productos más vendidos</h3>
      ${masVendidos.length===0
        ? '<div class="empty-state"><p>No hay ventas aún.<br><small>Las ventas aparecen cuando los pedidos se marcan como <strong>Entregados</strong>.</small></p></div>'
        : `<div class="table-wrap"><table class="data-table">
            <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Vendidos</th><th>Ingresos</th></tr></thead>
            <tbody>${masVendidos.map((p,i)=>`<tr>
              <td><strong>#${i+1}</strong></td>
              <td>${prodIcon(p.categoria)} ${esc(p.nombre)}</td>
              <td>${p.categoria}</td>
              <td><strong>${p.cantidad}</strong></td>
              <td>S/ ${p.ingresos.toFixed(2)}</td>
            </tr>`).join('')}</tbody>
          </table></div>`}
    </div>
  </div>`;
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);

}

/* ─── UTILITIES ─────────────────────────────────────────────── */
function catIcon(c)  { return {Sandwich:'🥪',Bebida:'<i data-lucide="coffee"></i>',Snack:'🍿'}[c]||'🍽️'; }
function prodIcon(c) { return catIcon(c); }
function estatBadge(e) {
  return {PENDIENTE:'badge-warning',CONFIRMADO:'badge-info',EN_PREPARACION:'badge-orange',LISTO:'badge-success',ENTREGADO:'badge-neutral',CANCELADO:'badge-danger'}[e]||'badge-neutral';
}
function estatLabel(e) {
  return {PENDIENTE:'Pendiente',CONFIRMADO:'Confirmado',EN_PREPARACION:'En preparación',LISTO:'Listo',ENTREGADO:'Entregado',CANCELADO:'Cancelado'}[e]||e;
}
function fmtDate(d) { return new Date(d).toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function esc(s)     { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ─── SIDEBAR (MOBILE) ──────────────────────────────────────── */
function openSidebarEst()  { document.getElementById('sidebar-est').classList.add('open'); document.getElementById('ov-est').classList.add('visible'); }
function closeSidebarEst() { document.getElementById('sidebar-est').classList.remove('open'); document.getElementById('ov-est').classList.remove('visible'); }
function openSidebarAdm()  { document.getElementById('sidebar-adm').classList.add('open'); document.getElementById('ov-adm').classList.add('visible'); }
function closeSidebarAdm() { document.getElementById('sidebar-adm').classList.remove('open'); document.getElementById('ov-adm').classList.remove('visible'); }

/* Init */
updateBadge();

