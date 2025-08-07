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

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <p className="font-medium">
          What fees will I pay, and which payout option is right for me?
        </p>
        <p>
          If you want the lowest fees and are comfortable managing crypto,
          choose Auto-Convert off. If you prefer to avoid price swings and want
          all payments in one asset, enable Auto-Convert—just remember the higher
          fees are due to conversion spread, not Cryptrac revenue.
        </p>
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
