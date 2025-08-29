"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { CommandPalette } from "./CommandPalette"

interface GlobalSearchProps {
  className?: string
  onCommandPaletteOpen?: () => void
}

export function GlobalSearch({ className, onCommandPaletteOpen }: GlobalSearchProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false)
  
  const handleOpen = () => {
    if (onCommandPaletteOpen) {
      onCommandPaletteOpen()
    } else {
      setIsCommandPaletteOpen(true)
    }
  }
  
  const handleClose = () => {
    setIsCommandPaletteOpen(false)
  }

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleOpen()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleOpen])

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "relative w-full max-w-md bg-white border border-gray-200 rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors",
          "flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:border-transparent",
          className
        )}
      >
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="flex-1 truncate">Search everything...</span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
            K
          </kbd>
        </div>
      </button>
      
      {!onCommandPaletteOpen && (
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={handleClose}
        />
      )}
    </>
  )
}


