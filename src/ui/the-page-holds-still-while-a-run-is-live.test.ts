// The four games whose page scrolled under a thumb mid-run (Neon Survival,
// Snake Survivors, Hold the Line through the arcade chrome; Snake Arena on its
// own), and Neon's career screens. The lock itself is tested in
// page-scroll-lock.test.ts; this holds the CALL SITES, because a lock nobody
// takes is a protection that answers "yes" to everybody who asks.
// `scripts/repro/repro-page-holds-still-while-playing.mjs` drags the real page.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");

describe("who holds the page still", () => {
  it("the arcade chrome, only while a run is live: no entrance card AND an untaken pause", () => {
    expect(src("./ArcadeChrome.tsx")).toContain("usePageScrollLock(entrance === null && paused === false);");
  });

  it("Snake Arena, only while the player is steering (aiming the first move, or playing) and not paused", () => {
    expect(src("../games/snakearena/SnakeArenaGame.tsx")).toContain('usePageScrollLock((s.phase === "aim" || s.phase === "playing") && !s.paused);');
  });

  it("Neon's career, while the map, the shop, the gear or the weapon pick is up - and it covers the canvas", () => {
    const layer = src("../games/survivors/CareerLayer.tsx");
    expect(layer).toContain('const covering = screen === "lobby" || screen === "shop" || screen === "gear" || screen === "pick";');
    expect(layer).toContain("usePageScrollLock(covering);");
    expect(layer).toContain("props.scene.current?.setCovered(covering);");
  });

  it("Neon's scene ignores a press on a covered canvas instead of starting a hidden run", () => {
    const scene = src("../games/survivors/SurvivorsScene.ts");
    expect(scene).toMatch(/this\.input\.on\("pointerdown", \(p: Phaser\.Input\.Pointer\) => \{\s*if \(this\.paused \|\| this\.covered\) return;/);
  });

  it("a career screen opened before the engine loaded still reaches the scene", () => {
    expect(src("../games/survivors/SurvivorsGame.tsx")).toContain('scene.setCovered(modeRef.current === "career");');
  });
});
