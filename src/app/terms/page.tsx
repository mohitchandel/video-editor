import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/common/app-logo";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" aria-label="Wavecraft home">
          <AppLogo />
        </Link>
      </header>
      <article className="flex flex-col gap-5 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Terms of use
        </h1>
        <p>
          Wavecraft is provided free of charge, as is, without warranty of any
          kind. Use it at your own risk.
        </p>
        <h2 className="mt-2 text-base font-medium text-foreground">
          Your content
        </h2>
        <p>
          You keep all rights to the audio, images, and videos you create.
          Because processing happens on your device, we never receive a copy
          of your content. You are responsible for having the rights to the
          material you use — including music licenses for songs you
          don&apos;t own.
        </p>
        <h2 className="mt-2 text-base font-medium text-foreground">
          Acceptable use
        </h2>
        <p>
          Don&apos;t use the app to produce content that is unlawful. The
          service may change or be discontinued at any time.
        </p>
        <h2 className="mt-2 text-base font-medium text-foreground">Contact</h2>
        <p>Questions? Reach out at thebytesbuilder@gmail.com.</p>
      </article>
    </main>
  );
}
