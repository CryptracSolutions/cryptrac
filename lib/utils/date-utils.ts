interface FormatDateOptions {
  timeZone: string;
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
}

export const formatDate = (dateString: string | null | undefined, options: FormatDateOptions): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatDateShort = (dateString: string | null | undefined, timezone: string): string => {
  return formatDate(dateString, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string | null | undefined, timezone: string): string => {
  return formatDate(dateString, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatTime = (dateString: string | null | undefined, timezone: string): string => {
  return formatDate(dateString, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatFullDateTime = (dateString: string | null | undefined, timezone: string): string => {
  return formatDate(dateString, {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const formatCompactDateTime = (dateString: string | null | undefined, timezone: string): string => {
  return formatDate(dateString, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || timezone;
  } catch {
    return timezone;
  }
};

export const getAllTimezones = (): string[] => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback for older browsers
    return [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Singapore',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Pacific/Auckland',
    ];
  }
};