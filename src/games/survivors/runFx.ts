// THE RUN'S EFFECTS (operator ruling 2026-10-03, "Show supers + 3 effects"):
//
//   STORM ARCS     a storm shot that jumps shape to shape leaves a jagged arc
//                  along each jump, so the chain is SEEN rather than inferred
//   SUPER SHOTS    the railgun is a long glowing beam, the storm a crackling orb -
//                  neither may look like the plain bolt and arc they grew from
//   BIG DEATHS     a boss or an elite dies with a flash and a short shake, and a
//                  burst ring - boss bigger than elite, both quieter than the
//                  boss's ARRIVAL (420 ms at 0.016), which stays the loudest thing
//   XP BAR         a thin bar along the top of the view, filling with the run's
//                  own `xp / need`, and a soft ping on gem pickup - once per burst
//   MONSTER BOOMS  a bomber's burst draws a ring and thumps
//
// The scene only CALLS this: `consume` per event, `tick` per frame, `draw` and
// `drawHud` into its Graphics. Everything here draws through `Pen`, so a test
// hands it a recorder; the camera and the audio come in through `FxHost`.

import type { Pen } from "./groundArt";
import type { Bolt, RunEvent, RunState, ShotKind } from "./types";

export interface FxHost {
  shake(ms: number, intensity: number): void;
  flash(ms: number, r: number, g: number, b: number): void;
  tone(o: { freq: number; ms: number; type?: OscillatorType; gain: number }): void;
}

/** Lifetimes and sizes, in one row so a retune is one diff. */
export const FX = {
  arcMs: 320,
  boomMs: 380,
  bossShake: [300, 0.012],
  eliteShake: [130, 0.006],
  bossFlash: 200,
  eliteFlash: 90,
  pingGapMs: 90,
} as const;

/** The XP bar: its height in view units, and its two inks. */
export const XP_BAR = { h: 5, track: 0x10132e, fill: 0x5ce1ff } as const;

interface Arc { x: number; y: number; tx: number; ty: number; age: number; seed: number }
interface Ring { x: number; y: number; age: number; r: number; ink: number; ms: number }

const STORM_INK = 0xd9c2ff;
const RAIL_INK = 0x9ff6ff;

export class RunFx {
  private arcs: Arc[] = [];
  private rings: Ring[] = [];
  private nextPing = 0;

  /** A new run: nothing left over from the last one. */
  reset(): void {
    this.arcs = [];
    this.rings = [];
    this.nextPing = 0;
  }

  /** One simulation event in; a flash, a shake, a sound or a mark out. */
  consume(e: RunEvent, run: RunState, now: number, host: FxHost): void {
    if (e.type === "pop" && e.big) {
      const boss = e.big === "boss";
      const [ms, k] = boss ? FX.bossShake : FX.eliteShake;
      host.flash(boss ? FX.bossFlash : FX.eliteFlash, 255, boss ? 236 : 246, boss ? 190 : 220);
      host.shake(ms, k);
      this.rings.push({ x: e.x, y: e.y, age: 0, r: boss ? 90 : 46, ink: 0xffd166, ms: FX.boomMs });
    } else if (e.type === "jump" && e.kind === "arc") {
      this.arcs.push({ x: e.x, y: e.y, tx: e.tx, ty: e.ty, age: 0, seed: (e.x * 13 + e.ty * 7) % 97 });
    } else if (e.type === "boom") {
      this.rings.push({ x: e.x, y: e.y, age: 0, r: 64, ink: 0xffe066, ms: FX.boomMs });
      host.shake(110, 0.005);
      host.tone({ freq: 70, ms: 180, type: "sine", gain: 0.12 });
    } else if (e.type === "gem") {
      if (now < this.nextPing) return;
      this.nextPing = now + FX.pingGapMs;
      // Rising as the bar fills, so the sound says how close the next card is.
      const fill = run.need > 0 ? Math.min(1, run.xp / run.need) : 0;
      host.tone({ freq: Math.round(880 + 440 * fill), ms: 45, type: "sine", gain: 0.035 });
    } else if (e.type === "regen") {
      host.tone({ freq: 660, ms: 120, type: "triangle", gain: 0.06 });
    }
  }

