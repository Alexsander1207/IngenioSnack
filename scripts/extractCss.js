const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
let style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
fs.writeFileSync('client/src/index.css', style, 'utf8');
console.log('CSS extracted');

