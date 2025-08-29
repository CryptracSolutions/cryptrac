export interface SearchResult {
  id: string
  title: string
  description?: string
  href: string
  category: SearchCategory
  icon?: string
  badge?: string
  metadata?: Record<string, any>
  weight?: number
  matchScore?: number
}

export interface SearchResultGroup {
  category: SearchCategory
  title: string
  icon: string
  results: SearchResult[]
}

export interface SearchAction extends Omit<SearchResult, 'category'> {
  action: () => void | Promise<void>
  shortcut?: string[]
}

export interface SearchHistory {
  query: string
  timestamp: number
  resultClicked?: string
}

export interface SearchAnalytics {
  query: string
  results: number
  timestamp: number
  clickedResult?: string
  noResults: boolean
}

export type SearchCategory = 
  | 'pages'
  | 'payment_links' 
  | 'transactions'
  | 'subscriptions'
  | 'customers'
  | 'terminal_devices'
  | 'actions'
  | 'help'
  | 'settings'
  | 'analytics'
  | 'invoices'
  | 'refunds'

export interface SearchConfig {
  maxResults: number
  debounceMs: number
  fuzzyThreshold: number
  categories: SearchCategory[]
  showRecent: boolean
  showSuggestions: boolean
}

export interface SearchState {
  query: string
  isOpen: boolean
  loading: boolean
  results: SearchResultGroup[]
  selectedIndex: number
  history: SearchHistory[]
  recentSearches: string[]
}

// API Response types
export interface SearchApiResponse {
  pages: Array<{
    title: string
    href: string
    description?: string
    weight?: number
  }>
  payment_links: Array<{
    id: string
    title: string
    link_id: string
    amount?: number
    currency?: string
    status?: string
    created_at?: string
    is_exact_link_match?: boolean
  }>
  transactions: Array<{
    id: string
    public_receipt_id: string | null
    total_paid: number | null
    currency: string | null
    status: string | null
    created_at?: string
    payment_method?: string
  }>
  subscriptions: Array<{
    id: string
    title: string | null
    status: string | null
    amount?: number
    billing_cycle?: string
    customer_email?: string
    created_at?: string
  }>
  customers: Array<{
    id: string
    name: string | null
    email: string | null
    phone: string | null
    total_payments?: number
    last_payment?: string
    created_at?: string
  }>
  terminal_devices: Array<{
    id: string
    public_id: string | null
    label: string | null
    status?: string
    location?: string
    created_at?: string
  }>
  invoices?: Array<{
    id: string
    invoice_number: string
    amount: number
    currency: string
    status: string
    due_date: string
    customer_email?: string
  }>
  help_articles?: Array<{
    id: string
    title: string
    description: string
    href: string
    tags?: string[]
  }>
  settings?: Array<{
    id: string
    title: string
    description: string
    href: string
    category: string
  }>
}

// Search utility types
export interface FuzzyMatchResult {
  score: number
  matches: Array<{
    start: number
    end: number
  }>
}

export interface WeightedResult {
  result: SearchResult
  finalScore: number
  matchScore: number
  weightScore: number
}