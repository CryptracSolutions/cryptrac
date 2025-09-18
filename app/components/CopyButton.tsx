'use client';

import { Copy } from 'lucide-react';
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
      className="min-w-[44px] min-h-[44px] p-2 sm:p-1 hover:bg-[#7f5efd]/10 rounded transition-colors flex items-center justify-center"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      <Copy className={`h-5 w-5 sm:h-3 sm:w-3 ${copied ? 'text-green-600' : 'text-[#7f5efd]'}`} />
    </button>
  );
}