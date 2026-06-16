const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, callback);
    } else {
      callback(filepath);
    }
  });
};

// 1. Replace 'crimson' with 'gold' in all TS/TSX files
walkSync('src', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes('crimson')) {
      content = content.replace(/crimson/g, 'gold');
      fs.writeFileSync(filepath, content);
      console.log('Updated:', filepath);
    }
  }
});

// 2. Rewrite globals.css for a lighter theme
const globalsPath = 'src/app/globals.css';
let css = fs.readFileSync(globalsPath, 'utf8');

// Replace crimson with gold
css = css.replace(/crimson/g, 'gold');

// Replace hex colors
css = css.replace(/#e11d48/g, '#D4AF6A');
css = css.replace(/#f43f5e/g, '#E5C48A'); // slightly lighter gold for gradient
css = css.replace(/rgb\(225 29 72/g, 'rgb(212 175 106'); // for the rgba utilities

// Change color-scheme
css = css.replace('color-scheme: dark;', 'color-scheme: light;');

// Make background bright and foreground dark in :root and .dark
const lightTheme = `
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.1 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1 0 0);
  --primary: #D4AF6A;
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0 0);
  --secondary-foreground: oklch(0.2 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.4 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.1 0 0);
  --destructive: oklch(0.6 0.2 20);
  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: #D4AF6A;
  --gold: #D4AF6A;
  --gold-foreground: oklch(0.98 0 0);
  --chart-1: #D4AF6A;
  --chart-2: oklch(0.7 0.1 50);
  --chart-3: oklch(0.6 0.1 80);
  --chart-4: oklch(0.8 0.1 110);
  --chart-5: oklch(0.9 0.1 140);
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.2 0 0);
  --sidebar-primary: #D4AF6A;
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.95 0 0);
  --sidebar-accent-foreground: oklch(0.1 0 0);
  --sidebar-border: oklch(0.9 0 0);
  --sidebar-ring: #D4AF6A;
`;

// Replace the contents of :root { ... } and .dark { ... }
css = css.replace(/:root\s*\{[^}]+\}/, ':root {' + lightTheme + '}');
css = css.replace(/\.dark\s*\{[^}]+\}/, '.dark {' + lightTheme + '}');

// Make glass-card brighter
css = css.replace('background: oklch(0.1 0 0 / 80%);', 'background: oklch(1 0 0 / 80%);');
css = css.replace('border: 1px solid oklch(0.18 0 0);', 'border: 1px solid oklch(0.9 0 0);');

// Make scrollbar thumb darker
css = css.replace('background: oklch(0.25 0 0);', 'background: oklch(0.8 0 0);');
css = css.replace('background: oklch(0.35 0 0);', 'background: oklch(0.7 0 0);');

fs.writeFileSync(globalsPath, css);
console.log('Updated globals.css');
