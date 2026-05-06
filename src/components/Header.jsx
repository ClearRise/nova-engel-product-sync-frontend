import React, { useState, useEffect } from 'react'
import PriceRateModal from './PriceRateModal'
import { apiFetch } from '../apiClient'

function Header({ currentPage, onPageChange, showAlert, onPriceRateUpdate }) {
  const [priceRate, setPriceRate] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceRate();
  }, []);

  const fetchPriceRate = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/price-rate');
      const data = await response.json();
      
      if (data.success) {
        setPriceRate(data.rate);
        onPriceRateUpdate(data.rate);
      }
    } catch (error) {
      console.error('Failed to fetch price rate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateUpdate = (newRate) => {
    setPriceRate(newRate);
    onPriceRateUpdate(newRate);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 mr-8">
              NovaEngel Sync
            </h1>
            
            {/* Navigation */}
            <nav className="flex space-x-8">
              {/* <button
                onClick={() => onPageChange('shopify')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'shopify'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Shopify Products
              </button> */}
              <button
                onClick={() => onPageChange('nova-engel')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'nova-engel'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Nova Engel Products
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Price Rate Display */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Price Rate:</span>
              <span className="text-sm font-medium text-gray-900">
                {loading ? '...' : `${priceRate}x`}
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
            </div>
            
            {showAlert && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm">
                ⚠️ Alert: Sync operation failed. Please check your connection.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Rate Modal */}
      <PriceRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRateUpdate={handleRateUpdate}
      />
    </header>
  )
}

export default Header 