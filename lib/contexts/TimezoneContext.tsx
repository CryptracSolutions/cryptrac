'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface TimezoneContextType {
  timezone: string;
  isLoading: boolean;
  updateTimezone: (newTimezone: string) => Promise<void>;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const TimezoneProvider = ({ children }: { children: ReactNode }) => {
  const [timezone, setTimezone] = useState('America/New_York'); // Default timezone
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMerchantTimezone = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: merchant } = await supabase
            .from('merchants')
            .select('timezone')
            .eq('user_id', user.id)
            .single();
          
          if (merchant && merchant.timezone) {
            setTimezone(merchant.timezone);
          }
        }
      } catch (error) {
        console.error('Error fetching merchant timezone:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantTimezone();
  }, [supabase]);

  const updateTimezone = async (newTimezone: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('merchants')
          .update({ timezone: newTimezone })
          .eq('user_id', user.id);
        
        if (!error) {
          setTimezone(newTimezone);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating timezone:', error);
      throw error;
    }
  };

  return (
    <TimezoneContext.Provider value={{ timezone, isLoading, updateTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};