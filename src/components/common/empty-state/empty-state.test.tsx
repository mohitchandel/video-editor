import { render, screen } from "@testing-library/react";
import { Music2 } from "lucide-react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./index";

describe("EmptyState", () => {
  it("renders title and hint", () => {
    render(
      <EmptyState icon={Music2} title="No audio yet" hint="Add a song." />,
    );
    expect(screen.getByText("No audio yet")).toBeInTheDocument();
    expect(screen.getByText("Add a song.")).toBeInTheDocument();
  });
});
