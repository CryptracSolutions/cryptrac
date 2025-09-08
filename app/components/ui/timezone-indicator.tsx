'use client';

import React from 'react';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { getTimezoneAbbreviation } from '@/lib/utils/date-utils';
import { Clock } from 'lucide-react';

interface TimezoneIndicatorProps {
  className?: string;
  showIcon?: boolean;
  showFullName?: boolean;
}

export const TimezoneIndicator: React.FC<TimezoneIndicatorProps> = ({ 
  className = '',
  showIcon = true,
  showFullName = false
}) => {
  const { timezone, isLoading } = useTimezone();

  if (isLoading) {
    return null;
  }

  const displayText = showFullName 
    ? timezone.replace(/_/g, ' ')
    : getTimezoneAbbreviation(timezone);

  return (
    <div className={`flex items-center gap-1.5 text-xs text-gray-500 ${className}`}>
      {showIcon && <Clock className="h-3 w-3" />}
      <span className="font-phonic">
        {showFullName ? 'Timezone: ' : ''}
        {displayText}
      </span>
    </div>
  );
};