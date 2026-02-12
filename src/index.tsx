import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Defer ResizeObserver callbacks to next frame to avoid "loop completed with undelivered notifications"
const OriginalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class extends OriginalResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

// Suppress the warning if it still fires (e.g. from libraries we don't control)
window.addEventListener(
  'error',
  (e: ErrorEvent) => {
    if (
      e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded'
    ) {
      e.stopImmediatePropagation();
      return true;
    }
  },
  true
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

