'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center px-8 py-3 bg-[#7f5efd] hover:bg-[#7c3aed] text-white font-phonic text-base font-normal rounded-lg shadow-lg transition-colors"
    >
      Print / Save PDF
    </button>
  );
}
