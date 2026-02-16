import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// GTM is now loaded dynamically via useCookieConsent after user grants consent

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
  
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
