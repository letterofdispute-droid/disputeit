/**
 * Post-build script to inject SEO content into index.html
 * 
 * This script runs after Vite build and:
 * 1. Injects a loading overlay (visible by default)
 * 2. Injects pre-rendered HTML content into <div id="root">
 * 
 * Bots see the full content in page source.
 * Humans see the loading overlay while React loads, then smooth transition.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// All 13 template categories with their data
const categories = [
  { id: 'refunds', name: 'Refunds & Purchases', description: 'Get your money back for products or services that did not meet expectations.' },
  { id: 'housing', name: 'Landlord & Housing', description: 'Request repairs, address deposit disputes, or document housing issues.' },
  { id: 'travel', name: 'Travel & Transportation', description: 'Claim compensation for flight delays, lost baggage, or booking issues.' },
  { id: 'damaged-goods', name: 'Damaged & Defective Goods', description: 'File complaints for items that arrived broken, defective, or not as described.' },
  { id: 'utilities', name: 'Utilities & Telecommunications', description: 'Dispute billing errors, service quality issues, or contract problems.' },
  { id: 'financial', name: 'Financial Services', description: 'Challenge bank fees, credit report errors, identity theft, debt collection, or data access requests.' },
  { id: 'insurance', name: 'Insurance Claims', description: 'Appeal denied claims, dispute settlements, or challenge cancellations.' },
  { id: 'vehicle', name: 'Vehicle & Auto', description: 'Address dealer complaints, warranty disputes, lemon law claims, or repair issues.' },
  { id: 'healthcare', name: 'Healthcare & Medical Billing', description: 'Dispute medical bills, insurance denials, coding errors, debt collection, or provider complaints.' },
  { id: 'employment', name: 'Employment & Workplace', description: 'Address wage issues, workplace discrimination, or termination disputes.' },
  { id: 'ecommerce', name: 'E-commerce & Online Services', description: 'Report seller issues, account problems, or data privacy requests.' },
  { id: 'hoa', name: 'Neighbor & HOA Disputes', description: 'Address community issues, fee disputes, or neighbor conflicts.' },
  { id: 'contractors', name: 'Contractors & Home Improvement', description: 'Dispute poor workmanship, project abandonment, cost overruns, or service issues.' },
];

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
  /* Hide static content visually but keep for SEO */
  #seo-static-content {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
</style>`;

// Loading overlay HTML
const overlayHTML = `
  <div id="loading-overlay">
    <img src="/ld-logo.svg" alt="Dispute Letters" style="height:40px;margin-bottom:16px;">
    <div class="spinner"></div>
  </div>`;

// Generate category cards HTML
function generateCategoryCards() {
  return categories.map(cat => `
          <a href="/templates/${cat.id}" style="display:block;padding:1rem;border:1px solid #e5e7eb;border-radius:0.5rem;">
            <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:0.5rem;">${cat.name}</h3>
            <p style="color:#6b7280;font-size:0.875rem;">${cat.description}</p>
          </a>`).join('');
}

// Pre-rendered HTML content for SEO
const staticContent = `
  <div id="seo-static-content">
    <header>
      <nav style="display:flex;gap:1.5rem;padding:1rem;">
        <a href="/" style="font-weight:bold;">Dispute Letters</a>
        <a href="/templates">Letter Templates</a>
        <a href="/how-it-works">How It Works</a>
        <a href="/faq">FAQ</a>
        <a href="/pricing">Pricing</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    
    <main>
      <section style="padding:3rem 1rem;text-align:center;">
        <h1 style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem;">Professional Dispute Letters, Without the Guesswork</h1>
        <p style="font-size:1.25rem;color:#6b7280;max-width:42rem;margin:0 auto 2rem;">
          Pre-validated letter templates with controlled language—no prompt engineering, no trial and error. Get a ready-to-send complaint letter in minutes.
        </p>
        <a href="/templates" style="display:inline-block;padding:0.75rem 1.5rem;background:#1a2744;color:white;border-radius:0.5rem;text-decoration:none;">Browse All Templates</a>
      </section>
      
      <section id="letters" style="padding:3rem 1rem;">
        <h2 style="font-size:1.875rem;font-weight:bold;text-align:center;margin-bottom:2rem;">Choose Your Letter Type</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;max-width:1200px;margin:0 auto;">
