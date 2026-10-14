import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/common/app-logo";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" aria-label="Wavecraft home">
          <AppLogo />
        </Link>
      </header>
      <article className="flex flex-col gap-5 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Privacy
        </h1>
        <p>
          Wavecraft runs entirely in your browser. The audio files and images
          you open are decoded and rendered on your device and are never
          uploaded to a server.
        </p>
        <h2 className="mt-2 text-base font-medium text-foreground">
          What stays on your device
        </h2>
        <p>
          Projects you edit are saved to your browser&apos;s local storage
          (IndexedDB) so you can pick up where you left off. You can delete
          this data at any time from the editor&apos;s settings menu
          (&ldquo;Clear saved projects&rdquo;) or by clearing your
          browser&apos;s site data.
        </p>
        <h2 className="mt-2 text-base font-medium text-foreground">
          What we collect
        </h2>
        <p>
          The app itself does not require an account and does not collect
          personal information. Standard web server logs (such as IP addresses
          of page requests) may be processed by the hosting provider to serve
          the site. If advertising is shown on this site in the future, the ad
          provider&apos;s own policies will apply and this page will be
          updated first.
        </p>
        <h2 className="mt-2 text-base font-medium text-foreground">Contact</h2>
        <p>
          Questions about this policy? Reach out at
          thebytesbuilder@gmail.com.
        </p>
      </article>
    </main>
  );
}
