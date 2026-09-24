import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Auto-reload quando o Vite não achar um chunk após novo deploy
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

// Captura erros de import dinâmico (chunk obsoleto após deploy)
const origOnError = window.onerror;
window.onerror = (msg, src, _line, _col, err) => {
  if (
    (typeof msg === 'string' && msg.includes('dynamically imported module')) ||
    (err instanceof TypeError && err.message.includes('Failed to fetch dynamically imported module'))
  ) {
    window.location.reload();
    return true;
  }
  return origOnError ? origOnError(msg, src, _line, _col, err) : false;
};

window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || '';
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('dynamically imported module')) {
    e.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
