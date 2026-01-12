import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Standard client-side rendering
// For SSG builds, vite-ssg will handle hydration automatically
const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
