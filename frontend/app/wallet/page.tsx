import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export const metadata = { title: "Wallet | Opentip" };

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/wallet");
  return <WalletClient />;
}
