"use client"

import * as React from "react"
import { SearchDropdown } from "./SearchDropdown"

interface GlobalSearchProps {
  className?: string
}

export function GlobalSearch({ className }: GlobalSearchProps) {


  return <SearchDropdown className={className} />
}


