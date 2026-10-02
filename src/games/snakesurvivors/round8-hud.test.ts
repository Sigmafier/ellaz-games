// @vitest-environment jsdom
// ROUND EIGHT, the parts a player SEES: the goal at the top of the arena (the
// forum player: "there is no score or time so the goal is unclear"), and Twin
// Head shown and said (the same player: "Double Head is pointless-looking").
import { createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { HEAD_R, START_LEN } from "./body";
import { INK, drawSnake, type Pen } from "./draw";
import { FX_TEXT } from "./fxText";
import { clockText, goalRow, heartBlock } from "./hud";
import { newRun } from "./logic";
import { GOAL_INSET, SnakeHud } from "./SnakeHud";
import { tailHead } from "./twinHead";
import { tailCrushFx } from "./crushFx";
import type { Pt } from "./types";

describe("the goal row", () => {
  it("the clock is m:ss of playing time", () => {
    expect(clockText(0)).toBe("0:00");
    expect(clockText(59_999)).toBe("0:59");
    expect(clockText(60_000)).toBe("1:00");
    expect(clockText(5 * 60_000 + 7_400)).toBe("5:07");
    expect(clockText(14 * 60_000)).toBe("14:00");
  });

  it("is the crushed count, the clock, and the next boss of three", () => {
    expect(goalRow(123, 65_000, 1, "en")).toEqual({ score: 123, clock: "1:05", boss: "BOSS 1/3" });
    expect(goalRow(500, 300_000, 3, "en").boss).toBe("BOSS 3/3");
  });

  it("is said in every language the game ships, with no em dash and no emoji", () => {
    for (const [loc, t] of Object.entries(FX_TEXT)) {
      const s = t.boss(2);
      expect(s, loc).toMatch(/2\/3/);
      expect(s, loc).not.toMatch(/[–—―]/);
      expect(s, loc).not.toMatch(/\p{Extended_Pictographic}/u);
    }
    expect(FX_TEXT.he.boss(1)).not.toBe(FX_TEXT.en.boss(1));
    expect(goalRow(0, 0, 1, "he").boss).toBe(FX_TEXT.he.boss(1));
  });
});

let host: HTMLDivElement;
afterEach(() => {
  if (!host) return;
  unmountComponentAtNode(host);
  host.remove();
});

describe("the HUD draws the goal top-centre", () => {
  it("renders the score, the clock and BOSS n/3 between the hearts and the length", () => {
    host = document.createElement("div");
    document.body.append(host);
    render(
      createElement(SnakeHud, {
        hearts: heartBlock(START_LEN, START_LEN, 2),
        len: START_LEN,
        boss: null,
        cards: [],
        goal: goalRow(42, 125_000, 2, "en"),
      }),
      host,
    );
    const el = host.querySelector<HTMLElement>('[data-hud="goal"]')!;
    expect(el).not.toBeNull();
    expect(el.querySelector('[data-goal="score"]')!.textContent).toBe("42");
    expect(el.querySelector('[data-goal="clock"]')!.textContent).toBe("2:05");
    expect(el.querySelector('[data-goal="boss"]')!.textContent).toBe("BOSS 2/3");
    // Held between the two corners by the insets measured in Chromium (`GOAL_INSET`).
    expect(el.style.left).toBe(GOAL_INSET.left);
    expect(el.style.right).toBe(GOAL_INSET.right);
  });

  it("draws no goal row when handed none (the guided run)", () => {
    host = document.createElement("div");
    document.body.append(host);
    render(createElement(SnakeHud, { hearts: heartBlock(START_LEN, START_LEN, 1), len: START_LEN, boss: null, cards: [], goal: null }), host);
    expect(host.querySelector('[data-hud="goal"]')).toBeNull();
  });
});

/** A pen that records every circle it fills, with the colour it was filled in. */
function recorder() {
  const circles: { x: number; y: number; r: number; ink: number; a: number }[] = [];
  let ink = 0;
  let a = 1;
  const pen: Pen = {
    fillStyle: (c: number, al = 1) => ((ink = c), (a = al)),
    fillCircle: (x: number, y: number, r: number) => circles.push({ x, y, r, ink, a }),
    fillTriangle: () => undefined,
    fillPoints: () => undefined,
    lineStyle: () => undefined,
    strokePoints: () => undefined,
  };
  return { pen, circles };
}

describe("Twin Head is SHOWN: the tail tip wears the head's own look", () => {
  const run = () => newRun("normal", { w: 420, h: 560 }, mulberry32(3));

  it("tailHead is null without the card, and the tail tip facing away from the body with it", () => {
    const r = run();
    expect(tailHead(r)).toBeNull();
    r.taken.twinHead = 1;
    const t = tailHead(r)!;
    const tip = r.path[r.path.length - 1];
    expect(t.x).toBe(tip.x);
    expect(t.y).toBe(tip.y);
    // The body runs left of the head, so the tail faces further left: PI.
    expect(Math.abs(Math.cos(t.heading) + 1)).toBeLessThan(1e-9);
  });

  it("draws a second head at the tail - mint, head-sized, a glow and two eyes - only with the card", () => {
    const r = run();
    const tip: Pt = r.path[r.path.length - 1];
    const near = (c: { x: number; y: number }) => Math.hypot(c.x - tip.x, c.y - tip.y) < HEAD_R;
    const without = recorder();
    drawSnake(without.pen, r, false);
    expect(without.circles.filter((c) => near(c) && c.ink === INK.mint)).toEqual([]);
    r.taken.twinHead = 1;
    const withCard = recorder();
    drawSnake(withCard.pen, r, false);
    const at = withCard.circles.filter(near);
    expect(at.some((c) => c.ink === INK.mint && c.r === HEAD_R && c.a === 1), "the head").toBe(true);
    expect(at.some((c) => c.ink === INK.mint && c.r === HEAD_R * 1.9 && c.a < 1), "the glow").toBe(true);
    expect(at.filter((c) => c.ink === INK.eye).length, "two eyes").toBe(2);
  });
});

describe("Twin Head is SEEN: a tail crush flashes at the tail", () => {
  it("a crush the tail closed gives an effect at the tail tip; a head crush gives none", () => {
    const r = newRun("normal", { w: 420, h: 560 }, mulberry32(3));
    r.taken.twinHead = 1;
    const tip = r.path[r.path.length - 1];
    const fx = tailCrushFx(r, "tail")!;
    expect(fx.at).toEqual({ x: tip.x, y: tip.y });
    expect(fx.to).toBeGreaterThan(fx.from);
    expect(fx.sparks).toBeGreaterThan(0);
    expect(tailCrushFx(r, "head")).toBeNull();
  });
});

describe("the scene and the game wire round eight", () => {
  // The Phaser scene cannot run in this suite, so its wiring is read off the
  // source, the way `snake-hud.test.ts` reads the game's.
  const here = dirname(fileURLToPath(import.meta.url));
  const SCENE = readFileSync(join(here, "SnakeSurvivorsScene.ts"), "utf8");
  const GAME = readFileSync(join(here, "SnakeSurvivorsGame.tsx"), "utf8");

  it("every hit, the '-N' over the head and the hearts' warning read hitCost", () => {
    expect(SCENE).not.toMatch(/\bbiteCost\(/);
    expect(SCENE).toContain("bite: hitCost(r),");
    expect(SCENE).toContain("this.popup(`-${hitCost(this.run)}`");
    expect(GAME).toContain("hearts={heartBlock(status.len, status.peak, status.bite)}");
  });

  it("the guide is drawn through guideShown, with the guided run as the exception", () => {
    expect(SCENE).toContain("if (pending && guideShown(caught.length, this.tut !== null)) drawSnapGuide(");
  });

  it("a tail crush plays tailCrushFx, and the goal row reads playing time and the stage", () => {
    expect(SCENE).toContain("const tail = tailCrushFx(this.run, e.by);");
    expect(SCENE).toContain("ms: r.t, stage: r.stage,");
    expect(GAME).toContain("goal={tutoring ? null : goalRow(status.crushed, status.ms, status.stage, ctx.locale)}");
  });

  it("Twin Head's card says what it does, in every language, and keeps its id", () => {
    expect(GAME).toContain('twinHead: ["Twin Head", "Your tail closes loops too"');
    expect(GAME).toContain('twinHead: ["ראש כפול", "גם הזנב שלך סוגר לולאות"');
    expect(GAME).toContain('twinHead: ["Doble cabeza", "Tu cola también cierra círculos"');
    expect(GAME).toContain('twinHead: ["Tvillinghuvud", "Din svans sluter också öglor"');
  });
});
