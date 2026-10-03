// The Music Box listening lab: a blind, loudness-matched A/B of the game's
// sound. A standalone page (scripts/lab/build-music-sound-lab.mjs bundles it),
// never part of the app, so it costs a child's first visit nothing.
//
// BLIND: the arms get shuffled letters on every load and their names appear
// only after Reveal. MATCHED: every arm is rendered offline first and scaled
// to the same RMS as today's sound for that tune and voice, so the louder arm
// cannot win by being louder. SAME TEMPO: one scheduler, one beat length.
import { STEP_MS } from "../../games/music/sound";
import { ROWS, VOICES, cellIndex, type Voice } from "../../games/music/logic";
import { ARMS, STEP_S, TAIL_S, dB, measure, renderArm, scheduleBeat, wav, type Arm, type ArmId, type Level } from "./arms";
import { TUNES, type TuneId } from "./tunes";

const LETTERS = ["W", "X", "Y", "Z"];
const VOICE_LABEL: Record<Voice, string> = { round: "Round", soft: "Soft", bright: "Bright" };
const MEASURE_LOOPS = 2;

/* ------------------------------------------------------------------ state */

function shuffled<T>(xs: readonly T[]): T[] {
  const out = [...xs];
  const r = new Uint32Array(out.length);
  try {
    crypto.getRandomValues(r);
  } catch {
    for (let i = 0; i < r.length; i++) r[i] = Math.floor(Math.random() * 2 ** 32);
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = r[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const order: Arm[] = shuffled(ARMS);
let tuneId: TuneId = "sparse";
let voice: Voice = "round";
let picked: number | null = null;
let revealed = false;

type Key = `${TuneId}|${Voice}|${ArmId}`;
const raw = new Map<Key, Level>();
const factor = new Map<Key, number>();
const matched = new Map<Key, Level>();
const key = (t: TuneId, v: Voice, a: ArmId): Key => `${t}|${v}|${a}`;
const tuneOf = (id: TuneId) => TUNES.find((t) => t.id === id)!;

/** Render every arm at gain 1, match each to today's RMS, then re-render to prove it. */
async function measureAll(onProgress: (done: number, total: number) => void): Promise<void> {
  const total = TUNES.length * VOICES.length * ARMS.length * 2;
  let done = 0;
  for (const t of TUNES) {
    const windowS = 0.05 + t.state.steps * MEASURE_LOOPS * STEP_S;
    for (const v of VOICES) {
      for (const a of ARMS) {
        const buf = await renderArm(a, t.state, v, 1, MEASURE_LOOPS);
        raw.set(key(t.id, v, a.id), measure(buf, windowS));
        onProgress(++done, total);
      }
      const target = raw.get(key(t.id, v, "today"))!.rms;
      for (const a of ARMS) {
        const k = key(t.id, v, a.id);
        const f = target / raw.get(k)!.rms;
        factor.set(k, f);
        const buf = await renderArm(a, t.state, v, f, MEASURE_LOOPS);
        matched.set(k, measure(buf, windowS));
        onProgress(++done, total);
      }
    }
  }
}

/* --------------------------------------------------------------- playback */

let ctx: AudioContext | null = null;
let playing: { slot: number; start: number; beat: number; timer: number } | null = null;
const LOOKAHEAD_S = 0.12;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function stop(): void {
  if (playing) clearInterval(playing.timer);
  playing = null;
  render();
}

function play(slot: number): void {
  stop();
  const ac = audio();
  const arm = order[slot];
  const start = ac.currentTime + 0.08;
  const state = { slot, start, beat: 0, timer: 0 };
  const pump = () => {
    const tune = tuneOf(tuneId).state;
    const gain = factor.get(key(tuneId, voice, arm.id)) ?? 1;
    while (state.start + state.beat * STEP_S < ac.currentTime + LOOKAHEAD_S) {
      const when = state.start + state.beat * STEP_S;
      scheduleBeat(ac, arm, tune, state.beat % tune.steps, voice, when, gain);
      state.beat++;
    }
  };
  pump();
  state.timer = window.setInterval(pump, 25);
  playing = state;
  render();
}

/** Restart whatever is playing, so a tune or voice change is heard at once. */
function restart(): void {
  if (playing) play(playing.slot);
  else render();
}

/* --------------------------------------------------------------------- UI */

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { cls?: string } = {},
  kids: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  const { cls, ...rest } = props;
  if (cls) e.className = cls;
  Object.assign(e, rest);
  for (const k of kids) e.append(k);
  return e;
}

function segmented<T extends string>(items: readonly T[], label: (x: T) => string, current: T, set: (x: T) => void) {
  return el(
    "div",
    { cls: "seg" },
    items.map((x) => {
      const b = el("button", { type: "button", textContent: label(x) });
      b.setAttribute("aria-pressed", String(x === current));
      b.onclick = () => {
        set(x);
        restart();
      };
      return b;
    }),
  );
}

function grid(): HTMLElement {
  const t = tuneOf(tuneId).state;
  const g = el("div", { cls: "grid" });
  g.style.gridTemplateColumns = `repeat(${t.steps}, 1fr)`;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < t.steps; col++) {
      const on = t.cells[cellIndex(row, col, t.steps)];
      g.append(el("div", { cls: `sq${on ? " on" : ""}`, title: on ? `beat ${col + 1}` : "" }));
      g.lastElementChild!.setAttribute("data-col", String(col));
    }
  }
  return g;
}

