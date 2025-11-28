import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import ShopifyProducts from './components/ShopifyProducts'
import NovaEngelProducts from './components/NovaEngelProducts'

function App() {
  const [currentPage, setCurrentPage] = useState('nova-engel')
  const [showAlert, setShowAlert] = useState(false)
  const [priceRate, setPriceRate] = useState(1)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePriceRateUpdate = (newRate) => {
    setPriceRate(newRate)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        currentPage={currentPage} 
        onPageChange={handlePageChange} 
        showAlert={showAlert}
        onPriceRateUpdate={handlePriceRateUpdate}
      />

      {/* Page Content */}
      {currentPage === 'shopify' && <ShopifyProducts />}
      {currentPage === 'nova-engel' && <NovaEngelProducts priceRate={priceRate} />}
    </div>
  )
}

export default App