  /** Age every mark; the ones past their life are gone. */
  tick(dt: number): void {
    for (const a of this.arcs) a.age += dt;
    for (const r of this.rings) r.age += dt;
    this.arcs = this.arcs.filter((a) => a.age < FX.arcMs);
    this.rings = this.rings.filter((r) => r.age < r.ms);
  }

  /** The world-space marks: the storm's arcs and the burst rings. */
  draw(g: Pen, _run: RunState, _now: number): void {
    for (const a of this.arcs) drawArc(g, a, 1 - a.age / FX.arcMs);
    for (const r of this.rings) {
      const t = r.age / r.ms;
      g.lineStyle(6 * (1 - t) + 1, r.ink, 0.85 * (1 - t));
      g.strokeCircle(r.x, r.y, r.r * (0.35 + 0.65 * t));
    }
  }

  /**
   * A super's shot, drawn its own way. TRUE when it drew - the scene then skips
   * the plain drawing. The railgun: a long beam with a glow. The storm: an orb
   * with crackling spokes.
   */
  drawShot(g: Pen, b: Bolt, ink: number, run: RunState): boolean {
    if (!evolvedHolds(run, b.kind)) return false;
    const sp = Math.hypot(b.vx, b.vy) || 1;
    const ux = b.vx / sp;
    const uy = b.vy / sp;
    if (b.kind === "bolt") {
      g.lineStyle(9, RAIL_INK, 0.25);
      g.lineBetween(b.x, b.y, b.x - ux * 46, b.y - uy * 46);
      g.lineStyle(4, RAIL_INK, 0.9);
      g.lineBetween(b.x, b.y, b.x - ux * 40, b.y - uy * 40);
      g.lineStyle(1.5, 0xffffff, 1);
      g.lineBetween(b.x, b.y, b.x - ux * 34, b.y - uy * 34);
      return true;
    }
    if (b.kind === "arc") {
      g.fillStyle(STORM_INK, 0.3);
      g.fillCircle(b.x, b.y, 9);
      g.fillStyle(ink, 1);
      g.fillCircle(b.x, b.y, 5);
      g.lineStyle(1.5, 0xffffff, 0.9);
      for (let i = 0; i < 4; i++) {
        const a = b.age / 40 + i * (Math.PI / 2);
        g.lineBetween(b.x + Math.cos(a) * 4, b.y + Math.sin(a) * 4, b.x + Math.cos(a + 0.5) * 11, b.y + Math.sin(a + 0.5) * 11);
      }
      return true;
    }
    return false;
  }

  /** The XP bar along the top of the view - only while a run is on. */
  drawHud(hud: Pen, run: Pick<RunState, "xp" | "need">, viewW: number, on: boolean): void {
    if (!on) return;
    const fill = run.need > 0 ? Math.max(0, Math.min(1, run.xp / run.need)) : 0;
    hud.fillStyle(XP_BAR.track, 0.85);
    hud.fillRect(0, 0, viewW, XP_BAR.h);
    hud.fillStyle(XP_BAR.fill, 1);
    hud.fillRect(0, 0, viewW * fill, XP_BAR.h);
  }
}

const SUPER_SHOTS: readonly ShotKind[] = ["bolt", "arc"];
function evolvedHolds(run: Pick<RunState, "slots">, kind: ShotKind): boolean {
  return SUPER_SHOTS.includes(kind) && run.slots.some((k) => k.id === kind && k.evolved === true);
}

/** A jagged bolt of light from one shape to the next: a wide faint stroke under a thin bright one. */
function drawArc(g: Pen, a: Arc, fade: number): void {
  const steps = 5;
  const dx = a.tx - a.x;
  const dy = a.ty - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let px = a.x;
  let py = a.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const jag = i < steps ? Math.sin(i * 2.9 + a.seed) * 7 : 0;
    const qx = a.x + dx * t + nx * jag;
    const qy = a.y + dy * t + ny * jag;
    g.lineStyle(9, STORM_INK, 0.35 * fade);
    g.lineBetween(px, py, qx, qy);
    g.lineStyle(2.5, 0xffffff, fade);
    g.lineBetween(px, py, qx, qy);
    px = qx;
    py = qy;
  }
}
