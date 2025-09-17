'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="p-1 hover:bg-[#7f5efd]/10 rounded transition-colors"
      title={`Copy ${label}`}
    >
      <Copy className={`h-3 w-3 ${copied ? 'text-green-600' : 'text-[#7f5efd]'}`} />
    </button>
  );
}