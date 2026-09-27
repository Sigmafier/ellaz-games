/**
 * THE LAYOUT LAB, at `#/lab/layout`.
 *
 *   #/lab/layout         every game on four screens (Wall)
 *   #/lab/layout/<game>  one game, four screens at once, with Before/After (OneGame)
 *   #/lab/layout/gate    walk everything and publish window.__layoutReport for
 *                        `npm run assert:layout` - the gate reads the lab
 *
 * Plan: ~/.claude/plans/read-the-following-handoff-sleepy-canyon.md. Every page
 * carries the beetle surface id, so notes on it land in one place.
 */
import { useEffect, useRef, useState } from "react";
import { runGate } from "./gate";
import { OneGame } from "./OneGame";
import { load, save, snapshot, type Snapshot } from "./store";
import { BTN, UI } from "./bits";
import { GAMES, walk } from "./walk";
import { Wall } from "./Wall";

const sub = () => decodeURIComponent(location.hash.replace(/^#\/lab\/layout\/?/, ""));

/**
 * THE BEETLE - the operator's note button, on every page we build
 * (`~/.claude/rules/quality/every-surface-we-build-carries-the-beetle.md`).
 * Loaded from the Visual Hall at runtime and only on a loopback origin: on
 * ellaz.fun there is no hall to send a note to, and the site makes no request
 * to anything but itself. The same guard the studio gallery uses (beetle.ts).
 */
function mountBeetle(surface: string): void {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  if (document.querySelector("beetle-host, script[data-surface]")) return;
  const s = document.createElement("script");
  s.src = "http://localhost:8772/_assets/beetle.js";
  s.dataset.surface = surface;
  s.async = true;
  document.head.append(s);
}

export function Layout() {
  const [route, setRoute] = useState(sub);
  const [snap, setSnap] = useState<Snapshot | null>(load);
  const [walking, setWalking] = useState<number | null>(null);
  const stop = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => mountBeetle("ellaz-layout-lab"), []);

  useEffect(() => {
    const on = () => setRoute(sub());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    if (route !== "gate" || !frame.current) return;
    runGate(frame.current, (n) => setWalking(n));
  }, [route]);

  const startWalk = async () => {
    if (!frame.current) return;
    stop.current = false;
    setWalking(0);
    const t0 = Date.now();
    let n = 0;
    const rows = await walk(frame.current, () => setWalking(++n), { stop: () => stop.current });
    if (!stop.current) {
      const s = snapshot(GAMES, rows, Date.now() - t0);
      save(s);
      setSnap(s);
    }
    setWalking(null);
  };

  const total = GAMES.length * 4;
  return (
    <main data-surface="ellaz-layout-lab" style={{ minHeight: "100vh", background: UI.bg, color: UI.ink, font: "14px/1.4 system-ui, sans-serif", padding: 16 }}>
      <header style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", margin: "0 0 14px" }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Layout lab</h1>
        {route !== "gate" && (
          walking === null ? (
            <button type="button" style={BTN} onClick={startWalk}>Walk all {GAMES.length} games x 4 screens</button>
          ) : (
            <button type="button" style={BTN} onClick={() => (stop.current = true)}>Stop ({walking}/{total})</button>
          )
        )}
        <span style={{ color: UI.dim, fontSize: 13 }}>
          {route === "gate"
            ? `gate walk: ${walking ?? 0}/${total}`
            : snap
              ? `last walk ${new Date(snap.at).toLocaleString()} · ${Object.keys(snap.cells).length} pages in ${Math.round(snap.ms / 1000)}s`
              : "nothing walked yet in this browser"}
        </span>
      </header>
      {route && route !== "gate" ? (
        <OneGame id={route} snap={snap} onBack={() => (location.hash = "#/lab/layout")} />
      ) : route !== "gate" && snap ? (
        <Wall snap={snap} onOpen={(id) => (location.hash = `#/lab/layout/${id}`)} />
      ) : null}
      {/* The walker's one frame: real size, off screen, never scaled. */}
      <iframe ref={frame} title="layout walker" aria-hidden="true" tabIndex={-1} style={{ position: "absolute", left: -99999, top: 0, border: 0 }} />
    </main>
  );
}
