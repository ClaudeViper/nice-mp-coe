import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole("button", { name: /test/i });
    expect(button).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
  });
});
