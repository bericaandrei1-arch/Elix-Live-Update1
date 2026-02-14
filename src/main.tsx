import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Debug: Log unhandled errors but don't crash the UI unless critical
window.addEventListener('error', (e) => {
  console.error('Global Error:', e.message, e.filename, e.lineno);
  // Only replace body if it's a catastrophic error that stops React from rendering
  if (e.message.includes('Minified React error')) {
    document.body.innerHTML = `<div style="padding:20px;color:red;font-family:monospace;background:#111;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center">
      <div>
        <h2 style="margin-bottom:10px">⚠️ Application Error</h2>
        <p style="color:#888;margin-bottom:20px">Something went wrong. Please reload.</p>
        <button onclick="window.location.reload()" style="padding:10px 20px;background:#fff;color:#000;border:none;border-radius:20px;cursor:pointer;font-weight:bold">Reload App</button>
      </div>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.warn('Unhandled Promise Rejection:', e.reason);
  // Don't crash the UI for async errors (like failed analytics or non-critical fetches)
  e.preventDefault(); 
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (e) {
  console.error('Root render failed:', e);
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:monospace;background:#111;min-height:100vh"><h2>⚠️ Root Render Crash</h2><pre>${e instanceof Error ? e.message : String(e)}</pre></div>`;
}
