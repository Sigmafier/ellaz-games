import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { newGame, step, type Dir } from "./logic";
import { RESTART_GRACE_MS, decide, keyPress, launch, restartAllowed, type Phase } from "./flow";
import { drawAim, type Pen } from "./draw";

/**
 * How a run starts and how it ends, answering the Phaser-forum review of
 * 2026-09-27 sentence by sentence:
 *
 *   "When you start a game it goes straight into a wall unless you react
 *    fast."                               -> the snake waits for a direction
 *   "When you lose ... you were clicking a button so instead the score you
 *    see start to play window."           -> an arrow never restarts a run
 *
 * The decisions are pure (`flow.ts`) so node can drive them; the scene only
 * calls them, and the last block below reads the scene to prove it does.
 */

const DIRS: Dir[] = ["up", "down", "left", "right"];

describe("the game-over card is never skipped (R2.1)", () => {
  it("an arrow, WASD or pad press NEVER restarts a finished run - not even long after", () => {
    for (const ms of [0, 1, RESTART_GRACE_MS - 1, RESTART_GRACE_MS, 5_000, 60_000, Infinity]) {
      expect(restartAllowed(ms, "direction"), `direction at ${ms}ms`).toBe(false);
    }
  });

  it("Space, Enter, a tap or Play again restart - but only once the grace is over", () => {
    expect(restartAllowed(0, "confirm")).toBe(false);
    expect(restartAllowed(RESTART_GRACE_MS - 1, "confirm")).toBe(false);
    expect(restartAllowed(RESTART_GRACE_MS, "confirm")).toBe(true);
    expect(restartAllowed(10_000, "confirm")).toBe(true);
  });

  it("the grace outlasts the death flash, so the card is read before it can go", () => {
    const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");
    const flash = Number(SCENE.match(/const DEATH_FLASH_MS = (\d+);/)?.[1]);
    expect(flash, "DEATH_FLASH_MS must still be declared in the scene").toBeGreaterThan(0);
    expect(RESTART_GRACE_MS).toBeGreaterThan(flash);
    // And short enough that a deliberate retry still feels immediate.
    expect(RESTART_GRACE_MS).toBeLessThanOrEqual(1000);
  });

  it("on the game-over screen a direction does nothing, a late confirm plays again", () => {
    expect(decide("over", "direction", 10_000)).toBe("none");
    expect(decide("over", "confirm", 100)).toBe("none");
    expect(decide("over", "confirm", 10_000)).toBe("again");
  });
});

describe("the snake waits for your first turn (R2.2)", () => {
  it("Start takes the card away and waits; a direction starts it", () => {
    expect(decide("ready", "confirm", Infinity)).toBe("aim");
    expect(decide("aim", "direction", Infinity)).toBe("go");
    // A second Start while waiting is not a go.
    expect(decide("aim", "confirm", Infinity)).toBe("none");
  });

  it("an arrow on the ready screen still starts at once, in that direction", () => {
    expect(decide("ready", "direction", Infinity)).toBe("go");
  });

  it("mid-run a direction turns and a confirm does nothing", () => {
    expect(decide("playing", "direction", Infinity)).toBe("turn");
    expect(decide("playing", "confirm", Infinity)).toBe("none");
  });

  it("the first press goes whichever way it says - all four", () => {
    for (const dir of DIRS) {
      const s = launch(newGame(17, 17, () => 0), dir);
      const head = s.body[0];
      const next = step(s, () => 0);
      expect(next.alive, dir).toBe(true);
      const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      expect(next.body[0], dir).toEqual({ x: head.x + d[0], y: head.y + d[1] });
    }
  });

  it("a first press backwards turns the snake round instead of being ignored", () => {
    const s0 = newGame(17, 17, () => 0); // facing right
    const s = launch(s0, "left");
    expect(s.body).toEqual([...s0.body].reverse());
    expect(s.dir).toBe("left");
    expect(s.pendingDir).toBe("left");
    // and it runs the whole length of the row to the left edge alive
    let run = s;
    for (let k = 0; k < s.body[0].x; k++) run = step(run, () => 0);
    expect(run.alive).toBe(true);
    expect(run.body[0].x).toBe(0);
  });

  it("a sideways first press never lets the next press fold back onto the neck", () => {
    // Launch up, then at once left: the neck is to the left. `dir` must stay
    // the direction the body actually lies in until a step is taken.
    const s = launch(newGame(17, 17, () => 0), "up");
    expect(s.dir).toBe("right");
    expect(s.pendingDir).toBe("up");
  });

  it("Space and Enter confirm, arrows and WASD steer, anything else is nothing", () => {
    expect(keyPress(" ")).toEqual({ kind: "confirm" });
    expect(keyPress("Enter")).toEqual({ kind: "confirm" });
    const map: Record<string, Dir> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
    };
    for (const [k, dir] of Object.entries(map)) expect(keyPress(k), k).toEqual({ kind: "direction", dir });
    // Shift, Tab and a stray letter used to start the run; now they do nothing.
    for (const k of ["Shift", "Tab", "x", "Escape", "Control"]) expect(keyPress(k), k).toBeNull();
  });

  it("every phase answers every input - the table is total", () => {
    const phases: Phase[] = ["ready", "aim", "playing", "over"];
    for (const p of phases)
      for (const k of ["direction", "confirm"] as const)
        expect(["none", "aim", "go", "turn", "again"]).toContain(decide(p, k, 10_000));
  });
});

