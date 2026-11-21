// Concatenate sources into one self-contained page.
const fs = require('fs');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const scripts = ['content.js', 'library.js', 'layouts.js', 'core.js', 'ui.js', 'app.js'].map(src).join('\n');
if (scripts.includes('</script')) throw new Error('script contains </script');
const html = src('index.template.html')
  .replace('/*STYLE*/', () => src('style.css'))
  .replace('/*SCRIPTS*/', () => scripts);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
console.log('built dist/index.html', (html.length / 1024).toFixed(1) + ' KB');
