const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const target1 = `  setTimeout(() => lucide.createIcons(), 10);\n}\`).style.display = s===sc ? 'block' : 'none'; });\n  document.querySelectorAll('#sidebar-est .nav-link').forEach((l,i) => l.classList.toggle('active', EST_SC[i]===sc));\n  closeSidebarEst();\n  if      (sc==='menu')     renderMenu();\n  else if (sc==='cart')     renderCart();\n  else if (sc==='myorders') renderMyOrders();\n  else if (sc==='profile')  renderProfile();\n}`;

const replace1 = `  setTimeout(() => lucide.createIcons(), 10);\n}`;

const target2 = `  setTimeout(() => lucide.createIcons(), 10);\n}\`).style.display = s===sc ? 'block' : 'none'; });\n  document.querySelectorAll('#sidebar-adm .nav-link').forEach((l,i) => l.classList.toggle('active', ADM_SC[i]===sc));\n  S.activeAdmScreen = sc;\n  closeSidebarAdm();\n  if      (sc==='panel')     renderPanel();\n  else if (sc==='productos') renderProductos();\n  else if (sc==='inventario')renderInventario();\n  else if (sc==='pedidos')   renderPedidos();\n  else if (sc==='reporte')   renderReporte();\n}`;

const replace2 = `  setTimeout(() => lucide.createIcons(), 10);\n}`;

if (html.includes(target1)) {
  html = html.replace(target1, replace1);
  console.log("Fixed showEst");
}

if (html.includes(target2)) {
  html = html.replace(target2, replace2);
  console.log("Fixed showAdm");
}

fs.writeFileSync('public/index.html', html, 'utf8');
