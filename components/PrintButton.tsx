'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
    >
      Print / Save PDF
    </button>
  );
}
