import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const HAS_SUPABASE_CONFIG = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const initialConnectionStatus: ConnectionStatus = {
  connected: false,
  reconnecting: false,
  error: null,
  method: 'none',
  lastUpdate: null
}

interface PaymentStatus {
  payment_id: string
  payment_status: string
  pay_address: string
  payin_extra_id?: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
  actually_paid?: number
  tx_hash?: string
  network?: string
}

interface UseRealTimePaymentStatusOptions {
  paymentId: string | null
  enabled?: boolean
  onStatusChange?: (status: PaymentStatus) => void
  fallbackToPolling?: boolean
  pollingInterval?: number
}

interface ConnectionStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
  method: 'realtime' | 'polling' | 'sse' | 'none'
  lastUpdate: Date | null
}

export function useRealTimePaymentStatus({
  paymentId,
  enabled = true,
  onStatusChange,
  fallbackToPolling = true,
  pollingInterval = 5000
}: UseRealTimePaymentStatusOptions) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus)

  const supabaseRef = useRef<SupabaseClient | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const paymentStatusRef = useRef<PaymentStatus | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10
  const missingConfigWarnedRef = useRef(false)
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasInitialFetchRef = useRef(false)
  const connectionMethodRef = useRef<'none' | 'realtime' | 'sse' | 'polling'>('none')
  
  // Stable refs to prevent stale closures
  const connectSSERef = useRef<(() => void) | null>(null)
  const startPollingRef = useRef<(() => void) | null>(null)

  // Initialize Supabase client
  if (!supabaseRef.current && HAS_SUPABASE_CONFIG) {
    supabaseRef.current = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!
    )
  } else if (!HAS_SUPABASE_CONFIG && !missingConfigWarnedRef.current) {
    console.warn('useRealTimePaymentStatus: Supabase configuration missing. Falling back to polling/SSE only.')
    missingConfigWarnedRef.current = true
  }

  // Update payment status and notify listeners
  const updatePaymentStatus = useCallback((newStatus: PaymentStatus) => {
    if (!isMountedRef.current) {
      console.log('⚠️ Skipping status update - component unmounted')
      return
    }
    console.log(`📨 Payment status update received:`, newStatus.payment_status)
    paymentStatusRef.current = newStatus
    setPaymentStatus(newStatus)
    setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }))
    onStatusChange?.(newStatus)
  }, [onStatusChange])

  // Polling fallback function
  const pollPaymentStatus = useCallback(async () => {
    if (!paymentId || !isMountedRef.current) return

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      console.log(`🔄 Polling payment status for: ${paymentId}`)
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.payment) {
          updatePaymentStatus(data.payment)
          if (isMountedRef.current) {
            setConnectionStatus(prev => ({
              ...prev,
              connected: true,
              error: null,
              method: 'polling'
            }))
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Polling request aborted')
        return
      }
      console.error('❌ Polling error:', error)
      if (isMountedRef.current) {
        setConnectionStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Polling failed'
        }))
      }
    }
  }, [paymentId, updatePaymentStatus])

  // Server-Sent Events connection
  const connectSSE = useCallback(() => {
    if (!paymentId) return

    console.log(`📺 Connecting to SSE for payment: ${paymentId}`)
    connectionMethodRef.current = 'sse'

    const eventSource = new EventSource(`/api/websocket/payment-status`, {
      // Note: EventSource doesn't support POST, so we'll use the subscription endpoint
    })

    eventSource.onopen = () => {
      console.log('✅ SSE connection established')
      setConnectionStatus(prev => ({
        ...prev,
        connected: true,
        reconnecting: false,
        error: null,
        method: 'sse'
      }))
      reconnectAttemptsRef.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'payment_status_update' && data.payment_id === paymentId) {
          // Use current payment status from ref to avoid stale closure
          const currentStatus = paymentStatusRef.current
          updatePaymentStatus({
            payment_id: data.payment_id,
            payment_status: data.status,
            pay_address: currentStatus?.pay_address || '',
            pay_amount: currentStatus?.pay_amount || 0,
            pay_currency: currentStatus?.pay_currency || '',
            price_amount: currentStatus?.price_amount || 0,
            price_currency: currentStatus?.price_currency || 'USD',
            order_id: currentStatus?.order_id || '',
            order_description: currentStatus?.order_description || '',
            created_at: currentStatus?.created_at || '',
            updated_at: data.timestamp,
            tx_hash: data.tx_hash,
            actually_paid: data.amount_received,
            outcome_amount: data.merchant_receives,
            outcome_currency: data.payout_currency,
            network: data.pay_currency
          })
        }
      } catch (error) {
        console.warn('⚠️ Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = () => {
      console.error('❌ SSE connection error')
      setConnectionStatus(prev => ({ 
        ...prev, 
        connected: false,
        error: 'SSE connection failed'
      }))
      eventSource.close()
      
      // Attempt reconnect or fallback
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++
        setConnectionStatus(prev => ({ ...prev, reconnecting: true }))
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (paymentId && isMountedRef.current) connectSSE()
        }, Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 30000)) // Exponential backoff with max 30s
      } else if (fallbackToPolling) {
        console.log('🔄 Falling back to polling after SSE failures')
        if (paymentId && startPollingRef.current) {
          startPollingRef.current()
        }
      }
    }

    eventSourceRef.current = eventSource
  }, [paymentId, updatePaymentStatus, fallbackToPolling])

  // Supabase real-time connection
  const connectRealTime = useCallback(() => {
    if (!paymentId || !supabaseRef.current) return

    console.log(`📡 Connecting to Supabase real-time for payment: ${paymentId}`)
    connectionMethodRef.current = 'realtime'

    // Create subscription to both database changes and broadcast events
    const channel = supabaseRef.current
      .channel(`payment-${paymentId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'transactions',
          filter: `nowpayments_payment_id=eq.${paymentId}`
        }, 
        (payload) => {
          console.log(`📨 Database change received for payment ${paymentId}`)
          // Convert database payload to PaymentStatus format
          const dbData = payload.new as Record<string, unknown>
          updatePaymentStatus({
            payment_id: dbData.nowpayments_payment_id as string,
            payment_status: dbData.status as string,
            pay_address: (dbData.pay_address as string) || '',
            payin_extra_id: dbData.payin_extra_id as string | undefined,
            pay_amount: (dbData.pay_amount as number) || 0,
            pay_currency: (dbData.pay_currency as string) || '',
            price_amount: (dbData.amount as number) || 0,
            price_currency: (dbData.currency as string) || 'USD',
            order_id: (dbData.order_id as string) || '',
            order_description: (dbData.description as string) || '',
            created_at: dbData.created_at as string,
            updated_at: dbData.updated_at as string,
            tx_hash: dbData.tx_hash as string | undefined,
            actually_paid: dbData.amount_received as number | undefined,
            outcome_amount: dbData.merchant_receives as number | undefined,
            outcome_currency: dbData.payout_currency as string | undefined,
            network: dbData.pay_currency as string | undefined
          })
        }
      )
      .on('broadcast', 
        { event: 'payment_status_update' }, 
        (payload) => {
          console.log(`📨 Broadcast received for payment ${paymentId}`)
          const broadcastData = payload.payload
          if (broadcastData.payment_id === paymentId) {
            // Use current status to avoid stale closure
            const currentStatus = paymentStatusRef.current
            updatePaymentStatus({
              payment_id: broadcastData.payment_id,
              payment_status: broadcastData.status,
              pay_address: currentStatus?.pay_address || '',
              payin_extra_id: currentStatus?.payin_extra_id,
              pay_amount: currentStatus?.pay_amount || 0,
              pay_currency: currentStatus?.pay_currency || '',
              price_amount: currentStatus?.price_amount || 0,
              price_currency: currentStatus?.price_currency || 'USD',
              order_id: currentStatus?.order_id || '',
              order_description: currentStatus?.order_description || '',
              created_at: currentStatus?.created_at || '',
              updated_at: broadcastData.timestamp,
              tx_hash: broadcastData.tx_hash,
              actually_paid: broadcastData.amount_received,
              outcome_amount: broadcastData.merchant_receives,
              outcome_currency: broadcastData.payout_currency,
              network: broadcastData.currency_received
            })
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Supabase subscription status: ${status}`)

        if (status === 'SUBSCRIBED') {
          setConnectionStatus(prev => ({
            ...prev,
            connected: true,
            reconnecting: false,
            error: null,
            method: 'realtime'
          }))
          reconnectAttemptsRef.current = 0
          // Keep polling running for redundancy - both methods can coexist
          console.log('✅ Real-time connected, keeping polling for redundancy')
        } else if (status === 'CLOSED') {
          setConnectionStatus(prev => ({ 
            ...prev, 
            connected: false,
            error: 'Real-time connection closed'
          }))
          
          // Attempt reconnect or fallback
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++
            setConnectionStatus(prev => ({ ...prev, reconnecting: true }))
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (paymentId && supabaseRef.current && isMountedRef.current) connectRealTime()
            }, Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 30000))
          } else {
            console.log('🔄 Falling back to SSE after real-time failures')
            // Fallback to polling for reliability
            console.log('🔄 Falling back to polling after real-time failures')
            if (paymentId && startPollingRef.current) {
              startPollingRef.current()
            }
          }
        }
      })

    subscriptionRef.current = channel
  }, [paymentId, updatePaymentStatus]) // Remove circular dependencies

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // Already polling

    console.log(`🔄 Starting polling for payment: ${paymentId}`)
    connectionMethodRef.current = 'polling'
    setConnectionStatus(prev => ({ ...prev, method: 'polling' }))

    // Start polling immediately for faster updates
    pollPaymentStatus()

    // Set up interval - use provided interval for faster updates
    pollingIntervalRef.current = setInterval(pollPaymentStatus, pollingInterval)
  }, [paymentId, pollPaymentStatus, pollingInterval])

  // Update function refs to avoid stale closures
  connectSSERef.current = connectSSE
  startPollingRef.current = startPolling

  // Stop all connections
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from payment status updates')

    // Abort any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    const hadPolling = Boolean(pollingIntervalRef.current)
    const hadSSE = Boolean(eventSourceRef.current)
    const hadSubscription = Boolean(subscriptionRef.current)
    const hadTimeout = Boolean(reconnectTimeoutRef.current)

    // Clear polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    
    // Close SSE
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    // Unsubscribe from Supabase
    if (subscriptionRef.current) {
      void subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    connectionMethodRef.current = 'none'

    const hadSideEffect = hadPolling || hadSSE || hadSubscription || hadTimeout

    if (isMountedRef.current) {
      setConnectionStatus(prev => {
        const shouldUpdateStatus =
          hadSideEffect ||
          prev.connected ||
          prev.reconnecting ||
          prev.error !== null ||
          prev.method !== 'none' ||
          prev.lastUpdate !== null

        return shouldUpdateStatus ? initialConnectionStatus : prev
      })
    }
  }, [])

  // Connect on mount and when paymentId changes
  useEffect(() => {
    if (!enabled || !paymentId) {
      disconnect()
      return
    }

    console.log(`🚀 Starting real-time connection for payment: ${paymentId}`)

    // Always start with polling for immediate updates, then try real-time
    if (fallbackToPolling && startPollingRef.current) {
      startPollingRef.current()
    }

    // Try real-time connections in parallel for faster updates
    if (HAS_SUPABASE_CONFIG) {
      connectRealTime()
    } else if (connectSSERef.current) {
      connectSSERef.current()
    }

    return disconnect
  }, [enabled, paymentId, connectRealTime, disconnect, fallbackToPolling])

  // Perform an immediate initial status fetch for fastest first update
  useEffect(() => {
    if (enabled && paymentId && !hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true
      // Immediate fetch for fastest initial status
      if (isMountedRef.current) {
        pollPaymentStatus()
      }
    }
  }, [enabled, paymentId, pollPaymentStatus])

  // Track mounted state and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      disconnect()
    }
  }, [disconnect])

  return {
    paymentStatus,
    connectionStatus,
    reconnect: connectRealTime,
    disconnect
  }
}
