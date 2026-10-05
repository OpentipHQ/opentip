"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import HeaderAuth from "@/components/HeaderAuth";
import NotificationBell from "@/components/NotificationBell";

const nav = [
  { href: "/repos", label: "Repos" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
];

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { status } = useSession();

  useEffect(() => {
    if (!open) return;

    const menu = document.getElementById(menuId);
    const main = document.getElementById("main-content");
    const footer = document.getElementById("site-footer");
    const previouslyFocused = document.activeElement as HTMLElement | null;

    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const items = menu ? [...menu.querySelectorAll<HTMLElement>("a, button")] : [];
    items[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [open, menuId]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <header id="top" className="site-header">
      <div className="wrap header-bar">
        <a href="#top" className="brand">
          <span className="logo-mark" aria-hidden="true" />
          <span>Opentip</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {status === "authenticated" ? (
            <span className="header-auth-slot">
              <NotificationBell />
              <HeaderAuth />
            </span>
          ) : (
            <Link href="/signin" className="signin-link">
              Sign in
            </Link>
          )}
          <Link href="/onboarding" className="btn-brand header-claim">
            Claim your repo
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div id={menuId} className="mobile-nav" hidden={!open}>
        <nav aria-label="Mobile" className="wrap mobile-nav-inner">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {status !== "authenticated" ? (
            <Link href="/signin" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          ) : null}
          <Link href="/onboarding" className="btn-brand mobile-claim" onClick={() => setOpen(false)}>
            Claim your repo
          </Link>
        </nav>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-icon">
      <path
        d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-icon">
      <path
        d="M5 5l10 10M15 5 5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
