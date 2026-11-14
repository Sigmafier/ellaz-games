import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { GameContext } from "@sdk/index";
import type { Locale } from "@i18n/index";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import { GameChrome } from "@ui/GameChrome";
import { type DifficultyOption } from "@ui/DifficultySelector";
import { Key } from "@ui/Key";
import { usePageScrollLock } from "@ui/pageScrollLock";
import { haptic, shake } from "@juice/index";
import { useRememberedLevel, winMoment } from "@shared/index";
import {
  HINT,
  LEVELS,
  MIDDLE_C,
  TIER,
  blackCentre,
  blacks,
  centreOf,
  clampOffset,
  firstVisibleC,
  hasBlacks,
  isMode,
  isSongId,
  keyForMidi,
  keysFor,
  layoutFor,
  midiForKey,
  newFollow,
  offsetForC,
  offsetToShow,
  pitchClass,
  playableSong,
  press,
  pushTrail,
  scrolls,
  songById,
  songsFor,
  timeline,
  upcoming,
  wanted,
  whites,
  type Follow,
  type Level,
  type Mode,
  type SongId,
} from "./logic";
import { pianoSpec } from "./sound";

// The renderer. Every rule about what a key DOES lives in logic.ts; this file
// decides what it looks and sounds like.
//
// TAP FIRST. Every key answers a single tap (pointerdown), so the game is
// tap-completable; sliding a finger along the keys plays each one it crosses,
// which is the glissando every online piano has - ON TOP, never required.
// Several fingers play several keys at once: each pointer is tracked by id.
//
// A PC also plays from the computer keyboard (A S D F ... for the white keys,
// W E T Y U ... for the black, from the first C on screen), and Z and X slide
// a long keyboard an octave.
//
// A LONG KEYBOARD SCROLLS UNDER A MAP. Plus and Pro own more keys than a screen
// holds at a size a finger can hit (`RANGE`, `layoutFor`). Dragging ON the keys
// is the glissando, so it cannot also be the scroll: the map of the whole range
// above the keys is what moves it, like the online pianos the operator pointed
// at - drag its window, or tap where you want to be. A trackpad's sideways
// swipe and Z / X move it too, and songs bring their next note into view.
//
// NO RECORD. Free play keeps nothing. Finishing a song is a `level_complete`
// through `winMoment`, fired from the key handler - never from a state updater -
// and only on the press that plays the song's last note.

const LEVEL_OPTIONS: DifficultyOption<Level>[] = [
  { id: "basic", label: { he: "בסיסי", en: "Basic", es: "Básico", sv: "Bas" } },
  // "Plus", not "Advanced": the level disc's label font is the kit's, and an
  // eight-letter word wrapped to "ADVANCE / D" on a 390px phone (2026-11-14).
  // Hebrew's מתקדם is five letters and fits.
  { id: "advanced", label: { he: "מתקדם", en: "Plus", es: "Plus", sv: "Plus" } },
  { id: "pro", label: { he: "מקצוען", en: "Pro", es: "Pro", sv: "Proffs" } },
];

/** What the level picker is: the KEYBOARD, not how hard anything is. */
const LEVEL_LABEL: Record<Locale, string> = { he: "מקלדת", en: "Keyboard", es: "Teclado", sv: "Klaviatur" };

/** Note names by pitch class, 0 = C. Swedish calls B "H", as its own music does. */
const NOTE_NAMES: Record<Locale, readonly string[]> = {
  he: ["דו", "דו#", "רה", "רה#", "מי", "פה", "פה#", "סול", "סול#", "לה", "לה#", "סי"],
  en: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  es: ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"],
  sv: ["C", "Ciss", "D", "Diss", "E", "F", "Fiss", "G", "Giss", "A", "Aiss", "H"],
};

const SONG_TITLES: Record<SongId, Record<Locale, string>> = {
  bus: { he: "גלגלי האוטובוס", en: "The Wheels on the Bus", es: "Las ruedas del autobús", sv: "Hjulen på bussen" },
  thumb: { he: "איפה האצבע", en: "Where Is Thumbkin?", es: "Martinillo", sv: "Broder Jakob" },
  twinkle: { he: "נצנץ כוכב קטן", en: "Twinkle, Twinkle", es: "Estrellita", sv: "Blinka lilla" },
  jonathan: { he: "יונתן הקטן", en: "Little Jonathan", es: "Juanito", sv: "Lilla Hans" },
  joy: { he: "האודה לשמחה", en: "Ode to Joy", es: "Himno de la alegría", sv: "Ode till glädjen" },
  lullaby: { he: "שיר הערש של ברהמס", en: "Brahms' Lullaby", es: "Canción de cuna de Brahms", sv: "Brahms vaggvisa" },
  jingle: { he: "ג'ינגל בלס", en: "Jingle Bells", es: "Cascabel", sv: "Bjällerklang" },
  nacht: { he: "מוזיקה לילית קטנה", en: "Eine kleine Nachtmusik", es: "Pequeña serenata nocturna", sv: "Eine kleine Nachtmusik" },
  elise: { he: "לאליזה", en: "Für Elise", es: "Para Elisa", sv: "Für Elise" },
  green: { he: "גרינסליבס", en: "Greensleeves", es: "Greensleeves", sv: "Greensleeves" },
  mountain: { he: "בהיכל מלך ההרים", en: "Hall of the Mountain King", es: "En la gruta del rey de la montaña", sv: "I bergakungens sal" },
  canon: { he: "הקאנון של פכלבל", en: "Pachelbel's Canon", es: "Canon de Pachelbel", sv: "Pachelbels kanon" },
  turkish: { he: "המארש הטורקי", en: "Turkish March", es: "Marcha turca", sv: "Turkisk marsch" },
  largo: { he: "הדרך הביתה (דבוז'אק)", en: "Going Home (Dvořák)", es: "Largo del Nuevo Mundo", sv: "Largo ur Nya världen" },
  gymno: { he: "ג'ימנופדי מס' 1", en: "Gymnopédie No. 1", es: "Gymnopédie n.º 1", sv: "Gymnopédie nr 1" },
  morning: { he: "מצב רוח של בוקר", en: "Morning Mood", es: "La mañana", sv: "Morgonstämning" },
};

