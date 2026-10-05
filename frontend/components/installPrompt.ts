const DISMISS_KEY = "opentip-install-dismissed";
const VISIT_KEY = "opentip-home-visits";
const TIPPED_KEY = "opentip-has-tipped";

export function markInstallTipped() {
  try {
    localStorage.setItem(TIPPED_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function recordHomeVisit(): { visits: number; tipped: boolean; dismissed: boolean } {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    const tipped = localStorage.getItem(TIPPED_KEY) === "1";
    const visits = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_KEY, String(visits));
    return { visits, tipped, dismissed };
  } catch {
    return { visits: 1, tipped: false, dismissed: false };
  }
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}

export { DISMISS_KEY };
