// A hidden repo must 404. A missing row is not hidden: unregistered repos
// still render so they can be claimed.
export function isHiddenRepo(record: { hidden?: boolean } | null | undefined): boolean {
  return record?.hidden === true;
}
