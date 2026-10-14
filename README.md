# Wavecraft

A free, browser-based music visualizer editor for independent musicians and YouTube creators. Drop in a song, add artwork and titles, pick an audio-reactive visualizer, and export a real video file — no account, no uploads, no watermark. All media is processed locally on your device.

## Features

- **Audio** — upload MP3/WAV/OGG/FLAC/M4A, play/pause/seek, live frequency analysis via the Web Audio API
- **Seven visualizers** — circular spectrum, frequency bars, waveform, mirrored spectrum, radial waveform, pulse ring, minimal equalizer — all driven by the actual audio, with configurable colors, size, position, sensitivity, smoothing, bar count, glow, and rotation
- **Layers** — background (solid / gradient / image), image layers (scale, rotation, corner radius, brightness/contrast/blur), text layers (fonts, weights, gradients, outline, shadow, glow, alignment, letter spacing)
- **Timeline** — time ruler with scrubbing, waveform audio track, colored per-layer tracks, drag to move, drag edges to trim (snap to grid, hold <kbd>⌥</kbd> for free positioning), playhead synced to a single playback clock
- **Editing** — contextual inspector per selection, drag layers directly on the canvas, undo/redo (<kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd>), <kbd>Space</kbd> to play/pause, <kbd>Delete</kbd> to remove a layer
- **Output** — landscape 16:9, portrait 9:16, or square 1:1 at 720p/1080p
- **Export** — real video files (WebM everywhere; MP4 where the browser's encoder supports it, e.g. Safari) with synchronized audio, recorded in real time via MediaRecorder
- **Local-first** — projects autosave to IndexedDB; nothing ever leaves your device

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the landing page links to the editor at `/editor`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also typechecks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit/component tests |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui on Base UI primitives · Zustand · Zod · Web Audio API · Canvas 2D · MediaRecorder · IndexedDB · Vitest + React Testing Library

## Architecture

```
src/
├── app/                  # Routes: landing, /editor, /privacy, /terms, /api/health
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── common/           # Reusable building blocks (IconButton, PanelHeader, …)
│   └── editor/           # Editor features (shell, top-bar, tool-rail, panels,
│                         #   preview, inspector, timeline, export)
├── hooks/                # Playback sync, uploads, export, history, persistence
├── lib/
│   ├── audio/            # AudioEngine — the single playback clock + analysis
│   ├── rendering/        # CompositionRenderer + visualizer draw functions
│   ├── export/           # Real-time MediaRecorder export pipeline
│   ├── media/            # Runtime registry for blobs/object URLs/images
│   └── project/          # Zod schema, defaults, serialization, IndexedDB storage
├── stores/               # Zustand: project (+undo/redo), editor, playback
├── types/                # Shared editor types
└── config/               # Aspect ratios, timeline, visualizer presets
```

Key design decisions:

- **One playback clock.** The `AudioEngine` singleton owns the AudioContext and current time. Per-frame consumers (preview canvas, timeline playhead) read it inside `requestAnimationFrame` loops; React state only receives coarse updates, so nothing re-renders 60× per second.
- **One renderer.** `CompositionRenderer` draws background → images → visualizers → text for a given time and audio frame. The live preview and the export pipeline share it, so what you see is what you export.
- **Serializable projects.** The project document is plain JSON validated with Zod. Binary media (AudioBuffers, blobs, object URLs) lives in a runtime registry and IndexedDB, never in the project state.
- **Honest export.** Export records the canvas and audio graph in real time — a 3-minute song takes 3 minutes. Progress shown is the actual playback position, and only formats the browser can really encode are offered.

## Browser support

Desktop-first. Chrome, Edge, and Firefox export WebM; Safari 14.1+ exports MP4. Timeline editing wants a pointer and screen space — small screens get collapsed panels and drawers, not a full mobile editor.

## Privacy

Everything — decoding, rendering, encoding, saving — happens in your browser. See [/privacy](http://localhost:3000/privacy) and [/terms](http://localhost:3000/terms).
