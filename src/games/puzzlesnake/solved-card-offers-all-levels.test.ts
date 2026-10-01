// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { Board } from "./Board";
import { LEVELS } from "./levels";
import { newGame, parseLevel } from "./logic";
import { WORDS } from "./words";

/**
 * NePo, forum post #13: "I can only play the next level ... There should be a
 * menu option to replay levels you have already won." The level picker was
 * already there - behind "Levels" in the phone footer and "All levels" beside
 * the board on a PC - and a player who had just won a level did not find it.
 * So the solved card itself now offers it: Next level stays the primary
 * button, and "All levels" sits under it as a real, always-pressable button.
 * No new words: it reuses `allLevels`, which every locale already carries.
 */

const T = WORDS.en;
let host: HTMLElement | null = null;

function solvedCard(last: boolean) {
  const onNext = vi.fn();
  const onLevels = vi.fn();
  const onTry = vi.fn();
  host = document.createElement("div");
  document.body.appendChild(host);
  const def = LEVELS[0];
  render(
    createElement(Board, {
      state: newGame(parseLevel(def.rows)),
      id: def.id,
      par: def.par,
      pc: false,
      T,
      card: { stars: 3, moves: def.par },
      last,
      headRef: { current: null },
      exitRef: { current: null },
      onSwipe: () => {},
      onTry,
      onNext,
      onLevels,
      onUndo: () => {},
      onStartOver: () => {},
      stuck: false,
      newTiles: [],
    }),
    host,
  );
  const card = host.querySelector("section")!;
  const buttons = [...card.querySelectorAll("button")];
  const named = (text: string) => buttons.filter((b) => (b.textContent ?? "").includes(text));
  return { card, buttons, named, onNext, onLevels, onTry };
}

afterEach(() => {
  if (host) unmountComponentAtNode(host), host.remove();
  host = null;
});

describe("the solved card offers every level, not only the next one", () => {
  it("CONTROL: `react` here is preact, the runtime the site ships", () => {
    expect(createElement("div", null).constructor).toBeUndefined();
  });

  it("shows Next level AND All levels, each a real button that is never disabled", () => {
    const { card, buttons, named, onNext, onLevels } = solvedCard(false);
    expect(card).not.toBeNull();
    const next = named(T.nextLevel);
    const all = named(T.allLevels);
    expect(next).toHaveLength(1);
    expect(all).toHaveLength(1);
    for (const b of buttons) {
      expect(b.disabled).toBe(false);
      expect(b.getAttribute("aria-disabled")).toBeNull();
      expect(b.type).toBe("button");
    }
    all[0].click();
    expect(onLevels).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    next[0].click();
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onLevels).toHaveBeenCalledTimes(1);
  });

  it("Next level is the primary button and All levels the secondary", () => {
    const { named } = solvedCard(false);
    expect(named(T.nextLevel)[0].style.background).toContain("--brand-strong");
    expect(named(T.allLevels)[0].style.background).not.toContain("--brand-strong");
  });

  it("on the last level there is no Next, and All levels is offered once", () => {
    const { named, onLevels } = solvedCard(true);
    expect(named(T.nextLevel)).toHaveLength(0);
    const all = named(T.allLevels);
    expect(all).toHaveLength(1);
    all[0].click();
    expect(onLevels).toHaveBeenCalledTimes(1);
  });

  it("Try again is still there", () => {
    const { named, onTry } = solvedCard(false);
    named(T.tryAgain)[0].click();
    expect(onTry).toHaveBeenCalledTimes(1);
  });
});