const WORDS: Record<
  Locale,
  {
    free: string;
    songs: string;
    listen: string;
    stop: string;
    sustain: string;
    labels: string;
    map: string;
    notes: string;
    keys: string;
    playAny: string;
    done: string;
    next: string;
    song: string;
    big: string;
    close: string;
  }
> = {
  he: {
    free: "נגינה חופשית",
    songs: "שירים",
    listen: "האזינו",
    stop: "עצרו",
    sustain: "פדל",
    labels: "שמות התווים",
    map: "מפת המקלדת - גררו כדי לזוז",
    notes: "תווים",
    keys: "קלידים",
    playAny: "נגנו על כל קליד",
    done: "כל הכבוד! ניגנתם את כל השיר",
    next: "התו הבא",
    song: "בחרו שיר",
    big: "פסנתר במסך מלא",
    close: "סגירת המסך המלא",
  },
  en: {
    free: "Free play",
    songs: "Songs",
    listen: "Listen",
    stop: "Stop",
    sustain: "Sustain",
    labels: "Note names",
    map: "Keyboard map - drag to move along",
    notes: "Notes",
    keys: "Keys",
    playAny: "Play any key",
    done: "Well done! You played the whole song",
    next: "Next note",
    song: "Choose a song",
    big: "Full-screen piano",
    close: "Close full screen",
  },
  es: {
    free: "Libre",
    songs: "Canciones",
    listen: "Escuchar",
    stop: "Parar",
    sustain: "Pedal",
    labels: "Nombres de notas",
    map: "Mapa del teclado: arrastra para moverte",
    notes: "Notas",
    keys: "Teclas",
    playAny: "Toca cualquier tecla",
    done: "¡Muy bien! Tocaste toda la canción",
    next: "Nota siguiente",
    song: "Elige una canción",
    big: "Piano a pantalla completa",
    close: "Cerrar pantalla completa",
  },
  sv: {
    free: "Fritt spel",
    songs: "Sånger",
    listen: "Lyssna",
    stop: "Stopp",
    sustain: "Pedal",
    labels: "Tonnamn",
    map: "Klaviaturkarta - dra för att flytta",
    notes: "Toner",
    keys: "Tangenter",
    playAny: "Spela på vilken tangent som helst",
    done: "Bra jobbat! Du spelade hela sången",
    next: "Nästa ton",
    song: "Välj en sång",
    big: "Piano i helskärm",
    close: "Stäng helskärm",
  },
};

/* -------------------------------------------------------------- the style */

/**
 * One colour per note name, C to B, the rainbow order classroom bells use. The
 * basic keyboard wears them on every key, and the song strip uses the same
 * colour for the note it is asking for - so a child can match colour to colour
 * before they can read a note name.
 */
const NOTE_COLORS: readonly string[] = [
  "#FF4D4D", "#FF4D4D", // C
  "#FF9A3D", "#FF9A3D", // D
  "#FFD23D", // E
  "#5BD45B", "#5BD45B", // F
  "#2EC4B6", "#2EC4B6", // G
  "#4D8DFF", "#4D8DFF", // A
  "#A66DFF", // B
];

/** The board behind the keys. Not a theme token: an instrument is its own colour. */
const CASE = "#1D2440";
const CASE_STRIP = "#28315A";
const IVORY = "#FBFAF5";
const IVORY_DOWN = "#DCE3F5";
const EBONY = "#1B1E2B";
const EBONY_DOWN = "#4A5378";
const HINT_RING = "#FFC730";

/** How tall the strip above the keys is, as a share of the board. */
const STRIP = 0.22;
/** On a keyboard that scrolls, the strip gives up part of that to the map. */
const STRIP_WITH_MAP = 0.15;
const MAP = 0.1;

/**
 * The narrowest a white key gets, px. A finger needs more than a mouse:
 * 36 on a touch screen leaves ten keys across an upright phone, the same as
 * Basic; 30 under a mouse puts 25 on a laptop's board.
 */
const MIN_KEY_TOUCH = 36;
const MIN_KEY_MOUSE = 30;
/**
 * Pro on a WIDE window - a phone turned sideways, the full-screen piano, a PC -
 * goes thinner (operator 2026-11-14: "the keys should be thinner in pro
 * landscape"): a pianist's hand, more of the five octaves at once. 26 on touch
 * puts about 31 white keys across a phone held sideways, against 23 at 36.
 */
const MIN_KEY_PRO_WIDE_TOUCH = 26;
const MIN_KEY_PRO_WIDE_MOUSE = 24;
/** The keys' window, px, from which Pro counts as wide. An upright phone is ~355. */
const WIDE_VIEW = 600;

/* ------------------------------------------------------------------ glyphs */

