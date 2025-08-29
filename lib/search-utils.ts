import { SearchResult, SearchResultGroup, FuzzyMatchResult, WeightedResult, SearchCategory, SearchApiResponse } from '@/types/search'

/**
 * Fuzzy string matching algorithm
 * Returns a score between 0-1 where 1 is a perfect match
 */
export function fuzzyMatch(needle: string, haystack: string): FuzzyMatchResult {
  const needleLower = needle.toLowerCase()
  const haystackLower = haystack.toLowerCase()
  
  // Exact match gets highest score
  if (haystackLower === needleLower) {
    return { score: 1, matches: [{ start: 0, end: haystack.length }] }
  }
  
  // Contains match gets high score
  if (haystackLower.includes(needleLower)) {
    const start = haystackLower.indexOf(needleLower)
    return { 
      score: 0.8, 
      matches: [{ start, end: start + needle.length }] 
    }
  }
  
  // Character-by-character fuzzy matching
  let score = 0
  const matches: Array<{ start: number; end: number }> = []
  let needleIndex = 0
  let matchStart = -1
  
  for (let i = 0; i < haystackLower.length && needleIndex < needleLower.length; i++) {
    if (haystackLower[i] === needleLower[needleIndex]) {
      if (matchStart === -1) matchStart = i
      needleIndex++
      
      // End of needle or next character doesn't match
      if (needleIndex === needleLower.length || 
          (i + 1 < haystackLower.length && haystackLower[i + 1] !== needleLower[needleIndex])) {
        matches.push({ start: matchStart, end: i + 1 })
        matchStart = -1
      }
    }
  }
  
  if (needleIndex === needleLower.length) {
    // Calculate score based on match density and position
    const matchRatio = needleIndex / needle.length
    const positionBonus = matches[0]?.start === 0 ? 0.2 : 0
    const densityBonus = matches.length <= 2 ? 0.1 : 0
    score = Math.min(0.7, matchRatio * 0.5 + positionBonus + densityBonus)
  }
  
  return { score, matches }
}

/**
 * Weight search results based on category, recency, and relevance
 */
export function weightResults(results: SearchResult[], query: string): WeightedResult[] {
  const categoryWeights: Record<SearchCategory, number> = {
    actions: 1.0,        // Highest priority for quick actions
    pages: 0.9,          // Navigation pages are important
    payment_links: 0.8,  // Core business data
    transactions: 0.8,   // Core business data  
    subscriptions: 0.7,  // Business data
    customers: 0.7,      // Business data
    invoices: 0.6,       // Secondary business data
    terminal_devices: 0.6, // Hardware
    analytics: 0.5,      // Reports and analytics
    settings: 0.4,       // Configuration
    help: 0.3,          // Documentation
    refunds: 0.3        // Less common actions
  }
  
  return results.map(result => {
    const matchResult = fuzzyMatch(query, result.title)
    const descriptionMatch = result.description ? fuzzyMatch(query, result.description) : { score: 0, matches: [] }
    
    const matchScore = Math.max(matchResult.score, descriptionMatch.score * 0.7)
    const categoryWeight = categoryWeights[result.category] || 0.5
    const customWeight = result.weight || 1.0
    
    // Boost for exact matches at the beginning
    const exactMatchBonus = result.title.toLowerCase().startsWith(query.toLowerCase()) ? 0.2 : 0
    
    const finalScore = (matchScore * 0.6 + categoryWeight * 0.3 + customWeight * 0.1) + exactMatchBonus
    
    return {
      result: { ...result, matchScore },
      finalScore,
      matchScore,
      weightScore: categoryWeight
    }
  }).sort((a, b) => b.finalScore - a.finalScore)
}

/**
 * Group search results by category
 */
