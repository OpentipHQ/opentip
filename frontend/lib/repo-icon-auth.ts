// Icon edits require a GitHub login proven by OAuth, or the payout wallet
// already linked to this user. The free-text display name is never consulted.
export function canEditRepoIcon(input: {
  githubLogin: string | null | undefined;
  repoId: string;
  sessionUserId: string | null | undefined;
  payoutWalletUserId: string | null | undefined;
}): boolean {
  const owner = input.repoId.split("/")[0] ?? "";
  const loginOk =
    typeof input.githubLogin === "string" &&
    input.githubLogin.length > 0 &&
    owner.length > 0 &&
    input.githubLogin.toLowerCase() === owner.toLowerCase();
  const walletOk =
    typeof input.sessionUserId === "string" &&
    input.sessionUserId.length > 0 &&
    input.payoutWalletUserId === input.sessionUserId;
  return loginOk || walletOk;
}
