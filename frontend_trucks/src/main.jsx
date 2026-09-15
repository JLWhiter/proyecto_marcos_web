import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'
import { TasaCambioProvider } from './context/TasaCambioContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <TasaCambioProvider>
          <App />
        </TasaCambioProvider>
      </NavigationProvider>
    </AuthProvider>
  </StrictMode>,
)