export function groupResults(weightedResults: WeightedResult[]): SearchResultGroup[] {
  const groups: Partial<Record<SearchCategory, SearchResult[]>> = {}
  
  weightedResults.forEach(({ result }) => {
    if (!groups[result.category]) {
      groups[result.category] = []
    }
    groups[result.category]!.push(result)
  })
  
  const categoryConfig: Record<SearchCategory, { title: string; icon: string; priority: number }> = {
    actions: { title: 'Quick Actions', icon: 'Zap', priority: 1 },
    pages: { title: 'Pages', icon: 'FileText', priority: 2 },
    payment_links: { title: 'Payment Links', icon: 'Link', priority: 3 },
    transactions: { title: 'Transactions', icon: 'Receipt', priority: 4 },
    subscriptions: { title: 'Subscriptions', icon: 'RefreshCw', priority: 5 },
    customers: { title: 'Customers', icon: 'Users', priority: 6 },
    invoices: { title: 'Invoices', icon: 'FileText', priority: 7 },
    terminal_devices: { title: 'Terminal Devices', icon: 'Smartphone', priority: 8 },
    analytics: { title: 'Analytics', icon: 'BarChart3', priority: 9 },
    settings: { title: 'Settings', icon: 'Settings', priority: 10 },
    help: { title: 'Help & Support', icon: 'HelpCircle', priority: 11 },
    refunds: { title: 'Refunds', icon: 'RotateCcw', priority: 12 }
  }
  
  return Object.entries(groups)
    .map(([category, results]) => ({
      category: category as SearchCategory,
      title: categoryConfig[category as SearchCategory]?.title || category,
      icon: categoryConfig[category as SearchCategory]?.icon || 'Search',
      results
    }))
    .sort((a, b) => {
      const aPriority = categoryConfig[a.category]?.priority || 999
      const bPriority = categoryConfig[b.category]?.priority || 999
      return aPriority - bPriority
    })
    .filter(group => group.results.length > 0)
}

/**
 * Convert API response to SearchResult objects
 */
export function transformApiResponse(apiResponse: SearchApiResponse): SearchResult[] {
  const results: SearchResult[] = []
  
  // Transform pages
  apiResponse.pages?.forEach(page => {
    results.push({
      id: `page-${page.href}`,
      title: page.title,
      description: page.description,
      href: page.href,
      category: 'pages',
      icon: 'FileText',
      weight: page.weight
    })
  })
  
  // Transform payment links
  apiResponse.payment_links?.forEach(link => {
    // If this is an exact link_id match, route directly to the payment link page
    const href = link.is_exact_link_match 
      ? `/merchant/dashboard/payments/${link.id}`
      : `/merchant/dashboard/payments?link=${encodeURIComponent(link.link_id)}`
    
    results.push({
      id: `payment-link-${link.id}`,
      title: link.title || link.link_id,
      description: link.amount ? `${link.amount} ${link.currency || 'USD'}` : undefined,
      href,
      category: 'payment_links',
      icon: 'Link',
      badge: link.status || undefined,
      metadata: {
        amount: link.amount,
        currency: link.currency,
        created_at: link.created_at,
        link_id: link.link_id,
        is_exact_match: link.is_exact_link_match
      }
    })
  })
  
  // Transform transactions
  apiResponse.transactions?.forEach(tx => {
    results.push({
      id: `transaction-${tx.id}`,
      title: tx.public_receipt_id || tx.id,
      description: `${tx.total_paid || 0} ${tx.currency || 'USD'} • ${tx.status || 'unknown'}`,
      href: tx.public_receipt_id ? `/r/${encodeURIComponent(tx.public_receipt_id)}` : '/merchant/dashboard',
      category: 'transactions',
      icon: 'Receipt',
      badge: tx.status || undefined,
      metadata: {
        amount: tx.total_paid,
        currency: tx.currency,
        status: tx.status,
        created_at: tx.created_at
      }
    })
  })
  
  // Transform subscriptions
  apiResponse.subscriptions?.forEach(sub => {
    results.push({
      id: `subscription-${sub.id}`,
      title: sub.title || `Subscription ${sub.id}`,
      description: `${sub.billing_cycle || 'Unknown cycle'} • ${sub.customer_email || 'No email'}`,
      href: `/merchant/subscriptions/${encodeURIComponent(sub.id)}`,
      category: 'subscriptions',
      icon: 'RefreshCw',
      badge: sub.status || undefined,
      metadata: {
        amount: sub.amount,
        billing_cycle: sub.billing_cycle,
        customer_email: sub.customer_email,
        created_at: sub.created_at
      }
    })
  })
  
  // Transform customers
  apiResponse.customers?.forEach(customer => {
    results.push({
      id: `customer-${customer.id}`,
      title: customer.name || customer.email || customer.phone || customer.id,
      description: [customer.email, customer.phone].filter(Boolean).join(' • '),
      href: `/merchant/dashboard/customers/${encodeURIComponent(customer.id)}`,
      category: 'customers',
      icon: 'User',
      metadata: {
        email: customer.email,
        phone: customer.phone,
        total_payments: customer.total_payments,
        last_payment: customer.last_payment,
        created_at: customer.created_at
      }
    })
  })
  
  // Transform terminal devices
  apiResponse.terminal_devices?.forEach(device => {
    results.push({
      id: `terminal-device-${device.id}`,
      title: device.label || device.public_id || device.id,
      description: device.location || 'No location set',
      href: `/merchant/dashboard/terminals/${encodeURIComponent(device.id)}`,
      category: 'terminal_devices',
      icon: 'Smartphone',
      badge: device.status || undefined,
      metadata: {
        public_id: device.public_id,
        location: device.location,
        status: device.status,
        created_at: device.created_at
      }
    })
  })
  
  return results
}

