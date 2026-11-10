import { describe, expect, it } from "vitest";
import { shouldIncreaseWeight } from "./progression";

describe("shouldIncreaseWeight", () => {
  it("todas las series al máximo del rango con el mismo peso", () => {
    expect(
      shouldIncreaseWeight(
        [
          { weightKg: 60, reps: 10 },
          { weightKg: 60, reps: 10 },
          { weightKg: 60, reps: 11 },
        ],
        10,
      ),
    ).toBe(true);
  });

  it("no si alguna serie quedó por debajo del máximo", () => {
    expect(
      shouldIncreaseWeight(
        [
          { weightKg: 60, reps: 10 },
          { weightKg: 60, reps: 9 },
        ],
        10,
      ),
    ).toBe(false);
  });

  it("no si cambió el peso entre series", () => {
    expect(
      shouldIncreaseWeight(
        [
          { weightKg: 60, reps: 10 },
          { weightKg: 62.5, reps: 10 },
        ],
        10,
      ),
    ).toBe(false);
  });

  it("no sin objetivo, sin historial o con peso corporal", () => {
    expect(shouldIncreaseWeight([{ weightKg: 60, reps: 10 }], null)).toBe(false);
    expect(shouldIncreaseWeight([], 10)).toBe(false);
    expect(shouldIncreaseWeight([{ weightKg: 0, reps: 15 }], 12)).toBe(false);
  });
});
