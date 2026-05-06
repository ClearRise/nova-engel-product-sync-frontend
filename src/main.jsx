import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('Main.jsx loading...')
console.log('Root element:', document.getElementById('root'))

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('Root element not found!')
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>'
  } else {
    const root = createRoot(rootElement)
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
    console.log('App rendered successfully')
  }
} catch (error) {
  console.error('Error rendering app:', error)
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}<br/><pre>${error.stack}</pre></div>`
}
