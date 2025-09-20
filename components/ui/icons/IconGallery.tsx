'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import * as Icons from './index';
import type { IconSize, IconColor } from './Icon';

const iconCategories = {
  Navigation: [
    'MoreIcon',
    'CancelIcon',
    'CloseIcon',
    'MenuIcon',
    'ChevronDownIcon',
    'ChevronUpIcon',
    'ChevronLeftIcon',
    'ChevronRightIcon',
    'ArrowLeftIcon',
    'ArrowRightIcon',
    'ExternalLinkIcon',
    'HomeIcon',
    'SearchIcon',
    'SettingsIcon',
  ],
  Form: [
    'CheckIcon',
    'RadioDotIcon',
    'ArrowUpDownIcon',
    'MinusIcon',
    'PlusIcon',
    'CalendarIcon',
    'ClockIcon',
    'EyeIcon',
    'EyeOffIcon',
    'UploadIcon',
    'FilterIcon',
    'SortIcon',
  ],
  Status: [
    'SuccessIcon',
    'SuccessFilledIcon',
    'ErrorIcon',
    'ErrorFilledIcon',
    'WarningIcon',
    'WarningFilledIcon',
    'InfoIcon',
    'InfoFilledIcon',
    'AlertIcon',
    'BadgeDotIcon',
    'StarIcon',
    'StarFilledIcon',
  ],
  Action: [
    'EditIcon',
    'DeleteIcon',
    'CopyIcon',
    'ShareIcon',
    'DownloadIcon',
    'SaveIcon',
    'RefreshIcon',
    'PrintIcon',
    'LinkIcon',
    'DuplicateIcon',
    'ArchiveIcon',
    'MailIcon',
    'UserIcon',
    'LockIcon',
    'UnlockIcon',
  ],
  Payment: [
    'CreditCardIcon',
    'BankIcon',
    'WalletIcon',
    'DollarIcon',
    'BitcoinIcon',
    'EthereumIcon',
    'QRCodeIcon',
    'ReceiptIcon',
    'ShieldCheckIcon',
    'LightningIcon',
    'TagIcon',
    'TrendingUpIcon',
  ],
  Special: [
    'LoadingIcon',
  ],
};

const sizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const colors: IconColor[] = ['default', 'primary', 'brand', 'white', 'disabled', 'success', 'error', 'warning', 'info'];

export function IconGallery() {
  const [selectedSize, setSelectedSize] = useState<IconSize>('md');
  const [selectedColor, setSelectedColor] = useState<IconColor>('default');
  const [showCode, setShowCode] = useState<string | null>(null);

  const copyToClipboard = async (iconName: string) => {
    const importText = `import { ${iconName} } from '@/components/ui/icons';`;
    const usageText = `<${iconName} size="${selectedSize}" color="${selectedColor}" />`;
    const fullText = `${importText}\n\n// Usage:\n${usageText}`;

    try {
      await navigator.clipboard.writeText(fullText);
      alert(`Copied ${iconName} code to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Icon Gallery</h1>
        <p className="text-gray-600 mb-6">
          Complete icon library matching Stripe&apos;s design system. Click on any icon to copy its usage code.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'px-3 py-1 rounded-md border transition-all',
                    selectedSize === size
                      ? 'bg-[#7f5efd] text-white border-[#7f5efd]'
                      : 'bg-white border-gray-300 hover:border-[#7f5efd]'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'px-3 py-1 rounded-md border transition-all',
                    selectedColor === color
                      ? 'bg-[#7f5efd] text-white border-[#7f5efd]'
                      : 'bg-white border-gray-300 hover:border-[#7f5efd]'
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Icon Categories */}
      {Object.entries(iconCategories).map(([category, iconNames]) => (
        <div key={category} className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{category} Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {iconNames.map((iconName) => {
              const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<Icons.IconProps>;
              if (!IconComponent) return null;

              return (
                <div
                  key={iconName}
                  className="relative group"
                  onMouseEnter={() => setShowCode(iconName)}
                  onMouseLeave={() => setShowCode(null)}
                >
                  <button
                    onClick={() => copyToClipboard(iconName)}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-4 rounded-lg border transition-all',
                      'hover:border-[#7f5efd] hover:shadow-md hover:scale-105',
                      selectedColor === 'white' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <IconComponent size={selectedSize} color={selectedColor} animate />
                    <span className={cn(
                      'text-xs mt-2 truncate max-w-full',
                      selectedColor === 'white' ? 'text-gray-300' : 'text-gray-600'
                    )}>
                      {iconName.replace('Icon', '')}
                    </span>
                  </button>

                  {/* Code tooltip */}
                  {showCode === iconName && (
                    <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
                      <code>{`<${iconName} size="${selectedSize}" color="${selectedColor}" />`}</code>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Usage Example */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Usage Example</h2>
        <pre className="bg-gray-900 text-white p-4 rounded-md overflow-x-auto">
          <code>{`import { CheckIcon, CopyIcon, SuccessIcon } from '@/components/ui/icons';

function MyComponent() {
  return (
    <div>
      <CheckIcon size="md" color="brand" />
      <CopyIcon size="lg" color="primary" animate />
      <SuccessIcon size="sm" color="success" />
    </div>
  );
}`}</code>
        </pre>
      </div>

      {/* Size Reference */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Size Reference</h2>
        <div className="flex gap-8 items-end">
          {sizes.map((size) => {
            const IconComponent = Icons.CheckIcon;
            return (
              <div key={size} className="flex flex-col items-center">
                <IconComponent size={size} color="brand" />
                <span className="text-xs mt-2 text-gray-600">
                  {size} ({size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '20px' : size === 'lg' ? '24px' : '32px'})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}