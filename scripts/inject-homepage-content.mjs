/**
 * Post-build script to inject loading overlay into index.html
 * 
 * This script runs after Vite build and:
 * 1. Injects a loading overlay (visible by default)
 * 
 * React removes the overlay after mounting, providing a smooth transition.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// CSS for the loading overlay - inline in head
const overlayCSS = `
<style id="seo-overlay-styles">
  #loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: hsl(210 20% 98%);
    transition: opacity 0.3s ease-out;
  }
  #loading-overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }
  #loading-overlay .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid hsl(214 32% 91%);
    border-top-color: hsl(222 47% 20%);
    border-radius: 50%;
    animation: seo-spin 1s linear infinite;
  }
  @keyframes seo-spin {
    to { transform: rotate(360deg); }
  }
</style>`;

// Loading overlay HTML
const overlayHTML = `
  <div id="loading-overlay">
    <img src="/ld-logo.svg" alt="Dispute Letters" style="height:40px;margin-bottom:16px;">
    <div class="spinner"></div>
  </div>`;

function injectOverlay() {
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  dist/index.html not found, skipping overlay injection');
    return;
  }
  
  let html = fs.readFileSync(indexPath, 'utf-8');
  
  // 1. Inject overlay CSS into <head> (before </head>)
  html = html.replace('</head>', `${overlayCSS}\n</head>`);
  
  // 2. Inject loading overlay after <body> tag
  html = html.replace('<body>', `<body>\n${overlayHTML}`);
  
  fs.writeFileSync(indexPath, html);
  console.log('✅ Injected loading overlay into dist/index.html');
}

// Run the injection
injectOverlay();
