import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Store active WebSocket connections
const connections = new Map<string, {
  ws: WebSocket
  paymentId: string
  clientId: string
  lastActivity: number
}>()

// Cleanup inactive connections every 30 seconds
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(connections.entries())
  for (const [id, conn] of entries) {
    if (now - conn.lastActivity > 300000) { // 5 minutes
      try {
        conn.ws.close()
      } catch (e) {
        console.warn('Error closing stale WebSocket:', e)
      }
      connections.delete(id)
      console.log(`🧹 Cleaned up stale WebSocket connection: ${id}`)
    }
  }
}, 30000)

// Broadcast payment status update to all connected clients watching this payment
// Currently unused - kept for potential future WebSocket implementation
// function broadcastPaymentStatusUpdate(paymentId: string, statusData: any) {
//   const message = JSON.stringify({
//     type: 'payment_status_update',
//     payment_id: paymentId,
//     ...statusData,
//     timestamp: new Date().toISOString()
//   })

//   let broadcastCount = 0
//   const entries = Array.from(connections.entries())
//   for (const [id, conn] of entries) {
//     if (conn.paymentId === paymentId) {
//       try {
//         if (conn.ws.readyState === WebSocket.OPEN) {
//           conn.ws.send(message)
//           conn.lastActivity = Date.now()
//           broadcastCount++
//         } else {
//           // Clean up closed connections
//           connections.delete(id)
//         }
//       } catch (error) {
//         console.warn(`Error broadcasting to WebSocket ${id}:`, error)
//         connections.delete(id)
//       }
//     }
//   }

//   if (broadcastCount > 0) {
//     console.log(`📡 Broadcasted payment status update for ${paymentId} to ${broadcastCount} clients`)
//   }
// }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('payment_id')
  const clientId = searchParams.get('client_id') || `client_${Date.now()}_${Math.random()}`

  if (!paymentId) {
    return NextResponse.json(
      { success: false, error: 'payment_id parameter required' },
      { status: 400 }
    )
  }

  // Check if request supports WebSocket upgrade
  const upgradeHeader = request.headers.get('upgrade')
  if (upgradeHeader !== 'websocket') {
    return NextResponse.json(
      { success: false, error: 'WebSocket upgrade required' },
      { status: 400 }
    )
  }

  try {
    // Create Supabase client for real-time subscriptions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify payment exists before setting up WebSocket
    const { data: payment, error } = await supabase
      .from('transactions')
      .select('id, nowpayments_payment_id, status')
      .eq('nowpayments_payment_id', paymentId)
      .single()

    if (error || !payment) {
      console.warn(`Payment not found for WebSocket connection: ${paymentId}`)
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log(`🔌 Setting up WebSocket connection for payment: ${paymentId} (client: ${clientId})`)

    // For now, return success - actual WebSocket upgrade will be handled by Next.js
    // This endpoint serves as the WebSocket handshake endpoint
    return NextResponse.json({
      success: true,
      message: 'WebSocket connection established',
      payment_id: paymentId,
      client_id: clientId,
      current_status: payment.status
    })

  } catch (error) {
    console.error('Error setting up WebSocket connection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to establish WebSocket connection' },
      { status: 500 }
    )
  }
}

// WebSocket connection handler (for Server-Sent Events fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, action, client_id } = body

    if (!payment_id) {
      return NextResponse.json({ success: false, error: 'payment_id required' }, { status: 400 })
    }

    if (action === 'subscribe') {
      // Set up Server-Sent Events as WebSocket fallback
      console.log(`📺 Setting up SSE connection for payment: ${payment_id} (client: ${client_id || 'unknown'})`)
      
      // Verify payment exists before setting up SSE
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: payment, error } = await supabase
        .from('transactions')
        .select('id, nowpayments_payment_id, status')
        .eq('nowpayments_payment_id', payment_id)
        .single()

      if (error || !payment) {
        console.warn(`Payment not found for SSE connection: ${payment_id}`)
        return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
      }

      const encoder = new TextEncoder()
      
      const stream = new ReadableStream({
        start(controller) {
          // Send initial connection success message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'connection_established',
            payment_id,
            client_id: client_id || 'sse_client',
            current_status: payment.status,
            timestamp: new Date().toISOString()
          })}\n\n`))

          // Set up Supabase real-time subscription
          const subscription = supabase
            .channel(`payment-${payment_id}-sse`)
            .on('postgres_changes', 
              { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'transactions',
                filter: `nowpayments_payment_id=eq.${payment_id}`
              }, 
              (payload) => {
                console.log(`📨 SSE: Received real-time update for payment ${payment_id}:`, payload.new.status)
                
                const message = {
                  type: 'payment_status_update',
                  payment_id,
                  status: payload.new.status,
                  tx_hash: payload.new.tx_hash,
                  payin_hash: payload.new.payin_hash,
                  payout_hash: payload.new.payout_hash,
                  amount_received: payload.new.amount_received,
                  currency_received: payload.new.currency_received,
                  merchant_receives: payload.new.merchant_receives,
                  payout_currency: payload.new.payout_currency,
                  timestamp: new Date().toISOString()
                }

                try {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
                } catch (error) {
                  console.warn('SSE connection closed during message send:', error)
                  subscription.unsubscribe()
                }
              }
            )
            .on('broadcast', 
              { event: 'payment_status_update' }, 
              (payload) => {
                console.log(`📨 SSE: Received broadcast for payment ${payment_id}`)
                const broadcastData = payload.payload
                if (broadcastData.payment_id === payment_id) {
                  try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'payment_status_update',
                      ...broadcastData,
                      source: 'broadcast'
                    })}\n\n`))
                  } catch (error) {
                    console.warn('SSE connection closed during broadcast:', error)
                    subscription.unsubscribe()
                  }
                }
              }
            )
            .subscribe()

          // Keep connection alive with heartbeat
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`))
            } catch {
              clearInterval(heartbeat)
              subscription.unsubscribe()
            }
          }, 30000) // 30 second heartbeat

          // Cleanup on connection close
          return () => {
            clearInterval(heartbeat)
            subscription.unsubscribe()
            console.log(`🔌 SSE connection closed for payment: ${payment_id}`)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('SSE endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to establish SSE connection' 
    }, { status: 500 })
  }
}