const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const headInjection = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
`;
content = content.replace(/<title>/, headInjection + '  <title>');

content = content.replace(
/font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;/,
`font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`
);

content = content.replace(/--primary:\s*#6B3E26;/g, `--primary:       #0F172A; /* Slate 900 */`)
.replace(/--primary-light:\s*#9C6244;/g, `--primary-light: #334155; /* Slate 700 */`)
.replace(/--primary-dark:\s*#3E2010;/g, `--primary-dark:  #020617; /* Slate 950 */`)
.replace(/--secondary:\s*#C8973F;/g, `--secondary:     #0284C7; /* Light Blue 600 */`)
.replace(/--accent:\s*#F5E6D3;/g, `--accent:        #F1F5F9; /* Slate 100 */`)
.replace(/--bg:\s*#FAF7F4;/g, `--bg:            #F8FAFC; /* Slate 50 */`)
.replace(/--text:\s*#2D1F14;/g, `--text:          #0F172A;`)
.replace(/--text-muted:\s*#8A6A55;/g, `--text-muted:    #64748B;`)
.replace(/--border:\s*#E8D5C4;/g, `--border:        #E2E8F0;`);

content = content.replace(
/background: linear-gradient\(145deg, #3E2010 0%, #6B3E26 45%, #C8973F 100%\);/g,
`background: linear-gradient(145deg, #020617 0%, #0F172A 45%, #1E293B 100%);`
);

content = content.replace(
/background: linear-gradient\(145deg, #2D1A0E, #4A2A1A\);/g,
`background: linear-gradient(145deg, #0F172A, #1E293B);`
);

content = content.replace(/background:#2D1A0E/g, 'background:#0F172A');

content = content.replace(
/#toast \{([\s\S]*?)background: #2D1F14;/,
`#toast {$1background: #0F172A;`
);

content = content.replace(
/<\/style>/,
`  .lucide { width: 1.2em; height: 1.2em; vertical-align: middle; stroke-width: 2.2; }
    .card-icon .lucide { width: 44px; height: 44px; margin: 0 auto; }
    .login-logo .lucide { width: 60px; height: 60px; margin: 0 auto; }
    .empty-icon .lucide { width: 70px; height: 70px; margin: 0 auto; stroke-width: 1.5; color: var(--text-muted); }
    .cf-icon-big .lucide { width: 68px; height: 68px; margin: 0 auto; color: var(--success); }
    .pa .lucide { width: 58px; height: 58px; margin: 0 auto; color: var(--primary); }
    .user-avatar .lucide { width: 30px; height: 30px; }
  </style>`
);

const emojiReplacements = {
  '<span class="login-logo">☕</span>': '<span class="login-logo"><i data-lucide="coffee"></i></span>',
  '<span class="card-icon">🎓</span>': '<span class="card-icon"><i data-lucide="graduation-cap"></i></span>',
  '<span class="card-icon">🏪</span>': '<span class="card-icon"><i data-lucide="store"></i></span>',
  '☕ IngenioSnack': '<i data-lucide="coffee"></i> IngenioSnack',
  '🏪 IngenioSnack': '<i data-lucide="store"></i> IngenioSnack',
  '<div class="user-avatar">👨‍🍳</div>': '<div class="user-avatar"><i data-lucide="chef-hat"></i></div>',
  '<div class="user-avatar">🎓</div>': '<div class="user-avatar"><i data-lucide="user"></i></div>',
  '🍽️ Menú': '<i data-lucide="book-open"></i> Menú',
  '🛒 Mi Pedido': '<i data-lucide="shopping-cart"></i> Mi Pedido',
  '📋 Mis Pedidos': '<i data-lucide="clipboard-list"></i> Mis Pedidos',
  '⭐ Mi Perfil': '<i data-lucide="user-circle"></i> Mi Perfil',
  '🚪 Cerrar sesión': '<i data-lucide="log-out"></i> Cerrar sesión',
  '📊 Panel': '<i data-lucide="layout-dashboard"></i> Panel',
  '🍞 Productos': '<i data-lucide="package"></i> Productos',
  '📦 Inventario': '<i data-lucide="archive"></i> Inventario',
  '🧾 Pedidos': '<i data-lucide="receipt"></i> Pedidos',
  '📈 Reporte': '<i data-lucide="bar-chart-2"></i> Reporte',
  '<span class="empty-icon">🛒</span>': '<span class="empty-icon"><i data-lucide="shopping-basket"></i></span>',
  '<span class="cf-icon-big">✅</span>': '<span class="cf-icon-big"><i data-lucide="check-circle-2"></i></span>',
  '<span>Estado:</span>': '<span><i data-lucide="activity"></i> Estado:</span>',
  '<span>Total:</span>': '<span><i data-lucide="banknote"></i> Total:</span>',
  '<span>Fecha:</span>': '<span><i data-lucide="calendar"></i> Fecha:</span>',
  '💵 Paga al recoger': '<i data-lucide="wallet"></i> Paga al recoger',
  '💵 El pago es contra entrega': '<i data-lucide="wallet"></i> El pago es contra entrega',
  '💵 Entregar y cobrar': '<i data-lucide="coins"></i> Entregar y cobrar',
  '<span class="pa">🎓</span>': '<span class="pa"><i data-lucide="user"></i></span>',
  '📋 ${esc(data.codigo)}': '<i data-lucide="hash"></i> ${esc(data.codigo)}',
  '✉️ ${esc(data.correo)}': '<i data-lucide="mail"></i> ${esc(data.correo)}',
  '⭐ Programa de fidelidad': '<i data-lucide="star"></i> Programa de fidelidad',
  '🥪 Progreso café gratis': '<i data-lucide="coffee"></i> Progreso café gratis',
  '☕ Cafés gratis disponibles': '<i data-lucide="gift"></i> Cafés gratis disponibles',
  '☕ Canjear café gratis': '<i data-lucide="coffee"></i> Canjear café gratis',
  '🛒 ${ni}': '<i data-lucide="shopping-cart"></i> ${ni}',
  '<div class="si">🧾</div>': '<div class="si"><i data-lucide="receipt"></i></div>',
  '<div class="si">⏳</div>': '<div class="si"><i data-lucide="hourglass"></i></div>',
  '<div class="si">⚡</div>': '<div class="si"><i data-lucide="zap"></i></div>',
  '<div class="si">✅</div>': '<div class="si"><i data-lucide="check-circle"></i></div>',
  '<div class="si">💰</div>': '<div class="si"><i data-lucide="dollar-sign"></i></div>',
  '<div class="si">🎓</div>': '<div class="si"><i data-lucide="users"></i></div>',
  '⛔ Desactivar': '<i data-lucide="slash"></i> Desactivar',
  '✅ Activar': '<i data-lucide="check"></i> Activar',
  '📊 Estadísticas generales': '<i data-lucide="bar-chart-3"></i> Estadísticas generales',
  '🏆 Productos más vendidos': '<i data-lucide="award"></i> Productos más vendidos'
};

for (const [emojiStr, iconStr] of Object.entries(emojiReplacements)) {
  content = content.split(emojiStr).join(iconStr);
}

// Special case
const userAvatarStr = '\\n    <div class="user-avatar">🎓</div>\\n    <div class="user-name">${esc(S.user.nombre)}</div>';
const userAvatarRepl = '\\n    <div class="user-avatar"><i data-lucide="user"></i></div>\\n    <div class="user-name">${esc(S.user.nombre)}</div>';
content = content.replace(userAvatarStr, userAvatarRepl);

content = content.replace(
  /function catIcon\(c\)\s*\{\s*return \{Sandwich:'🥪',Bebida:'☕',Snack:'🍿'\}\[c\]\|\|'🍽️';\s*\}/,
  "function catIcon(c)  { return {Sandwich:'<i data-lucide=\"sandwich\"></i>',Bebida:'<i data-lucide=\"coffee\"></i>',Snack:'<i data-lucide=\"cookie\"></i>'}[c]||'<i data-lucide=\"utensils\"></i>'; }"
);

const rendersToPatch = [
  'renderMenu', 'renderCart', 'renderMyOrders', 'renderProfile',
  'renderPanel', 'renderProductos', 'renderInventario', 'renderPedidos', 'renderReporte'
];
rendersToPatch.forEach(fn => {
  const regex = new RegExp(`(function ${fn}\\(\\) \\{[\\s\\S]*?el\\.innerHTML = [\\s\\S]*?)\\}\\n`);
  content = content.replace(regex, (match, p1) => {
    return match.replace(/\\}\\s*$/, '\\n  lucide.createIcons();\\n}');
  });
});

content = content.replace(
  /function showEst\(sc\) \{([\s\S]*?)\}/,
  "function showEst(sc) {\n  EST_SC.forEach(s => { document.getElementById(`sc-${s}`).style.display = s===sc ? 'block' : 'none'; });\n  document.querySelectorAll('#sidebar-est .nav-link').forEach((l,i) => l.classList.toggle('active', EST_SC[i]===sc));\n  closeSidebarEst();\n  if      (sc==='menu')     renderMenu();\n  else if (sc==='cart')     renderCart();\n  else if (sc==='myorders') renderMyOrders();\n  else if (sc==='profile')  renderProfile();\n  setTimeout(() => lucide.createIcons(), 10);\n}"
);

content = content.replace(
  /function showAdm\(sc\) \{([\s\S]*?)\}/,
  "function showAdm(sc) {\n  ADM_SC.forEach(s => { document.getElementById(`sc-${s}`).style.display = s===sc ? 'block' : 'none'; });\n  document.querySelectorAll('#sidebar-adm .nav-link').forEach((l,i) => l.classList.toggle('active', ADM_SC[i]===sc));\n  S.activeAdmScreen = sc;\n  closeSidebarAdm();\n  if      (sc==='panel')     renderPanel();\n  else if (sc==='productos') renderProductos();\n  else if (sc==='inventario')renderInventario();\n  else if (sc==='pedidos')   renderPedidos();\n  else if (sc==='reporte')   renderReporte();\n  setTimeout(() => lucide.createIcons(), 10);\n}"
);

content = content.replace(/updateBadge\(\);\n</, "updateBadge();\nlucide.createIcons();\n<");
content = content.replace(/renderCart\(\);\n  toast/g, "renderCart();\n  setTimeout(() => lucide.createIcons(), 10);\n  toast");
content = content.replace(/function filterTab\(t\) \{ S\.pedidosTab=t; renderPedidos\(\); \}/g, "function filterTab(t) { S.pedidosTab=t; renderPedidos(); setTimeout(() => lucide.createIcons(), 10); }");

fs.writeFileSync(targetFile, content);
console.log('Successfully refactored index.html');