/**
 * Get search suggestions based on popular actions and current state
 */
export function getSearchSuggestions(): SearchResult[] {
  return [
    {
      id: 'action-create-payment',
      title: 'Create Payment Link',
      description: 'Generate a new payment link for customers',
      href: '/merchant/dashboard/payments/create',
      category: 'actions',
      icon: 'Plus'
    },
    {
      id: 'action-smart-terminal',
      title: 'Smart Terminal',
      description: 'Accept in-person crypto payments',
      href: '/smart-terminal',
      category: 'actions',
      icon: 'Smartphone'
    },
    {
      id: 'action-create-subscription',
      title: 'Create Subscription',
      description: 'Set up recurring billing',
      href: '/merchant/subscriptions/create',
      category: 'actions',
      icon: 'RefreshCw'
    },
    {
      id: 'page-dashboard',
      title: 'Dashboard',
      description: 'View your business overview',
      href: '/merchant/dashboard',
      category: 'pages',
      icon: 'LayoutDashboard'
    },
    {
      id: 'page-analytics',
      title: 'Analytics',
      description: 'View business reports and metrics',
      href: '/merchant/dashboard/analytics',
      category: 'analytics',
      icon: 'BarChart3'
    }
  ]
}

/**
 * Save search to history
 */
export function saveSearchHistory(query: string, resultClicked?: string) {
  if (typeof window === 'undefined') return
  
  try {
    const history = getSearchHistory()
    const newEntry = {
      query,
      timestamp: Date.now(),
      resultClicked
    }
    
    const updatedHistory = [newEntry, ...history.filter((h: { query: string }) => h.query !== query)].slice(0, 10)
    localStorage.setItem('cryptrac_search_history', JSON.stringify(updatedHistory))
  } catch (error) {
    console.warn('Failed to save search history:', error)
  }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory() {
  if (typeof window === 'undefined') return []
  
  try {
    const history = localStorage.getItem('cryptrac_search_history')
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.warn('Failed to get search history:', error)
    return []
  }
}

/**
 * Get recent search queries
 */
export function getRecentSearches(): string[] {
  return getSearchHistory()
    .slice(0, 5)
    .map((entry: any) => entry.query)
    .filter((query: string, index: number, arr: string[]) => arr.indexOf(query) === index)
}

/**
 * Clear search history
 */
export function clearSearchHistory() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('cryptrac_search_history')
  } catch (error) {
    console.warn('Failed to clear search history:', error)
  }
}