// lib/supabase-custom-types.ts
// Import the generated types (from supabase gen)
import type { Database as GeneratedDatabase } from '../types/database.types';

// Extend the generated Database type to include missing functions like triggers
export type Database = GeneratedDatabase & {
  public: {
    Functions: {
      // Manual type for handle_monthly_bonus trigger function
      // It's a trigger, so no direct args/returns - use 'unknown' for flexibility
      handle_monthly_bonus: {
        Args: Record<string, unknown>; // Any potential args (though trigger has none)
        Returns: unknown; // Trigger returns nothing useful
      };
    };
  };
};

// Usage: In code, import { Database } from '@/lib/supabase-custom-types';
// Then createClient<Database>(...) for typed Supabase client