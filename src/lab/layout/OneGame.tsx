/**
 * THE ONE-GAME VIEW - the real game on all four screens at once, the bars
 * outlined, the numbers under each (operator pick 2026-09-27, design A).
 *
 * Four live frames, never more: 33 once froze the browser. Each is the REAL
 * screen size and scaled by its transform, so a phone frame lays out as a
 * phone. The two switches change the page inside the frames and re-read it:
 *   After     the chosen class's layout drawn over the real game (after.ts)
 *   End strip the end-of-run strip raised through GameHost's lab switch
 */
import { useEffect, useRef, useState } from "react";
import { applyAfter } from "./after";
import { BTN, Legend, Numbers, Outlines, UI, seg } from "./bits";
import type { Snapshot } from "./store";
import { verdicts, type Verdict } from "./verdicts";
import { GAMES, readOne } from "./walk";
import { SCREENS, type LayoutClass, type Report, type ScreenId } from "./types";

const BOX = { w: 580, h: 420 };
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Mode = { after: LayoutClass | null; strip: boolean };

function Stage({ id, screen, mode, onRead }: { id: string; screen: ScreenId; mode: Mode; onRead: (r: Report) => void }) {
  const f = useRef<HTMLIFrameElement>(null);
  const [r, setR] = useState<Report | null>(null);
  const s = SCREENS.find((x) => x.id === screen)!;
  const k = Math.min(BOX.w / s.w, BOX.h / s.h);
  useEffect(() => {
    let live = true;
    setR(null);
    const prepare = async (doc: Document) => {
      if (mode.strip) {
        doc.defaultView?.postMessage({ type: "ellaz:lab-strip", on: true }, location.origin);
        await wait(300);
      }
      if (mode.after) applyAfter(doc, mode.after);
    };
    readOne(f.current!, id, screen, prepare).then((rep) => {
      if (!live) return;
      setR(rep);
      onRead(rep);
    });
    return () => {
      live = false;
    };
  }, [id, screen, mode.after, mode.strip]);
  return (
    <div style={{ position: "relative", width: s.w * k, height: s.h * k, overflow: "hidden", borderRadius: 6, background: "#fff" }}>
      <iframe ref={f} title={`${id} on ${screen}`} style={{ position: "absolute", left: 0, top: 0, border: 0, transform: `scale(${k})`, transformOrigin: "0 0", pointerEvents: "none" }} />
      {r && !r.error && <Outlines r={r} k={k} />}
    </div>
  );
}

export function OneGame({ id, snap, onBack }: { id: string; snap: Snapshot | null; onBack: () => void }) {
  const [cls, setCls] = useState<LayoutClass>(snap?.suggested[id] ?? "outside");
  const [mode, setMode] = useState<Mode>({ after: null, strip: false });
  const [reads, setReads] = useState<Partial<Record<ScreenId, Report>>>({});
  const [before, setBefore] = useState<Partial<Record<ScreenId, Verdict>>>({});
  const v = (screen: ScreenId): Verdict | null => {
    const r = reads[screen];
    if (!r) return null;
    const out = verdicts([{ id, screen, report: r }])[0];
    return { ...out, strays: snap?.cells[`${id}|${screen}`]?.v.strays ?? [] };
  };
  const onRead = (screen: ScreenId) => (r: Report) => {
    setReads((m) => ({ ...m, [screen]: r }));
    if (!mode.after && !r.error) setBefore((m) => ({ ...m, [screen]: verdicts([{ id, screen, report: r }])[0] }));
  };
  const go = (next: string) => (location.hash = `#/lab/layout/${next}`);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", margin: "0 0 12px" }}>
        <button type="button" style={BTN} onClick={onBack}>All games</button>
        <select value={id} onChange={(e) => go((e.target as HTMLSelectElement).value)} style={{ ...BTN, background: "#0b1222" }}>
          {GAMES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <label style={{ color: UI.dim, fontSize: 13 }}>
          class{" "}
          <select value={cls} onChange={(e) => setCls((e.target as HTMLSelectElement).value as LayoutClass)} style={{ ...BTN, background: "#0b1222" }}>
            <option value="onGame">onGame - buttons on the game</option>
            <option value="outside">outside - buttons beside it</option>
          </select>{" "}
          (suggested: {snap?.suggested[id] ?? "walk the wall first"})
        </label>
        <span style={{ display: "inline-flex", border: `1px solid ${UI.line}`, borderRadius: 10, overflow: "hidden" }}>
          <button type="button" style={seg(!mode.after)} onClick={() => setMode((m) => ({ ...m, after: null }))}>Before</button>
          <button type="button" style={seg(!!mode.after)} onClick={() => setMode((m) => ({ ...m, after: cls }))}>After</button>
        </span>
        <button type="button" style={seg(mode.strip)} onClick={() => setMode((m) => ({ ...m, strip: !m.strip }))}>
          End strip {mode.strip ? "on" : "off"}
        </button>
      </div>
      <Legend />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 600px), 1fr))", gap: 18 }}>
        {SCREENS.map((s) => {
          const vv = v(s.id);
          const r = reads[s.id];
          return (
            <div key={`${s.id}-${cls}`} style={{ background: UI.card, border: `1px solid ${UI.line}`, borderRadius: 12, padding: 10 }}>
              <b>{s.id} {s.w}x{s.h}</b>
              <Stage id={id} screen={s.id} mode={mode} onRead={onRead(s.id)} />
              {r?.error ? <p style={{ color: UI.dim }}>not read: {r.error}</p> : vv && r ? <Numbers v={vv} r={r} before={mode.after ? before[s.id] : undefined} /> : <p style={{ color: UI.dim }}>reading...</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
