"use client";

import { LinkIcon } from "./LinkIcon";

type Link = { title: string; url: string };

export default function LinkIcons({ links }: { links: Link[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex gap-3 mt-2">
      {links.map((link, i) => (
        <LinkIcon key={i} url={link.url} title={link.title} />
      ))}
    </div>
  );
}
