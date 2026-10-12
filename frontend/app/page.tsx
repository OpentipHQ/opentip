import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";

const description =
  "Funding for open source, from the open market. Fund maintainers in ETH or USDC. No account needed. OAR is coming soon.";

export const metadata: Metadata = {
  title: { absolute: "Opentip | Funding for open source" },
  description,
  openGraph: {
    title: "Opentip | Funding for open source",
    description,
    url: "https://opentip.tech",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/ogimage.png", width: 1200, height: 630, alt: "Opentip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Opentip | Funding for open source",
    description,
    images: ["/ogimage.png"],
  },
};

export default function Page() {
  return <HomePage />;
}
