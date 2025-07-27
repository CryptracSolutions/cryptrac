// Cache utility for NOWPayments API rate limiting and performance optimization
// Implements both in-memory cache (NodeCache) and database cache for persistence

import NodeCache from 'node-cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// In-memory cache for fast access (TTL in seconds)
const memoryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance for read-only data
});

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  useMemoryOnly?: boolean; // Skip database cache
  forceRefresh?: boolean; // Bypass cache and fetch fresh data
}

// Create Supabase client for cache operations
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context
          }
        },
      },
    }
  );
}

/**
 * Get data from cache (memory first, then database)
 */
export async function getCachedData<T>(
  key: string, 
  options: CacheOptions = {}
): Promise<T | null> {
  const { useMemoryOnly = false, forceRefresh = false } = options;

  if (forceRefresh) {
    return null;
  }

  // Try memory cache first
  const memoryData = memoryCache.get<T>(key);
  if (memoryData) {
    console.log(`Cache HIT (memory): ${key}`);
    return memoryData;
  }

  // Skip database cache if memory-only
  if (useMemoryOnly) {
    console.log(`Cache MISS (memory-only): ${key}`);
    return null;
  }

  try {
    // Try database cache
    const supabase = await getSupabaseClient();
    const { data: cacheEntry, error } = await supabase
      .from('nowpayments_cache')
      .select('cache_data, expires_at')
      .eq('cache_key', key)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !cacheEntry) {
      console.log(`Cache MISS (database): ${key}`);
      return null;
    }

    const cachedData = cacheEntry.cache_data as T;
    
    // Store in memory cache for faster future access
    const expiresAt = new Date(cacheEntry.expires_at);
    const ttlSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    
    if (ttlSeconds > 0) {
      memoryCache.set(key, cachedData, ttlSeconds);
      console.log(`Cache HIT (database): ${key}, stored in memory for ${ttlSeconds}s`);
      return cachedData;
    }

    console.log(`Cache EXPIRED (database): ${key}`);
    return null;

  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache (both memory and database)
 */
export async function setCachedData<T>(
  key: string, 
  data: T, 
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = 300, useMemoryOnly = false } = options; // 5 minutes default
  
  try {
    // Store in memory cache
    memoryCache.set(key, data, ttl);
    console.log(`Cache SET (memory): ${key} for ${ttl}s`);

    // Skip database cache if memory-only
    if (useMemoryOnly) {
      return;
    }

    // Store in database cache for persistence
    const expiresAt = new Date(Date.now() + (ttl * 1000));
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('nowpayments_cache')
      .upsert({
        cache_key: key,
        cache_data: data,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      console.error(`Database cache error for key ${key}:`, error);
      // Don't throw - memory cache still works
    } else {
      console.log(`Cache SET (database): ${key} expires at ${expiresAt.toISOString()}`);
    }

  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    // Don't throw - let the application continue without cache
  }
}

/**
 * Delete data from cache
 */
export async function deleteCachedData(key: string): Promise<void> {
  try {
    // Remove from memory cache
    memoryCache.del(key);
    console.log(`Cache DELETE (memory): ${key}`);

    // Remove from database cache
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('nowpayments_cache')
      .delete()
      .eq('cache_key', key);

    if (error) {
      console.error(`Database cache delete error for key ${key}:`, error);
    } else {
      console.log(`Cache DELETE (database): ${key}`);
    }

  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Clear all cache data
 */
export async function clearAllCache(): Promise<void> {
  try {
    // Clear memory cache
    memoryCache.flushAll();
    console.log('Cache CLEAR (memory): all keys');

    // Clear database cache
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('nowpayments_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Database cache clear error:', error);
    } else {
      console.log('Cache CLEAR (database): all keys');
    }

  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Clean expired entries from database cache
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.rpc('clean_expired_cache');

    if (error) {
      console.error('Cache cleanup error:', error);
    } else {
      console.log('Cache cleanup completed');
    }

  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    memory: {
      keys: memoryCache.keys().length,
      stats: memoryCache.getStats()
    }
  };
}

// Cache key generators for consistent naming
export const CacheKeys = {
  // NOWPayments API cache keys
  currencies: () => 'nowpayments:currencies',
  payoutCurrencies: () => 'nowpayments:payout-currencies',
  estimate: (from: string, to: string, amount: number) => 
    `nowpayments:estimate:${from}:${to}:${amount}`,
  
  // Merchant-specific cache keys
  merchantCurrencies: (merchantId: string) => 
    `merchant:${merchantId}:currencies`,
  merchantSettings: (merchantId: string) => 
    `merchant:${merchantId}:settings`,
  
  // System cache keys
  supportedCurrencies: () => 'system:supported-currencies',
  popularCurrencies: () => 'system:popular-currencies'
} as const;

// Default TTL values for different types of data
export const CacheTTL = {
  // NOWPayments data (changes infrequently)
  currencies: 24 * 60 * 60, // 24 hours
  estimates: 5 * 60, // 5 minutes
  
  // Merchant data (changes occasionally)
  merchantSettings: 30 * 60, // 30 minutes
  
  // System data (changes rarely)
  supportedCurrencies: 12 * 60 * 60, // 12 hours
  
  // Short-term cache
  temporary: 5 * 60 // 5 minutes
} as const;

