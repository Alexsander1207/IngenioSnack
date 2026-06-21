const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const regexAdm = /setTimeout\(\(\) => lucide\.createIcons\(\), 10\);\n\}\`\)\.style\.display = s===sc \? 'block' : 'none'; \}\);\n\s*document\.querySelectorAll\('#sidebar-adm \.nav-link'\)\.forEach\(\(l,i\) => l\.classList\.toggle\('active', ADM_SC\[i\]===sc\)\);\n\s*S\.activeAdmScreen = sc;\n\s*closeSidebarAdm\(\);\n\s*if\s*\(sc==='panel'\)\s*renderPanel\(\);\n\s*else if \(sc==='productos'\)\s*renderProductos\(\);\n\s*else if \(sc==='inventario'\)renderInventario\(\);\n\s*else if \(sc==='pedidos'\)\s*renderPedidos\(\);\n\s*else if \(sc==='reporte'\)\s*renderReporte\(\);\n\}/g;

html = html.replace(regexAdm, "setTimeout(() => lucide.createIcons(), 10);\n}");

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fixed with regex.");
