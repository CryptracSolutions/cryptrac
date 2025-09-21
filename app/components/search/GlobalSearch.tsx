"use client"

import * as React from "react"
import { SearchDropdown } from "./SearchDropdown"

interface GlobalSearchProps {
  className?: string
  autoFocus?: boolean
}

export function GlobalSearch({ className, autoFocus }: GlobalSearchProps) {
  return <SearchDropdown className={className} autoFocus={autoFocus} />
}