function cards(ready: boolean): HTMLElement {
  return el(
    "div",
    { cls: "cards" },
    order.map((arm, slot) => {
      const isPlaying = playing?.slot === slot;
      const playBtn = el("button", {
        type: "button",
        cls: `play${isPlaying ? " on" : ""}`,
        textContent: isPlaying ? "Stop" : "Play",
        disabled: !ready,
      });
      playBtn.onclick = () => (isPlaying ? stop() : play(slot));
      const pickBtn = el("button", {
        type: "button",
        cls: "pick",
        textContent: picked === slot ? "Your pick" : "I pick this one",
      });
      pickBtn.setAttribute("aria-pressed", String(picked === slot));
      pickBtn.onclick = () => {
        picked = slot;
        render();
      };
      const k = key(tuneId, voice, arm.id);
      const kids: (Node | string)[] = [el("div", { cls: "letter", textContent: LETTERS[slot] }), playBtn, pickBtn];
      if (revealed) {
        const m = matched.get(k);
        kids.push(
          el("div", { cls: "name", textContent: arm.name }),
          el("div", {
            cls: "num",
            textContent: m
              ? `played at x${factor.get(k)!.toFixed(2)} - RMS ${dB(m.rms).toFixed(1)} dB, peak ${dB(m.peak).toFixed(1)} dB`
              : "",
          }),
        );
      }
      return el("div", { cls: `card${picked === slot ? " picked" : ""}` }, kids);
    }),
  );
}

let ready = false;
let progress = "";

function render(): void {
  const root = $("#app");
  root.replaceChildren(
    el("h1", { textContent: "Music Box - which sound do you like best?" }),
    el("p", {
      cls: "lede",
      textContent:
        "Four versions of the same tune. They play at the same speed and have been matched in loudness, so pick the one that sounds best, not the one that sounds biggest. The letters are shuffled every time this page loads.",
    }),
    el("div", { cls: "row" }, [el("span", { cls: "lab", textContent: "Tune" }), segmented(TUNES.map((t) => t.id), (id) => tuneOf(id).label, tuneId, (id) => (tuneId = id))]),
    el("div", { cls: "row" }, [el("span", { cls: "lab", textContent: "Sound button" }), segmented(VOICES, (v) => VOICE_LABEL[v], voice, (v) => (voice = v))]),
    grid(),
    ready ? "" : el("p", { cls: "status", textContent: progress || "Matching loudness..." }),
    cards(ready),
    el("div", { cls: "foot" }, [
      (() => {
        const b = el("button", { type: "button", cls: "reveal", textContent: revealed ? "Hide names" : "Reveal which is which" });
        b.onclick = () => {
          revealed = !revealed;
          render();
        };
        return b;
      })(),
    ]),
    revealed
      ? el("p", {
          cls: "note",
          textContent: `Every version is scaled to the RMS of today's sound for the same tune and sound button, measured on an offline render of ${MEASURE_LOOPS} loops at ${STEP_MS} ms a beat. Today's sound plays at x1.00.`,
        })
      : "",
  );
}

function tickHead(): void {
  const head = ctx && playing ? Math.floor((ctx.currentTime - playing.start) / STEP_S) : -1;
  const steps = tuneOf(tuneId).state.steps;
  const col = head >= 0 ? head % steps : -1;
  document.querySelectorAll<HTMLElement>(".sq").forEach((s) => {
    s.classList.toggle("head", Number(s.dataset.col) === col);
  });
  requestAnimationFrame(tickHead);
}

/* ----------------------------------------- the hook the WAV export drives */

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

declare global {
  interface Window {
    __musicLab?: unknown;
  }
}

window.__musicLab = {
  ready: () => ready,
  table: () =>
    [...raw.keys()].map((k) => {
      const [tune, v, arm] = k.split("|");
      return { tune, voice: v, arm, raw: raw.get(k), factor: factor.get(k), matched: matched.get(k) };
    }),
  wav: async (arm: ArmId, tune: TuneId, v: Voice, loops: number) => {
    const t = tuneOf(tune).state;
    const buf = await renderArm(ARMS.find((a) => a.id === arm)!, t, v, factor.get(key(tune, v, arm)) ?? 1, loops);
    return { b64: toBase64(wav(buf)), seconds: t.steps * loops * STEP_S + TAIL_S };
  },
};

render();
requestAnimationFrame(tickHead);
void measureAll((d, n) => {
  progress = `Matching loudness... ${d} of ${n}`;
  if (d % 6 === 0) render();
}).then(() => {
  ready = true;
  render();
});