describe("the scene only CALLS the decisions", () => {
  // Source-read: the scene boots Phaser and cannot run in this suite.
  const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");
  const code = SCENE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const method = (name: string) => {
    const at = code.indexOf(`\n  ${name}(`);
    expect(at, `the scene must have ${name}`).toBeGreaterThan(0);
    return code.slice(at, code.indexOf("\n  }", at));
  };

  it("restarts in exactly three places: press, the platform bar, and a board change", () => {
    const owners: string[] = [];
    for (const m of code.matchAll(/\n  (?:private )?(\w+)\([^)]*\)[^{\n]*\{/g)) {
      const body = code.slice(m.index!, code.indexOf("\n  }", m.index!));
      if (body.includes("this.restart()")) owners.push(m[1]);
    }
    expect(owners.sort()).toEqual(["press", "restartFromChrome", "setMode"]);
  });

  it("press asks decide, with the time since death", () => {
    const body = method("private press");
    expect(body).toMatch(/decide\(this\.phase, \w+\.kind, /);
    expect(body).toContain("this.diedAt");
  });

  it("every caller of press checks the pause cover first", () => {
    // press trusts its callers; five surfaces, one guard each.
    const slices = [
      method("startFromChrome"),
      method("steer"),
      code.slice(code.indexOf('"keydown"'), code.indexOf('"pointerdown"')),
      code.slice(code.indexOf('"pointerup"'), code.indexOf("this.scale.on(")),
    ];
    let callers = 0;
    for (const sl of slices) {
      const at = sl.indexOf("this.press(");
      expect(at, "a surface stopped calling press").toBeGreaterThan(0);
      expect(sl.slice(0, at), "a surface calls press before checking the pause").toContain("if (this.paused) return;");
      callers += sl.split("this.press(").length - 1;
    }
    expect(code.split("this.press(").length - 1, "press is called from somewhere unguarded").toBe(callers);
  });

  it("keys, taps, swipes, the pad and the cards all go through press", () => {
    expect(code).toContain("keyPress(e.key)");
    expect(method("steer")).toContain('this.press({ kind: "direction", dir })');
    expect(method("startFromChrome")).toContain('this.press({ kind: "confirm" })');
    // The canvas decides tap-or-swipe on pointerUP, so a swipe that ends
    // after a death is a direction and can never restart the run.
    const down = code.slice(code.indexOf('"pointerdown"'), code.indexOf('"pointerup"'));
    expect(down).not.toContain("restart");
    expect(down).not.toContain("press");
  });

  it("a speed change is never a go, and a board change waits", () => {
    expect(method("setSpeed")).not.toMatch(/phase|press|startPlaying/);
    expect(method("setMode")).not.toMatch(/press|"aim"|"playing"/);
  });
});

describe("the waiting hint (R2.2)", () => {
  // Draw calls recorded through a Proxy, the same shape Phaser's Graphics has.
  const pen = () => {
    const calls: string[] = [];
    const g: Pen = new Proxy({} as Pen, {
      get: (_t, k) => (...a: unknown[]) => (calls.push(`${String(k)}(${a.join(",")})`), g),
    });
    return { g, calls };
  };
  const board = { ox: 0, oy: 0, c: 20, cols: 17, rows: 17 };

  it("draws four arrows round the head - any of them is a way to go", () => {
    const { g, calls } = pen();
    drawAim(g, board, { x: 8, y: 8 }, 0.5);
    expect(calls.filter((c) => c.startsWith("fillTriangle")).length).toBe(4);
  });

  it("pulses: the arrows move with the beat", () => {
    const a = pen();
    const b = pen();
    drawAim(a.g, board, { x: 8, y: 8 }, 0);
    drawAim(b.g, board, { x: 8, y: 8 }, 1);
    expect(a.calls).not.toEqual(b.calls);
  });

  it("is drawn while waiting and never while playing", () => {
    const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");
    expect(SCENE).toMatch(/if \(this\.phase === "aim"\) drawAim\(/);
  });

  it("is a hint on the canvas, not a button and not disabled", () => {
    const GAME = readFileSync(new URL("./SnakeGame.tsx", import.meta.url), "utf8");
    expect(GAME).not.toMatch(/"aim"[^\n]*<button/);
    expect(GAME).not.toMatch(/\bdisabled[=}]/);
  });
});
