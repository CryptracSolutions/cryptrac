"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Search, 
  ArrowUp, 
  ArrowDown, 
  CornerDownLeft,
  Clock,
  Zap,
  FileText,
  Link,
  Receipt,
  RefreshCw,
  Users,
  Smartphone,
  BarChart3,
  Settings,
  HelpCircle,
  RotateCcw
} from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import { 
  transformApiResponse, 
  weightResults, 
  groupResults, 
  getSearchSuggestions,
  saveSearchHistory,
  getRecentSearches
} from "@/lib/search-utils"
import { useSearchAnalytics, updateSearchMetrics } from "@/lib/hooks/useSearchAnalytics"
import { SearchResult, SearchResultGroup, SearchApiResponse } from "@/types/search"

interface SearchDropdownProps {
  className?: string
}

const CATEGORY_ICONS = {
  actions: Zap,
  pages: FileText,
  payment_links: Link,
  transactions: Receipt,
  subscriptions: RefreshCw,
  customers: Users,
  terminal_devices: Smartphone,
  analytics: BarChart3,
  settings: Settings,
  help: HelpCircle,
  invoices: FileText,
  refunds: RotateCcw
} as const

const STATUS_COLORS = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800", 
  failed: "bg-red-100 text-red-800",
  active: "bg-blue-100 text-blue-800",
  paused: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800"
} as const

export function SearchDropdown({ className }: SearchDropdownProps) {
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [resultGroups, setResultGroups] = React.useState<SearchResultGroup[]>([])
  const [recentSearches] = React.useState<string[]>(() => getRecentSearches())
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const { trackSearchQuery, trackSearchClick } = useSearchAnalytics()

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
    return resultGroups.flatMap(group => group.results)
  }, [resultGroups])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global keyboard shortcut for CMD/CTRL+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search function with debouncing
  const doSearch = React.useMemo(() => {
    let handle: NodeJS.Timeout

    return async (searchQuery: string) => {
      clearTimeout(handle)
      
      handle = setTimeout(async () => {
        if (!searchQuery.trim()) {
          // Show suggestions when empty
          const suggestions = getSearchSuggestions()
          const grouped = groupResults(suggestions.map(result => ({ 
            result, 
            finalScore: 1, 
            matchScore: 1, 
            weightScore: 1 
          })))
          setResultGroups(grouped)
          setSelectedIndex(0)
          return
        }

        setLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
            cache: "no-store"
          })
          
          if (!response.ok) throw new Error("Search failed")
          
          const data: SearchApiResponse = await response.json()
          const searchResults = transformApiResponse(data)
          const weightedResults = weightResults(searchResults, searchQuery)
          const grouped = groupResults(weightedResults)
          
          setResultGroups(grouped)
          setSelectedIndex(0)
          
          // Track search analytics
          const totalResults = searchResults.length
          trackSearchQuery(searchQuery, totalResults)
          updateSearchMetrics(searchQuery, totalResults)
        } catch (error) {
          console.error("Search error:", error)
          setResultGroups([])
        } finally {
          setLoading(false)
        }
      }, 200)
    }
  }, [trackSearchQuery])

  React.useEffect(() => {
    if (isOpen) {
      doSearch(query)
    }
  }, [query, doSearch, isOpen])

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (flatResults[selectedIndex]) {
          handleResultClick(flatResults[selectedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }, [flatResults, selectedIndex, isOpen])

  // Handle result click
  const handleResultClick = React.useCallback((result: SearchResult) => {
    saveSearchHistory(query, result.id)
    
    // Track click analytics
    const totalResults = flatResults.length
    trackSearchClick(query, result.id, totalResults)
    updateSearchMetrics(query, totalResults, true)
    
    router.push(result.href)
    setIsOpen(false)
    setQuery("")
    inputRef.current?.blur()
  }, [query, router, flatResults.length, trackSearchClick])

  // Handle recent search click
  const handleRecentClick = React.useCallback((recentQuery: string) => {
    setQuery(recentQuery)
    setSelectedIndex(0)
  }, [])

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
    if (!query) {
      doSearch("")
    }
  }

  return (
    <div ref={dropdownRef} className={cn("relative w-full max-w-sm", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Search"
          leftIcon={<Search className="h-4 w-4" />}
          className="bg-white border border-gray-200 rounded-lg h-9 text-sm focus:border-[#7f5efd] focus:ring-1 focus:ring-[#7f5efd]/20 transition-colors"
        />
        
        {/* Keyboard shortcut indicator */}
        {!isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
              {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="max-h-96 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#7f5efd] border-t-transparent"></div>
                <span className="ml-3">Searching...</span>
              </div>
            )}

            {!loading && resultGroups.length === 0 && query.trim() && (
              <div className="py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}

            {!loading && !query.trim() && (
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </div>
                    {recentSearches.map((recentQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentClick(recentQuery)}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-600"
                      >
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{recentQuery}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Quick Actions
                  </div>
                  {getSearchSuggestions().map((suggestion) => {
                    const IconComponent = CATEGORY_ICONS[suggestion.category] || Search
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleResultClick(suggestion)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700 truncate">{suggestion.title}</div>
                          {suggestion.description && (
                            <div className="text-xs text-gray-500 truncate">{suggestion.description}</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {!loading && resultGroups.length > 0 && (
              <div className="py-2">
                {resultGroups.map((group) => {
                  const IconComponent = CATEGORY_ICONS[group.category] || Search
                  let currentIndex = 0
                  
                  // Calculate the starting index for this group
                  for (const prevGroup of resultGroups) {
                    if (prevGroup === group) break
                    currentIndex += prevGroup.results.length
                  }
                  
                  return (
                    <div key={group.category} className="mb-1">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <IconComponent className="h-3 w-3" />
                        {group.title}
                      </div>
                      {group.results.map((result, resultIndex) => {
                        const globalIndex = currentIndex + resultIndex
                        const isSelected = globalIndex === selectedIndex
                        
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                              isSelected && "bg-gradient-to-r from-[#7f5efd]/10 to-[#7f5efd]/5 border-r-2 border-[#7f5efd]"
                            )}
                          >
                            <div className="flex-shrink-0">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center",
                                isSelected ? "bg-[#7f5efd] text-white" : "bg-gray-100 text-gray-500"
                              )}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium truncate",
                                  isSelected ? "text-gray-900" : "text-gray-700"
                                )}>
                                  {result.title}
                                </span>
                                {result.badge && (
                                  <Badge 
                                    variant="secondary"
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full",
                                      STATUS_COLORS[result.badge as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-600"
                                    )}
                                  >
                                    {result.badge}
                                  </Badge>
                                )}
                              </div>
                              {result.description && (
                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                  {result.description}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 flex items-center gap-2">
                              {result.metadata?.amount && (
                                <span className="text-xs text-gray-400 font-mono">
                                  {result.metadata.amount} {result.metadata.currency || 'USD'}
                                </span>
                              )}
                              {isSelected && (
                                <div className="text-[#7f5efd]">
                                  <CornerDownLeft className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer with keyboard shortcuts */}
          {resultGroups.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    <ArrowDown className="h-3 w-3" />
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CornerDownLeft className="h-3 w-3" />
                    <span>Select</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}