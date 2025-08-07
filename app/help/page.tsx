import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support"
};

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Help &amp; Support</h1>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">Refund Policy</h2>
        <p>
          Cryptrac does not handle refunds. Any refund or dispute is strictly
          between you and your customer. Because payments are made directly
          to your wallet, chargebacks are not possible.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">Understanding Payment Fees</h2>
        <p>
          Every crypto payment includes two separate fees:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Network Fees:</strong> paid to the blockchain. They vary by
            coin, network congestion, and transaction size.
          </li>
          <li>
            <strong>Gateway Fees:</strong> 0.5% for direct payouts or 1% when
            Auto-Convert is on. You choose whether you or the customer pays
            this fee.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Cryptrac does not earn from any transaction fees. Our revenue is the
          $19/month subscription.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">
          Crypto vs. Traditional Payment Processors
        </h2>
        <p>
          Card processors like Stripe, PayPal, and Square typically charge about
          2.9% + $0.30 per transaction. With Cryptrac, you usually pay 0.5%–1%
          plus a small network fee, making crypto payments cheaper for merchants
          in most cases.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">Best Practice Recommendations</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>For lowest cost and most transparency:</strong> receive the
            same crypto your customer sends by keeping Auto-Convert off.
          </li>
          <li>
            <strong>For price stability and simplified accounting:</strong> turn
            Auto-Convert on to receive payments in your preferred stable coin.
          </li>
          <li>
            <strong>Payment amount strategy:</strong> set a minimum payment
            amount so network fees are a small percentage of each payment.
          </li>
          <li>
            <strong>Review process:</strong> review payout details after each
            payment for a full breakdown of all fees.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="space-y-2">
          <p className="font-medium">
            What fees will I pay, and which payout option is right for me?
          </p>
          <p>
            If you want the lowest fees and are comfortable managing crypto,
            choose Auto-Convert off. If you prefer to avoid price swings and
            want all payments in one asset, enable Auto-Convert—just remember
            the higher fees are due to conversion spread, not Cryptrac revenue.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Does Cryptrac earn from transaction fees?</p>
          <p>No. Gateway fees and network fees go entirely to processing the transaction.</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">How are network fees determined?</p>
          <p>
            They depend on the coin, network congestion, and how much is being
            sent. Networks like Bitcoin and Ethereum cost more, while Solana,
            Base, or BNB are usually just a few cents.
          </p>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        Need more help? Reach out to us at{' '}
        <Link
          href="mailto:support@cryptrac.com"
          className="text-primary underline"
        >
          support@cryptrac.com
        </Link>
        .
      </p>
    </div>
  );
}
