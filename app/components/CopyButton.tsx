'use client';

import { CopyIcon, CheckIcon } from '@/components/ui/icons';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className="min-w-[44px] min-h-[44px] p-2 sm:p-1 rounded transition-colors flex items-center justify-center"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <CheckIcon size="md" color="success" animate className="sm:w-3 sm:h-3" />
      ) : (
        <CopyIcon size="md" color="brand" animate className="sm:w-3 sm:h-3" />
      )}
    </button>
  );
}