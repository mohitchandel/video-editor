import type { Metadata } from "next";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Editor",
};

export default function EditorPage() {
  return <EditorShell />;
}
