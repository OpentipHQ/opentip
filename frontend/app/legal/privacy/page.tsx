export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-20 space-y-12">
      <h1 className="serif fluid-page-title font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-zinc-500">Last updated: September 2026</p>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">1. Information We Collect</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Opentip collects only the minimum data necessary to operate the Service:
        </p>
        <ul className="text-sm leading-relaxed text-zinc-700 list-disc pl-5 space-y-2">
          <li><strong>GitHub account data:</strong> username, profile image, email (if public), and repository information — used solely for authentication and to populate your developer profile.</li>
          <li><strong>Email address:</strong> used for account recovery and password reset only.</li>
          <li><strong>On-chain addresses:</strong> wallet addresses you link to your account, used for tip distribution.</li>
          <li><strong>Usage data:</strong> minimal server logs (IP addresses, request times) retained for security and debugging.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">2. How We Use Your Data</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Your data is used exclusively to:
        </p>
        <ul className="text-sm leading-relaxed text-zinc-700 list-disc pl-5 space-y-2">
          <li>Authenticate your identity via GitHub OAuth or email/password.</li>
          <li>Display your developer profile and repository information.</li>
          <li>Process and record tip transactions on-chain.</li>
          <li>Send account-related emails (password reset, security alerts).</li>
          <li>Prevent fraud and abuse of the platform.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">3. Data Storage & Security</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Your data is stored in encrypted databases hosted on secure cloud infrastructure. Passwords are hashed with bcrypt. We do not store or have access to your private keys or wallet credentials. All on-chain transactions are public by nature of the blockchain and are not controlled by Opentip.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">4. Data Sharing</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          We do not sell, trade, or share your personal data with third parties, except:
        </p>
        <ul className="text-sm leading-relaxed text-zinc-700 list-disc pl-5 space-y-2">
          <li>GitHub (for OAuth authentication only).</li>
          <li>Resend (for sending transactional emails).</li>
          <li>Azure Blob Storage (for storing uploaded profile images).</li>
          <li>As required by law or to protect the rights and safety of Opentip.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">5. Your Rights</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          You have the right to:
        </p>
        <ul className="text-sm leading-relaxed text-zinc-700 list-disc pl-5 space-y-2">
          <li>Access and download your data.</li>
          <li>Correct inaccurate data.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Revoke GitHub OAuth permissions at any time via your GitHub settings.</li>
        </ul>
        <p className="text-sm leading-relaxed text-zinc-700">
          To exercise these rights, contact us via the link in the site footer.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">6. Blockchain Transparency</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          All tip transactions are recorded on the Base blockchain and are publicly visible. Linking a wallet address to your Opentip account associates that address with your profile. Be aware of this transparency when choosing which addresses to link.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">7. Cookies</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Opentip uses only essential session cookies required for authentication. We do not use tracking cookies, analytics cookies, or advertising cookies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">8. Children&apos;s Privacy</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          The Service is not intended for users under 18. We do not knowingly collect data from children.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl font-semibold">9. Changes to This Policy</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance.
        </p>
      </section>
    </div>
  );
}
