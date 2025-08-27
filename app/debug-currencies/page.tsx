'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/app/components/ui/card";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  is_token?: boolean;
  parent_currency?: string;
  enabled: boolean;
  min_amount: number;
  max_amount?: number;
  decimals: number;
  icon_url?: string;
  nowpayments_code?: string;
  contract_address?: string;
  is_stablecoin?: boolean;
}

export default function DebugCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // all, stablecoins, non-stablecoins

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const response = await fetch('/api/debug/currencies');
        if (!response.ok) {
          throw new Error('Failed to fetch currencies');
        }
        const data = await response.json();
        
        if (data.success && data.currencies) {
          setCurrencies(data.currencies);
        } else {
          throw new Error(data.message || 'Failed to fetch currencies');
        }
      } catch (err) {
        setError('Unable to load currencies. Please try again later.');
        console.error('Error fetching currencies:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrencies();
  }, []);

  const filteredCurrencies = currencies.filter(currency => {
    if (filter === 'stablecoins') return currency.is_stablecoin;
    if (filter === 'non-stablecoins') return !currency.is_stablecoin;
    return true;
  });

  const stablecoins = currencies.filter(c => c.is_stablecoin);
  const nonStablecoins = currencies.filter(c => !c.is_stablecoin);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading all currencies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All NOWPayments Currencies</h1>
        
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Currencies</h3>
            <p className="text-3xl font-bold text-purple-600">{currencies.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Stablecoins</h3>
            <p className="text-3xl font-bold text-green-600">{stablecoins.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Non-Stablecoins</h3>
            <p className="text-3xl font-bold text-blue-600">{nonStablecoins.length}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All ({currencies.length})
          </button>
          <button
            onClick={() => setFilter('stablecoins')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'stablecoins' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Stablecoins ({stablecoins.length})
          </button>
          <button
            onClick={() => setFilter('non-stablecoins')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'non-stablecoins' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Non-Stablecoins ({nonStablecoins.length})
          </button>
        </div>

        {/* Currencies List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {filter === 'all' && 'All Currencies'}
              {filter === 'stablecoins' && 'Stablecoins Only'}
              {filter === 'non-stablecoins' && 'Non-Stablecoins Only'}
              {' '}({filteredCurrencies.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Network
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NOWPayments Code
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCurrencies.map((currency, index) => (
                  <tr key={`${currency.code}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {currency.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.network || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        currency.is_stablecoin 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {currency.is_stablecoin ? 'Stablecoin' : 'Cryptocurrency'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.min_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.nowpayments_code || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Data */}
        <div className="mt-8">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(filteredCurrencies, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `currencies-${filter}-${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700"
          >
            Export {filter === 'all' ? 'All' : filter} Currencies as JSON
          </button>
        </div>
      </div>
    </div>
  );
}