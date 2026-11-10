import { describe, expect, it } from "vitest";
import { sortRoutinesForHome } from "./suggested-routine";

describe("sortRoutinesForHome", () => {
  it("primero las nunca hechas por posición, después la más vieja", () => {
    const sorted = sortRoutinesForHome([
      { id: "empuje", position: 0, lastDoneAt: "2026-11-08T20:00:00Z" },
      { id: "tiron", position: 1, lastDoneAt: "2026-11-05T20:00:00Z" },
      { id: "piernas", position: 2, lastDoneAt: null },
      { id: "full", position: 3, lastDoneAt: null },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["piernas", "full", "tiron", "empuje"]);
  });

  it("si todas se hicieron, la sugerida es la más vieja", () => {
    const sorted = sortRoutinesForHome([
      { id: "a", position: 0, lastDoneAt: "2026-11-09T20:00:00Z" },
      { id: "b", position: 1, lastDoneAt: "2026-11-01T20:00:00Z" },
    ]);
    expect(sorted[0].id).toBe("b");
  });

  it("no modifica el array original", () => {
    const input = [
      { id: "a", position: 1, lastDoneAt: null },
      { id: "b", position: 0, lastDoneAt: null },
    ];
    sortRoutinesForHome(input);
    expect(input.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
