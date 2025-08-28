import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim()

    // Early return empty if no query
    if (!q) {
      return NextResponse.json({ pages: [], payment_links: [] })
    }

    // Get authenticated user via server client
    const supabase = await createServerClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    // Static pages to search (routes across dashboard/help/contact)
    const allPages = [
      { title: "Dashboard", href: "/merchant/dashboard" },
      { title: "Payments", href: "/merchant/dashboard/payments" },
      { title: "Create Payment Link", href: "/merchant/dashboard/payments/create" },
      { title: "Profile", href: "/merchant/dashboard/profile" },
      { title: "Transactions", href: "/merchant/dashboard/tax-reports" },
      { title: "Wallets", href: "/merchant/wallets" },
      { title: "Settings", href: "/merchant/settings" },
      { title: "Help & Support", href: "/help" },
      { title: "Contact", href: "/contact" },
    ]

    const qLower = q.toLowerCase()
    const pageResults = allPages
      .filter((p) => p.title.toLowerCase().includes(qLower))
      .slice(0, 8)

    // If not authenticated, return page results only
    if (!user) {
      return NextResponse.json({ pages: pageResults, payment_links: [] })
    }

    // Find merchant id for the user
    const { data: merchantRow } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const merchantId = merchantRow?.id

    // Query payment_links for this merchant
    let paymentLinks: Array<{ id: string; title: string; link_id: string }> = []
    if (merchantId) {
      const { data } = await supabase
        .from("payment_links")
        .select("id,title,link_id")
        .eq("merchant_id", merchantId)
        .or(
          `title.ilike.%${q}%,link_id.ilike.%${q}%`
        )
        .order("updated_at", { ascending: false })
        .limit(10)
      paymentLinks = (data || []) as typeof paymentLinks
    }

    return NextResponse.json({ pages: pageResults, payment_links: paymentLinks })
  } catch (err) {
    console.error("/api/search error", err)
    return NextResponse.json({ pages: [], payment_links: [] }, { status: 200 })
  }
}


