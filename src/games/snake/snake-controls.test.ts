import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PAD_CELL, PAD_GAP, STICK_SIZE } from "@ui/DirectionPad";
import { PHONE_KNOB, PHONE_PAD_CELL, PHONE_STICK, PHONE_STICK_CSS } from "./controls";

/**
 * "Snake buttons are too big joystick are too big" - a player on a 360x726
 * Android, 2026-09-29. The phone's controls got smaller so the board stops
 * being scaled down to make room for them. This file holds the two limits of
 * that trade: never under the kids tap target, and never taller than before.
 */
const TOKENS = readFileSync(new URL("../../ui/tokens.css", import.meta.url), "utf8");
const PAD_SRC = readFileSync(new URL("../../ui/DirectionPad.tsx", import.meta.url), "utf8");
const GAME_SRC = readFileSync(new URL("./SnakeGame.tsx", import.meta.url), "utf8");
const px = (name: string) => Number(new RegExp(`${name}:\\s*(\\d+)px`).exec(TOKENS)?.[1]);
const footprint = (cell: number) => cell * 3 + PAD_GAP * 2;

describe("snake's phone controls", () => {
  it("reads the kids tap target", () => {
    // population guard: a NaN floor would pass every comparison below
    expect(px("--tap-kids")).toBeGreaterThanOrEqual(48);
  });

  it("every arrow still clears the kids tap target", () => {
    expect(PHONE_PAD_CELL).toBeGreaterThanOrEqual(px("--tap-kids"));
  });

  it("the stick well is at least two kids targets across", () => {
    expect(PHONE_STICK).toBeGreaterThanOrEqual(2 * px("--tap-kids"));
  });

  it("is smaller than the shared default - the report's whole point", () => {
    expect(footprint(PHONE_PAD_CELL)).toBeLessThan(footprint(PAD_CELL));
    expect(PHONE_STICK).toBeLessThan(STICK_SIZE);
  });

  it("switching Arrows to Joystick never makes the footer taller", () => {
    expect(PHONE_STICK).toBeLessThanOrEqual(footprint(PHONE_PAD_CELL));
  });

  it("keeps the knob the fraction of the well the shared pad draws", () => {
    expect(PAD_SRC).toMatch(/const KNOB = 0\.6;/);
    expect(PHONE_KNOB).toBe(Math.round(PHONE_STICK * 0.6));
  });
});

describe("the stick resize reads the shape DirectionPad draws", () => {
  // The rule targets the well as the ONE aria-hidden element inside the
  // wrapper, and the knob as its direct child. If DirectionPad grows a second
  // aria-hidden element, or wraps the knob, the rule silently resizes the wrong
  // thing or nothing - so the shape is pinned here, where that change reds.
  it("the pad draws exactly one aria-hidden element: the well", () => {
    expect(PAD_SRC.match(/aria-hidden="true"/g)?.length).toBe(1);
  });

  it("the well and knob are sized from STICK_SIZE and a knob size, inline", () => {
    expect(PAD_SRC).toMatch(/\{ width: STICK_SIZE, height: STICK_SIZE \}/);
    expect(PAD_SRC).toMatch(/width: knobSize,\s*height: knobSize,/);
  });

  it("the rule overrides both, and only inside snake's own wrapper", () => {
    expect(PHONE_STICK_CSS).toContain(`.snake-stick [aria-hidden="true"]{width:${PHONE_STICK}px!important;height:${PHONE_STICK}px!important}`);
    expect(PHONE_STICK_CSS).toContain(`.snake-stick [aria-hidden="true"]>div{width:${PHONE_KNOB}px!important;height:${PHONE_KNOB}px!important}`);
    expect(PHONE_STICK_CSS.match(/\.snake-stick /g)?.length).toBe(2);
  });
});

describe("the PC keeps its controls", () => {
  it("the phone arm passes the phone cell, and the PC arm passes no size at all", () => {
    const phone = GAME_SRC.slice(GAME_SRC.indexOf('className="snake-stick"'));
    const pcArm = GAME_SRC.slice(GAME_SRC.indexOf("(pc ? ("), GAME_SRC.indexOf('className="snake-stick"'));
    expect(phone).toMatch(/size=\{PHONE_PAD_CELL\}/);
    expect(pcArm).toContain("<DirectionPad");
    expect(pcArm).not.toMatch(/size=/);
  });
});
