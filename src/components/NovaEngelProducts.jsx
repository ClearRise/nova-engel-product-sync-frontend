import { useState, useEffect, useRef, useMemo } from 'react'
import { apiFetch } from '../apiClient'
import { showNotification } from './Notification'
import PriceRateModal from './PriceRateModal'

function NovaEngelProducts() {
  const [priceRate, setPriceRate] = useState(1);
  const [isPriceRateModalOpen, setIsPriceRateModalOpen] = useState(false);
  const [priceRateLoading, setPriceRateLoading] = useState(true);
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
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const brandInputRef = useRef();
  const categoryInputRef = useRef();
  const [searchPageInput, setSearchPageInput] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Bulk registration states
  const [isRegisteringAll, setIsRegisteringAll] = useState(false);
  const [isRegisteringByCategory, setIsRegisteringByCategory] = useState(false);
  const [isRegisteringByBrand, setIsRegisteringByBrand] = useState(false);
  const [isRegisteringByFilter, setIsRegisteringByFilter] = useState(false);
  const [bulkRegistrationProgress, setBulkRegistrationProgress] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [totalProductCount, setTotalProductCount] = useState(null); // Total product count from Nova Engel
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Check if product is already registered
  const isProductRegistered = (productId) => {
    return registeredProductIds.includes(productId.toString())
  }

  // Calculate adjusted price
  const getAdjustedPrice = (originalPrice) => {
    return (parseFloat(originalPrice || 0) * priceRate).toFixed(2);
  };

  // Cancel bulk registration
  const handleCancelRegistration = () => {
    if (abortController) {
      setIsCancelling(true);
      abortController.abort();
      setAbortController(null);
      setIsRegisteringAll(false);
      setIsRegisteringByCategory(false);
      setIsRegisteringByBrand(false);
      setIsRegisteringByFilter(false);
      setBulkRegistrationProgress(null);
      setFetchError('Registration cancelled by user');
      setIsCancelling(false);
    }
  };

  // Register all products
  const handleRegisterAllProducts = async () => {
    if (!confirm('Are you sure you want to register ALL products from Nova Engel to Shopify? This may take a long time.')) {
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsRegisteringAll(true);
    setBulkRegistrationProgress({ message: 'Starting registration of all products...', current: 0, total: 0 });
    setFetchError(null);
    
    try {
      const response = await apiFetch('/api/register-all-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register all products');
      }
      
      const data = await response.json();
      
      // Refresh registered products list
      await fetchRegisteredProducts();
      
      setBulkRegistrationProgress(null);
      showNotification(
        `Registration completed!\n\nTotal: ${data.summary.total}\nAlready registered: ${data.summary.alreadyRegistered}\nNewly registered: ${data.summary.registered}\nFailed: ${data.summary.failed}`,
        'success',
        8000
      );
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setFetchError('Registration cancelled');
        showNotification('Registration cancelled by user', 'warning', 5000);
      } else {
        console.error('Failed to register all products:', error);
        setFetchError(`Registration failed: ${error.message}`);
        showNotification(`Registration failed: ${error.message}`, 'error', 8000);
      }
    } finally {
      setIsRegisteringAll(false);
      setBulkRegistrationProgress(null);
      setAbortController(null);
    }
  };

  // Register products by category
  const handleRegisterByCategory = async (category) => {
    if (!category) {
      setFetchError('Please select a category');
      return;
    }
    
    if (!confirm(`Are you sure you want to register all products in category "${category}" to Shopify?`)) {
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsRegisteringByCategory(true);
    setBulkRegistrationProgress({ message: `Registering products in category "${category}"...`, current: 0, total: 0 });
    setFetchError(null);
    
    try {
      const response = await apiFetch('/api/register-products-by-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register products by category');
      }
      
      const data = await response.json();
      
      // Refresh registered products list
      await fetchRegisteredProducts();
      
      setBulkRegistrationProgress(null);
      showNotification(
        `Registration completed!\n\nTotal in category: ${data.summary.total}\nAlready registered: ${data.summary.alreadyRegistered}\nNewly registered: ${data.summary.registered}\nFailed: ${data.summary.failed}`,
        'success',
        8000
      );
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setFetchError('Registration cancelled');
        showNotification('Registration cancelled by user', 'warning', 5000);
      } else {
        console.error('Failed to register products by category:', error);
        setFetchError(`Registration failed: ${error.message}`);
        showNotification(`Registration failed: ${error.message}`, 'error', 8000);
      }
    } finally {
      setIsRegisteringByCategory(false);
      setBulkRegistrationProgress(null);
      setAbortController(null);
    }
  };

  // Register products by brand
  const handleRegisterByBrand = async (brand) => {
    if (!brand) {
      setFetchError('Please select a brand');
      return;
    }
    
    if (!confirm(`Are you sure you want to register all products for brand "${brand}" to Shopify?`)) {
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsRegisteringByBrand(true);
    setBulkRegistrationProgress({ message: `Registering products for brand "${brand}"...`, current: 0, total: 0 });
    setFetchError(null);
    
    try {
      const response = await apiFetch('/api/register-products-by-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brand }),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register products by brand');
      }
      
      const data = await response.json();
      
      // Refresh registered products list
      await fetchRegisteredProducts();
      
      setBulkRegistrationProgress(null);
      showNotification(
        `Registration completed!\n\nTotal for brand: ${data.summary.total}\nAlready registered: ${data.summary.alreadyRegistered}\nNewly registered: ${data.summary.registered}\nFailed: ${data.summary.failed}`,
        'success',
        8000
      );
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setFetchError('Registration cancelled');
        showNotification('Registration cancelled by user', 'warning', 5000);
      } else {
        console.error('Failed to register products by brand:', error);
        setFetchError(`Registration failed: ${error.message}`);
        showNotification(`Registration failed: ${error.message}`, 'error', 8000);
      }
    } finally {
      setIsRegisteringByBrand(false);
      setBulkRegistrationProgress(null);
      setAbortController(null);
    }
  };

  // Register products by filter (category and/or brand)
  const handleRegisterByFilter = async () => {
    if (!searchCategory && !searchBrand) {
      setFetchError('Please select at least one filter (category or brand)');
      return;
    }
    
    const filterDesc = [];
    if (searchCategory) filterDesc.push(`category "${searchCategory}"`);
    if (searchBrand) filterDesc.push(`brand "${searchBrand}"`);
    
    if (!confirm(`Are you sure you want to register all products matching ${filterDesc.join(' and ')} to Shopify?`)) {
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsRegisteringByFilter(true);
    setBulkRegistrationProgress({ message: `Registering products matching filters...`, current: 0, total: 0 });
    setFetchError(null);
    
    try {
      const response = await apiFetch('/api/register-products-by-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category: searchCategory || undefined,
          brand: searchBrand || undefined
        }),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register products by filter');
      }
      
      const data = await response.json();
      
      // Refresh registered products list
      await fetchRegisteredProducts();
      
      setBulkRegistrationProgress(null);
      showNotification(
        `Registration completed!\n\nTotal matching filters: ${data.summary.total}\nAlready registered: ${data.summary.alreadyRegistered}\nNewly registered: ${data.summary.registered}\nFailed: ${data.summary.failed}`,
        'success',
        8000
      );
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setFetchError('Registration cancelled');
        showNotification('Registration cancelled by user', 'warning', 5000);
      } else {
        console.error('Failed to register products by filter:', error);
        setFetchError(`Registration failed: ${error.message}`);
        showNotification(`Registration failed: ${error.message}`, 'error', 8000);
      }
    } finally {
      setIsRegisteringByFilter(false);
      setBulkRegistrationProgress(null);
      setAbortController(null);
    }
  };

  // Fetch registered products from Shopify
  const fetchRegisteredProducts = async () => {
    setIsLoadingRegisteredProducts(true);
    try {
      const response = await apiFetch('/api/registered-products');
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

  // Unregister selected registered products from Shopify
  const handleDeleteSelected = async () => {
    // Filter to only registered products
    const registeredSelected = selectedProducts.filter(id => isProductRegistered(id));
    
    if (registeredSelected.length === 0) {
      showNotification('Please select registered products to unregister', 'warning', 5000);
      return;
    }
    
    if (!confirm(`Are you sure you want to unregister ${registeredSelected.length} registered product(s) from Shopify? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeletingBulk(true);
    setFetchError(null);
    
    try {
      const response = await apiFetch('/api/products/delete-by-nova-engel-ids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novaEngelProductIds: registeredSelected
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete products');
      }
      
      const data = await response.json();
      
      // Refresh registered products list
      await fetchRegisteredProducts();
      
      // Clear selection
      setSelectedProducts([]);
      
      const { successful, failed } = data.summary;
      if (failed === 0) {
        showNotification(`Successfully unregistered ${successful} product(s) from Shopify`, 'success', 5000);
      } else {
        showNotification(`Unregistered ${successful} product(s), ${failed} failed`, 'warning', 8000);
      }
      
    } catch (error) {
      console.error('Failed to unregister products:', error);
      setFetchError(`Unregistration failed: ${error.message}`);
      showNotification(`Unregistration failed: ${error.message}`, 'error', 8000);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Unregister all registered products from Shopify
  const handleDeleteAllRegistered = async () => {
    if (registeredProductIds.length === 0) {
      showNotification('No registered products to unregister', 'warning', 5000);
      return;
    }
    
    if (!confirm(`Are you sure you want to unregister ALL ${registeredProductIds.length} registered product(s) from Shopify? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeletingBulk(true);
    setFetchError(null);
    
    try {
      // Process in batches of 100 to avoid exceeding API limits
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < registeredProductIds.length; i += batchSize) {
        batches.push(registeredProductIds.slice(i, i + batchSize));
      }
      
      let totalSuccessful = 0;
      let totalFailed = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const response = await apiFetch('/api/products/delete-by-nova-engel-ids', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            novaEngelProductIds: batch
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete products');
        }
        
        const data = await response.json();
        totalSuccessful += data.summary.successful;
        totalFailed += data.summary.failed;
        
        // Show progress for large unregistrations
        if (batches.length > 1) {
          showNotification(
            `Unregistering batch ${batchIndex + 1}/${batches.length}... (${totalSuccessful} unregistered so far)`,
            'info',
            3000
          );
        }
      }
      
      // Refresh registered products list
      await fetchRegisteredProducts();
      
      // Clear selection
      setSelectedProducts([]);
      
      if (totalFailed === 0) {
        showNotification(`Successfully unregistered all ${totalSuccessful} registered product(s) from Shopify`, 'success', 5000);
      } else {
        showNotification(`Unregistered ${totalSuccessful} product(s), ${totalFailed} failed`, 'warning', 8000);
      }
      
    } catch (error) {
      console.error('Failed to unregister all products:', error);
      setFetchError(`Unregistration failed: ${error.message}`);
      showNotification(`Unregistration failed: ${error.message}`, 'error', 8000);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Register selected products to Shopify
  const handleRegisterToShopify = async () => {
    setIsRegistering(true);
    setRegistrationResults([]);
    setFetchError(null);

    // Filter to only unregistered products
    const selectedProductDetails = fetchedProducts.filter(p => 
      selectedProducts.includes(p.Id) && !isProductRegistered(p.Id)
    );
    
    if (selectedProductDetails.length === 0) {
      showNotification('No unregistered products selected. Please select products that are not yet registered in Shopify.', 'warning', 5000);
      setIsRegistering(false);
      return;
    }
    
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
      const response = await apiFetch('/api/register-products-bulk', {
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
      showNotification(`Registration failed: ${error.message}`, 'error', 8000);
    } finally {
      setIsRegistering(false);
      setSelectedProducts([]); // Clear selection after registration
    }
  };

  // Fetch Nova Engel products
  const fetchNovaEngelProducts = async (page = 1) => {
    setSelectedProducts([]); // Clear selection on new page fetch
    setSearchBarVisible(false);
    setIsSearching(false); // Reset search state
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const response = await apiFetch(
        `/api/novaengel/products?page=${page}&itemsPerPage=${itemsPerPage}&language=en`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      setFetchedProducts(data || []);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error fetching Nova Engel products:', error);
      setFetchError(error.message);
      // Don't clear products on error, keep what we have
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
    // Allow selection of all products (both registered and unregistered)
    if (isSelected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  }

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      // Select all products (both registered and unregistered)
      const allProductIds = fetchedProducts.map(product => product.Id);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
    }
  }

  // Fetch both lists at once
  const refreshLists = async () => {
    setIsLoadingBrands(true);
    setIsLoadingCategories(true);
    try {
      const res = await apiFetch('/api/novaengel/brand-category-lists');
      if (!res.ok) {
        throw new Error(`Failed to refresh lists: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setBrandList(data.brands);
        setCategoryList(data.categories);
      }
    } catch (e) { /* ignore */ }
    setIsLoadingBrands(false);
    setIsLoadingCategories(false);
  };

  // Pre-sort brand and category lists for faster filtering
  const sortedBrandList = useMemo(() => {
    return [...brandList].sort((a, b) => a.BrandName.localeCompare(b.BrandName));
  }, [brandList]);

  const sortedCategoryList = useMemo(() => {
    return [...categoryList].sort((a, b) => a.Name.localeCompare(b.Name));
  }, [categoryList]);

  // Filter and memoize suggestions based on input
  const filteredBrandSuggestions = useMemo(() => {
    if (!brandInput.trim()) return sortedBrandList;
    const lowerInput = brandInput.toLowerCase();
    return sortedBrandList.filter(b => 
      b.BrandName.toLowerCase().includes(lowerInput)
    );
  }, [brandInput, sortedBrandList]);

  const filteredCategorySuggestions = useMemo(() => {
    if (!categoryInput.trim()) return sortedCategoryList;
    const lowerInput = categoryInput.toLowerCase();
    return sortedCategoryList.filter(c => 
      c.Name.toLowerCase().includes(lowerInput)
    );
  }, [categoryInput, sortedCategoryList]);

  // Show suggestions when input is focused or changed
  useEffect(() => {
    setShowBrandSuggestions(!!brandInput && filteredBrandSuggestions.length > 0);
  }, [brandInput, filteredBrandSuggestions.length]);
  
  useEffect(() => {
    setShowCategorySuggestions(!!categoryInput && filteredCategorySuggestions.length > 0);
  }, [categoryInput, filteredCategorySuggestions.length]);

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
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const params = new URLSearchParams({
        title: searchTitle,
        brand: searchBrand,
        category: searchCategory,
        page,
        itemsPerPage: searchItemsPerPage
      });
      const res = await apiFetch(`/api/novaengel/products/search?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.products) {
        setFetchedProducts(data.products);
        setSearchTotal(data.total);
      } else {
        setFetchedProducts([]);
        setSearchTotal(0);
      }
    } catch (e) {
      console.error('Search failed:', e);
      setFetchedProducts([]);
      setSearchTotal(0);
      setFetchError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchTitle('');
    setSearchBrand('');
    setSearchCategory('');
    setBrandInput('');
    setCategoryInput('');
    setSearchResults([]);
    setSearchTotal(0);
    setIsSearching(false);
    setSearchPage(1);
    // Restore normal product list
    fetchNovaEngelProducts(1);
  };

  // Fetch price rate on mount
  useEffect(() => {
    const fetchPriceRate = async () => {
      try {
        setPriceRateLoading(true);
        const response = await apiFetch('/api/price-rate');
        const data = await response.json();
        
        if (data.success) {
          setPriceRate(data.rate);
        }
      } catch (error) {
        console.error('Failed to fetch price rate:', error);
      } finally {
        setPriceRateLoading(false);
      }
    };
    
    fetchPriceRate();
  }, []);

  // Fetch total product count
  const fetchTotalProductCount = async () => {
    try {
      const response = await apiFetch('/api/novaengel/products/total-count');
      if (!response.ok) {
        throw new Error(`Failed to fetch total count: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setTotalProductCount(data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch total product count:', error);
    }
  };

  const handlePriceRateUpdate = (newRate) => {
    setPriceRate(newRate);
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

  // Calculate total pages based on total product count
  const totalPages = totalProductCount ? Math.ceil(totalProductCount / itemsPerPage) : null;

  const isAnyRegistrationRunning = isRegisteringAll || isRegisteringByCategory || isRegisteringByBrand || isRegisteringByFilter || isRegistering;

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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Controls</h2>
          
          {/* Search Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Search & Filter</h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Title</label>
              <input
                type="text"
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product title"
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brandInput}
                onChange={e => { setBrandInput(e.target.value); setSearchBrand(e.target.value); }}
                onFocus={() => setShowBrandSuggestions(filteredBrandSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 100)}
                ref={brandInputRef}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type to search brand"
                autoComplete="off"
              />
              {showBrandSuggestions && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                  {filteredBrandSuggestions.map((b) => (
                    <li
                      key={b.BrandName}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm"
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
                onFocus={() => setShowCategorySuggestions(filteredCategorySuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 100)}
                ref={categoryInputRef}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type to search category"
                autoComplete="off"
              />
              {showCategorySuggestions && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                  {filteredCategorySuggestions.map((c) => (
                    <li
                      key={c.Name}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm"
                      onMouseDown={() => selectCategory(c)}
                    >
                      {c.Name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                <option value="registered">Registered Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={refreshLists} 
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:bg-gray-300" 
                disabled={isLoadingBrands || isLoadingCategories}
              >
                {isLoadingBrands || isLoadingCategories ? 'Refreshing...' : 'Refresh Lists'}
              </button>
              <button 
                type="button" 
                onClick={() => handleSearch(1)} 
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          {/* Bulk Registration Section */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700">Bulk Registration</h3>
            
            <button
              type="button"
              onClick={handleRegisterAllProducts}
              disabled={isAnyRegistrationRunning}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isAnyRegistrationRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isRegisteringAll ? 'Registering All...' : 'Register All Products'}
            </button>

            {searchCategory && (
              <button
                type="button"
                onClick={() => handleRegisterByCategory(searchCategory)}
                disabled={isAnyRegistrationRunning}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isAnyRegistrationRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isRegisteringByCategory ? 'Registering...' : `Register Category: ${searchCategory}`}
              </button>
            )}

            {searchBrand && (
              <button
                type="button"
                onClick={() => handleRegisterByBrand(searchBrand)}
                disabled={isAnyRegistrationRunning}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isAnyRegistrationRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isRegisteringByBrand ? 'Registering...' : `Register Brand: ${searchBrand}`}
              </button>
            )}

            {(searchCategory || searchBrand) && (
              <button
                type="button"
                onClick={handleRegisterByFilter}
                disabled={isAnyRegistrationRunning}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isAnyRegistrationRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                {isRegisteringByFilter ? 'Registering...' : 'Register Filtered Products'}
              </button>
            )}

            {/* Cancel Button */}
            {isAnyRegistrationRunning && (
              <button
                type="button"
                onClick={handleCancelRegistration}
                disabled={isCancelling}
                className="w-full px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Registration'}
              </button>
            )}
          </div>

          {/* Selected Products Registration */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700">Selected Products</h3>
            
            <button
              type="button"
              onClick={handleRegisterToShopify}
              disabled={selectedProducts.filter(id => !isProductRegistered(id)).length === 0 || isAnyRegistrationRunning}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedProducts.filter(id => !isProductRegistered(id)).length === 0 || isAnyRegistrationRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isRegistering 
                ? 'Registering...' 
                : `Register ${selectedProducts.filter(id => !isProductRegistered(id)).length} Unregistered`
              }
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedProducts.filter(id => isProductRegistered(id)).length === 0 || isDeletingBulk}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedProducts.filter(id => isProductRegistered(id)).length === 0 || isDeletingBulk
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isDeletingBulk 
                ? 'Unregistering...' 
                : `Unregister ${selectedProducts.filter(id => isProductRegistered(id)).length} Selected`
              }
            </button>

            <button
              onClick={fetchRegisteredProducts}
              disabled={isLoadingRegisteredProducts}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isLoadingRegisteredProducts
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isLoadingRegisteredProducts ? 'Loading...' : `Refresh Registered (${registeredProductIds.length})`}
            </button>

            <button
              type="button"
              onClick={handleDeleteAllRegistered}
              disabled={registeredProductIds.length === 0 || isDeletingBulk}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                registeredProductIds.length === 0 || isDeletingBulk
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isDeletingBulk 
                ? 'Unregistering All...' 
                : `Unregister All Registered (${registeredProductIds.length})`
              }
            </button>
          </div>

          {/* Progress Indicator */}
          {bulkRegistrationProgress && (
            <div className="pt-4 border-t">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-900">{bulkRegistrationProgress.message}</div>
                    {bulkRegistrationProgress.total > 0 && (
                      <div className="text-xs text-blue-700 mt-1">
                        {bulkRegistrationProgress.current} / {bulkRegistrationProgress.total}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {fetchError && (
            <div className="pt-4 border-t">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-xs text-red-600">{fetchError}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900">Nova Engel Products</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {totalProductCount !== null && (
                  <>
                    <span>Total: {totalProductCount.toLocaleString()} products</span>
                    <span>•</span>
                  </>
                )}
                <span>Page: {fetchedProducts.length} products</span>
                {selectedProducts.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">{selectedProducts.length} selected</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Price Rate, Pagination and Refresh Controls */}
            <div className="flex items-center space-x-4">
              {/* Price Rate Display */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-md border border-gray-200">
                <span className="text-sm text-gray-600">Price Rate:</span>
                <span className="text-sm font-medium text-gray-900">
                  {priceRateLoading ? '...' : `${priceRate}x`}
                </span>
                <button
                  onClick={() => setIsPriceRateModalOpen(true)}
                  className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Edit
                </button>
              </div>

              {/* Pagination Controls */}
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
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      value={pageInput}
                      onChange={handlePageInputChange}
                      disabled={isLoading}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    {totalPages && (
                      <span className="text-sm text-gray-600">/ {totalPages}</span>
                    )}
                  </div>
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
              
              <button
                onClick={() => fetchNovaEngelProducts(currentPage)}
                disabled={isLoading}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
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
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-4">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === fetchedProducts.length && fetchedProducts.length > 0}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = selectedProducts.length > 0 && selectedProducts.length < fetchedProducts.length;
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
                fetchedProducts
                  .filter((product) => {
                    const isRegistered = isProductRegistered(product.Id);
                    if (statusFilter === 'registered') return isRegistered;
                    if (statusFilter === 'pending') return !isRegistered;
                    return true;
                  })
                  .map((product) => {
                  const isRegistered = isProductRegistered(product.Id);
                  
                  return (
                    <tr key={product.Id} className={`hover:bg-gray-50 ${isRegistered ? 'bg-green-50 border-l-4 border-l-green-400' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.Id)}
                          onChange={(e) => handleProductSelect(product.Id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          title={isRegistered ? 'Select to unregister from Shopify' : 'Select product for registration or unregistration'}
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
          </div>
        </div>
      </div>

      {/* Price Rate Modal */}
      <PriceRateModal
        isOpen={isPriceRateModalOpen}
        onClose={() => setIsPriceRateModalOpen(false)}
        onRateUpdate={handlePriceRateUpdate}
      />
    </div>
  )
}

export default NovaEngelProducts