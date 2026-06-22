const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Head injections
const headInjection = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
`;
html = html.replace('</head>', headInjection + '</head>');

// 2. CSS updates
html = html.replace("font-family: system-ui, -apple-system, sans-serif;", "font-family: 'Inter', system-ui, -apple-system, sans-serif;");

// Update CSS vars for slate theme
html = html.replace(/--primary:\s*#[0-9a-fA-F]+;/g, "--primary: #0F172A;");
html = html.replace(/--primary-light:\s*#[0-9a-fA-F]+;/g, "--primary-light: #334155;");
html = html.replace(/--primary-dark:\s*#[0-9a-fA-F]+;/g, "--primary-dark: #020617;");
html = html.replace(/--secondary:\s*#[0-9a-fA-F]+;/g, "--secondary: #0284C7;");

// Login background
const oldLoginBg = "background: linear-gradient(145deg, #3A2618 0%, #2A1A0F 45%, #1A0F08 100%);";
const newLoginBg = "background: linear-gradient(rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.9)), url('fondo-login.jpg') center/cover no-repeat;";
html = html.replace(oldLoginBg, newLoginBg);
// Fallback if it was different
html = html.replace("background: linear-gradient(145deg, #020617 0%, #0F172A 45%, #1E293B 100%);", newLoginBg);

// Add CSS for lucide
const lucideCss = `
    .lucide { width: 1.2em; height: 1.2em; vertical-align: middle; stroke-width: 2.2; }
    .card-icon .lucide { width: 44px; height: 44px; margin: 0 auto; }
    .login-logo .lucide { width: 60px; height: 60px; margin: 0 auto; }
    .empty-icon .lucide { width: 70px; height: 70px; margin: 0 auto; stroke-width: 1.5; color: var(--text-muted); }
    .cf-icon-big .lucide { width: 68px; height: 68px; margin: 0 auto; color: var(--success); }
    .pa .lucide { width: 58px; height: 58px; margin: 0 auto; color: var(--primary); }
    .user-avatar .lucide { width: 30px; height: 30px; }
  </style>`;
html = html.replace('</style>', lucideCss);

// 3. Emoji replacements
const emojiMap = {
  '☕': '<i data-lucide="coffee"></i>',
  '🎓': '<i data-lucide="graduation-cap"></i>',
  '🏪': '<i data-lucide="store"></i>',
  '📖': '<i data-lucide="book-open"></i>',
  '🛒': '<i data-lucide="shopping-cart"></i>',
  '📋': '<i data-lucide="clipboard-list"></i>',
  '👤': '<i data-lucide="user-circle"></i>',
  '🚪': '<i data-lucide="log-out"></i>',
  '🍔': '<i data-lucide="pizza"></i>',
  '🥤': '<i data-lucide="cup-soda"></i>',
  '🍩': '<i data-lucide="cookie"></i>',
  '📦': '<i data-lucide="package"></i>',
  '🛍️': '<i data-lucide="shopping-basket"></i>',
  '💳': '<i data-lucide="wallet"></i>',
  '🥇': '<i data-lucide="star"></i>',
  '🎁': '<i data-lucide="gift"></i>',
  '🧾': '<i data-lucide="receipt"></i>',
  '⏳': '<i data-lucide="hourglass"></i>',
  '⚡': '<i data-lucide="zap"></i>',
  '✅': '<i data-lucide="check-circle"></i>',
  '💵': '<i data-lucide="dollar-sign"></i>',
  '👥': '<i data-lucide="users"></i>',
  '🚫': '<i data-lucide="slash"></i>',
  '✔️': '<i data-lucide="check"></i>',
  '✏️': '<i data-lucide="edit-2"></i>',
  '🗑️': '<i data-lucide="trash-2"></i>',
  '📧': '<i data-lucide="mail"></i>'
};

for (const [emoji, icon] of Object.entries(emojiMap)) {
  html = html.split(emoji).join(icon);
}

// 4. Inject lucide.createIcons() calls whenever HTML is rendered.
// We can use a MutationObserver or just patch updateBadge and the show functions.
const injection = `
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);
`;
html = html.replace(/function showEst\(sc\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/function showAdm\(sc\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/function renderMenu\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/function renderCart\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/function renderMyOrders\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/function renderProfile\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/async function renderPanel\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/async function renderProductos\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/async function renderInventario\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/async function renderPedidos\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));
html = html.replace(/async function renderReporte\(\) \{[\s\S]*?\n\}/g, (match) => match.replace('\n}', injection + '\n}'));

// Run it once on load
html = html.replace('</body>', `<script>document.addEventListener('DOMContentLoaded', () => { setTimeout(()=>lucide.createIcons(), 50); });</script></body>`);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Successfully refactored using precise string replacement.');
