"use client";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState<{ totalVolume: string; totalTips: number; developersPaid: number } | null>(null);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = (i: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-0">

      {/* Hero */}
      <section className="py-32 md:py-52 border-b rule">
        <div className="grid md:grid-cols-12 gap-12 md:gap-8">
          <div className="md:col-span-8 space-y-8">
            <h1 className="serif text-6xl md:text-8xl lg:text-[7rem] xl:text-[8rem] font-semibold leading-[0.85] tracking-tight">
              Support the humans<br />behind the <span className="underline decoration-accent decoration-2 underline-offset-4">code.</span>
            </h1>
            <p className="text-zinc-700 max-w-lg text-lg leading-relaxed">
              Behind every repo you <code className="font-mono text-sm">npm install</code> without thinking twice, there&apos;s someone who wrote it, fixed it, and kept it running — usually for free. Opentip makes it a five-second thing to change that. Paste a GitHub link, send a tip, done.
            </p>
            <div className="flex gap-3">
              <Link href="/repos"><Button size="lg" className="px-8">Find a repo</Button></Link>
              <Link href="/activity"><Button variant="ghost" size="lg">See who&apos;s been tipped</Button></Link>
            </div>
          </div>
          <div className="md:col-span-4 flex flex-col justify-end space-y-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/opentip-hero-mockup-nobg.png" alt="" className="w-full max-w-[380px] mx-auto mix-blend-multiply" />
            <div className="border-t rule pt-8">
              <div className="grid grid-cols-2 divide-x rule">
                <div className="px-3">
                  <div className="stats text-3xl font-bold tracking-tight">{stats ? `$${(Number(stats.totalVolume) / 1e6).toFixed(0)}` : "—"}</div>
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500 mt-1">tipped so far</div>
                </div>
                <div className="px-3">
                  <div className="stats text-3xl font-bold tracking-tight">{stats ? stats.developersPaid.toLocaleString() : "—"}</div>
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500 mt-1">developers paid</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="py-16 md:py-24 border-b rule">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="serif text-3xl md:text-4xl font-semibold tracking-tight">Open source runs on gratitude. Gratitude doesn&apos;t pay rent.</h2>
          </div>
          <div className="md:col-span-8">
            <p className="text-zinc-700 text-lg leading-relaxed max-w-2xl">
              You&apos;re reading this on software built from open source. So is almost everything else. The people who wrote it get stars, issues, and the occasional &quot;thanks!&quot; in a comment thread. Rarely money. Opentip doesn&apos;t fix open source funding — nothing single-handedly does — but it removes every excuse not to send something when a repo has genuinely helped you.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 border-b rule">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="serif text-3xl md:text-4xl font-semibold tracking-tight">How it works</h2>
          </div>
          <div className="md:col-span-8 space-y-10">
            <div className="space-y-4 border-t rule pt-6">
              <div className="stats text-2xl font-bold">01</div>
              <h3 className="font-semibold text-sm">Change one word in a URL.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Take any GitHub repo link. Swap <code className="font-mono text-xs">github.com</code> for <code className="font-mono text-xs">opentip.dev</code>. That&apos;s the whole trick.
              </p>
              <div className="flex items-center gap-3 text-sm font-mono text-zinc-500 overflow-x-auto">
                <span className="whitespace-nowrap">github.com/vercel/next.js</span>
                <span className="text-zinc-400 flex-shrink-0">&rarr;</span>
                <span className="whitespace-nowrap">opentip.dev/vercel/next.js</span>
              </div>
            </div>
            <div className="space-y-4 border-t rule pt-6">
              <div className="stats text-2xl font-bold">02</div>
              <h3 className="font-semibold text-sm">Send a tip. No account needed.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Connect a wallet, pick an amount, send it. You can tip in ETH or USDC — either way, the developer only ever sees USDC land in their balance. Your $10 stays worth $10, no matter what the market does five minutes later.
              </p>
            </div>
            <div className="space-y-4 border-t rule pt-6">
              <div className="stats text-2xl font-bold">03</div>
              <h3 className="font-semibold text-sm">The developer claims it, whenever.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Tips sit there, accumulating, until the developer decides to claim them. Nobody&apos;s holding their money hostage. Nobody&apos;s approving anything. It&apos;s theirs the moment it lands, they just choose when to move it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why it's built this way */}
      <section className="py-16 md:py-24 border-b rule">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="serif text-3xl md:text-4xl font-semibold tracking-tight">Why it&apos;s built this way</h2>
          </div>
          <div className="md:col-span-8 grid sm:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2 border-t rule pt-4">
              <h3 className="font-semibold text-sm">We never touch your money.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Tips go straight into a smart contract, not into a company bank account. Opentip can&apos;t freeze it, delay it, or lose it. The contract does exactly what its code says, and the code is public.
              </p>
            </div>
            <div className="space-y-2 border-t rule pt-4">
              <h3 className="font-semibold text-sm">Volatility is someone else&apos;s problem, not the developer&apos;s.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                If you tip in ETH, it&apos;s converted to USDC before it ever reaches the contract. A developer who did great work today shouldn&apos;t watch their tip lose 8% of its value by the weekend.
              </p>
            </div>
            <div className="space-y-2 border-t rule pt-4">
              <h3 className="font-semibold text-sm">Everything is checkable.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Every tip, every claim, every fee — it&apos;s all sitting on Basescan for anyone to go look at. We&apos;re not asking you to trust a dashboard. Trust the chain.
              </p>
            </div>
            <div className="space-y-2 border-t rule pt-4">
              <h3 className="font-semibold text-sm">5% keeps the lights on. That&apos;s it.</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Developers keep 95% of every tip. The other 5% funds Opentip itself — no hidden cuts, no surprise fees, nothing else in between.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For developers */}
      <section className="py-16 md:py-24 border-b rule">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="serif text-3xl md:text-4xl font-semibold tracking-tight">For developers</h2>
          </div>
          <div className="md:col-span-8 space-y-6">
            <h3 className="serif text-2xl md:text-3xl font-semibold tracking-tight">Claim your repo. Takes about a minute.</h3>
            <p className="text-zinc-700 text-lg leading-relaxed max-w-2xl">
              Sign in with GitHub, we confirm you actually own (or maintain) the repo, then you link a wallet. That&apos;s the entire setup. From then on, anyone in the world can send you a tip at <code className="font-mono text-sm">opentip.dev/you/your-repo</code>, and it&apos;s waiting for you to claim whenever you want.
            </p>
            <div className="pt-2">
              <Link href="/onboarding"><Button size="lg" className="px-8">Claim your repo</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fee breakdown */}
      <section className="py-16 md:py-24 border-b rule">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="serif text-3xl md:text-4xl font-semibold tracking-tight">Fee breakdown</h2>
            <p className="text-zinc-600 text-sm mt-3 max-w-xs">No fine print. This is the whole thing.</p>
          </div>
          <div className="md:col-span-8">
            <div className="grid grid-cols-3 gap-4 border-t rule pt-6">
              <div>
                <div className="stats text-4xl font-bold tracking-tight">95%</div>
                <div className="text-xs text-zinc-600 mt-1">Goes to developer</div>
              </div>
              <div>
                <div className="stats text-4xl font-bold tracking-tight">5%</div>
                <div className="text-xs text-zinc-600 mt-1">Keeps Opentip running</div>
              </div>
              <div>
                <div className="stats text-2xl font-bold">$1</div>
                <div className="text-xs text-zinc-600 mt-1">Minimum tip, so gas fees never eat someone&apos;s $0.25</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 border-b rule">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="serif text-3xl md:text-4xl font-semibold tracking-tight">FAQ</h2>
          </div>
          <div className="md:col-span-8">
            {[
              { q: "Do I need an account to tip someone?", a: "No. Just a wallet. Tip a repo the same way you'd send anyone money — connect, send, gone." },
              { q: "What if I tip in ETH — does the developer get ETH?", a: "No, they get USDC. Your ETH is swapped automatically before it reaches the contract, so what you send in value is close to what they receive, regardless of ETH's price that day." },
              { q: "What chain does this run on?", a: "Base. It's cheap and fast enough that a $1 tip doesn't get eaten alive by gas fees." },
              { q: "Can anyone claim any repo's tips?", a: "No. Only whoever verifies ownership through GitHub can register a repo and set the wallet that claims its funds." },
              { q: "Has the contract been audited?", a: "Not yet — this is early. The code is open and verified on Basescan, so you don't have to take our word for it, but we're not going to pretend a formal audit has happened when it hasn't." },
              { q: "What happens if a repo gets a new owner?", a: "Whoever's currently verified as the developer can update the payout wallet anytime. Ownership on Opentip follows ownership on GitHub." },
            ].map(({ q, a }, i) => {
              const open = openFaqs.has(i);
              return (
                <div key={q} className="border-t rule">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between py-5 text-left"
                  >
                    <h3 className="font-semibold text-sm pr-4">{q}</h3>
                    {open ? <Minus className="h-4 w-4 flex-shrink-0 text-zinc-500" /> : <Plus className="h-4 w-4 flex-shrink-0 text-zinc-500" />}
                  </button>
                  {open && (
                    <p className="text-sm text-zinc-600 leading-relaxed pb-5">{a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl space-y-6">
          <h2 className="serif text-4xl md:text-5xl font-semibold tracking-tight leading-[0.95]">
            Someone maintained the thing you&apos;re about to use for free. Say thanks in a way that actually means something.
          </h2>
          <div className="pt-2">
            <Link href="/repos"><Button size="lg" className="px-8">Find a repo to support</Button></Link>
          </div>
        </div>
      </section>

    </div>
  );
}
