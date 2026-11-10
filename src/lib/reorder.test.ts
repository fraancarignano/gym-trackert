import { describe, expect, it } from "vitest";
import { moveItem } from "./reorder";

describe("moveItem", () => {
  const ids = ["a", "b", "c", "d"];

  it("sube un elemento", () => {
    expect(moveItem(ids, "c", "up")).toEqual(["a", "c", "b", "d"]);
  });

  it("baja un elemento", () => {
    expect(moveItem(ids, "a", "down")).toEqual(["b", "a", "c", "d"]);
  });

  it("no mueve más allá de los extremos", () => {
    expect(moveItem(ids, "a", "up")).toEqual(ids);
    expect(moveItem(ids, "d", "down")).toEqual(ids);
  });

  it("ignora ids que no están", () => {
    expect(moveItem(ids, "z", "up")).toEqual(ids);
  });

  it("no modifica el array original", () => {
    const original = [...ids];
    moveItem(ids, "b", "up");
    expect(ids).toEqual(original);
  });
});
