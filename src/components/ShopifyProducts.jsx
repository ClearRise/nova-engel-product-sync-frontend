import { useState } from 'react'
import { products as shopifyProducts } from '../sample-data/products'

function ShopifyProducts() {
  const [importNovaEngel, setImportNovaEngel] = useState(false)
  const [periodicShopifyImport, setPeriodicShopifyImport] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [fetchedProducts, setFetchedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const itemsPerPage = 10

  // Use fetched products if available, otherwise use sample data
  const displayProducts = fetchedProducts.length > 0 ? fetchedProducts : shopifyProducts

  // Mock statistics
  const stats = {
    shopifyImported: displayProducts.length,
    novaEngelImportable: 23,
    novaEngelUpdated: 15,
    shopifyUpdated: 12,
    failedUpdates: 3
  }

  // Fetch Shopify products
  const fetchShopifyProducts = async () => {
    setIsLoading(true)
    setFetchError(null)
    
    try {
      const accessToken = import.meta.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN
      const shopDomain = import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN

      if (!accessToken || !shopDomain) {
        throw new Error('Missing Shopify credentials. Please check your .env file.')
      }

      const response = await fetch(`https://${shopDomain}/admin/api/2023-10/products.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform Shopify data to match our expected format
      const transformedProducts = data.products.map(product => ({
        shopifyId: product.id.toString(),
        shopifyTitle: product.title,
        novaEngelId: `NE${product.id.toString().padStart(3, '0')}`, // Generate Nova Engel ID
        novaEngelUpdate: false, // Default to false
        shopifyUpdate: false, // Default to false
      }))

      setFetchedProducts(transformedProducts)
      setCurrentPage(1) // Reset to first page when new data is loaded
      
    } catch (error) {
      console.error('Error fetching Shopify products:', error)
      setFetchError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(displayProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = displayProducts.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Sync Settings</h2>
            
            {/* Import Nova Engel Checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importNovaEngel}
                  onChange={(e) => setImportNovaEngel(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Import Nova Engel product list
                </span>
              </label>
            </div>

            {/* Periodic Shopify Import Checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={periodicShopifyImport}
                  onChange={(e) => setPeriodicShopifyImport(e.target.checked)}
                  disabled={!importNovaEngel}
                  className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0 ${
                    importNovaEngel 
                      ? 'text-blue-600' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                />
                <span className={`ml-3 text-sm font-medium ${
                  importNovaEngel ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  Periodically import products from Shopify
                </span>
              </label>
            </div>

            {/* Fetch Shopify Products Button */}
            <div className="mb-6">
              <button
                onClick={fetchShopifyProducts}
                disabled={isLoading}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching...
                  </div>
                ) : (
                  'Fetch Shopify Products'
                )}
              </button>
              
              {fetchError && (
                <div className="mt-2 text-sm text-red-600">
                  {fetchError}
                </div>
              )}
              
              {fetchedProducts.length > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Successfully fetched {fetchedProducts.length} products
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shopify Products Imported:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.shopifyImported}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nova Engel Importable:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.novaEngelImportable}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nova Engel Updated:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.novaEngelUpdated}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shopify Updated:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.shopifyUpdated}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed Updates:</span>
                  <span className="text-sm font-medium text-red-600">{stats.failedUpdates}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Shopify Product List</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shopify Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shopify Product Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nova Engel ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nova Engel Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shopify Update
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.map((product, index) => (
                    <tr key={startIndex + index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.shopifyId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.shopifyTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.novaEngelId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.novaEngelUpdate 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.novaEngelUpdate ? '✓ Updated' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.shopifyUpdate 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.shopifyUpdate ? '✓ Updated' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, displayProducts.length)} of {displayProducts.length} results
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShopifyProducts