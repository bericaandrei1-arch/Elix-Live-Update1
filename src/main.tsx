import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Debug: catch any unhandled errors that cause white screen
// window.addEventListener('error', (e) => {
//   document.body.innerHTML = `<div style="padding:20px;color:red;font-family:monospace;background:#111;min-height:100vh"><h2>⚠️ App Crash</h2><pre>${e.message}\n\n${e.filename}:${e.lineno}</pre></div>`;
// });
// window.addEventListener('unhandledrejection', (e) => {
//   document.body.innerHTML = `<div style="padding:20px;color:orange;font-family:monospace;background:#111;min-height:100vh"><h2>⚠️ Async Crash</h2><pre>${e.reason}</pre></div>`;
// });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* 
        Using import.meta.env.BASE_URL ensures the router understands the subpath 
        when deployed to GitHub Pages (e.g. /elix-star-live-web/)
      */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
