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
  SONGS,
  TIER,
  blackCentre,
  blacks,
  canShift,
  clampStart,
  hasBlacks,
  isMode,
  isSongId,
  keyForMidi,
  keysFor,
  midiForKey,
  newFollow,
  pitchClass,
  press,
  pushTrail,
  shiftStart,
  songById,
  spanFor,
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
// W E T Y U ... for the black), and in pro Z and X slide the keyboard an octave.
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
    down: string;
    up: string;
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
    down: "אוקטבה למטה",
    up: "אוקטבה למעלה",
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
    down: "Octave down",
    up: "Octave up",
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
    down: "Bajar una octava",
    up: "Subir una octava",
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
    down: "En oktav ner",
    up: "En oktav upp",
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
const DOWN_D = "M15 5l-7 7 7 7";
const UP_D = "M9 5l7 7-7 7";
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

function readStart(ctx: GameContext): number {
  const v = ctx.storage.get<unknown>(START_KEY, null);
  return typeof v === "number" && Number.isFinite(v) ? v : MIDDLE_C;
}

/* ----------------------------------------------------------------- the game */

export function Piano({ ctx }: { ctx: GameContext }) {
  const [level, setLevel] = useRememberedLevel(ctx, LEVELS, "basic");
  // Read ONCE at mount: a PC run gets the two-octave pro keyboard and the PC
  // board shape; a window resized mid-run keeps the keyboard it started with.
  const [pc] = useState(isPcArena);
  const [mode, setModeState] = useState<Mode>(() => readMode(ctx));
  const [songId, setSongId] = useState<SongId>(() => readSong(ctx));
  const [follow, setFollow] = useState<Follow>(() => newFollow(readSong(ctx)));
  const [start, setStart] = useState<number>(() => clampStart(readStart(ctx), spanFor("pro", pc)));
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

  const T = WORDS[ctx.locale];
  const names = NOTE_NAMES[ctx.locale];

  // A song always starts the keyboard at middle C, so every song is on screen.
  const windowStart = mode === "songs" ? MIDDLE_C : start;
  const keys = useMemo(() => keysFor(level, pc, windowStart), [level, pc, windowStart]);
  const whiteKeys = useMemo(() => whites(keys), [keys]);
  const blackKeys = useMemo(() => blacks(keys), [keys]);

  /* --------------------------------------------- refs the handlers read */

  const boardRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(follow);
  followRef.current = follow;
  const live = useRef({ mode, level, keys, sustain, songId });
  live.current = { mode, level, keys, sustain, songId };
  const demoTimers = useRef<number[]>([]);
  const startedRef = useRef(false);

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

  /* ------------------------------------------------ the computer keyboard */

  const shiftBy = useCallback(
    (octaves: number) => {
      setStart((s) => {
        const next = shiftStart(s, octaves, spanFor("pro", pc));
        ctx.storage.set(START_KEY, next);
        return next;
      });
    },
    [ctx, pc],
  );

  useEffect(() => {
    const down = new Map<string, number>();
    const onDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      const { level: lv, mode: m, keys: ks } = live.current;
      if (canShift(lv) && m === "free" && (k === "z" || k === "x")) {
        e.preventDefault();
        if (!e.repeat) shiftBy(k === "z" ? -1 : 1);
        return;
      }
      const midi = midiForKey(k, ks);
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

  /** Start the current song again from its first note. */
  const freshSong = useCallback(
    (id: SongId) => {
      const f = newFollow(id);
      followRef.current = f;
      setFollow(f);
    },
    [],
  );

  const chooseLevel = useCallback(
    (next: Level) => {
      stopDemo();
      setLevel(next);
      freshSong(live.current.songId);
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
  // keyboard drawn sideways rather than squeezed.
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
  const want = mode === "songs" ? wanted(follow) : undefined;
  const hint = HINT[level];
  const done = mode === "songs" && want === undefined;
  // Basic always names its keys; advanced and pro follow the names switch.
  const showNames = level === "basic" || labels;
  const coloured = level === "basic";

  const nameOf = (m: number) => names[pitchClass(m)];
  const whiteW = 100 / whiteKeys.length;

  const stats =
    mode === "songs"
      ? [{ icon: "layers" as const, label: T.notes, value: `${follow.at}/${song.notes.length}`, ltr: true, compact: true }]
      : [{ icon: "layers" as const, label: T.keys, value: keys.length, compact: true }];

  // Every footer key is the same 56px tall, in ONE row, on every level and in
  // both modes - so changing the level never changes the game's height.
  const keyStyle: CSSProperties = { minWidth: 56, height: 56, fontSize: 24, padding: "0 12px" };
  const onKey = (on: boolean): CSSProperties =>
    on ? { ...keyStyle, outline: "3px solid var(--brand)", outlineOffset: -3 } : keyStyle;

  const strip = (() => {
    if (mode === "songs") {
      if (done) return <span style={{ fontWeight: 800, color: "#fff" }}>{T.done}</span>;
      const next = upcoming(follow, pc ? 10 : 6);
      return (
        <div dir="ltr" style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden", width: "100%" }}>
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
      <div dir="ltr" style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden" }}>
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
   * width whatever the titles' lengths in any language.
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
      {SONGS.map((sg) => (
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
      {mode === "songs" && songPicker({ flex: "0 1 260px", minWidth: 0 })}
      {mode === "songs" && (
        <Key size={22} go aria-label={listening ? T.stop : T.listen} onClick={onListen} style={{ ...keyStyle, height: 48 }}>
          <Glyph d={listening ? STOP_D : PLAY_D} filled />
        </Key>
      )}
      {canShift(level) && mode === "free" && (
        <>
          <Key size={22} act aria-label={T.down} onClick={() => shiftBy(-1)} style={{ ...keyStyle, height: 48 }}>
            <Glyph d={DOWN_D} />
          </Key>
          <span style={{ minWidth: 40, textAlign: "center", fontWeight: 800, color: "#fff" }}>{`C${Math.floor(start / 12) - 1}`}</span>
          <Key size={22} act aria-label={T.up} onClick={() => shiftBy(1)} style={{ ...keyStyle, height: 48 }}>
            <Glyph d={UP_D} />
          </Key>
        </>
      )}
      <span style={{ flex: "1 1 auto" }} />
      <Key size={22} aria-label={T.sustain} aria-pressed={sustain} onClick={toggleSustain} style={{ ...onKey(sustain), height: 48 }}>
        <Glyph d={PEDAL_D} />
      </Key>
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
            {canShift(level) && mode === "free" && (
              <>
                <Key size={24} act aria-label={T.down} onClick={() => shiftBy(-1)} style={keyStyle}>
                  <Glyph d={DOWN_D} />
                </Key>
                <span dir="ltr" style={{ minWidth: 40, textAlign: "center", fontWeight: 800, color: "var(--text)" }}>
                  {`C${Math.floor(start / 12) - 1}`}
                </span>
                <Key size={24} act aria-label={T.up} onClick={() => shiftBy(1)} style={keyStyle}>
                  <Glyph d={UP_D} />
                </Key>
              </>
            )}
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
          // per unit of height, a PC one 2.4. More keys make each key narrower,
          // never the game taller - `assert:difficulty` holds that. The box
          // stays in the page while the keyboard is full screen, so nothing
          // under it moves.
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
                // Drawn sideways: a box the window's height wide and its width
                // tall, turned a quarter about its top-left corner and slid
                // back into view. Hit testing follows the transform, so a key
                // is still the key under the finger.
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
        // LTR, always: low notes on the left is how every piano is built, and
        // an RTL row would put middle C on the visual right in Hebrew
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
            flex: `0 0 ${STRIP * 100}%`,
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
        <div style={{ position: "relative", flex: "1 1 auto", minHeight: 0, display: "flex", gap: 2 }}>
          {whiteKeys.map((m) => {
            const down = lit(m);
            const target = want === m;
            const letter = pc && labels ? keyForMidi(m, keys) : undefined;
            return (
              <button
                key={m}
                type="button"
                data-midi={m}
                aria-label={nameOf(m)}
                onClick={(e) => {
                  // A keyboard user's Enter or Space (detail 0); a pointer
                  // already played the key on pointerdown.
                  if (e.detail === 0) strike(m);
                }}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
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
                  position: "relative",
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
                      fontSize: whiteKeys.length > 10 ? 12 : 15,
                      color: "#1B1E2B",
                      lineHeight: 1,
                    }}
                  >
                    {nameOf(m)}
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
              const letter = pc && labels ? keyForMidi(m, keys) : undefined;
              return (
                <button
                  key={m}
                  type="button"
                  data-midi={m}
                  aria-label={nameOf(m)}
                  onClick={(e) => {
                    if (e.detail === 0) strike(m);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    // Physical `left`, on purpose: the row is pinned LTR above.
                    left: `calc(${centre * whiteW}% - ${whiteW * 0.31}%)`,
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
                  {showNames && level === "pro" && (
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
    </GameChrome>
  );
}
