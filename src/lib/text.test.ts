import { describe, expect, it } from "vitest";
import { escapeLike, formatTarget, normalizeText } from "./text";

describe("normalizeText", () => {
  it("saca tildes y pasa a minúsculas", () => {
    expect(normalizeText("  Jalón al Pecho ")).toBe("jalon al pecho");
    expect(normalizeText("Sillón de cuádriceps")).toBe("sillon de cuadriceps");
  });
});

describe("escapeLike", () => {
  it("escapa comodines y barras", () => {
    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });

  it("deja igual el texto sin comodines", () => {
    expect(escapeLike("Press banca")).toBe("Press banca");
  });
});

describe("formatTarget", () => {
  it("muestra el rango", () => {
    expect(formatTarget(4, 8, 10)).toBe("4 × 8–10");
  });

  it("muestra un solo valor si min = max", () => {
    expect(formatTarget(3, 12, 12)).toBe("3 × 12");
  });
});
