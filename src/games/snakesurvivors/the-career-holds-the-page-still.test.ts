// SNAKE SURVIVORS' CAREER SCREENS HOLD THE PAGE STILL, the way Neon Survival's
// do (src/ui/the-page-holds-still-while-a-run-is-live.test.ts). Measured on live
// ellaz.fun at 390x844 on 2026-10-03: a drag on the map or the shop moved the
// page 125px and slid the arena out from under it, and a tap on that arena
// started a run nobody could see. The lock itself is tested in
// src/ui/page-scroll-lock.test.ts; this holds the CALL SITES, because a lock
// nobody takes answers "yes" to everybody who asks.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");

describe("Snake Survivors' career holds the page still", () => {
  it("while the map, the shop or the gear is up - and tells the scene it covers the canvas", () => {
    const layer = src("./SnakeCareerLayer.tsx");
    expect(layer).toContain('import { usePageScrollLock } from "@ui/pageScrollLock";');
    expect(layer).toContain('const covering = c.screen === "lobby" || c.screen === "shop" || c.screen === "gear";');
    expect(layer).toContain("usePageScrollLock(covering);");
    expect(layer).toContain("props.scene.current?.setCovered(covering);");
  });

  it("leaving the career uncovers the scene, so the quick run's canvas is not left deaf", () => {
    expect(src("./SnakeCareerLayer.tsx")).toContain("useEffect(() => () => props.scene.current?.setCovered(false), [props.scene]);");
  });

  it("the scene ignores a press on a covered canvas instead of starting a hidden run", () => {
    const scene = src("./SnakeSurvivorsScene.ts");
    expect(scene).toMatch(/this\.input\.on\("pointerdown", \(p: Phaser\.Input\.Pointer\) => \{\s*if \(this\.paused \|\| this\.covered\) return;/);
    expect(scene).toMatch(/setCovered\(on: boolean\) \{\s*this\.covered = on;\s*if \(on\) this\.stick = null;/);
  });

  it("a career screen opened before the engine loaded still reaches the scene", () => {
    expect(src("./SnakeSurvivorsGame.tsx")).toContain('scene.setCovered(modeRef.current === "career");');
  });
});
