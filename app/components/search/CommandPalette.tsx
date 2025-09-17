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
  RotateCcw,
  X
} from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
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

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
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

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [resultGroups, setResultGroups] = React.useState<SearchResultGroup[]>([])
  const [recentSearches] = React.useState<string[]>(() => getRecentSearches())
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { trackSearchQuery, trackSearchClick } = useSearchAnalytics()

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setResultGroups([])
    }
  }, [isOpen])

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
    return resultGroups.flatMap(group => group.results)
  }, [resultGroups])

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
    doSearch(query)
  }, [query, doSearch])

  // Handle result click
  const handleResultClick = React.useCallback((result: SearchResult) => {
    saveSearchHistory(query, result.id)
    
    // Track click analytics
    const totalResults = flatResults.length
    trackSearchClick(query, result.id, totalResults)
    updateSearchMetrics(query, totalResults, true)
    
    router.push(result.href)
    onClose()
  }, [query, router, onClose, flatResults.length, trackSearchClick])

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
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
        onClose()
        break
    }
  }, [flatResults, selectedIndex, onClose, handleResultClick])

  // Handle recent search click
  const handleRecentClick = React.useCallback((recentQuery: string) => {
    setQuery(recentQuery)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search everything..."
              className="flex-1 border-none shadow-none text-base placeholder:text-gray-400 focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
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

            {!loading && !query.trim() && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                {recentSearches.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(recentQuery)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-600"
                  >
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{recentQuery}</span>
                  </button>
                ))}
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
      </div>
    </div>
  )
}
