import Link from "next/link";
import InstallModal from "@/components/InstallModal";
import { FundForm } from "@/components/home/FundForm";
import { HomeHeader } from "@/components/home/HomeHeader";
import "./home.css";

const contractAddress = "0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC";
const basescan = `https://basescan.org/address/${contractAddress}`;

const steps = [
  {
    n: "01",
    title: "Swap one word in the URL.",
    body: "Replace github.com with opentip.tech on any repo link to open its funding page.",
  },
  {
    n: "02",
    title: "Fund it in any supported token.",
    body: "Connect a wallet, choose an amount in ETH, USDC, or OAR, and confirm. No account required.",
  },
  {
    n: "03",
    title: "Maintainers claim on their schedule.",
    body: "Funds are held by the contract and belong to the maintainer the moment they land. They withdraw whenever they choose.",
  },
];

const trust = [
  {
    n: "01",
    title: "Non-custodial by design.",
    body: "Funds go to a public smart contract, never to an Opentip account. Only the registered payout wallet can withdraw a maintainer’s balance.",
  },
  {
    n: "02",
    title: "Multi-token support.",
    body: "Accept ETH, USDC, or OAR with no extra setup.",
  },
  {
    n: "03",
    title: "Fully verifiable.",
    body: "Every contribution, claim, and fee is recorded on Basescan.",
  },
  {
    n: "04",
    title: "Transparent pricing.",
    body: "A flat 5% platform fee. Maintainers receive 95% of every contribution.",
  },
];

const faqs = [
  {
    q: "Do I need an account to fund a repo?",
    a: "No. Connect a wallet, choose ETH, USDC, or OAR, and confirm. Funding does not require an Opentip account.",
  },
  {
    q: "If I send ETH, does the maintainer receive ETH?",
    a: "Yes. A contribution stays in the token you send. ETH is claimable as ETH, USDC as USDC, and OAR as OAR.",
  },
  {
    q: "What chain does this run on?",
    a: "Base. Contributions, claims, and fees are on Base mainnet and visible on Basescan.",
  },
  {
    q: "Can anyone claim any repo’s funds?",
    a: "No. Claiming requires the payout wallet registered for that repo. Registration happens after a maintainer signs in with GitHub and Opentip verifies ownership or maintainer access.",
  },
  {
    q: "Has the contract been audited?",
    a: "The contract is public and verifiable on Basescan. Read the source and the on-chain record before you send funds.",
  },
  {
    q: "What happens if a repo changes owner?",
    a: "The payout address does not follow GitHub on its own. The registered wallet can update it, and Opentip can reassign it after the new maintainer verifies access. Funds stay in the contract until they are claimed.",
  },
  {
    q: "Isn’t the contract centralized?",
    a: "Funds are held by the contract, not by Opentip. An owner key can pause tips, registrations, payout-address updates, and claims; set the fee to any rate up to a hard 10% cap; and reassign a payout address. It cannot withdraw a maintainer’s pending balance — only the current payout address can claim it. The owner can withdraw the separate fee balance. Reassigning the payout address changes which wallet can claim. Those actions are public on Basescan.",
  },
];

