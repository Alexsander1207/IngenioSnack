const fs = require('fs');
let lines = fs.readFileSync('public/index.html', 'utf8').split('\n');
let newLines = [];
let skip = 0;
for (let i = 0; i < lines.length; i++) {
  if (skip > 0) { skip--; continue; }
  if (lines[i].includes('}).style.display = s===sc ? \'block\' : \'none\'; });')) {
    skip = 8;
    continue;
  }
  newLines.push(lines[i]);
}
fs.writeFileSync('public/index.html', newLines.join('\n'));
console.log('Fixed lines!');
