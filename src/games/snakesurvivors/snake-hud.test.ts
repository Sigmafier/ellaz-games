// @vitest-environment jsdom
import { createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { START_LEN, MIN_LEN } from "./body";
import { bossRow, heartBlock, runStats } from "./hud";
import { PauseCard, SnakeHud } from "./SnakeHud";

/**
 * The C3 HUD, RENDERED through the runtime that ships (`react` is aliased onto
 * preact/compat in both configs). The play screen draws hearts top-left, the
 * length top-right, the boss row with icons and numbers, owned cards only - and
 * no word. Crushed, best and level are on the pause card and the game-over line.
 */

let host: HTMLDivElement;
const mount = (el: ReturnType<typeof createElement>) => {
  host = document.createElement("div");
  document.body.append(host);
  render(el, host);
  return host;
};
afterEach(() => {
  unmountComponentAtNode(host);
  host.remove();
});

const hud = (o: { len?: number; peak?: number; cards?: string[]; boss?: ReturnType<typeof bossRow> } = {}) =>
  mount(
    createElement(SnakeHud, {
      hearts: heartBlock(o.len ?? START_LEN, o.peak ?? START_LEN, 1),
      len: o.len ?? START_LEN,
      boss: o.boss === undefined ? bossRow("normal", { len: 25, crushed: 0, stage: 1 }, null) : o.boss,
      cards: (o.cards ?? []).map((id) => ({ id, art: createElement("svg", { width: "40", height: "40" }) })),
    }),
  );

describe("the play screen", () => {
  it("hearts top-left: eight big hearts in a framed block, two rows of four", () => {
    const el = hud().querySelector<HTMLElement>('[data-hud="hearts"]')!;
    expect(el.style.left).toBe("0.5em");
    expect(el.style.top).toBe("0.5em");
    expect(el.style.right).toBe("");
    expect(el.style.fontSize).toBe("1.75em");
    expect(el.style.gridTemplateColumns).toBe("repeat(4, auto)");
    expect(el.querySelectorAll('[data-heart="full"]').length).toBe(8);
    expect(el.dataset.danger).toBe("false");
  });

  it("a lost heart is an outline, and the last heart turns the block red", () => {
    const three = hud({ len: MIN_LEN + 2 }).querySelector<HTMLElement>('[data-hud="hearts"]')!;
    expect(three.querySelectorAll('[data-heart="full"]').length).toBe(3);
    expect(three.querySelectorAll('[data-heart="empty"]').length).toBe(5);
    unmountComponentAtNode(host);
    host.remove();
    const one = hud({ len: MIN_LEN }).querySelector<HTMLElement>('[data-hud="hearts"]')!;
    expect(one.dataset.danger).toBe("true");
    expect(one.style.borderColor || one.style.border).toMatch(/244, 80, 63|f4503f/i);
  });

  it("the length top-right, big, with the glyph and no word", () => {
    const el = hud({ len: 41, peak: 41 }).querySelector<HTMLElement>('[data-hud="length"]')!;
    expect(el.style.right).toBe("0.7em");
    expect(el.style.left).toBe("");
    expect(el.textContent).toBe("41");
    expect(el.querySelector("svg")).not.toBeNull();
  });

  it("the boss row: icon, bar, and the two triggers as icons and numbers", () => {
    const el = hud().querySelector<HTMLElement>('[data-hud="boss"]')!;
    expect(el.querySelector('[data-num="len"]')!.textContent).toBe("25/50");
    expect(el.querySelector('[data-num="crushed"]')!.textContent).toBe("0/10");
    expect(el.querySelectorAll("svg").length).toBe(3);
    // Never clipped: the numbers do not wrap or shrink; the bar gives way.
    for (const n of el.querySelectorAll<HTMLElement>("[data-num]")) expect(n.style.whiteSpace).toBe("nowrap");
  });

  it("no word in play: no Length, Crushed, Best, Boss or LV", () => {
    const text = hud({ cards: ["fangs"] }).textContent ?? "";
    expect(text).not.toMatch(/[A-Za-z]/);
  });

  it("cards only once owned: no column, no empty slots, until one is taken", () => {
    expect(hud().querySelector('[data-hud="cards"]')).toBeNull();
    unmountComponentAtNode(host);
    host.remove();
    const el = hud({ cards: ["fangs", "spit"] }).querySelector('[data-hud="cards"]')!;
    expect(el.querySelectorAll("[data-card]").length).toBe(2);
    // The card's fixed 40px drawing is made to fill its small slot.
    expect(el.querySelector("svg")!.getAttribute("width")).toBe("100%");
  });

  it("with a warden up the row is its health alone; with no row it draws nothing", () => {
    const w = hud({ boss: bossRow("normal", null, { now: 1, max: 4 }) }).querySelector('[data-hud="boss"]')!;
    expect(w.querySelector("[data-num]")).toBeNull();
    expect((w.querySelector("i") as HTMLElement).style.width).toBe("25%");
    unmountComponentAtNode(host);
    host.remove();
    expect(hud({ boss: null }).querySelector('[data-hud="boss"]')).toBeNull();
  });

  it("is a picture: it takes no pointer and is hidden from assistive tech", () => {
    const root = hud().querySelector<HTMLElement>('[data-hud="c3"]')!;
    expect(root.style.pointerEvents).toBe("none");
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("the pause card carries what left the play screen", () => {
  it("shows crushed, best and level with their words, and one tap resumes", () => {
    let resumed = 0;
    const el = mount(
      createElement(PauseCard, {
        stats: runStats(12, 40, 3),
        words: { crushed: "Crushed", best: "Best", level: "Level" },
        resume: "Resume",
        onResume: () => resumed++,
      }),
    );
    const btn = el.querySelector<HTMLButtonElement>('button[data-hud="pause"]')!;
    expect(btn.getAttribute("aria-label")).toBe("Resume");
    expect(btn.hasAttribute("disabled")).toBe(false);
    expect([...btn.querySelectorAll<HTMLElement>("[data-stat]")].map((s) => s.textContent)).toEqual([
      "12Crushed",
      "40Best",
      "3Level",
    ]);
    btn.click();
    expect(resumed).toBe(1);
  });
});

describe("the game wires it", () => {
  const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
  const GAME = code(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "SnakeSurvivorsGame.tsx"), "utf8"));

  it("draws its own HUD and hands the shared one nothing", () => {
    expect(GAME).toMatch(/hud=\{null\}/);
    expect(GAME).toContain("<SnakeHud");
    expect(GAME).toContain("heartBlock(status.len, status.peak, status.bite)");
  });

  it("the pause card is up exactly while a run is paused", () => {
    expect(GAME).toMatch(/status\.phase === "playing" && status\.paused && \(\s*<PauseCard/);
    expect(GAME).toContain("sceneRef.current?.setPaused(false)");
  });

  it("the game-over card names crushed, best and level", () => {
    // Since 2026-10-01 they are TILES on the title-style card (screens.ts
    // `endOf` builds them from `runStats`), each labelled by name.
    expect(GAME).toContain("const endNow = endOf(status, best);");
    expect(GAME).toMatch(/tiles: shown\.stats\.map\(\(st\) => \(\{[\s\S]*?label: statWords\[st\.id\]/);
    expect(GAME).toContain("runStats(score, best, status.lv)");
  });
});
