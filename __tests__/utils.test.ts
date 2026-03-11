import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});
