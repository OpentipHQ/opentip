"use client";
import Link from "next/link";
import Image from "next/image";

function renderBioWithLinks(bio: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const parts = bio.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-accent break-all">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface ProfileData {
  login: string | null;
  name: string | null;
  image: string | null;
  pfp: string | null;
  header: string | null;
  bio: string | null;
  social: {
    website: string | null;
    twitter: string | null;
    discord: string | null;
    telegram: string | null;
    farcaster: string | null;
    github: string | null;
  };
  repos: {
    repo_id: string;
    total_tipped: string;
    tip_count: number;
  }[];
  stats: {
    total_tipped: string;
    total_tips: number;
    tips_claimed: number;
    repo_count: number;
  };
}

function getWeeks(data: ContributionDay[]): ContributionDay[][] {
  // Build a lookup map from the API data
  const dayMap = new Map<string, ContributionDay>();
  for (const d of data) {
    dayMap.set(d.date, d);
  }

  // Generate full 52-week grid ending today
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  // Align to the previous Sunday (start of GitHub week)
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  const weeks: ContributionDay[][] = [];
  let currentWeek: ContributionDay[] = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const dateStr = cursor.toISOString().split("T")[0];
    currentWeek.push(dayMap.get(dateStr) ?? { date: dateStr, count: 0, level: 0 });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) weeks.push(currentWeek);

  return weeks;
}

const LEVELS = [
  "bg-transparent",
  "bg-[#161b22]",
  "bg-[#0e4429]",
  "bg-[#006d32]",
  "bg-[#26a641]",
];

export function ContributionHeatmap({ contributions }: { contributions: ContributionDay[] }) {
  if (!contributions || contributions.length === 0) return null;

  const weeks = getWeeks(contributions);

  return (
    <div className="overflow-x-auto -mx-6 px-6 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-[2px] min-w-fit">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day, di) => (
              <div
                key={di}
                title={`${day.count} contributions on ${day.date}`}
                className={`w-[8px] h-[8px] rounded-[2px] ${LEVELS[day.level] || LEVELS[0]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileClient({ data, contributions }: { data: ProfileData; contributions: ContributionDay[] }) {
  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20 space-y-10">
      {/* Header + PFP overlay */}
      <section className="-mx-0 sm:-mx-6 md:-mx-10 -mt-12 md:-mt-20">
        {/* Header banner */}
        {data.header ? (
          <Image src={data.header} alt="Header" width={800} height={192} className="w-full h-32 md:h-48 object-cover" />
        ) : (
          <div className="w-full h-32 md:h-48 bg-zinc-200/50" />
        )}

        {/* PFP overlapping header bottom */}
        <div className="relative px-6 md:px-10">
          <div className="-mt-10 md:-mt-12 inline-block">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm border-4 border-[#c1c0b6] bg-[#c1c0b6] overflow-hidden">
              {data.pfp ? (
                <Image src={data.pfp} alt={data.login || "Profile"} width={96} height={96} className="w-full h-full object-cover" />
              ) : data.image ? (
                <Image src={data.image} alt={data.login || "Profile"} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-2xl font-semibold">
                  {data.login?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Name + bio below header */}
        <div className="px-6 md:px-10 pt-3 text-center md:text-left">
          <h1 className="serif fluid-heading font-semibold tracking-tight">{data.login}</h1>
          {data.name && data.name !== data.login && (
            <p className="text-sm text-zinc-600 mt-1">{data.name}</p>
          )}
          {data.bio && (
            <p className="text-sm text-zinc-700 max-w-md leading-relaxed mt-3">{renderBioWithLinks(data.bio)}</p>
          )}
          <div className="mt-3 flex justify-center md:justify-start">
            <SocialLinks social={data.social} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-b rule py-6">
        <div className="flex justify-center fluid-gap">
          <div className="text-center">
            <div className="stats text-2xl font-medium">${data.stats.total_tipped}</div>
            <div className="text-xs text-zinc-500 mt-1">total tipped</div>
          </div>
          <div className="text-center">
            <div className="stats text-2xl font-medium">{data.stats.repo_count}</div>
            <div className="text-xs text-zinc-500 mt-1">repos</div>
          </div>
          <div className="text-center">
            <div className="stats text-2xl font-medium">{data.stats.total_tips}</div>
            <div className="text-xs text-zinc-500 mt-1">tips received</div>
          </div>
          <div className="text-center">
            <div className="stats text-2xl font-medium">${data.stats.tips_claimed.toFixed(2)}</div>
            <div className="text-xs text-zinc-500 mt-1">tips claimed</div>
          </div>
        </div>
      </section>

      {/* Repos */}
      {data.repos.length > 0 && (
        <section className="border rule rounded-sm bg-[#c1c0b6]/50 p-6 space-y-4">
          <h2 className="serif text-lg font-semibold">Repos</h2>
          <ul className="divide-y rule">
            {data.repos.map((r) => (
              <li key={r.repo_id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/${r.repo_id}`} className="font-mono text-sm underline underline-offset-4 hover:text-accent">{r.repo_id}</Link>
                    <div className="flex gap-4 mt-1">
                      <span className="stats text-xs text-zinc-500">${(Number(r.total_tipped) / 1e6).toFixed(2)} tipped</span>
                      <span className="stats text-xs text-zinc-500">{r.tip_count} tips</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contribution heatmap */}
      {contributions.length > 0 && (
        <section className="border rule rounded-sm bg-[#c1c0b6]/50 p-6 space-y-4">
          <h2 className="serif text-lg font-semibold">GitHub contribution activity</h2>
          <ContributionHeatmap contributions={contributions} />
          <p className="text-xs text-zinc-500">GitHub contributions from the past year</p>
        </section>
      )}
    </div>
  );
}

function SocialLinks({ social }: { social: ProfileData["social"] }) {
  const links: { key: string; href: string | null; icon: React.ReactNode }[] = [
    { key: "github", href: social.github ? `https://github.com/${social.github}` : null, icon: GithubSvg() },
    { key: "website", href: social.website, icon: WebsiteSvg() },
    { key: "twitter", href: social.twitter ? `https://twitter.com/${social.twitter}` : null, icon: TwitterSvg() },
    { key: "farcaster", href: social.farcaster ? `https://warpcast.com/${social.farcaster}` : null, icon: FarcasterSvg() },
    { key: "discord", href: social.discord ? `https://discord.com/users/${social.discord}` : null, icon: DiscordSvg() },
    { key: "telegram", href: social.telegram ? `https://t.me/${social.telegram}` : null, icon: TelegramSvg() },
  ];

  const visible = links.filter((l) => l.href);
  if (visible.length === 0) return null;

  return (
    <div className="flex gap-3">
      {visible.map((link) => (
        <a
          key={link.key}
          href={link.href!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-900 transition-colors"
          title={link.key}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

function GithubSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function WebsiteSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function TwitterSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function FarcasterSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724" />
    </svg>
  );
}
