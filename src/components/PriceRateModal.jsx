import React, { useState, useEffect } from 'react';

function PriceRateModal({ isOpen, onClose, onRateUpdate }) {
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCurrentRate();
    }
  }, [isOpen]);

  const fetchCurrentRate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/price-rate');
      const data = await response.json();
      
      if (data.success) {
        setRate(data.rate.toString());
      } else {
        setError('Failed to fetch current price rate');
      }
    } catch (error) {
      setError('Failed to fetch current price rate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rate || isNaN(parseFloat(rate)) || parseFloat(rate) <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/price-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate: parseFloat(rate) }),
      });

      const data = await response.json();
      
      if (data.success) {
        onRateUpdate(parseFloat(rate));
        onClose();
      } else {
        setError(data.error || 'Failed to update price rate');
      }
    } catch (error) {
      setError('Failed to update price rate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Price Rate Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
              Price Rate Multiplier
            </label>
            <div className="relative">
              <input
                type="number"
                id="rate"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter price rate (e.g., 1.5)"
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This rate will be multiplied by Nova Engel prices when creating/updating products in Shopify.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PriceRateModal; 