'use client';

import { useState, useCallback } from 'react';

interface CleanupResult {
  success: boolean;
  message: string;
  cleanedCount: number;
  cleanedRecords?: Array<{
    id: string;
    business_name: string;
    created_at: string;
  }>;
}

export function useOnboardingCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupIncompleteOnboarding = useCallback(async (): Promise<CleanupResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🧹 Triggering onboarding cleanup...');

      const response = await fetch('/api/merchants/cleanup-incomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cleanup failed');
      }

      const result: CleanupResult = await response.json();
      
      console.log('✅ Cleanup completed:', result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup incomplete onboarding';
      console.error('❌ Cleanup error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cleanupIncompleteOnboarding,
    isLoading,
    error,
  };
}