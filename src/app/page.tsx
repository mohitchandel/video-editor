import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import { buttonVariants } from "@/components/ui/button";

/** Static spectrum illustration — same bars the editor renders live. */
function SpectrumHero() {
  const heights = [
    18, 34, 52, 78, 64, 92, 70, 48, 86, 100, 74, 58, 90, 66, 44, 72, 96, 60,
    38, 80, 54, 30, 62, 42, 24, 50, 32, 20, 40, 26,
  ];
  return (
    <div
      aria-hidden
      className="flex h-40 items-end justify-center gap-1.5 overflow-hidden rounded-xl border bg-canvas px-6 pb-0 sm:h-56"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-2.5 rounded-t-sm sm:w-3.5"
          style={{
            height: `${h}%`,
            backgroundImage:
              "linear-gradient(to top, var(--primary), var(--track-audio))",
            opacity: 0.55 + (h / 100) * 0.45,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <AppLogo />
        <Link
          href="/editor"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Open editor
        </Link>
      </header>

      <section className="mt-16 flex flex-col gap-6">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Turn a song into a music video, right in your browser.
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Wavecraft is a free editor for musicians and YouTube creators. Drop
          in a track, add artwork and titles, pick an audio-reactive
          visualizer, and export a real video file — no account, no uploads,
          no watermark.
        </p>
        <div>
          <Link href="/editor" className={buttonVariants({ size: "lg" })}>
            Start creating <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <SpectrumHero />
      </section>

      <section className="mt-14 grid gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium">Seven visualizers</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Circular spectrum, bars, waveform, mirrored, radial, pulse ring,
            and minimal EQ — each driven by the actual frequencies of your
            track.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium">A real timeline</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Arrange artwork and text on tracks, trim when each element appears,
            and scrub with a live preview.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium">Private by design</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Audio and images are processed on your device with the Web Audio
            API and canvas. Nothing is uploaded, ever.
          </p>
        </div>
      </section>

      <footer className="mt-auto flex items-center justify-between gap-4 pt-16 text-xs text-muted-foreground">
        <span>Wavecraft — free music visualizer editor</span>
        <span className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </span>
      </footer>
    </main>
  );
}