export function HomePage() {
  return (
    <div className="home-root">
      <InstallModal />
      <HomeHeader />
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero-inner">
            <p className="eyebrow">On Base · Non-custodial</p>
            <h1 id="hero-title" className="display">
              Funding for open source,
              <br /> from the <em>open market</em>.
            </h1>
            <p className="lede">
              Opentip turns any GitHub repo into a funding page. Users, companies, and fans send ETH, USDC, or OAR straight to a smart contract on Base, and maintainers claim it whenever they want.
            </p>
            <FundForm />
            <Link className="text-cta" href="/onboarding">
              Claim your repo
              <Arrow />
            </Link>
            <ul className="trust-line">
              <li>Built on Base</li>
              <li>95% to maintainers</li>
              <li>No account needed to tip</li>
              <li>
                <a href={basescan} target="_blank" rel="noopener noreferrer">
                  Contract verified on Basescan
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section className="section stage-section" aria-labelledby="stage-title">
          <div className="wrap stage-copy">
            <p className="eyebrow">See it in action</p>
            <h2 id="stage-title" className="display display-sm">
              From repo link to funded in under a minute
            </h2>
            <p className="lede">Replace github.com with opentip.tech on any repo link to open its funding page.</p>
          </div>
          <div className="wrap">
            <div className="stage" aria-hidden="true">
              <div className="browser">
                <div className="browser-chrome">
                  <span className="traffic">
                    <i />
                    <i />
                    <i />
                  </span>
                  <div className="omnibox">
                    <span className="scheme">https://</span>
                    <span className="host-slot">
                      <span className="host host-gh">
                        <span className="swap">
                          <span className="host-hl" />
                          github.com
                        </span>
                        <span className="path">/owner/repo</span>
                      </span>
                      <span className="host host-ot">
                        opentip.tech<span className="path">/owner/repo</span>
                      </span>
                    </span>
                  </div>
                </div>
                <div className="preview">
                  <div className="preview-top">
                    <div>
                      <p className="preview-kicker">Funding page</p>
                      <p className="preview-repo">owner/repo</p>
                    </div>
                    <span className="preview-pill">Preview</span>
                  </div>
                  <div className="amount-block">
                    <p className="preview-kicker">Amount</p>
                    <div className="amount-slot">
                      <p className="amount amount-eth">
                        0.05 <span>ETH</span>
                      </p>
                      <p className="amount amount-usdc">
                        25 <span>USDC</span>
                      </p>
                      <p className="amount amount-oar">
                        100 <span>OAR</span>
                      </p>
                    </div>
                  </div>
                  <div className="token-row">
                    <span className="token-ind" />
                    <span className="token token-eth">ETH</span>
                    <span className="token token-usdc">USDC</span>
                    <span className="token token-oar">OAR</span>
                  </div>
                  <div className="mini-split">
                    <div className="mini-bar">
                      <span />
                      <span />
                    </div>
                    <div className="mini-labels">
                      <span>95% maintainer</span>
                      <span>5% fee</span>
                    </div>
                  </div>
                  <div className="status-slot">
                    <p className="status status-wait">Connect a wallet to fund</p>
                    <p className="status status-held">Held by the contract on Base</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="stage-caption">
              <span className="mono">github.com/owner/repo</span>
              <span aria-hidden="true" className="stage-arrow">
                →
              </span>
              <span className="mono stage-after">opentip.tech/owner/repo</span>
            </p>
          </div>
        </section>

        <section className="section reveal" aria-labelledby="problem-title">
          <div className="wrap problem">
            <h2 id="problem-title" className="display display-sm">
              Open source powers everything. Its funding doesn’t.
            </h2>
            <p className="lede">
              Nearly every product ships on open-source code, yet most maintainers earn nothing from it. Opentip gives every repo a direct funding channel, open to anyone, with no platform holding the money in between.
            </p>
          </div>
        </section>

        <section className="section reveal" aria-labelledby="how-title">
          <div className="wrap">
            <div className="section-intro">
              <h2 id="how-title" className="display display-sm">
                How it works
              </h2>
            </div>
            <ol className="steps">
              {steps.map((step) => (
                <li key={step.n}>
                  <span className="step-num" aria-hidden="true">
                    {step.n}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {step.n === "01" ? (
                    <p className="step-url">
                      <span>github.com/owner/repo</span>
                      <span aria-hidden="true">↓</span>
                      <span className="now">opentip.tech/owner/repo</span>
                    </p>
                  ) : null}
                  {step.n === "02" ? (
                    <div className="token-pills" aria-hidden="true">
                      <span>ETH</span>
                      <span>USDC</span>
                      <span>OAR</span>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section reveal" aria-labelledby="trust-title">
          <div className="wrap">
            <div className="section-intro">
              <h2 id="trust-title" className="display display-sm">
                Built for trust
              </h2>
            </div>
            <ul className="trust-grid">
              {trust.map((item) => (
                <li key={item.n}>
                  <span className="trust-index">{item.n}</span>
                  <h3>{item.title}</h3>
                  <p>
                    {item.body}
                    {item.n === "03" ? (
                      <>
                        {" "}
                        <a className="inline-link" href={basescan} target="_blank" rel="noopener noreferrer">
                          View the contract
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                        .
                      </>
                    ) : null}
                  </p>
                  {item.n === "03" ? <p className="address">{contractAddress}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="maintainer reveal" aria-labelledby="maintainer-title">
          <div className="wrap maintainer-grid">
            <div>
              <p className="eyebrow">For maintainers</p>
              <h2 id="maintainer-title" className="display display-sm">
                Turn your repo into a funding channel
              </h2>
              <p className="lede">
                Sign in with GitHub, verify ownership or maintainer access, and link a wallet. Setup takes about a minute. Your repo is then fundable at <code className="code-url">opentip.tech/owner/repo</code>.
              </p>
              <Link href="/onboarding" className="btn-brand">
                Claim your repo
                <Arrow />
              </Link>
            </div>
            <aside className="funding-card" aria-label="Example funding address">
              <p className="eyebrow">After setup</p>
              <p className="funding-url">
                <span>opentip.tech/</span>owner/repo
              </p>
              <p>Anyone can fund the page. You claim the balance whenever you choose.</p>
            </aside>
          </div>
        </section>

        <section className="section reveal" aria-labelledby="price-title">
          <div className="wrap">
            <div className="price-head">
              <p className="eyebrow">Pricing</p>
              <h2 id="price-title" className="display display-sm">
                Simple, transparent pricing
              </h2>
              <p className="lede">The same terms on every contribution, in ETH, USDC, or OAR.</p>
            </div>
            <div className="split-bar" role="img" aria-label="95 percent to the maintainer and 5 percent platform fee">
              <span />
              <span />
            </div>
            <ul className="price-grid">
              <li>
                <p className="price-value">95%</p>
                <p>to the maintainer</p>
              </li>
              <li>
                <p className="price-value">5%</p>
                <p>platform fee</p>
              </li>
              <li>
                <p className="price-value">$1</p>
                <p>minimum per contribution, to keep gas costs proportionate</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="section reveal" aria-labelledby="faq-title">
          <div className="wrap faq-layout">
            <div>
              <h2 id="faq-title" className="display display-sm">
                FAQ
              </h2>
            </div>
            <div className="faq-list">
              {faqs.map((item, index) => (
                <details key={item.q} name="faq" open={index === 0}>
                  <summary>
                    <h3>{item.q}</h3>
                    <span className="plus" aria-hidden="true" />
                  </summary>
                  <div className="faq-panel">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta reveal" aria-labelledby="close-title">
          <div className="wrap">
            <h2 id="close-title" className="display display-sm">
              Back the software you build on.
            </h2>
            <Link href="/repos" className="btn-brand">
              Find a repo to fund
              <Arrow />
            </Link>
          </div>
        </section>
      </main>

      <footer id="site-footer" className="site-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#top" className="brand">
                <span className="logo-mark" aria-hidden="true" />
                <span>Opentip</span>
              </a>
              <p>Funding for open source, from the open market.</p>
            </div>
            <nav className="footer-col" aria-label="Product">
              <h2 className="footer-label">Product</h2>
              <Link href="/repos">Repos</Link>
              <Link href="/activity">Activity</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/docs">Docs</Link>
            </nav>
            <nav className="footer-col" aria-label="Social">
              <h2 className="footer-label">Social</h2>
              <a href="https://github.com/opentiphq" target="_blank" rel="noopener noreferrer">
                GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href="https://x.com/opentip_tech" target="_blank" rel="noopener noreferrer">
                X<span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href="mailto:support@opentip.tech">support@opentip.tech</a>
            </nav>
            <nav className="footer-col" aria-label="Legal">
              <h2 className="footer-label">Legal</h2>
              <Link href="/legal/terms">Terms</Link>
              <Link href="/legal/privacy">Privacy</Link>
            </nav>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Opentip</p>
            <p>Non-custodial on Base</p>
          </div>
          <p className="footer-wordmark" aria-hidden="true">
            Opentip
          </p>
        </div>
      </footer>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="arrow-icon">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
