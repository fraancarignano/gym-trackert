import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDuration,
  formatElapsed,
  formatIsoDate,
  formatSet,
  isoDateToTimestamp,
  todayIsoDate,
  formatTime,
  formatWeight,
  parseDecimal,
  toInputValue,
} from "./format";

describe("formatWeight / formatSet", () => {
  it("usa coma decimal", () => {
    expect(formatWeight(62.5)).toBe("62,5 kg");
    expect(formatSet(60, 8)).toBe("60 kg × 8");
  });
});

describe("fechas en hora de Córdoba", () => {
  // 02:30 UTC del 11/11 = 23:30 del 10/11 en Argentina (UTC-3).
  const lateNight = "2026-11-11T02:30:00Z";

  it("formatDate usa dd/mm/aaaa y la zona de Córdoba", () => {
    expect(formatDate(lateNight)).toBe("10/11/2026");
  });

  it("formatTime en 24 h", () => {
    expect(formatTime(lateNight)).toBe("23:30");
  });
});

describe("fechas sin hora", () => {
  it("formatIsoDate no se corre de día por la zona horaria", () => {
    expect(formatIsoDate("2026-11-10")).toBe("10/11/2026");
    expect(formatDate(isoDateToTimestamp("2026-11-10"))).toBe("10/11/2026");
  });

  it("todayIsoDate usa la fecha de Córdoba", () => {
    // 02:30 UTC del 11/11 todavía es 10/11 en Argentina.
    expect(todayIsoDate(new Date("2026-11-11T02:30:00Z"))).toBe("2026-11-10");
  });
});

describe("formatDuration", () => {
  it("minutos y horas", () => {
    expect(formatDuration(45 * 60_000)).toBe("45 min");
    expect(formatDuration(65 * 60_000)).toBe("1 h 05 min");
    expect(formatDuration(-1)).toBe("0 min");
  });
});

describe("formatElapsed", () => {
  it("mm:ss y h:mm:ss", () => {
    expect(formatElapsed(309_000)).toBe("05:09");
    expect(formatElapsed(3_723_000)).toBe("1:02:03");
  });
});

describe("parseDecimal / toInputValue", () => {
  it("acepta coma o punto", () => {
    expect(parseDecimal("62,5")).toBe(62.5);
    expect(parseDecimal("62.5")).toBe(62.5);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });

  it("convierte a texto con coma", () => {
    expect(toInputValue(62.5)).toBe("62,5");
    expect(toInputValue(null)).toBe("");
  });
});
