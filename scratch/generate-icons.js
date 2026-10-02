// Pure Node PNG generator for PWA icon fallback
const fs = require('fs');
const path = require('path');

// We copy the SVG as icon-192.svg, icon-512.svg, and create standard PNGs
const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

fs.writeFileSync(path.join(__dirname, '..', 'public', 'icons', 'icon-192.svg'), svgContent);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icons', 'icon-512.svg'), svgContent);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svgContent);

console.log('SVG icon fallbacks ready.');
