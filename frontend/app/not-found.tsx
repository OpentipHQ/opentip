import Link from "next/link";
import { Button } from "@/components/motion/button";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Page not found | Opentip",
};

export default function NotFound() {
  return (
    <>
      <div className="min-h-[80vh] flex flex-col justify-center text-center space-y-6">
        <h1 className="serif font-semibold tracking-tight leading-none text-[10rem] md:text-[16rem]">404</h1>
        <p className="text-zinc-600 max-w-md mx-auto">
          Sorry, the developer said he wasn&apos;t tipped enough and he won&apos;t be building this page. You can check back later or{" "}
          <Link href="/repos" className="text-accent underline underline-offset-4 hover:opacity-80 transition-opacity">find a repo to tip</Link>
        </p>
        <div><Link href="/"><Button>Go home</Button></Link></div>
      </div>
      <div className="fluid-page-neg"><Footer force /></div>
    </>
  );
}
