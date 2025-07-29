import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Fetching payment link for ID:', id)

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Fetch payment link by link_id with merchant information
    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .select(`
        id,
        link_id,
        title,
        description,
        amount,
        currency,
        status,
        accepted_cryptos,
        expires_at,
        max_uses,
        current_uses,
        charge_customer_fee,
        merchant:merchants(
          id,
          business_name,
          charge_customer_fee
        )
      `)
      .eq('link_id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching payment link:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Payment link not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment link' },
        { status: 500 }
      )
    }

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, message: 'Payment link not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', paymentLink)

    return NextResponse.json({
      success: true,
      payment_link: paymentLink
    })

  } catch (error) {
    console.error('Error in payment link API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

