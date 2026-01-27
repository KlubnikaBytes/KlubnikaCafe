// 1. Silence all console outputs immediately
if (typeof window !== 'undefined') {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  // console.error = () => {}; // Leave this if you want to see if the app actually crashes
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)