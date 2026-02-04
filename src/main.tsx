import { createRoot } from 'react-dom/client'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App.tsx'
import './index.css'

// Initialize Google Tag Manager
const initGTM = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    // Create dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Inject GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WX8PKJXH';
    document.head.insertBefore(script, document.head.firstChild);

    // Inject noscript iframe for users with JS disabled
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-WX8PKJXH';
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }
};

// Initialize GTM immediately before React renders
initGTM();

const container = document.getElementById("root");

// Get reCAPTCHA site key from environment
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

if (container) {
  const root = createRoot(container);
  root.render(
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <App />
    </GoogleReCaptchaProvider>
  );
  
  // Remove loading overlay after React mounts
  requestAnimationFrame(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      // Remove from DOM after fade animation
      setTimeout(() => overlay.remove(), 300);
    }
  });
}
