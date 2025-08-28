"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Link as LinkIcon } from "lucide-react"

interface SearchResultPage {
  title: string
  href: string
}

interface SearchResultPaymentLink {
  id: string
  title: string
  link_id: string
}

export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [pages, setPages] = React.useState<SearchResultPage[]>([])
  const [links, setLinks] = React.useState<SearchResultPaymentLink[]>([])
  const router = useRouter()

  const doSearch = React.useMemo(() => {
    let handle: number | NodeJS.Timeout
    return (value: string) => {
      clearTimeout(handle as number)
      handle = setTimeout(async () => {
        if (!value) {
          setPages([])
          setLinks([])
          setLoading(false)
          return
        }
        setLoading(true)
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
            cache: "no-store"
          })
          const data = await res.json()
          setPages(data.pages || [])
          setLinks(data.payment_links || [])
        } finally {
          setLoading(false)
        }
      }, 250)
    }
  }, [])

  React.useEffect(() => {
    doSearch(query)
  }, [query, doSearch])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pages[0]) {
      router.push(pages[0].href)
      setOpen(false)
    }
  }

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <form onSubmit={onSubmit}>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          placeholder="Search Cryptrac..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </form>

      {open && (pages.length > 0 || links.length > 0 || loading) && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="max-h-80 overflow-auto py-2">
            {loading && (
              <div className="px-4 py-2 text-sm text-gray-500">Searching…</div>
            )}

            {pages.length > 0 && (
              <div className="py-1">
                <div className="px-4 pb-1 text-xs uppercase tracking-wide text-gray-500">Pages</div>
                {pages.map((p) => (
                  <button
                    key={p.href}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      router.push(p.href)
                      setOpen(false)
                    }}
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <div className="py-1">
                <div className="px-4 pb-1 text-xs uppercase tracking-wide text-gray-500">Payment Links</div>
                {links.map((l) => (
                  <button
                    key={l.id}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      // Route to payments page and perhaps anchor or query
                      router.push(`/merchant/dashboard/payments?link=${encodeURIComponent(l.link_id)}`)
                      setOpen(false)
                    }}
                  >
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{l.title || l.link_id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


