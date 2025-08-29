import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { SearchApiResponse } from "@/types/search"

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

    // Comprehensive pages and actions to search
    const allPages = [
      // Core Dashboard Pages
      { title: "Dashboard", href: "/merchant/dashboard", description: "Business overview and key metrics", weight: 1.0 },
      { title: "Payments", href: "/merchant/dashboard/payments", description: "View and manage payment links", weight: 0.9 },
      { title: "Create Payment Link", href: "/merchant/dashboard/payments/create", description: "Generate new payment links", weight: 1.0 },
      { title: "Profile", href: "/merchant/dashboard/profile", description: "Business profile and information", weight: 0.7 },
      { title: "Transactions", href: "/merchant/dashboard/tax-reports", description: "Transaction history and tax reports", weight: 0.8 },
      { title: "Analytics", href: "/merchant/dashboard/analytics", description: "Business reports and insights", weight: 0.6 },
      
      // Subscriptions
      { title: "Subscriptions", href: "/merchant/subscriptions", description: "Manage recurring payments", weight: 0.8 },
      { title: "Create Subscription", href: "/merchant/subscriptions/create", description: "Set up recurring billing", weight: 0.9 },
      
      // Account Management
      { title: "Wallets", href: "/merchant/wallets", description: "Cryptocurrency wallet settings", weight: 0.7 },
      { title: "Settings", href: "/merchant/settings", description: "Account preferences and configuration", weight: 0.6 },
      
      // Quick Actions
      { title: "Smart Terminal", href: "/smart-terminal", description: "Accept in-person crypto payments", weight: 1.0 },
      { title: "QR Scanner", href: "/smart-terminal/scanner", description: "Scan QR codes for payments", weight: 0.8 },
      { title: "Generate QR Code", href: "/merchant/dashboard/payments/create?qr=true", description: "Create QR code for payments", weight: 0.8 },
      
      // Help & Support
      { title: "Help & Support", href: "/help", description: "Documentation and support resources", weight: 0.5 },
      { title: "Contact Support", href: "/contact", description: "Get help from our team", weight: 0.6 },
      { title: "Payment Links Guide", href: "/payment-links-info", description: "Learn about payment links", weight: 0.4 },
      { title: "Smart Terminal Guide", href: "/smart-terminal-info", description: "Learn about the smart terminal", weight: 0.4 },
      { title: "Supported Cryptocurrencies", href: "/supported-cryptocurrencies", description: "View supported crypto currencies", weight: 0.5 },
      { title: "Subscription Billing Guide", href: "/subscriptions-info", description: "Learn about recurring payments", weight: 0.4 },
      
      // Legal & Compliance
      { title: "Terms of Service", href: "/terms", description: "Platform terms and conditions", weight: 0.3 },
      { title: "Privacy Policy", href: "/privacy", description: "Privacy and data protection policy", weight: 0.3 },
      { title: "Security", href: "/security", description: "Platform security information", weight: 0.4 },
      { title: "Cookie Policy", href: "/cookies", description: "Cookie usage and preferences", weight: 0.2 },
      
      // Business Information
      { title: "About Cryptrac", href: "/about", description: "Learn about our platform", weight: 0.3 },
      { title: "Blog", href: "/blog", description: "Latest news and updates", weight: 0.2 }
    ]

    const qLower = q.toLowerCase()
    const pageResults = allPages
      .filter((p) => p.title.toLowerCase().includes(qLower))
      .slice(0, 8)

    // If not authenticated, return page results only
    if (!user) {
      return NextResponse.json({ pages: pageResults, payment_links: [], transactions: [], subscriptions: [], customers: [], terminal_devices: [] })
    }

    // Find merchant id for the user
    const { data: merchantRow } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const merchantId = merchantRow?.id

    // Query merchant data with enhanced fields
    let paymentLinks: SearchApiResponse['payment_links'] = []
    let transactions: SearchApiResponse['transactions'] = []
    let subscriptions: SearchApiResponse['subscriptions'] = []
    let customers: SearchApiResponse['customers'] = []
    let devices: SearchApiResponse['terminal_devices'] = []
    let invoices: SearchApiResponse['invoices'] = []
    let helpArticles: SearchApiResponse['help_articles'] = []
    let settings: SearchApiResponse['settings'] = []
    if (merchantId) {
      // Enhanced payment links query with link_id specific search
      const { data } = await supabase
        .from("payment_links")
        .select("id,title,link_id,amount,currency,status,created_at,expires_at")
        .eq("merchant_id", merchantId)
        .or(
          `title.ilike.%${q}%,link_id.ilike.%${q}%,description.ilike.%${q}%,link_id.eq.${q}`
        )
        .order("updated_at", { ascending: false })
        .limit(15)
      paymentLinks = (data || []).map(link => ({
        id: link.id,
        title: link.title,
        link_id: link.link_id,
        amount: link.amount,
        currency: link.currency,
        status: link.status,
        created_at: link.created_at,
        // Add a flag to indicate if this is an exact link_id match for special routing
        is_exact_link_match: link.link_id === q
      }))

      // Enhanced transactions query
      const { data: txs } = await supabase
        .from("transactions")
        .select("id,public_receipt_id,total_paid,currency,status,created_at,payment_method,blockchain_hash")
        .eq("merchant_id", merchantId)
        .or(
          `public_receipt_id.ilike.%${q}%,status.ilike.%${q}%,currency.ilike.%${q}%,blockchain_hash.ilike.%${q}%`
        )
        .order("created_at", { ascending: false })
        .limit(15)
      transactions = (txs || []).map(tx => ({
        id: tx.id,
        public_receipt_id: tx.public_receipt_id,
        total_paid: tx.total_paid,
        currency: tx.currency,
        status: tx.status,
        created_at: tx.created_at,
        payment_method: tx.payment_method
      }))

      // Enhanced subscriptions query
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id,title,status,amount,billing_cycle,customer_email,created_at")
        .eq("merchant_id", merchantId)
        .or(
          `title.ilike.%${q}%,status.ilike.%${q}%,customer_email.ilike.%${q}%,billing_cycle.ilike.%${q}%`
        )
        .order("created_at", { ascending: false })
        .limit(15)
      subscriptions = (subs || []).map(sub => ({
        id: sub.id,
        title: sub.title,
        status: sub.status,
        amount: sub.amount,
        billing_cycle: sub.billing_cycle,
        customer_email: sub.customer_email,
        created_at: sub.created_at
      }))

      // Enhanced customers query
      const { data: custs } = await supabase
        .from("customers")
        .select("id,name,email,phone,created_at,total_payments,last_payment")
        .eq("merchant_id", merchantId)
        .or(
          `name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
        )
        .order("created_at", { ascending: false })
        .limit(15)
      customers = (custs || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        created_at: customer.created_at,
        total_payments: customer.total_payments,
        last_payment: customer.last_payment
      }))

      // Enhanced terminal devices query
      const { data: devs } = await supabase
        .from("terminal_devices")
        .select("id,public_id,label,status,location,created_at")
        .eq("merchant_id", merchantId)
        .or(
          `public_id.ilike.%${q}%,label.ilike.%${q}%,location.ilike.%${q}%,status.ilike.%${q}%`
        )
        .order("created_at", { ascending: false })
        .limit(15)
      devices = (devs || []).map(device => ({
        id: device.id,
        public_id: device.public_id,
        label: device.label,
        status: device.status,
        location: device.location,
        created_at: device.created_at
      }))
      
      // Query invoices if table exists
      try {
        const { data: invs } = await supabase
          .from("subscription_invoices")
          .select("id,invoice_number,amount,currency,status,due_date,customer_email")
          .eq("merchant_id", merchantId)
          .or(
            `invoice_number.ilike.%${q}%,customer_email.ilike.%${q}%,status.ilike.%${q}%`
          )
          .order("created_at", { ascending: false })
          .limit(10)
        invoices = (invs || []).map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          due_date: inv.due_date,
          customer_email: inv.customer_email
        }))
      } catch {
        // Table might not exist, ignore
        invoices = []
      }
      
      // Add help articles based on search query
      helpArticles = [
        {
          id: "help-payment-links",
          title: "Setting up Payment Links",
          description: "Learn how to create and manage payment links",
          href: "/help#payment-links",
          tags: ["payments", "links", "setup"]
        },
        {
          id: "help-terminal",
          title: "Using Smart Terminal",
          description: "Guide to accepting in-person crypto payments",
          href: "/help#smart-terminal", 
          tags: ["terminal", "qr", "payments"]
        },
        {
          id: "help-subscriptions",
          title: "Recurring Billing Setup",
          description: "How to set up subscription payments",
          href: "/help#subscriptions",
          tags: ["subscriptions", "recurring", "billing"]
        },
        {
          id: "help-wallets",
          title: "Wallet Configuration",
          description: "Setting up cryptocurrency wallets",
          href: "/help#wallets",
          tags: ["wallets", "crypto", "setup"]
        }
      ].filter(article => 
        article.title.toLowerCase().includes(q.toLowerCase()) ||
        article.description.toLowerCase().includes(q.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
      )
      
      // Add settings search results
      settings = [
        {
          id: "settings-profile",
          title: "Business Profile",
          description: "Update business information and details",
          href: "/merchant/dashboard/profile",
          category: "profile"
        },
        {
          id: "settings-wallets",
          title: "Wallet Settings",
          description: "Manage cryptocurrency wallet addresses",
          href: "/merchant/wallets",
          category: "wallets"
        },
        {
          id: "settings-notifications",
          title: "Notification Settings",
          description: "Configure email and payment notifications",
          href: "/merchant/settings#notifications",
          category: "notifications"
        },
        {
          id: "settings-api",
          title: "API Settings",
          description: "Manage API keys and integrations",
          href: "/merchant/settings#api",
          category: "api"
        }
      ].filter(setting =>
        setting.title.toLowerCase().includes(q.toLowerCase()) ||
        setting.description.toLowerCase().includes(q.toLowerCase())
      )
    }

    const response: SearchApiResponse = {
      pages: pageResults,
      payment_links: paymentLinks,
      transactions,
      subscriptions,
      customers,
      terminal_devices: devices,
      invoices,
      help_articles: helpArticles,
      settings
    }
    
    return NextResponse.json(response)
  } catch (err) {
    console.error("/api/search error", err)
    return NextResponse.json({ pages: [], payment_links: [] }, { status: 200 })
  }
}


