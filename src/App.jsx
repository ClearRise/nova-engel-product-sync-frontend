import './App.css'
import ErrorBoundary from './components/ErrorBoundary'
import NovaEngelProducts from './components/NovaEngelProducts'
import NotificationContainer from './components/Notification'

function App() {
  console.log('App component rendering...')
  
  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-50 overflow-hidden">
        {/* Page Content */}
        <NovaEngelProducts />
        
        {/* Notification Container */}
        <NotificationContainer />
      </div>
    </ErrorBoundary>
  )
}

export default App