${generateCategoryCards()}
        </div>
      </section>
      
      <section style="padding:3rem 1rem;background:#f9fafb;">
        <h2 style="font-size:1.875rem;font-weight:bold;text-align:center;margin-bottom:2rem;">How It Works</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;max-width:900px;margin:0 auto;">
          <div style="text-align:center;">
            <div style="font-size:1.5rem;font-weight:bold;color:#1a2744;margin-bottom:0.5rem;">1</div>
            <h3 style="font-weight:600;margin-bottom:0.5rem;">Choose Your Template</h3>
            <p style="color:#6b7280;">Select from 450+ professionally crafted letter templates.</p>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.5rem;font-weight:bold;color:#1a2744;margin-bottom:0.5rem;">2</div>
            <h3 style="font-weight:600;margin-bottom:0.5rem;">Fill In Your Details</h3>
            <p style="color:#6b7280;">Answer simple questions to personalize your letter.</p>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.5rem;font-weight:bold;color:#1a2744;margin-bottom:0.5rem;">3</div>
            <h3 style="font-weight:600;margin-bottom:0.5rem;">Download & Send</h3>
            <p style="color:#6b7280;">Get your letter as PDF or Word document, ready to send.</p>
          </div>
        </div>
      </section>
      
      <section style="padding:3rem 1rem;">
        <h2 style="font-size:1.875rem;font-weight:bold;text-align:center;margin-bottom:2rem;">What You're Really Paying For</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;max-width:900px;margin:0 auto;">
          <div style="text-align:center;padding:1.5rem;">
            <h3 style="font-weight:600;margin-bottom:0.5rem;">Certainty</h3>
            <p style="color:#6b7280;">Pre-validated letter templates with tested structure. No guessing, no prompt engineering.</p>
          </div>
          <div style="text-align:center;padding:1.5rem;">
            <h3 style="font-weight:600;margin-bottom:0.5rem;">Correctness</h3>
            <p style="color:#6b7280;">Legal-safe language, correct tone. No misleading statements that could weaken your claim.</p>
          </div>
          <div style="text-align:center;padding:1.5rem;">
            <h3 style="font-weight:600;margin-bottom:0.5rem;">Time Saved</h3>
            <p style="color:#6b7280;">5 minutes, not 5 hours. Skip the back-and-forth with generic AI.</p>
          </div>
        </div>
      </section>
    </main>
    
    <footer style="padding:2rem 1rem;border-top:1px solid #e5e7eb;text-align:center;">
      <nav style="display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-bottom:1.5rem;">
        <a href="/templates">Letter Templates</a>
        <a href="/how-it-works">How It Works</a>
        <a href="/pricing">Pricing</a>
        <a href="/faq">FAQ</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/disclaimer">Disclaimer</a>
      </nav>
      <p style="color:#6b7280;font-size:0.875rem;">
        Dispute Letters helps you write professional complaint letters. Our templates are for informational purposes only and do not constitute legal advice.
      </p>
      <p style="color:#9ca3af;font-size:0.75rem;margin-top:1rem;">© ${new Date().getFullYear()} Dispute Letters. All rights reserved.</p>
    </footer>
  </div>`;

function injectContent() {
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  dist/index.html not found, skipping content injection');
    return;
  }
  
  let html = fs.readFileSync(indexPath, 'utf-8');
  
  // 1. Inject overlay CSS into <head> (before </head>)
  html = html.replace('</head>', `${overlayCSS}\n</head>`);
  
  // 2. Inject loading overlay after <body> tag
  html = html.replace('<body>', `<body>\n${overlayHTML}`);
  
  // 3. Inject static content into <div id="root">
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${staticContent}\n  </div>`
  );
  
  fs.writeFileSync(indexPath, html);
  console.log('✅ Injected SEO content and loading overlay into dist/index.html');
}

// Run the injection
injectContent();
