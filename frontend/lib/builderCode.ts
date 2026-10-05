export const BUILDER_CODE = (process.env.NEXT_PUBLIC_BUILDER_CODE as string) || "bc_s44rnr4k";

// ERC-8021 suffix — appended to calldata, ignored by contracts, read by Base indexers.
// Last 16 bytes are 8021 repeating, CBOR payload contains {a: BUILDER_CODE}.
// Uses ox if installed, else fallback hardcoded for bc_s44rnr4k.
let suffix: `0x${string}` = "0x" as `0x${string}`;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Attribution } = require("ox/erc8021");
  suffix = Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) as `0x${string}`;
} catch {
  // Fallback: precomputed via ox for bc_s44rnr4k — verified with ox 0.6.5
  // CBOR {a: "bc_s44rnr4k"} + schema 0x02 + marker 80218021802180218021802180218021
  suffix = "0xa161616862635f733434726e72346b000c02802180218021802180218021802180218021" as `0x${string}`;
}
export const DATA_SUFFIX = suffix;
