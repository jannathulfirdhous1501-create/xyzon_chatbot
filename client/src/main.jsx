import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css' // FIXED: Pointed to the correct location
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)