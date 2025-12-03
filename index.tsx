import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Configure the worker to match the loaded API version dynamically.
// This prevents version mismatch errors (e.g., API v5.4.449 vs Worker v5.4.394).
// We use the version property exported by the library itself.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);