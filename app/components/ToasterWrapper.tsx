"use client"; // Client component

// app/components/ToasterWrapper.tsx
import dynamic from 'next/dynamic';

// Dynamic Toaster with ssr: false (loads client-only, fixes hydration)
const DynamicToaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster), { ssr: false });

export default function ToasterWrapper() {
  return <DynamicToaster />;
}