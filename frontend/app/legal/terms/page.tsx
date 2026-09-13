export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-20 space-y-12">
      <h1 className="serif fluid-page-title font-semibold tracking-tight">Terms of Service</h1>
      <p className="text-sm text-zinc-500">Last updated: September 2026</p>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">1. Acceptance of Terms</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          By accessing or using Opentip (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">2. Description of Service</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Opentip is an open-source platform that allows users to send cryptocurrency tips to open-source software developers. The Service facilitates on-chain transactions on the Base network. Opentip does not custody, hold, or control user funds at any time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">3. Eligibility</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          You must be at least 18 years of age and capable of forming a binding contract to use the Service. You are responsible for ensuring that your use complies with all applicable laws in your jurisdiction.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">4. User Responsibilities</h2>
        <ul className="text-sm leading-relaxed text-zinc-700 list-disc pl-5 space-y-2">
          <li>You are solely responsible for the security of your wallet and credentials.</li>
          <li>You are responsible for all transactions initiated from your wallet.</li>
          <li>You must not use the Service for money laundering, sanctions evasion, or any illegal purpose.</li>
          <li>You must not attempt to exploit, hack, or manipulate the smart contracts or platform.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">5. Fees</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Opentip charges a 5% platform fee on all tips, deducted automatically by the smart contract before distribution to developers. Fees are non-refundable once a transaction is confirmed on-chain.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">6. Smart Contract Risk</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          The Service relies on smart contracts deployed on the Base network. These contracts are provided &quot;as is&quot; and &quot;as available.&quot; While the contracts have been audited and tested, blockchain technology carries inherent risks including but not limited to smart contract bugs, network congestion, and unforeseen vulnerabilities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">7. No Warranty</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          THE SERVICE IS PROVIDED WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">8. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          In no event shall Opentip, its operators, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of funds, data, or profits.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">9. Modifications</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Opentip reserves the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">10. Governing Law</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          These Terms shall be governed by and construed in accordance with the laws of the applicable jurisdiction, without regard to conflict of law principles.
        </p>
      </section>
    </div>
  );
}
