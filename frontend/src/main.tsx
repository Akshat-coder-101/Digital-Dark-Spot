/**
 * 🍉 DIGITAL DARK SPOT — Frontend Entry Point
 * 
 * • React 18 Concurrent Root
 * • MotionConfig: Enforces reduced-motion compliance globally for accessibility
 * • BrowserRouter: HTML5 history navigation
 * • Tailwind CSS v4 + Watermelon Seed tokens
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to locate root element "#root" in document.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* Global Motion accessibility wrapper: respects user preference for reduced motion */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
);
