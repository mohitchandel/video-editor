import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelHeader } from "./index";

describe("PanelHeader", () => {
  it("renders the title and actions", () => {
    render(<PanelHeader title="Media" actions={<button>Clear</button>} />);
    expect(screen.getByRole("heading", { name: "Media" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
});
