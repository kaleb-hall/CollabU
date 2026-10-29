import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Fonts load from our own bundle (no Google request). Latin only, to keep the CSS small.
import '@fontsource/young-serif/latin-400.css'
import '@fontsource-variable/hanken-grotesk/wght.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
