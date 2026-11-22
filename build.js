// Concatenate sources into one self-contained page.
const fs = require('fs');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const scripts = ['content.js', 'library.js', 'layouts.js', 'core.js', 'ui.js', 'app.js'].map(src).join('\n');
if (scripts.includes('</script')) throw new Error('script contains </script');
const html = src('index.template.html')
  .replace('/*STYLE*/', () => src('style.css'))
  .replace('/*SCRIPTS*/', () => scripts)
  // home screen icon: the Keycap T (icons/), embedded so the single page carries it
  .replace('/*ICON_SVG*/', () => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(__dirname, 'icons', 'icon.svg')).toString('base64'))
  .replace('/*ICON_180*/', () => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'icons', 'icon-180.png')).toString('base64'));
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
console.log('built dist/index.html', (html.length / 1024).toFixed(1) + ' KB');
