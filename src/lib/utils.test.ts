import { describe, expect, it } from "vitest"
import { cn, getAvatarColor } from "./utils"

describe("cn", () => {
  it("joins multiple class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b")
  })

  it("merges conflicting Tailwind classes, keeping the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active")
  })
})

describe("getAvatarColor", () => {
  it("returns the same color for the same seed", () => {
    expect(getAvatarColor("alice")).toBe(getAvatarColor("alice"))
  })

  it("returns a bg-* Tailwind class", () => {
    expect(getAvatarColor("bob")).toMatch(/^bg-/)
  })

  it("distributes different seeds across more than one color", () => {
    const seeds = ["alice", "bob", "carol", "dave", "erin", "frank", "grace", "heidi"]
    const colors = new Set(seeds.map((s) => getAvatarColor(s)))
    expect(colors.size).toBeGreaterThan(1)
  })
})
