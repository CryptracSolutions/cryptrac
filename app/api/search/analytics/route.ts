import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { query, results, clickedResult, noResults } = await request.json()

    // Get authenticated user via server client
    const supabase = await createServerClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    // If not authenticated, still track analytics but without user association
    const analyticsData = {
      query: query?.substring(0, 255) || '', // Limit query length
      results_count: results || 0,
      clicked_result: clickedResult?.substring(0, 255) || null,
      no_results: Boolean(noResults),
      user_id: user?.id || null,
      timestamp: new Date().toISOString(),
      // Additional useful metrics
      query_length: query?.length || 0,
      has_click: Boolean(clickedResult),
      session_info: {
        user_agent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer')
      }
    }

    // Store analytics in localStorage on client or in a database/analytics service
    // For now, we'll just log it and return success
    console.log('Search analytics:', analyticsData)

    // In production, you might want to:
    // 1. Store in a dedicated analytics database
    // 2. Send to analytics service like Google Analytics, Mixpanel, etc.
    // 3. Store in Supabase analytics table
    
    // Example: Store in Supabase analytics table (if table exists)
    try {
      await supabase
        .from('search_analytics')
        .insert({
          query: analyticsData.query,
          results_count: analyticsData.results_count,
          clicked_result: analyticsData.clicked_result,
          no_results: analyticsData.no_results,
          user_id: analyticsData.user_id,
          query_length: analyticsData.query_length,
          has_click: analyticsData.has_click,
          user_agent: analyticsData.session_info.user_agent,
          referrer: analyticsData.session_info.referrer,
          created_at: analyticsData.timestamp
        })
    } catch (dbError) {
      // Table might not exist, ignore error but log for debugging
      console.log('Analytics table not available:', dbError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Search analytics error:', error)
    // Don't fail search functionality due to analytics errors
    return NextResponse.json({ success: false, error: 'Analytics tracking failed' }, { status: 200 })
  }
}