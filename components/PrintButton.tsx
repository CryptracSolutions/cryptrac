'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center px-6 sm:px-8 py-3 min-h-[48px] bg-[#7f5efd] hover:bg-[#7c3aed] text-white font-phonic text-base font-normal rounded-lg shadow-lg transition-colors"
    >
      Print / Save PDF
    </button>
  );
}
