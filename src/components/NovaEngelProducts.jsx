import { useState, useEffect, useRef } from 'react'

function NovaEngelProducts({ priceRate = 1 }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [fetchedProducts, setFetchedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [pageInput, setPageInput] = useState(1)
  const [imageLoading, setImageLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationResults, setRegistrationResults] = useState([])
  const [registeredProductIds, setRegisteredProductIds] = useState([]) // Array of Nova Engel product IDs already registered
  const [isLoadingRegisteredProducts, setIsLoadingRegisteredProducts] = useState(false)
  const itemsPerPage = 100
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [brandList, setBrandList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchItemsPerPage, setSearchItemsPerPage] = useState(100);
  const [brandInput, setBrandInput] = useState('');
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const brandInputRef = useRef();
  const categoryInputRef = useRef();
  const [searchPageInput, setSearchPageInput] = useState(1);

  // Check if product is already registered
  const isProductRegistered = (productId) => {
    return registeredProductIds.includes(productId.toString())
  }

  // Calculate adjusted price
  const getAdjustedPrice = (originalPrice) => {
    return (parseFloat(originalPrice || 0) * priceRate).toFixed(2);
  };

  // Fetch registered products from Shopify
  const fetchRegisteredProducts = async () => {
    setIsLoadingRegisteredProducts(true);
    try {
      const response = await fetch('/api/registered-products');
      if (!response.ok) {
        throw new Error(`Failed to fetch registered products: ${response.statusText}`);
      }
      const data = await response.json();
      setRegisteredProductIds(data.registeredProductIds || []);
    } catch (error) {
      console.error('Error fetching registered products:', error);
      setFetchError(`Failed to fetch registered products: ${error.message}`);
    } finally {
      setIsLoadingRegisteredProducts(false);
    }
  };

  // Register selected products to Shopify
  const handleRegisterToShopify = async () => {
    setIsRegistering(true);
    setRegistrationResults([]);
    setFetchError(null);

    const selectedProductDetails = fetchedProducts.filter(p => selectedProducts.includes(p.Id));
    
    try {
      // Prepare products data for bulk registration
      const productsToRegister = [];
      
      for (const product of selectedProductDetails) {
        productsToRegister.push({
          title: product.Description.replaceAll(/"/g, "'"),
          novaEngelId: product.Id.toString(),
          vendor: product.BrandName,
          descriptionHtml: product.CompleteDescription?.replaceAll(/"/g, "'"),
          price: product.Price?.toString() || '0.00',
          inventoryQuantity: product.Stock || 0,
          barcode: product.EANs?.[0] || null,
          tags: product.Families?.join(', ') || '',
          novaEngelBrandId: product.BrandId || '',
          novaEngelProductId: product.Id.toString(),
        });
      }

      // Send all products to backend at once
      const response = await fetch('/api/register-products-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsToRegister,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register products');
      }

      const data = await response.json();

      // Process results
      const results = data.results || [];
      setRegistrationResults(results);

      // Update registered product IDs for successful registrations
      const successfulProducts = results.filter(r => r.success);
      setRegisteredProductIds(prev => [...prev, ...successfulProducts.map(r => r.productId)]);

      // Refresh registered products list to get the latest data
      await fetchRegisteredProducts();

      // Show summary
      const successful = data.summary?.successful || 0;
      const failed = data.summary?.failed || 0;

      if (failed === 0) {
        setFetchError(null);
      } else {
        setFetchError(`${successful} products registered successfully, ${failed} failed. Check console for details.`);
      }

    } catch (error) {
      console.error('Bulk registration failed:', error);
      setFetchError(`Registration failed: ${error.message}`);
    } finally {
      setIsRegistering(false);
      setSelectedProducts([]); // Clear selection after registration
    }
  };

  // Fetch Nova Engel products
  const fetchNovaEngelProducts = async (page = 1) => {
    setSelectedProducts([]); // Clear selection on new page fetch
    setSearchBarVisible(false);
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const response = await fetch(
        `/api/novaengel/products?page=${page}&itemsPerPage=${itemsPerPage}&language=en`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      setFetchedProducts(data || []);
      setCurrentPage(page);
      
      if (data && data.length < itemsPerPage) {
        // Reached end of data
      }
      
    } catch (error) {
      console.error('Error fetching Nova Engel products:', error);
      setFetchError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle page navigation
  const handlePageChange = (page) => {
    if (page >= 1) {
      setPageInput(page);
      fetchNovaEngelProducts(page);
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }

  const handleNextPage = () => {
    // Only allow next page if we have 20 items (indicating more data might be available)
    if (fetchedProducts.length === itemsPerPage) {
      handlePageChange(currentPage + 1);
    }
  }

  const handlePageInputChange = (e) => {
    setPageInput(parseInt(e.target.value) || 1);
  }

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    handlePageChange(pageInput);
  }

  // Handle product selection
  const handleProductSelect = (productId, isSelected) => {
    // Don't allow selection of already registered products
    if (isProductRegistered(productId)) {
      return;
    }
    
    if (isSelected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  }

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      // Only select products that are not already registered
      const selectableProducts = fetchedProducts
        .filter(product => !isProductRegistered(product.Id))
        .map(product => product.Id);
      setSelectedProducts(selectableProducts);
    } else {
      setSelectedProducts([]);
    }
  }

  // Fetch both lists at once
  const refreshLists = async () => {
    setIsLoadingBrands(true);
    setIsLoadingCategories(true);
    try {
      const res = await fetch('/api/novaengel/brand-category-lists');
      const data = await res.json();
      if (data.success) {
        setBrandList(data.brands);
        setCategoryList(data.categories);
      }
    } catch (e) { /* ignore */ }
    setIsLoadingBrands(false);
    setIsLoadingCategories(false);
  };

  // Show all brands/categories as suggestions when input is focused or changed
  useEffect(() => {
    setBrandSuggestions(brandList);
    setShowBrandSuggestions(!!brandInput && brandList.length > 0);
  }, [brandInput, brandList]);
  useEffect(() => {
    setCategorySuggestions(categoryList);
    setShowCategorySuggestions(!!categoryInput && categoryList.length > 0);
  }, [categoryInput, categoryList]);

  // When user selects a suggestion
  const selectBrand = (brand) => {
    setSearchBrand(brand.BrandName);
    setBrandInput(brand.BrandName);
    setShowBrandSuggestions(false);
    if (brandInputRef.current) brandInputRef.current.blur();
  };
  const selectCategory = (cat) => {
    setSearchCategory(cat.Name);
    setCategoryInput(cat.Name);
    setShowCategorySuggestions(false);
    if (categoryInputRef.current) categoryInputRef.current.blur();
  };

  // When user types in brand/category, update search value as well
  useEffect(() => {
    if (!brandInput) setSearchBrand('');
  }, [brandInput]);
  useEffect(() => {
    if (!categoryInput) setSearchCategory('');
  }, [categoryInput]);

  // Search handler
  const handleSearch = async (page = 1) => {
    setIsSearching(true);
    setSearchPage(page);
    try {
      const params = new URLSearchParams({
        title: searchTitle,
        brand: searchBrand,
        category: searchCategory,
        page,
        itemsPerPage: searchItemsPerPage
      });
      setIsLoading(true);
      const res = await fetch(`/api/novaengel/products/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFetchedProducts(data.products);
        setSearchTotal(data.total);
      } else {
        setSearchResults([]);
        setSearchTotal(0);
      }
    } catch (e) {
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchTitle('');
    setSearchBrand('');
    setSearchCategory('');
    setSearchResults([]);
    setSearchTotal(0);
    setIsSearching(false);
    setSearchPage(1);
  };

  // Load products and registered products on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchRegisteredProducts();
      await fetchNovaEngelProducts(1);
      refreshLists();
    };
    initializeData();
  }, []);

  // For pagination in search mode
  const handleSearchPageChange = (page) => {
    if (page >= 1) {
      handleSearch(page);
    }
  };

  // Keep searchPageInput in sync with searchPage
  useEffect(() => {
    setSearchPageInput(searchPage);
  }, [searchPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search Bar Toggle */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Nova Engel Product Search</h2>
          <button
            className="text-blue-600 text-sm underline focus:outline-none"
            onClick={() => setSearchBarVisible(v => !v)}
          >
            {searchBarVisible ? 'Hide Search' : 'Show Search'}
          </button>
        </div>
        {/* Search Bar */}
        {searchBarVisible && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <form
              className="flex flex-wrap gap-4 items-end"
              onSubmit={e => { e.preventDefault(); handleSearch(searchPageInput); }}
              autoComplete="off"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter product title"
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brandInput}
                  onChange={e => { setBrandInput(e.target.value); setSearchBrand(e.target.value); }}
                  onFocus={() => setShowBrandSuggestions(brandList.length > 0)}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 100)}
                  ref={brandInputRef}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm w-48"
                  placeholder="Type to search brand"
                  autoComplete="off"
                />
                {showBrandSuggestions && (
                  <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-48 max-h-40 overflow-y-auto shadow-lg">
                    {brandSuggestions.map((b, i) => (
                      <li
                        key={b.BrandName + i}
                        className="px-2 py-1 cursor-pointer hover:bg-blue-100 text-sm"
                        onMouseDown={() => selectBrand(b)}
                      >
                        {b.BrandName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={categoryInput}
                  onChange={e => { setCategoryInput(e.target.value); setSearchCategory(e.target.value); }}
                  onFocus={() => setShowCategorySuggestions(categoryList.length > 0)}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 100)}
                  ref={categoryInputRef}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm w-48"
                  placeholder="Type to search category"
                  autoComplete="off"
                />
                {showCategorySuggestions && (
                  <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-48 max-h-40 overflow-y-auto shadow-lg">
                    {categorySuggestions.map((c, i) => (
                      <li
                        key={c.Name + i}
                        className="px-2 py-1 cursor-pointer hover:bg-blue-100 text-sm"
                        onMouseDown={() => selectCategory(c)}
                      >
                        {c.Name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Page</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={searchPageInput}
                    onChange={e => setSearchPageInput(Number(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                  {/* <button
                    type="button"
                    onClick={() => handleSearch(searchPageInput)}
                    className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
                  >Go</button> */}
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <button type="button" onClick={refreshLists} className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:bg-gray-300" disabled={isLoadingBrands || isLoadingCategories}>
                  {isLoadingBrands || isLoadingCategories ? 'Refreshing...' : 'Refresh Brand and Category Lists'}
                </button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Search</button>
                {/* <button type="button" onClick={handleResetSearch} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Reset</button> */}
              </div>
            </form>
          </div>
        )}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Nova Engel Product List</h2>
            
            <div className="flex items-center space-x-4">
              {/* Register to Shopify Button */}
              <button
                type="button" // Ensure this is explicitly set
                onClick={handleRegisterToShopify}
                disabled={selectedProducts.length === 0 || isRegistering}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedProducts.length === 0 || isRegistering
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                }`}
              >
                {isRegistering 
                  ? 'Registering...' 
                  : `Register ${selectedProducts.length} to Shopify`
                }
              </button>

              {/* Refresh Registered Products Button */}
              <button
                onClick={fetchRegisteredProducts}
                disabled={isLoadingRegisteredProducts}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLoadingRegisteredProducts
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                }`}
              >
                {isLoadingRegisteredProducts ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  `Refresh Registered (${registeredProductIds.length})`
                )}
              </button>

              {/* Fetch Products Button */}
              <button
                onClick={() => fetchNovaEngelProducts(currentPage)}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  'Refresh Products'
                )}
              </button>
            </div>
          </div>
          
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

          {/* Registered Products Summary */}
          {fetchedProducts.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              📊 Current page: {fetchedProducts.filter(p => isProductRegistered(p.Id)).length} registered, {fetchedProducts.filter(p => !isProductRegistered(p.Id)).length} pending
              {registeredProductIds.length > 0 && (
                <span className="ml-2">| Total registered: {registeredProductIds.length}</span>
              )}
            </div>
          )}

          {/* Registration Results */}
          {registrationResults.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Registration Results:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {registrationResults.map((result, index) => (
                  <div key={index} className={`text-xs ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.success ? '✓' : '✗'} Product {result.productId}: {result.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Top Navigation Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing {fetchedProducts.length} products on page {currentPage}
                {fetchedProducts.length < itemsPerPage && (
                  <span className="text-gray-500"> (end of data)</span>
                )}
              </span>
              {selectedProducts.length > 0 && (
                <span className="ml-4 text-blue-600 font-medium">
                  {selectedProducts.length} products selected
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  currentPage === 1 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              
              <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Page:</span>
                <input
                  type="number"
                  min="1"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  disabled={isLoading}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:text-gray-400"
                >
                  Go
                </button>
              </form>
              
              <button
                onClick={handleNextPage}
                disabled={fetchedProducts.length < itemsPerPage || isLoading}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  fetchedProducts.length < itemsPerPage || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === fetchedProducts.filter(p => !isProductRegistered(p.Id)).length && fetchedProducts.length > 0}
                    ref={(input) => {
                      if (input) {
                        const selectableProducts = fetchedProducts.filter(p => !isProductRegistered(p.Id));
                        const selectedSelectable = selectedProducts.filter(id => 
                          selectableProducts.some(p => p.Id === id)
                        );
                        input.indeterminate = selectedSelectable.length > 0 && selectedSelectable.length < selectableProducts.length;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-600">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : fetchedProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                fetchedProducts.map((product) => {
                  const isRegistered = isProductRegistered(product.Id);
                  const isSelectable = !isRegistered;
                  
                  return (
                    <tr key={product.Id} className={`hover:bg-gray-50 ${isRegistered ? 'bg-green-50 border-l-4 border-l-green-400' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.Id)}
                          onChange={(e) => handleProductSelect(product.Id, e.target.checked)}
                          disabled={!isSelectable}
                          className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${
                            isSelectable ? 'text-blue-600' : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={isRegistered ? 'Product already registered in Shopify' : 'Select product for registration'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.Id}
                        {isRegistered && (
                          <span className="ml-2 text-xs text-green-600">✓</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md">
                          <div className="font-medium text-gray-900">
                            {product.Description}
                          </div>
                          {product.Contenido && (
                            <div className="text-xs text-gray-500 mt-1">
                              Content: {product.Contenido}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.BrandName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium text-gray-900">
                            €{getAdjustedPrice(product.Price)}
                          </div>
                          {priceRate !== 1 && (
                            <div className="text-xs text-gray-500">
                              Original: €{product.Price?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.Stock > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.Stock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {product.Families?.map((family, index) => (
                            <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded mr-1 mb-1 inline-block">
                              {family}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.EANs.map((ean, index) => (
                          <span key={`${ean}-${index}`} className="text-xs bg-gray-100 px-2 py-1 rounded mr-1 mb-1 inline-block">
                            {ean}
                          </span>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isRegistered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing {fetchedProducts.length} products on page {currentPage}
                {fetchedProducts.length < itemsPerPage && (
                  <span className="text-gray-500"> (end of data)</span>
                )}
              </span>
              {selectedProducts.length > 0 && (
                <span className="ml-4 text-blue-600 font-medium">
                  {selectedProducts.length} products selected
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  currentPage === 1 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              
              <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Page:</span>
                <input
                  type="number"
                  min="1"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  disabled={isLoading}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:text-gray-400"
                >
                  Go
                </button>
              </form>
              
              <button
                onClick={handleNextPage}
                disabled={fetchedProducts.length < itemsPerPage || isLoading}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  fetchedProducts.length < itemsPerPage || isLoading
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
  )
}

export default NovaEngelProducts