function Glyph({ d, filled = false }: { d: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const PLAY_D = "M7.5 5.2 19 12 7.5 18.8z";
const STOP_D = "M6.4 6.4h11.2v11.2H6.4z";
/** A pedal: a foot plate on a stem. */
const PEDAL_D = "M12 3v9M7 15h10a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4z";
/** Four corners: the full-screen piano. */
const BIG_D = "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";
const CLOSE_D = "M6 6l12 12M18 6 6 18";
/** A tag: the note names. */
const LABEL_D = "M4 5h8l8 8-7 7-8-8V5zM8.5 8.5h.01";

/* ----------------------------------------------------------------- storage */

const MODE_KEY = "mode";
const SONG_KEY = "song";
const START_KEY = "start";
const SUSTAIN_KEY = "sustain";
const LABELS_KEY = "labels";

function readMode(ctx: GameContext): Mode {
  const v = ctx.storage.get<unknown>(MODE_KEY, null);
  return isMode(v) ? v : "free";
}

function readSong(ctx: GameContext): SongId {
  const v = ctx.storage.get<unknown>(SONG_KEY, null);
  return isSongId(v) ? v : "bus";
}

function readBool(ctx: GameContext, key: string, fallback: boolean): boolean {
  const v = ctx.storage.get<unknown>(key, null);
  return typeof v === "boolean" ? v : fallback;
}

/** The C a long keyboard last had at its left edge, or null on a first visit. */
function readStart(ctx: GameContext): number | null {
  const v = ctx.storage.get<unknown>(START_KEY, null);
  return typeof v === "number" && Number.isInteger(v) && pitchClass(v) === 0 ? v : null;
}

function coarsePointer(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;
}

/* ----------------------------------------------------------------- the game */

export function Piano({ ctx }: { ctx: GameContext }) {
  const [level, setLevel] = useRememberedLevel(ctx, LEVELS, "basic");
  // Read ONCE at mount: the board's shape, and how narrow a key may get.
  const [pc] = useState(isPcArena);
  const [coarse] = useState(coarsePointer);
  const [mode, setModeState] = useState<Mode>(() => readMode(ctx));
  const [songId, setSongId] = useState<SongId>(() => playableSong(readSong(ctx), level));
  const [follow, setFollow] = useState<Follow>(() => newFollow(songId));
  const [sustain, setSustain] = useState(() => readBool(ctx, SUSTAIN_KEY, false));
  const [labels, setLabels] = useState(() => readBool(ctx, LABELS_KEY, true));
  const [trail, setTrail] = useState<number[]>([]);
  /** Keys held down right now, by pointer or computer key - drawn pressed. */
  const [held, setHeld] = useState<ReadonlySet<number>>(() => new Set());
  /** The note the "listen" demo is sounding, or null when it is not playing. */
  const [demo, setDemo] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  /**
   * The full-screen piano: the keyboard alone, filling the screen. `turned`
   * is whether it had to be drawn sideways because the screen stayed portrait
   * (no orientation lock - an iPhone, a desktop browser in a tall window).
   */
  const [big, setBig] = useState(false);
  const [turned, setTurned] = useState(false);
  /** The keys' window, px of LAYOUT width (never a transformed rect). */
  const [viewW, setViewW] = useState(0);
  /** How far a long keyboard is scrolled, px. */
  const [offset, setOffset] = useState(0);

  const T = WORDS[ctx.locale];
  const names = NOTE_NAMES[ctx.locale];

  const keys = useMemo(() => keysFor(level), [level]);
  const whiteKeys = useMemo(() => whites(keys), [keys]);
  const blackKeys = useMemo(() => blacks(keys), [keys]);
  const proWide = level === "pro" && viewW >= WIDE_VIEW;
  const minKey = proWide
    ? coarse
      ? MIN_KEY_PRO_WIDE_TOUCH
      : MIN_KEY_PRO_WIDE_MOUSE
    : coarse
      ? MIN_KEY_TOUCH
      : MIN_KEY_MOUSE;
  const lay = layoutFor(whiteKeys.length, viewW, minKey);
  const long = scrolls(level) && lay.scroll;
  const keyPx = lay.keyPx;
  const shown = long ? clampOffset(offset, lay.contentPx, viewW) : 0;
  const base = long ? firstVisibleC(keys, shown, keyPx) : keys[0];

  /* --------------------------------------------- refs the handlers read */

  const boardRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(follow);
  followRef.current = follow;
  const live = useRef({ mode, level, keys, sustain, songId, base, long, keyPx, contentPx: lay.contentPx, viewW });
  live.current = { mode, level, keys, sustain, songId, base, long, keyPx, contentPx: lay.contentPx, viewW };
  const demoTimers = useRef<number[]>([]);
  const startedRef = useRef(false);

  /* ------------------------------------------------------- the scrolling */

  // The window's width, from LAYOUT: `clientWidth` is untouched by fitStage's
  // scale and by the full-screen piano's quarter turn, a rect is not
  // (a-canvas-that-measures-its-own-box-cannot-see-a-transform-on-it.md).
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const read = () => setViewW(el.clientWidth);
    read();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Scroll to an offset, kept inside the row. */
  const scrollTo = useCallback((px: number) => {
    const { contentPx, viewW: w } = live.current;
    setOffset(clampOffset(px, contentPx, w));
  }, []);

  /** Remember where a long keyboard was left, as the C at its edge. */
  const remember = useCallback(() => {
    const { long: l, keys: ks, keyPx: k, contentPx, viewW: w } = live.current;
    if (!l) return;
    setOffset((o) => {
      ctx.storage.set(START_KEY, firstVisibleC(ks, clampOffset(o, contentPx, w), k));
      return o;
    });
  }, [ctx]);

  // A new level, or a new width: put the remembered C at the left edge - or,
  // on a first visit, middle C in the middle, where a pianist's hands start.
  useEffect(() => {
    if (!long) return;
    const c = readStart(ctx);
    setOffset(
      c === null
        ? clampOffset(centreOf(keys, MIDDLE_C) * keyPx - viewW / 2, lay.contentPx, viewW)
        : offsetForC(keys, c, keyPx, lay.contentPx, viewW),
    );
    // keyPx and contentPx follow viewW and level; listing them would re-centre
    // on every render that rounds differently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, level, long, viewW]);

  // Songs and the listen demo bring the note they want into view.
  const want = mode === "songs" ? wanted(follow) : undefined;
  const focus = demo ?? want;
  useEffect(() => {
    if (!long || focus === undefined) return;
    setOffset((o) => offsetToShow(centreOf(keys, focus), keyPx, o, lay.contentPx, viewW));
  }, [focus, keys, keyPx, lay.contentPx, long, viewW]);

  // A trackpad's sideways swipe (or Shift + wheel) slides the keyboard. Native
  // and not passive, so it can keep the page from swiping back a history step.
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    let settle = 0;
    const onWheel = (e: WheelEvent) => {
      if (!live.current.long) return;
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      setOffset((o) => clampOffset(o + dx, live.current.contentPx, live.current.viewW));
      window.clearTimeout(settle);
      settle = window.setTimeout(remember, 250);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [remember]);

  /** Slide a long keyboard by whole octaves (Z / X). */
  const shiftBy = useCallback(
    (octaves: number) => {
      const { long: l, keyPx: k } = live.current;
      if (!l) return;
      setOffset((o) => clampOffset(o + octaves * 7 * k, live.current.contentPx, live.current.viewW));
      window.setTimeout(remember, 0);
    },
    [remember],
  );

  /* ------------------------------------------------------------ the sound */

  const ring = useCallback(
    (midi: number) => {
      ctx.audio.voice(pianoSpec(midi, live.current.sustain));
    },
    [ctx],
  );

  const stopDemo = useCallback(() => {
    for (const t of demoTimers.current) window.clearTimeout(t);
    demoTimers.current = [];
    setDemo(null);
    setListening(false);
  }, []);

  useEffect(() => stopDemo, [stopDemo]);
  // A tab going away stops the demo; a song left half-played simply waits.
  useEffect(() => ctx.onPause(() => stopDemo()), [ctx, stopDemo]);

  /* ------------------------------------------------------------ a strike */

  const holdOn = useCallback((midi: number) => {
    setHeld((prev) => {
      if (prev.has(midi)) return prev;
      const next = new Set(prev);
      next.add(midi);
      return next;
    });
  }, []);

  const holdOff = useCallback((midi: number) => {
    setHeld((prev) => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  /**
   * One key, struck. Every note in the game goes through here - a tap, a
   * slide, a computer key - and so does the song: the reward is decided HERE,
   * in the handler flow, never inside a state updater.
   */
  const strike = useCallback(
    (midi: number, at?: { x: number; y: number }) => {
      ctx.audio.unlock();
      ring(midi);
      haptic.tap();
      const { mode: m, level: lv, songId: sid } = live.current;
      if (m === "free") {
        setTrail((t) => pushTrail(t, midi));
        return;
      }
      if (demoTimers.current.length) stopDemo();
      const { follow: next, outcome } = press(followRef.current, midi);
      if (outcome.kind === "right") {
        followRef.current = next;
        setFollow(next);
        if (outcome.done) {
          winMoment(ctx, { reason: "level_complete", tier: TIER[lv], level: `${sid}-${lv}`, at });
        }
      } else if (outcome.kind === "other") {
        // Gentle: the key the song wants gives a little wiggle. Nothing is lost.
        const el = boardRef.current?.querySelector<HTMLElement>(`[data-midi="${outcome.want}"]`);
        if (el) shake(el, 3, 220);
      }
    },
    [ctx, ring, stopDemo],
  );

  /* ------------------------------------------------------- the pointers */

  const keyAt = (x: number, y: number): number | undefined => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-midi]");
    if (!el || !boardRef.current?.contains(el)) return undefined;
    const m = Number(el.dataset.midi);
    return Number.isFinite(m) ? m : undefined;
  };

  /**
   * Where each pointer is and which key it is on (-1: off the keys). A drag is
   * followed POINT BY POINT rather than event by event: a fast mouse sweep
   * reports one move per frame, 60px or more apart, and reading only the end
   * point skipped two keys in three. So the path from the last point to this
   * one is walked in short steps and every key it crosses sounds, in order.
   */
  const trace = useRef(new Map<number, { x: number; y: number; midi: number }>());

  const release = (id: number) => {
    const t = trace.current.get(id);
    if (!t) return;
    trace.current.delete(id);
    if (t.midi >= 0) holdOff(t.midi);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-midi]");
    if (!el) return;
    const midi = Number(el.dataset.midi);
    if (!Number.isFinite(midi)) return;
    // No focus ring, no text selection, no native drag on a mouse sweep.
    e.preventDefault();
    // Capture on the BOARD, so a drag that leaves it still reports its moves
    // and its release here - a mouse let go outside used to leave its key lit.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a synthetic or already-released pointer: the board still works */
    }
    trace.current.set(e.pointerId, { x: e.clientX, y: e.clientY, midi });
    holdOn(midi);
    strike(midi, { x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = trace.current.get(e.pointerId);
    if (!t) return;
    // A mouse whose button came up somewhere we never heard about.
    if (e.pointerType === "mouse" && e.buttons === 0) {
      release(e.pointerId);
      return;
    }
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
    for (let i = 1; i <= steps; i++) {
      const x = t.x + (dx * i) / steps;
      const y = t.y + (dy * i) / steps;
      const now = keyAt(x, y) ?? -1;
      if (now === t.midi) continue;
      if (t.midi >= 0) holdOff(t.midi);
      t.midi = now;
      if (now >= 0) {
        holdOn(now);
        strike(now, { x, y });
      }
    }
    t.x = e.clientX;
    t.y = e.clientY;
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => release(e.pointerId);

  /* ------------------------------------------------------------- the map */

  /**
   * The map of the whole keyboard. Press inside the lit window and drag it;
   * press anywhere else and the window centres there, then follows the drag.
   * Positions come from `offsetX` over the map's own layout width, so a scaled
   * frame and the turned full-screen piano read the same as a flat page.
   */
  const grab = useRef<{ id: number; dx: number } | null>(null);

  const mapFrac = (e: ReactPointerEvent<HTMLDivElement>): number => {
    const w = e.currentTarget.clientWidth || 1;
    return e.nativeEvent.offsetX / w;
  };

  const onMapDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const { contentPx, viewW: w } = live.current;
    if (!contentPx) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* fine without */
    }
    const x = mapFrac(e) * contentPx;
    const inside = x >= shown && x <= shown + w;
    const dx = inside ? x - shown : w / 2;
    grab.current = { id: e.pointerId, dx };
    if (!inside) scrollTo(x - dx);
  };

  const onMapMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    scrollTo(mapFrac(e) * live.current.contentPx - g.dx);
  };

  const onMapEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (grab.current?.id !== e.pointerId) return;
    grab.current = null;
    remember();
  };

  /* ------------------------------------------------ the computer keyboard */

  useEffect(() => {
    const down = new Map<string, number>();
    const onDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      const { keys: ks, base: b, long: l } = live.current;
      if (l && (k === "z" || k === "x")) {
        e.preventDefault();
        if (!e.repeat) shiftBy(k === "z" ? -1 : 1);
        return;
      }
      const midi = midiForKey(k, ks, b);
      if (midi === undefined) return;
      // ' opens Firefox's quick find, and ; is harmless - hold both for the game.
      e.preventDefault();
      if (e.repeat || down.has(k)) return;
      down.set(k, midi);
      holdOn(midi);
      strike(midi);
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const midi = down.get(k);
      if (midi === undefined) return;
      down.delete(k);
      holdOff(midi);
    };
    const onBlur = () => {
      for (const m of down.values()) holdOff(m);
      down.clear();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [holdOff, holdOn, shiftBy, strike]);

  /* ------------------------------------------------------- the controls */

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart(level);
    }
  }, [ctx, level]);

  /** Start a song again from its first note. */
  const freshSong = useCallback((id: SongId) => {
    const f = newFollow(id);
    followRef.current = f;
    setFollow(f);
  }, []);

  const chooseLevel = useCallback(
    (next: Level) => {
      stopDemo();
      setLevel(next);
      // A classic the new keyboard cannot play gives way to one it can.
      const id = playableSong(live.current.songId, next);
      setSongId(id);
      freshSong(id);
      setTrail([]);
      ctx.analytics.levelStart(next);
    },
    [ctx, freshSong, setLevel, stopDemo],
  );

  // The table's restart token: the song from its first note, or a clean trail.
  const restart = useCallback(() => {
    stopDemo();
    freshSong(live.current.songId);
    setTrail([]);
  }, [freshSong, stopDemo]);

  const setMode = (next: Mode) => {
    ctx.audio.unlock();
    if (next === mode) return;
    stopDemo();
    setModeState(next);
    ctx.storage.set(MODE_KEY, next);
    freshSong(songId);
    setTrail([]);
    haptic.tap();
  };

  const pickSong = (id: SongId) => {
    ctx.audio.unlock();
    stopDemo();
    setSongId(id);
    ctx.storage.set(SONG_KEY, id);
    freshSong(id);
    haptic.tap();
  };

  /** Play the song through once, lighting each key as it sounds. */
  const onListen = () => {
    ctx.audio.unlock();
    if (listening) {
      stopDemo();
      return;
    }
    stopDemo();
    setListening(true);
    const rows = timeline(songById(songId));
    for (const row of rows) {
      demoTimers.current.push(
        window.setTimeout(() => {
          ring(row.midi);
          setDemo(row.midi);
        }, row.at),
      );
    }
    const end = rows.length ? rows[rows.length - 1].at + rows[rows.length - 1].ms : 0;
    demoTimers.current.push(window.setTimeout(() => stopDemo(), end));
  };

  const toggleSustain = () => {
    ctx.audio.unlock();
    setSustain((s) => {
      ctx.storage.set(SUSTAIN_KEY, !s);
      return !s;
    });
    haptic.tap();
  };

  const toggleLabels = () => {
    setLabels((s) => {
      ctx.storage.set(LABELS_KEY, !s);
      return !s;
    });
    haptic.tap();
  };

  /* ------------------------------------------------- the full-screen piano */

  // The real Fullscreen API where there is one: the element goes to the top
  // layer, out from under any transform `fitStage` put on the frame, and a
  // phone can then be asked to turn landscape. Where there is none (an
  // iPhone), the same layer is a fixed box over the page - fitStage leaves a
  // phone frame at scale 1 (the board gate reads 1 for this game), so fixed is
  // fixed to the window. Either way, a screen that stays portrait gets the
  // keyboard drawn sideways rather than squeezed - and because the keyboard is
  // as long as its window allows, landscape shows two to three times the keys.
  const enterBig = () => {
    ctx.audio.unlock();
    setBig(true);
    haptic.tap();
    const el = layerRef.current;
    if (el && typeof el.requestFullscreen === "function") {
      el.requestFullscreen({ navigationUI: "hide" })
        .then(() => {
          const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          return o?.lock?.("landscape");
        })
        .catch(() => {
          /* refused, or no lock on this device: the sideways drawing covers it */
        });
    }
  };

  const exitBig = useCallback(() => {
    setBig(false);
    try {
      (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.();
    } catch {
      /* nothing was locked */
    }
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    if (!big) return;
    const measure = () => setTurned(window.innerHeight > window.innerWidth);
    measure();
    // Leaving full screen by the browser's own gesture (Esc, the back swipe)
    // closes the piano layer too, so the page is never left under a stray cover.
    const onFs = () => {
      if (!document.fullscreenElement) exitBig();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitBig();
    };
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, [big, exitBig]);

  // The page behind the layer must not scroll under a sliding finger.
  usePageScrollLock(big);
  useEffect(() => () => exitBig(), [exitBig]);

  /* ----------------------------------------------------------- the screen */

  const song = songById(songId);
  const hint = HINT[level];
  const done = mode === "songs" && want === undefined;
  // Basic always names its keys; plus and pro follow the names switch.
  const showNames = level === "basic" || labels;
  const coloured = level === "basic";
  const showLetters = pc && labels;

  const nameOf = (m: number) => names[pitchClass(m)];
  const whiteW = 100 / whiteKeys.length;

  const stats =
    mode === "songs"
      ? [{ icon: "layers" as const, label: T.notes, value: `${follow.at}/${song.notes.length}`, ltr: true, compact: true }]
      : [{ icon: "layers" as const, label: T.keys, value: keys.length, compact: true }];

  // Every footer key is 56px tall, so changing the level never changes the
  // game's height.
  const keyStyle: CSSProperties = { minWidth: 56, height: 56, fontSize: 24, padding: "0 12px" };
  const onKey = (on: boolean): CSSProperties =>
    on ? { ...keyStyle, outline: "3px solid var(--brand)", outlineOffset: -3 } : keyStyle;

  const stripCount = Math.max(4, Math.min(12, Math.floor((viewW || 300) / 52)));

  const strip = (() => {
    if (mode === "songs") {
      if (done) return <span style={{ fontWeight: 800, color: "#fff" }}>{T.done}</span>;
      const next = upcoming(follow, stripCount);
      return (
        <div dir="ltr" style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden", width: "100%", height: "100%" }}>
          {next.map(([m], i) => (
            <span
              key={`${follow.at + i}`}
              aria-label={i === 0 ? `${T.next}: ${nameOf(m)}` : undefined}
              style={{
                flex: "0 0 auto",
                minWidth: i === 0 ? 54 : 38,
                height: i === 0 ? "84%" : "62%",
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                padding: "0 8px",
                fontWeight: 800,
                fontSize: i === 0 ? 20 : 15,
                // In pro the strip shows names only; below it, the note's colour too.
                background: level === "pro" ? (i === 0 ? "#fff" : "rgba(255,255,255,.18)") : NOTE_COLORS[pitchClass(m)],
                color: level === "pro" && i !== 0 ? "#fff" : "#1B1E2B",
                opacity: i === 0 ? 1 : Math.max(0.35, 1 - i * 0.12),
                boxShadow: i === 0 ? `0 0 0 3px ${HINT_RING}` : "none",
              }}
            >
              {nameOf(m)}
            </span>
          ))}
        </div>
      );
    }
    if (trail.length === 0) return <span style={{ color: "rgba(255,255,255,.7)", fontWeight: 700 }}>{T.playAny}</span>;
    return (
      <div dir="ltr" style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden", height: "100%" }}>
        {trail.map((m, i) => (
          <span
            key={`${i}-${m}`}
            style={{
              minWidth: 36,
              height: "60%",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              padding: "0 7px",
              fontWeight: 800,
              fontSize: 14,
              background: NOTE_COLORS[pitchClass(m)],
              color: "#1B1E2B",
              opacity: 0.4 + (0.6 * (i + 1)) / trail.length,
            }}
          >
            {nameOf(m)}
          </span>
        ))}
      </div>
    );
  })();

  const lit = (m: number) => held.has(m) || demo === m;

  /**
   * The songs as a LIST, not a row of buttons: a native select scales to any
   * number of songs, opens the phone's own picker, and costs one control's
   * width whatever the titles' lengths in any language. It lists only what this
   * keyboard can play.
   */
  const songPicker = (extra: CSSProperties) => (
    <select
      aria-label={T.song}
      value={songId}
      onChange={(e) => {
        const v = e.currentTarget.value;
        if (isSongId(v)) pickSong(v);
      }}
      style={{
        height: 48,
        maxWidth: "100%",
        padding: "0 14px",
        borderRadius: 12,
        border: "2px solid var(--brand-strong)",
        background: "var(--surface)",
        color: "var(--text)",
        font: "700 17px Fredoka, inherit",
        cursor: "pointer",
        ...extra,
      }}
    >
      {songsFor(level).map((sg) => (
        <option key={sg.id} value={sg.id}>
          {SONG_TITLES[sg.id][ctx.locale]}
        </option>
      ))}
    </select>
  );

  /** The bar across the top of the full-screen piano. */
  const bigBar = (
    <div
      dir="ltr"
      style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8, padding: "0 4px 8px", flexWrap: "nowrap" }}
    >
      <Key size={22} act aria-label={T.close} onClick={exitBig} style={{ ...keyStyle, height: 48, minWidth: 48 }}>
        <Glyph d={CLOSE_D} />
      </Key>
      {mode === "songs" && songPicker({ flex: "0 1 280px", minWidth: 0 })}
      {mode === "songs" && (
        <Key size={22} go aria-label={listening ? T.stop : T.listen} onClick={onListen} style={{ ...keyStyle, height: 48 }}>
          <Glyph d={listening ? STOP_D : PLAY_D} filled />
        </Key>
      )}
      <span style={{ flex: "1 1 auto" }} />
      {level !== "basic" && (
        <Key size={22} aria-label={T.labels} aria-pressed={labels} onClick={toggleLabels} style={{ ...onKey(labels), height: 48 }}>
          <Glyph d={LABEL_D} />
        </Key>
      )}
      <Key size={22} aria-label={T.sustain} aria-pressed={sustain} onClick={toggleSustain} style={{ ...onKey(sustain), height: 48 }}>
        <Glyph d={PEDAL_D} />
      </Key>
    </div>
  );

  /** The map of a long keyboard: every key, small, with the visible part lit. */
  const map = scrolls(level) && (
    <div
      role="scrollbar"
      aria-label={T.map}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={lay.contentPx > viewW ? Math.round((shown / (lay.contentPx - viewW)) * 100) : 0}
      onPointerDown={onMapDown}
      onPointerMove={onMapMove}
      onPointerUp={onMapEnd}
      onPointerCancel={onMapEnd}
      style={{
        flex: `0 0 ${MAP * 100}%`,
        minHeight: 18,
        position: "relative",
        background: "#0F1428",
        borderRadius: 8,
        overflow: "hidden",
        touchAction: "none",
        cursor: long ? "grab" : "default",
        opacity: long ? 1 : 0.55,
      }}
    >
      {/* children ignore the pointer, so `offsetX` is always measured on the map itself */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 2, display: "flex", gap: 1, pointerEvents: "none" }}>
        {whiteKeys.map((m) => (
          <span
            key={m}
            style={{
              flex: "1 1 0",
              background: m === focus ? HINT_RING : "#D9DCE8",
              borderRadius: 2,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 800,
              lineHeight: 1,
              color: "#1B1E2B",
              overflow: "hidden",
            }}
          >
            {pitchClass(m) === 0 ? String(Math.floor(m / 12) - 1) : ""}
          </span>
        ))}
      </div>
      <div aria-hidden="true" style={{ position: "absolute", inset: 2, pointerEvents: "none" }}>
        {blackKeys.map((m) => (
          <span
            key={m}
            style={{
              position: "absolute",
              top: 0,
              height: "55%",
              left: `${(blackCentre(keys, m) - 0.3) * whiteW}%`,
              width: `${0.6 * whiteW}%`,
              background: m === focus ? HINT_RING : "#1B1E2B",
              borderRadius: 1,
            }}
          />
        ))}
      </div>
      {long && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${(shown / lay.contentPx) * 100}%`,
            width: `${(viewW / lay.contentPx) * 100}%`,
            border: `2px solid ${HINT_RING}`,
            background: "rgba(255,199,48,.22)",
            borderRadius: 6,
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );

  return (
    <GameChrome
      ctx={ctx}
      stats={stats}
      levels={LEVEL_OPTIONS}
      level={level}
      onLevel={chooseLevel}
      levelLabel={LEVEL_LABEL[ctx.locale]}
      onRestart={restart}
      // No `arenaFills`: measured 2026-11-14 at 1536x739, controls UNDER the
      // keyboard put the table's pieces above it too and the page scaled the
      // whole game down. Beside it, in the tray, the keyboard keeps its size.
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 }}>
            {(["free", "songs"] as const).map((m) => (
              <Key key={m} size={17} aria-pressed={mode === m} onClick={() => setMode(m)} style={onKey(mode === m)}>
                {m === "free" ? T.free : T.songs}
              </Key>
            ))}
            {mode === "songs" && (
              <Key size={24} go aria-label={listening ? T.stop : T.listen} onClick={onListen} style={{ ...keyStyle, minWidth: 96 }}>
                <Glyph d={listening ? STOP_D : PLAY_D} filled />
                <span style={{ fontSize: 16, marginInlineStart: 6 }}>{listening ? T.stop : T.listen}</span>
              </Key>
            )}
          </div>
          {mode === "songs" && songPicker({ width: "100%" })}
          <div
            dir="ltr"
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 }}
          >
            <Key size={24} aria-label={T.sustain} aria-pressed={sustain} onClick={toggleSustain} style={onKey(sustain)}>
              <Glyph d={PEDAL_D} />
            </Key>
            {level !== "basic" && (
              <Key size={24} aria-label={T.labels} aria-pressed={labels} onClick={toggleLabels} style={onKey(labels)}>
                <Glyph d={LABEL_D} />
              </Key>
            )}
            <Key size={24} aria-label={T.big} onClick={enterBig} style={keyStyle}>
              <Glyph d={BIG_D} />
            </Key>
          </div>
        </div>
      }
    >
      <div
        className={BOARD_CLASS}
        style={{
          // One box per device, on every level: a phone keyboard is 1.45 wide
          // per unit of height, a PC one 2.4. More keys never make the game
          // taller - `assert:difficulty` holds that. The box stays in the page
          // while the keyboard is full screen, so nothing under it moves.
          ...boardVars({ vw: 94, vh: 66, cap: 620, chrome: 111, ratio: pc ? 2.4 : 1.45 }),
          aspectRatio: pc ? "2.4 / 1" : "1.45 / 1",
          position: "relative",
        }}
      >
        <div
          ref={layerRef}
          style={
            big
              ? {
                  position: "fixed",
                  inset: 0,
                  zIndex: 2147483000,
                  background: "#0F1428",
                  overflow: "hidden",
                  touchAction: "none",
                }
              : { position: "absolute", inset: 0 }
          }
        >
          <div
            style={
              big && turned
                ? {
                    // Drawn sideways: a box the window's height wide and its
                    // width tall, turned a quarter about its top-left corner
                    // and slid back into view. Hit testing follows the
                    // transform, so a key is still the key under the finger.
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100vh",
                    height: "100vw",
                    transformOrigin: "top left",
                    transform: "rotate(90deg) translateY(-100%)",
                    display: "flex",
                    flexDirection: "column",
                    padding: "max(10px, env(safe-area-inset-top)) 10px 10px",
                    boxSizing: "border-box",
                  }
                : big
                  ? {
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      padding:
                        "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))",
                      boxSizing: "border-box",
                    }
                  : { width: "100%", height: "100%", display: "flex", flexDirection: "column" }
            }
          >
            {big && bigBar}
            <div
              ref={boardRef}
              className="ellaz-play-surface"
              // LTR, always: low notes on the left is how every piano is built,
              // and an RTL row would put middle C on the visual right in Hebrew
              // (rtl-spatial-grid-dir-ltr.md).
              dir="ltr"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onLostPointerCapture={onPointerEnd}
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                position: "relative",
                background: CASE,
                borderRadius: 16,
                padding: 6,
                boxSizing: "border-box",
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                aria-live="polite"
                style={{
                  flex: `0 0 ${(scrolls(level) ? STRIP_WITH_MAP : STRIP) * 100}%`,
                  minHeight: 0,
                  background: CASE_STRIP,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 10px",
                  overflow: "hidden",
                  fontFamily: "Fredoka, inherit",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                {strip}
              </div>
              {map}
              <div ref={viewRef} style={{ position: "relative", flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    // A long keyboard is wider than its window and slides
                    // under it; a short one is exactly the window.
                    width: long ? `${lay.contentPx}px` : "100%",
                    transform: long ? `translateX(${-shown}px)` : "none",
                    transition: grab.current ? "none" : "transform .18s ease-out",
                  }}
                >
                  {whiteKeys.map((m, i) => {
                    const down = lit(m);
                    const target = want === m;
                    const letter = showLetters ? keyForMidi(m, keys, base) : undefined;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-midi={m}
                        aria-label={`${nameOf(m)}${Math.floor(m / 12) - 1}`}
                        onClick={(e) => {
                          // A keyboard user's Enter or Space (detail 0); a
                          // pointer already played the key on pointerdown.
                          if (e.detail === 0) strike(m);
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: `calc(${i * whiteW}% + 1px)`,
                          width: `calc(${whiteW}% - 2px)`,
                          padding: 0,
                          border: "none",
                          borderRadius: "0 0 8px 8px",
                          background: down ? IVORY_DOWN : IVORY,
                          boxShadow:
                            target && hint === "glow"
                              ? `inset 0 0 0 4px ${HINT_RING}, 0 0 14px ${HINT_RING}`
                              : down
                                ? "inset 0 3px 6px rgba(0,0,0,.25)"
                                : "inset 0 -5px 0 rgba(0,0,0,.12)",
                          transform: down ? "translateY(2px)" : "none",
                          transition: "background .06s, transform .06s",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: 4,
                          paddingBottom: 8,
                          cursor: "pointer",
                          touchAction: "none",
                          overflow: "hidden",
                        }}
                      >
                        {coloured && (
                          <span
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              insetInline: 0,
                              bottom: 0,
                              height: "36%",
                              background: NOTE_COLORS[pitchClass(m)],
                              opacity: down ? 1 : 0.85,
                            }}
                          />
                        )}
                        {target && hint === "dot" && (
                          <span
                            aria-hidden="true"
                            style={{ width: 12, height: 12, borderRadius: 99, background: HINT_RING, position: "relative" }}
                          />
                        )}
                        {showNames && (
                          <span
                            aria-hidden="true"
                            style={{
                              position: "relative",
                              fontWeight: 800,
                              fontSize: keyPx >= 40 ? 15 : 12,
                              color: "#1B1E2B",
                              lineHeight: 1,
                            }}
                          >
                            {nameOf(m)}
                            {/* the octave, on every C, so a long keyboard says where it is */}
                            {pitchClass(m) === 0 && scrolls(level) ? (
                              <sub style={{ fontSize: "0.7em" }}>{Math.floor(m / 12) - 1}</sub>
                            ) : null}
                          </span>
                        )}
                        {letter && (
                          <span aria-hidden="true" style={{ position: "relative", fontSize: 11, color: "#5b6172", lineHeight: 1 }}>
                            {letter}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {hasBlacks(level) &&
                    blackKeys.map((m) => {
                      const down = lit(m);
                      const target = want === m;
                      const centre = blackCentre(keys, m);
                      const letter = showLetters ? keyForMidi(m, keys, base) : undefined;
                      return (
                        <button
                          key={m}
                          type="button"
                          data-midi={m}
                          aria-label={`${nameOf(m)}${Math.floor(m / 12) - 1}`}
                          onClick={(e) => {
                            if (e.detail === 0) strike(m);
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            // Physical `left`, on purpose: the row is pinned LTR above.
                            left: `${(centre - 0.31) * whiteW}%`,
                            width: `${whiteW * 0.62}%`,
                            height: "60%",
                            padding: 0,
                            border: "none",
                            borderRadius: "0 0 6px 6px",
                            background: down ? EBONY_DOWN : EBONY,
                            boxShadow:
                              target && hint === "glow"
                                ? `0 0 0 3px ${HINT_RING}, 0 0 12px ${HINT_RING}`
                                : "inset 0 -4px 0 rgba(255,255,255,.12), 0 2px 3px rgba(0,0,0,.4)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: 3,
                            paddingBottom: 6,
                            cursor: "pointer",
                            touchAction: "none",
                            zIndex: 1,
                          }}
                        >
                          {target && hint === "dot" && (
                            <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 99, background: HINT_RING }} />
                          )}
                          {labels && keyPx >= 34 && (
                            <span aria-hidden="true" style={{ fontSize: 9, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                              {nameOf(m)}
                            </span>
                          )}
                          {letter && (
                            <span aria-hidden="true" style={{ fontSize: 10, color: "#aab0c4", lineHeight: 1 }}>
                              {letter}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameChrome>
  );
}
