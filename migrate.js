const fs = require('fs');

const appJsx = fs.readFileSync('src/App.jsx', 'utf-8');
const newPageTsx = '"use client";\n' + appJsx.replace('import "./App.css";', '');
fs.writeFileSync('src/app/page.tsx', newPageTsx);

const globalsCss = fs.readFileSync('src/app/globals.css', 'utf-8');
const indexCss = fs.readFileSync('src/index.css', 'utf-8');
const appCss = fs.readFileSync('src/App.css', 'utf-8');

fs.writeFileSync('src/app/globals.css', globalsCss + '\n' + indexCss + '\n' + appCss);

console.log('Migration complete');
