import { useCallback } from 'react'
import { SearchAnalytics } from '@/types/search'

interface QueryMetric {
  query: string;
  count: number;
  clicks: number;
  lastUsed: number;
}

interface SearchMetrics {
  totalSearches: number;
  successfulSearches: number;
  topQueries: QueryMetric[];
  lastSearchTime: number | null;
}

/**
 * Hook for tracking search analytics
 */
export function useSearchAnalytics() {
  const trackSearch = useCallback(async (analytics: SearchAnalytics) => {
    try {
      // Send analytics to API endpoint
      await fetch('/api/search/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: analytics.query,
          results: analytics.results,
          clickedResult: analytics.clickedResult,
          noResults: analytics.noResults
        })
      })
    } catch (error) {
      // Don't fail search functionality due to analytics errors
      console.warn('Failed to track search analytics:', error)
    }
  }, [])

  const trackSearchQuery = useCallback(async (query: string, resultsCount: number) => {
    await trackSearch({
      query,
      results: resultsCount,
      timestamp: Date.now(),
      noResults: resultsCount === 0
    })
  }, [trackSearch])

  const trackSearchClick = useCallback(async (query: string, resultId: string, resultsCount: number) => {
    await trackSearch({
      query,
      results: resultsCount,
      clickedResult: resultId,
      timestamp: Date.now(),
      noResults: false
    })
  }, [trackSearch])

  return {
    trackSearch,
    trackSearchQuery,
    trackSearchClick
  }
}

/**
 * Client-side search metrics storage
 */
export function getSearchMetrics() {
  if (typeof window === 'undefined') return null

  try {
    const metrics = localStorage.getItem('cryptrac_search_metrics')
    return metrics ? JSON.parse(metrics) : {
      totalSearches: 0,
      successfulSearches: 0,
      topQueries: [],
      lastSearchTime: null
    }
  } catch (error) {
    console.warn('Failed to get search metrics:', error)
    return null
  }
}

/**
 * Update client-side search metrics
 */
export function updateSearchMetrics(query: string, resultsCount: number, clicked: boolean = false) {
  if (typeof window === 'undefined') return

  try {
    const metrics = getSearchMetrics() || {
      totalSearches: 0,
      successfulSearches: 0,
      topQueries: [],
      lastSearchTime: null
    }

    metrics.totalSearches++
    if (resultsCount > 0) {
      metrics.successfulSearches++
    }
    metrics.lastSearchTime = Date.now()

    // Update top queries
    const existingQuery = metrics.topQueries.find((q: QueryMetric) => q.query === query)
    if (existingQuery) {
      existingQuery.count++
      if (clicked) existingQuery.clicks = (existingQuery.clicks || 0) + 1
    } else {
      metrics.topQueries.push({
        query,
        count: 1,
        clicks: clicked ? 1 : 0,
        lastUsed: Date.now()
      })
    }

    // Keep only top 10 queries
    metrics.topQueries = metrics.topQueries
      .sort((a: QueryMetric, b: QueryMetric) => b.count - a.count)
      .slice(0, 10)

    localStorage.setItem('cryptrac_search_metrics', JSON.stringify(metrics))
  } catch (error) {
    console.warn('Failed to update search metrics:', error)
  }
}

/**
 * Get popular search queries for suggestions
 */
export function getPopularQueries(limit: number = 5): string[] {
  const metrics = getSearchMetrics()
  if (!metrics || !metrics.topQueries) return []

  return metrics.topQueries
    .slice(0, limit)
    .map((q: { query: string }) => q.query)
}