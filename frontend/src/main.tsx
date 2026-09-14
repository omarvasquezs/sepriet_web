import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Automatically transform typed values in text inputs and textareas to uppercase (except password)
document.addEventListener(
  'input',
  (e) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !('value' in target)) return;

    // Skip password and non-text inputs
    if (
      target.type === 'password' ||
      target.type === 'file' ||
      target.type === 'checkbox' ||
      target.type === 'radio' ||
      target.type === 'date' ||
      target.type === 'datetime-local' ||
      target.type === 'time' ||
      target.type === 'color' ||
      target.type === 'range'
    ) {
      return;
    }

    if (typeof target.value === 'string') {
      const upper = target.value.toUpperCase();
      if (target.value !== upper) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        target.value = upper;
        if (start !== null && end !== null) {
          target.setSelectionRange(start, end);
        }
      }
    }
  },
  true
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
