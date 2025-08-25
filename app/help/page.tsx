import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support"
};

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="heading-xl text-gray-900">Help &amp; Support</h1>
        <p className="text-body-lg text-gray-600">Get help with Cryptrac cryptocurrency payments</p>
      </div>

      {/* Getting Started */}
      <section className="space-y-6">
        <h2 className="heading-lg text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-[#7f5efd] rounded-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">1. Account Setup</h3>
            <p className="text-body text-gray-600 mb-4">Complete your merchant profile and verify your business information.</p>
            <ul className="text-body-sm text-gray-600 space-y-2">
              <li>• Add your business details</li>
              <li>• Configure payment settings</li>
              <li>• Set up your cryptocurrency wallets</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">2. Create Payment Links</h3>
            <p className="text-body text-gray-600 mb-4">Generate payment links for your customers to pay with cryptocurrency.</p>
            <ul className="text-body-sm text-gray-600 space-y-2">
              <li>• Set payment amounts and currencies</li>
              <li>• Choose accepted cryptocurrencies</li>
              <li>• Configure fees and tax settings</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Payment Setup */}
      <section className="space-y-6">
        <h2 className="heading-lg text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-[#7f5efd] rounded-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          Payment Setup Instructions
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-medium border-0">
          <div className="space-y-6">
            <div>
              <h3 className="heading-sm text-gray-900 mb-3">Understanding Payment Fees</h3>
              <p className="text-body text-gray-600 mb-4">Every crypto payment includes two separate fees:</p>
              <ul className="list-disc pl-6 space-y-2 text-body text-gray-600">
                <li><strong>Network Fees:</strong> paid to the blockchain. They vary by coin, network congestion, and transaction size.</li>
                <li><strong>Gateway Fees:</strong> 0.5% for direct payouts or 1% when Auto-Convert is on. You choose whether you or the customer pays this fee.</li>
              </ul>
              <p className="text-body-sm text-gray-500 mt-4">
                Cryptrac does not earn from any transaction fees. Our revenue is the $19/month subscription.
              </p>
            </div>
            
            <div>
              <h3 className="heading-sm text-gray-900 mb-3">Auto-Convert vs Direct Crypto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Direct Crypto (0.5% fee)</h4>
                  <p className="text-sm text-green-700">Receive the same cryptocurrency your customer sends. Lower fees, but you manage multiple crypto assets.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Auto-Convert (1% fee)</h4>
                  <p className="text-sm text-blue-700">Automatically convert all payments to your preferred stable coin. Higher fees but simplified accounting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Configuration */}
      <section className="space-y-6">
        <h2 className="heading-lg text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-[#7f5efd] rounded-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          Wallet Configuration Help
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-medium border-0">
          <div className="space-y-4">
            <div>
              <h3 className="heading-sm text-gray-900 mb-3">Adding Wallet Addresses</h3>
              <p className="text-body text-gray-600 mb-4">To receive cryptocurrency payments, you need to add wallet addresses for each cryptocurrency you want to accept.</p>
              <ol className="list-decimal pl-6 space-y-2 text-body text-gray-600">
                <li>Go to your <strong>Settings</strong> page</li>
                <li>Navigate to the <strong>Wallets</strong> section</li>
                <li>Add your wallet address for each cryptocurrency</li>
                <li>Verify the address is correct before saving</li>
              </ol>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Security Note</h4>
              <p className="text-sm text-yellow-700">Always double-check wallet addresses. Cryptocurrency transactions cannot be reversed if sent to the wrong address.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-6">
        <h2 className="heading-lg text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-[#7f5efd] rounded-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          Troubleshooting Common Issues
        </h2>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">Payment Not Received</h3>
            <ul className="text-body text-gray-600 space-y-2">
              <li>• Check that the payment link is still active and not expired</li>
              <li>• Verify the customer sent the correct amount</li>
              <li>• Confirm the transaction on the blockchain explorer</li>
              <li>• Check your wallet address is correctly configured</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">High Network Fees</h3>
            <ul className="text-body text-gray-600 space-y-2">
              <li>• Network fees vary based on blockchain congestion</li>
              <li>• Consider using Layer 2 solutions for lower fees</li>
              <li>• Bitcoin and Ethereum typically have higher fees</li>
              <li>• Solana, Base, and BNB usually have lower fees</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">Auto-Convert Issues</h3>
            <ul className="text-body text-gray-600 space-y-2">
              <li>• Auto-convert may take a few minutes to process</li>
              <li>• Check your stable coin wallet address is set</li>
              <li>• Verify the conversion rate at time of payment</li>
              <li>• Contact support if conversion fails</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="heading-lg text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-[#7f5efd] rounded-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">What fees will I pay, and which payout option is right for me?</h3>
            <p className="text-body text-gray-600">If you want the lowest fees and are comfortable managing crypto, choose Auto-Convert off. If you prefer to avoid price swings and want all payments in one asset, enable Auto-Convert—just remember the higher fees are due to conversion spread, not Cryptrac revenue.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">Does Cryptrac earn from transaction fees?</h3>
            <p className="text-body text-gray-600">No. Gateway fees and network fees go entirely to processing the transaction. Cryptrac's revenue comes from the monthly subscription fee.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">How are network fees determined?</h3>
            <p className="text-body text-gray-600">They depend on the coin, network congestion, and how much is being sent. Networks like Bitcoin and Ethereum cost more, while Solana, Base, or BNB are usually just a few cents.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">Can I get refunds for failed payments?</h3>
            <p className="text-body text-gray-600">Cryptrac does not handle refunds. Any refund or dispute is strictly between you and your customer. Because payments are made directly to your wallet, chargebacks are not possible.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-medium border-0">
            <h3 className="heading-sm text-gray-900 mb-3">How do I track my payments?</h3>
            <p className="text-body text-gray-600">All payments are tracked in your merchant dashboard. You can view payment history, download reports, and monitor your revenue in real-time.</p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="space-y-6">
        <h2 className="heading-lg text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-[#7f5efd] rounded-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          Contact Support
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-medium border-0 text-center">
          <p className="text-body text-gray-600 mb-4">
            Need more help? Our support team is here to assist you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:support@cryptrac.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7f5efd] hover:bg-[#7c3aed] text-white rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
