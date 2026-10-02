import { textFor } from "@i18n/index";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
// The ARCADE chrome, because this game declares `tier: "showcase"` - the band
// the operator picked when asked who gets dedicated game controls. The shared
// `GameChrome` is what the other 42 wear; `arcade-chrome-is-tier-not-id.test.ts`
// pins that this correspondence is the BAND's and never this game's name.
import { ArcadeChrome } from "@ui/ArcadeChrome";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import { shake } from "@juice/index";
import { SLOTS_MAX } from "./arsenal";
import { DASH_MS } from "./powers";
import { WEAPON_ART, WEAPON_INK_CSS } from "./weaponArt";
// NO `DirectionPad` HERE, and that is the point of this game's control.
// `CLAUDE.md` used to say every game ships the four-arrow pad and never the
// stick alone; the operator ruled on 2026-09-13 that the steering moves ONTO the
// arena for showcase-tier games, and the law was amended in the same change
// rather than quietly broken. The pad still ships in `maze`, the one kids-band
// game that imports it, which is exactly the band the amended law still binds.
import type { DifficultyOption } from "@ui/DifficultySelector";
// The MODULE, not the `@shared/index` barrel - the same call snake makes, and for
// the same reason: pulling the barrel in for one hook drags the rest along.
import { useRememberedLevel } from "@shared/useRememberedLevel";
// The MODULE, for the same reason as the line above.
import { measureBoxUnscaled, type ScaleManagerLike } from "@shared/phaserBox";
// TYPE-ONLY, and that is load-bearing. Importing one VALUE from the scene makes
// the static import real, and Rollup then refuses to move it behind the dynamic
// `import()` below - un-deferring the whole engine while every comment here still
// claims it is lazy. `logic.ts` is a different matter: it is pure, pulls nothing,
// and the arena's size is needed to shape the box before Phaser exists.
import type { SurvivorsScene, SurvivorsStatus } from "./SurvivorsScene";
import type { LevelKey, UpgradeId, WeaponId } from "./logic";
import { ARENA, ARENA_WIDE, RUN_MS, UPGRADE_IDS, type Arena,
} from "./logic";
import { phoneArena, phoneBox } from "./phoneArena";
// THE CAREER (P3, 2026-09-29): everything the career draws lives in its own
// file; this component only opens it, from the title's Career pill.
import { CareerLayer } from "./CareerLayer";
// THE TITLE CARD (2026-09-30, one screen since 2026-10-01): key art, the
// difficulty, a big PLAY that starts a quick run on the last-used weapon, and
// two pills - the weapon pick and the Career map. The game-over card wears the
// same style.
import { CROWN, NEON_INKS, neonArt, neonLines } from "./entrance/NeonTitle";
import { neonView, readWeapon, rememberWeapon, type NeonMode } from "./entrance/quickStart";
import { balancedLines, titleLines } from "@ui/ArcadeTitle";
// THE WEAPON PICK and THE SUPER POWER CARD (operator ruling 2026-09-30, "like
// Survivor.io"): a run starts on one MAIN weapon picked from the whole
// collection, and a weapon's evolution arrives as a gold card of its own.
import { WeaponPick } from "./entrance/WeaponPick";
import { SuperCard } from "./entrance/SuperCard";
import { LevelCards } from "./LevelCards";
import { cardWords } from "./cardWords";
import { weaponWords } from "./entrance/weaponWords";
import { weaponsOpenIn } from "./weaponPool";
import type { CareerStore } from "../../shared/career/save";
import { notifyRunStart } from "@ui/gameTools";
import { neonCareerWords } from "./careerWords";
import type { CareerResult } from "./types";

// The second Phaser game in the roster, wearing the same chrome as the other
// forty-two. React owns the bar and the upgrade cards; Phaser owns the arena.
//
// The cards are DOM rather than canvas text on purpose: they are the one thing in
// this game a player must TAP, and a rectangle drawn inside a canvas cannot be
// reached by a keyboard or a screen reader.

const LEVEL_OPTIONS: DifficultyOption<LevelKey>[] = [
  { id: "calm", label: { he: "רגוע", en: "Calm", es: "Tranquilo", sv: "Lugn" } },
  { id: "normal", label: { he: "רגיל", en: "Normal", es: "Normal", sv: "Normal" } },
  { id: "wild", label: { he: "פראי", en: "Wild", es: "Salvaje", sv: "Vild" } },
];

// `STICK_KEY` ("stickStyle") LIVED HERE and is gone, along with the setting it
// remembered. The operator removed the choice on 2026-09-22 - *"Lets remove the
// joystick/on screen buttons and just do the on screen"* - so there is one stick
// and it is born under the thumb.
//
// The stored value is deliberately NOT migrated or cleared. A key nothing reads
// costs a player nothing, and a one-off cleanup pass is code that runs on every
// mount for ever to tidy something invisible. If the choice ever comes back, the
// key is still there and still means what it meant.

/** The dash chip's drawing: two chevrons, in ice. */
const DASH_ART = (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#22e7ff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l6 6-6 6" />
    <path d="M12 6l6 6-6 6" />
  </svg>
);

/** The freeze button's drawing: a six-armed snowflake. */
const FREEZE_ART = (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    {[0, 60, 120].map((d) => (
      <g key={d} transform={`rotate(${d} 12 12)`}>
        <path d="M12 2v20" />
        <path d="M9 5l3 2.5L15 5" />
        <path d="M9 19l3-2.5 3 2.5" />
      </g>
    ))}
  </svg>
);

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function SurvivorsGame({ ctx }: { ctx: GameContext }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Typed as the half the chrome actually calls, rather than the whole scene.
  const sceneRef = useRef<Pick<
    SurvivorsScene,
    | "setLevel" | "setPaused" | "restartFromChrome" | "startFromChrome" | "choose"
    | "setStartWeapon" | "freezeFromChrome" | "startCareer" | "leaveCareer" | "reroll"
  > | null>(null);

  /**
   * WHICH SCREEN THIS IS RIGHT NOW: the title, the weapon pick, a quick run, or
   * the career. The game opens on the TITLE (operator, 2026-09-30: *"we have to
   * have 1 enter game screen"*), and since 2026-10-01 the title is the ONE
   * screen: its PLAY starts a quick run on the last-used weapon, its weapon pill
   * opens the pick, its Career pill opens the map. The Career / Quick run cards
   * screen that sat between them is gone.
   */
  const [mode, setMode] = useState<NeonMode>("title");
  /** The scene tells the career when a level ends; the career decides what that pays. */
  const careerEndRef = useRef<((r: CareerResult, token: string) => void) | null>(null);

  const [level, setLevel] = useRememberedLevel(
    ctx,
    LEVEL_OPTIONS.map((o) => o.id),
    "normal",
  );
  const levelRef = useRef(level);
  levelRef.current = level;

  // The career save as the kit's store, read for which weapons are open: two of
  // the five open only once a career world is won (weaponPool.ts).
  const careerStore = useMemo<CareerStore>(
    () => ({ get: (key) => ctx.storage.get<unknown>(key, null), set: (key, value) => ctx.storage.set(key, value) }),
    [ctx],
  );
  // The MAIN weapon the next run starts with - the LAST-USED one, remembered on
  // this device and validated on the way in: anything this save may not pick
  // (locked, unknown, not ours) reads as the first weapon it owns (quickStart.ts).
  const [startWeapon, setStartWeapon] = useState<WeaponId>(() => readWeapon(ctx.storage, weaponsOpenIn(careerStore)));
  const startRef = useRef(startWeapon);
  startRef.current = startWeapon;
  /** Pick a main weapon: remembered, and handed to the scene before the run it starts. */
  const chooseWeapon = (id: WeaponId) => {
    setStartWeapon(id);
    // From the handler, never a state updater - the house rule.
    rememberWeapon(ctx.storage, id);
    sceneRef.current?.setStartWeapon(id);
  };
  // PLAY pressed before Phaser finished loading: the run starts the moment the
  // scene is ready, rather than dropping the press.
  const pendingPlay = useRef(false);
  /** A quick run on this weapon - the title's PLAY, the pick's PLAY, and PLAY AGAIN. */
  const startQuick = (id: WeaponId) => {
    chooseWeapon(id);
    setMode("quick");
    if (sceneRef.current) sceneRef.current.startFromChrome();
    else pendingPlay.current = true;
  };

  const [status, setStatus] = useState<SurvivorsStatus>({
    score: 0,
    timeLeft: RUN_MS,
    // A run opens on stage 1, so a HUD drawn before the scene has published
    // anything says the same thing the first frame will.
    stage: 1,
    // The run starts carrying the chosen weapon, so a HUD drawn before the scene
    // has published anything shows the same slot the first shot will use.
    slots: [startWeapon],
    dash: 1,
    charge: 0,
    frozen: false,
    hp: 3,
    maxHp: 3,
    power: 1,
    xp: 0,
    need: 4,
    level,
    phase: "ready",
    paused: false,
    offer: [],
    rerolls: 0,
    boss: null,
    // Built from the id list rather than typed out, so an eighth upgrade cannot
    // leave a hole here that only shows up as an empty pip row on one card.
    taken: Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as Record<UpgradeId, number>,
    gold: null,
  });
  const best = ctx.score?.best(status.level) ?? 0;

  /**
   * PORTRAIT ON A PHONE, LANDSCAPE ON A PC - decided once, at mount.
   *
   * WHY THIS IS JAVASCRIPT AND NOT A MEDIA QUERY, given that the board's SIZE is
   * pure CSS: a media query can change how big a box is drawn, and cannot change
   * how many units of floor the simulation has. The arena's shape is a rule of
   * the game - it decides where enemies enter, where the ship may stand and what
   * the player can see - so it has to be a value the simulation is handed.
   *
   * 900px IS NOT A NUMBER CHOSEN HERE. It is the breakpoint `.ellaz-board`'s own
   * desktop branch uses in `global.css`, quoted rather than re-decided: two
   * numbers would be two answers, and a window between them would size the box
   * from one shape and play on the other.
   *
   * READ ONCE, and the consequence is stated rather than hidden. Dragging a
   * window across 900px mid-session does NOT reshape a run - the canvas is sized
   * from this at boot and a live run would otherwise change its rules underneath
   * the player. The inline `aspectRatio` below comes from this same value, so
   * the box and the simulation can never disagree about the shape; the only cost
   * is that a resized window keeps the arena it opened with until the next
   * mount. Re-shaping on the fly would mean restarting the run, which is a worse
   * answer to a rarer problem.
   */
  // The read itself lives in `@ui/boardSize` since 2026-09-14, when a second
  // game needed the same answer - one breakpoint, one function.
  // A phone game page takes the TALL arena: the same floor, shaped to the box
  // under the one 52px bar (operator ruling 2026-09-14, `phoneArena.ts`).
  // `phoneBox` answers null anywhere that bar is not, so a PC, the standalone
  // bundle and an embed keep exactly the arena they had.
  const [arena] = useState<Arena>(() => {
    if (isPcArena()) return ARENA_WIDE;
    if (typeof window === "undefined") return ARENA;
    const box = phoneBox();
    return box ? phoneArena(box.w, box.h) : ARENA;
  });

  /**
   * THE STAGE BANNER. Without it a player has no way to know a run is three
   * stages: the clock reads the same, the crowd looks the same, and the only
   * tell is a boss that did not end the run - which reads as the game being
   * broken rather than as a stage having been cleared.
   *
   * Driven off `status.stage` CHANGING rather than off the `stage` event,
   * because the chrome never sees events - the scene turns them into sounds and
   * publishes state. One record of which stage it is, read by both.
   *
   * A ref for the previous value rather than a second piece of state: comparing
   * against state would re-run this on every publish, sixty times a second.
   */
  const [banner, setBanner] = useState(0);
  const lastStage = useRef(status.stage);
  useEffect(() => {
    if (status.stage === lastStage.current) return;
    lastStage.current = status.stage;
    setBanner(status.stage);
    const t = window.setTimeout(() => setBanner(0), 1800);
    return () => window.clearTimeout(t);
  }, [status.stage]);

  useEffect(() => {
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    ctx.lifecycle.loadingStart();
    void (async () => {
      const [{ default: Phaser }, { SurvivorsScene: Scene }] = await Promise.all([
        import("phaser"),
        import("./SurvivorsScene"),
      ]);
      // The component may have unmounted while the engine was downloading. On a
      // cold cache that is seconds, not milliseconds.
      if (cancelled) return;
      const g = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: arena.w,
        height: arena.h,
        backgroundColor: "#0b0d1f",
        // NO_CENTER, and the host below centres with CSS instead. `updateCenter`
        // compares the canvas's RENDERED rect against `parentSize`, and
        // `measureBoxUnscaled` deliberately puts those two in different units -
        // so left on, it would write a margin of half the frame's scale and push
        // the arena off its own box. See `@shared/phaserBox`.
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
        // So a bug report from this game can carry a picture of the arena. WebGL
        // discards the drawing buffer after presenting, so a read-back from
        // outside Phaser returns a well-formed black square instead of failing.
        render: { preserveDrawingBuffer: true },
        scene: Scene,
      });
      game = g;
      // The canvas follows the box's LAYOUT size, not its rendered one. Without
      // this the arena is drawn at the frame's scale INSIDE a box already drawn
      // at that scale, and the HUD - which is DOM, so it is laid out - is left
      // standing around a smaller picture. It costs nothing while the frame is
      // unscaled, which is every moment before a run ends.
      measureBoxUnscaled(g.scale as unknown as ScaleManagerLike, host);
      g.scene.start("survivors", {
        ctx,
        // The scene sizes its floor from this. Passed rather than imported by
        // the scene, because only this component knows how big the screen is.
        arena,
        onStatus: (s: SurvivorsStatus) => {
          if (!cancelled) setStatus(s);
        },
        onCareerEnd: (r: CareerResult, token: string) => {
          if (!cancelled) careerEndRef.current?.(r, token);
        },
        onReady: (scene: SurvivorsScene) => {
          if (cancelled) return;
          sceneRef.current = scene;
          // The remembered starting weapon, before the level: both only reshape
          // a run that has not started, so the order changes nothing a player sees.
          scene.setStartWeapon(startRef.current);
          // The remembered level, applied the moment the scene exists. Read
          // through a REF: this effect depends on `[ctx]` alone, and closing over
          // `level` would either go stale or reboot Phaser on every change.
          scene.setLevel(levelRef.current);
          if (pendingPlay.current) {
            pendingPlay.current = false;
            scene.startFromChrome();
          }
        },
      });
      ctx.lifecycle.loadingFinished();
    })();

    return () => {
      cancelled = true;
      sceneRef.current = null;
      game?.destroy(true);
    };
    // `arena` comes from a `useState` that is never set, so it is referentially
    // stable for the life of the mount: listing it is correctness, and it can
    // never reboot Phaser.
  }, [ctx, arena]);

  // This game's own words. A locale RECORD, so promoting a language reds this
  // block by name instead of leaving the game speaking English inside a page
  // that is not.
  const T = textFor(
    {
      he: {
        golem: "גולם",
        warden: "שומר",
        queen: "מלכה",
        stage: "שלב",
        hint: "גררו, חצים או כפתורים - היריות לבד",
        // The entrance screen's words. `title` is a SECOND copy of the name the
        // page's own h1 carries, and that is a real duplication - the renderer
        // cannot reach `meta.ts` without making the game's meta a static import
        // of the chunk. Written down rather than hidden: if the game is renamed,
        // both move.
        title: "הישרדות ניאון",
        play: "שחקו",
        playAgain: "שחקו שוב",
        lost: "נגמרו הלבבות",
        wonHead: "ניצחתם!",
        beat: "הגולם נפל!",
        pick: "עלייה לדרגה",
        score: "צורות",
        time: "נשאר",
        hearts: "לבבות",
        pickWeapon: "בחרו נשק",
        newWeapon: "נשק חדש",
        dash: "זינוק",
        dashReady: "זינוק מוכן",
        freeze: "הקפאה",
      },
      en: {
        golem: "Golem",
        warden: "Warden",
        queen: "Queen",
        stage: "Stage",
        hint: "Drag, arrows or buttons - it shoots by itself",
        title: "Neon Survival",
        play: "Play",
        playAgain: "Play again",
        lost: "Out of hearts",
        wonHead: "You win!",
        beat: "The golem is down!",
        pick: "Level up",
        score: "Shapes",
        time: "Left",
        hearts: "Hearts",
        pickWeapon: "Pick your weapon",
        newWeapon: "New weapon",
        dash: "Dash",
        dashReady: "Dash ready",
        freeze: "Freeze",
      },
      es: {
        golem: "Gólem",
        warden: "Guardián",
        queen: "Reina",
        stage: "Fase",
        hint: "Arrastra, flechas o botones - dispara solo",
        title: "Supervivencia Neón",
        play: "Jugar",
        playAgain: "Jugar otra vez",
        lost: "Sin corazones",
        wonHead: "¡Has ganado!",
        beat: "¡El gólem ha caído!",
        pick: "Subes de nivel",
        score: "Formas",
        time: "Queda",
        hearts: "Corazones",
        pickWeapon: "Elige tu arma",
        newWeapon: "Arma nueva",
        dash: "Salto",
        dashReady: "Salto listo",
        freeze: "Congelar",
      },
      sv: {
        golem: "Golem",
        warden: "Väktare",
        queen: "Drottning",
        stage: "Fas",
        hint: "Dra, pilar eller knappar - skjuter själv",
        title: "Neonöverlevnad",
        play: "Spela",
        playAgain: "Spela igen",
        lost: "Inga hjärtan kvar",
        wonHead: "Du vann!",
        beat: "Golemen föll!",
        pick: "Du går upp i nivå",
        score: "Former",
        time: "Kvar",
        hearts: "Hjärtan",
        pickWeapon: "Välj ditt vapen",
        newWeapon: "Nytt vapen",
        dash: "Rusning",
        dashReady: "Rusning klar",
        freeze: "Frys",
      },
    },
    ctx.locale,
  );

  const CW = cardWords(ctx.locale);
  const UP = textFor(
    {
      he: {
        rapid: "יריות מהירות יותר",
        power: "יריות חזקות יותר",
        spread: "עוד יריה בכל פעם",
        swift: "תנועה מהירה יותר",
        magnet: "אוספים יהלומים מרחוק",
        heart: "לב נוסף",
        pierce: "היריות עוברות דרך",
        shield: "מגן שחוזר",
        range: "רואים רחוק יותר",
      },
      en: {
        rapid: "Faster shots",
        power: "Stronger shots",
        spread: "One more bolt",
        swift: "Quicker feet",
        magnet: "Longer gem reach",
        heart: "One more heart",
        pierce: "Shots pass through",
        shield: "A shield that comes back",
        range: "The gun sees further",
      },
      es: {
        rapid: "Disparos más rápidos",
        power: "Disparos más fuertes",
        spread: "Un disparo más",
        swift: "Pies más rápidos",
        magnet: "Más alcance de gemas",
        heart: "Un corazón más",
        pierce: "Los disparos atraviesan",
        shield: "Un escudo que vuelve",
        range: "El arma ve más lejos",
      },
      sv: {
        rapid: "Snabbare skott",
        power: "Starkare skott",
        spread: "Ett skott till",
        swift: "Snabbare fötter",
        magnet: "Längre räckvidd för ädelstenar",
        heart: "Ett hjärta till",
        pierce: "Skotten går igenom",
        crit: "Slår ibland dubbelt",
        shield: "En sköld som kommer tillbaka",
        range: "Vapnet ser längre",
      },
    },
    ctx.locale,
  );

  // The five weapons' names and one line each, for the pick and the cards.
  const WN = textFor(
    {
      he: {
        bolt: ["קרן", "ישר ומהיר"],
        arc: ["קשת", "מתעקל אחריהם"],
        burst: ["פיצוץ", "טבעת מסביבך"],
        blades: ["להבים", "מסתובבים סביבך"],
        drone: ["רחפן", "יורה לצידך"],
      },
      en: {
        bolt: ["Bolt", "straight and fast"],
        arc: ["Arc", "curves after them"],
        burst: ["Burst", "a ring all around"],
        blades: ["Blades", "spin around you"],
        drone: ["Drone", "shoots beside you"],
      },
      es: {
        bolt: ["Rayo", "recto y rápido"],
        arc: ["Arco", "los persigue en curva"],
        burst: ["Estallido", "un anillo alrededor"],
        blades: ["Cuchillas", "giran a tu alrededor"],
        drone: ["Dron", "dispara a tu lado"],
      },
      sv: {
        bolt: ["Blixt", "rakt och snabbt"],
        arc: ["Båge", "jagar dem i kurva"],
        burst: ["Skur", "en ring runt om"],
        blades: ["Blad", "snurrar runt dig"],
        drone: ["Drönare", "skjuter vid din sida"],
      },
    } satisfies Record<"he" | "en" | "es" | "sv", Record<WeaponId, [string, string]>>,
    ctx.locale,
  );

  const choosing = status.offer.length > 0;
  /**
   * The game-over card is LATCHED: a difficulty tap on it restarts the scene to
   * "ready", and read off the phase alone the card would turn into the title
   * under the finger. Set when a quick run ends, cleared when one starts or the
   * player leaves for the title, the pick or the career.
   */
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    if (status.phase === "playing") setEnded(false);
    else if (mode === "quick" && (status.phase === "won" || status.phase === "over")) setEnded(true);
  }, [status.phase, mode]);
  const go = (next: NeonMode) => {
    setEnded(false);
    setMode(next);
  };
  const view = neonView(mode, status.phase, choosing, ended || (mode === "quick" && (status.phase === "won" || status.phase === "over")));
  const won = status.phase === "won";
  const weaponPill = {
    label: WN[startWeapon][0],
    icon: <span style={{ color: WEAPON_INK_CSS[startWeapon], display: "flex", width: "100%", height: "100%" }}>{WEAPON_ART[startWeapon](22)}</span>,
    onPress: () => go("pick"),
  };

  return (
    <ArcadeChrome
      ctx={ctx}
      // The same four numbers the three grey cards used to carry, drawn ON the
      // arena instead of above it. Two of them change shape rather than value:
      //
      // - HEARTS was `3/3` in a card and is a BAR here, which is the reading a
      //   thumb can take without leaving the fight.
      // - The CLOCK and the GOLEM are no longer one cell that swaps what it
      //   reports. The old card had to choose, because there was one slot; the
      //   arena has room for both, so the clock keeps counting and the golem's
      //   bar simply appears when it arrives.
      //
      // The pips are the one genuinely new reading, and they come from the
      // simulation's own rotation - `weaponAt(shots)` is what decides which
      // weapon fires next, so the HUD reads that rather than keeping a second
      // count that could disagree with it.
      hud={{
        hearts: { now: status.hp, max: status.maxHp },
        score: status.score,
        // The same reading the grey bar's record slot carried - `best` is the
        // stored record and the live score can already have passed it, so the
        // larger of the two is what a player should see.
        // A career level has no record to beat - the quick run's would be a lie there.
        best: status.gold !== null ? undefined : Math.max(best, status.score),
        clock: clock(status.timeLeft),
        // Four slots, the carried weapons first and the rest dashed-empty.
        slots: Array.from({ length: SLOTS_MAX }, (_, i) => {
          const id = status.slots[i];
          return id
            ? { id, art: <span style={{ color: WEAPON_INK_CSS[id], display: "flex" }}>{WEAPON_ART[id](22)}</span> }
            : { id: "empty", art: null };
        }),
        chip: {
          art: DASH_ART,
          ready: status.dash >= 1,
          text:
            status.dash >= 1
              ? T.dashReady
              : `${T.dash} ${Math.ceil(((1 - status.dash) * DASH_MS) / 1000)}s`,
        },
        // NAMED BY THE BOSS THAT IS ACTUALLY THERE. This read `T.golem` while
        // there was one boss, and would have labelled an 80-health warden
        // "Golem" from the day there were three - the same defect as the
        // hardcoded health denominator, in the words instead of the bar.
        boss: status.boss
          ? {
              now: status.boss.hp,
              max: status.boss.maxHp,
              label: status.boss.kind === "warden" ? T.warden : status.boss.kind === "queen" ? T.queen : T.golem,
            }
          : null,
        labels: { hearts: T.hearts, score: T.score },
      }}
      // The freeze: its ring fills with gems and one press stops every shape.
      // Offered only mid-run, and pressable while it charges - it wiggles rather
      // than being `disabled`, which this platform keeps for the impossible.
      power={
        status.phase === "playing" && !choosing
          ? {
              label: T.freeze,
              charge: status.charge,
              ready: status.charge >= 1 && !status.frozen,
              art: FREEZE_ART,
              onUse: (el) => {
                if (status.charge >= 1 && !status.frozen) sceneRef.current?.freezeFromChrome();
                else shake(el, 4, 200);
              },
            }
          : null
      }
      levels={LEVEL_OPTIONS}
      level={status.level}
      // Reachable mid-run. The scene treats it as a fresh run at that level.
      onLevel={(k) => {
        setLevel(k);
        sceneRef.current?.setLevel(k);
      }}
      onRestart={() => sceneRef.current?.restartFromChrome()}
      // Only while the arena is actually moving. On the ready, won and over
      // screens nothing is running, and a cover over any of them hides the one
      // line telling the player how to leave it.
      paused={status.phase === "playing" ? status.paused : undefined}
      onPaused={
        status.phase === "playing" ? (next) => sceneRef.current?.setPaused(next) : undefined
      }
      entrance={
        /*
         * THE THREE ROWS THAT USED TO HANG UNDER THE ARENA, MOVED ONTO IT.
         * The operator, 2026-09-13: *"maybe the buttons instead of being down
         * should be on some kind of load screen or entrance to the game"* -
         * then picked this shape off four rendered over the live game. Since
         * 2026-10-01 it is the TITLE itself (one screen) and, after a quick
         * run, the game-over card in the title's style.
         *
         * `choosing` is folded into `view`: the upgrade picker is its own cover,
         * drawn DURING a live run, and two covers on one arena would stack.
         */
        view === "title"
          ? {
              label: T.title,
              lines: neonLines(titleLines(T.title, ctx.locale)),
              action: T.play,
              onAction: () => startQuick(startWeapon),
              pills: [weaponPill, { label: neonCareerWords(ctx.locale).career, icon: CROWN, onPress: () => go("career") }],
              pillsWide: "flank" as const,
              inks: NEON_INKS,
              bottom: [0.116, 0.035] as [number, number],
              children: neonArt,
            }
          : view === "over"
            ? {
                label: won ? T.wonHead : T.lost,
                lines: neonLines(balancedLines(won ? T.wonHead : T.lost, ctx.locale)),
                result: won ? T.beat : undefined,
                layout: "stack" as const,
                top: [0.16, 0.083] as [number, number],
                nameFs: [72, 56] as [number, number],
                play: { tall: [290, 78] as [number, number], wide: [300, 60] as [number, number] },
                action: T.playAgain,
                again: true,
                onAction: () => startQuick(startWeapon),
                // Back to the weapon pick (the run's main weapon is chosen
                // there, from the whole collection), or to the title.
                pills: [
                  { label: weaponWords(ctx.locale).weapon, back: true, onPress: () => go("pick") },
                  { label: neonCareerWords(ctx.locale).menu, back: true, onPress: () => go("title") },
                ],
                inks: NEON_INKS,
                scrim: "rgba(11, 13, 31, 0.7)",
                children: neonArt,
              }
            : null
      }
    >
      <div
        className={BOARD_CLASS}
        style={{
          position: "relative",
          // The arena is 420 x 560, so its width is three quarters of whatever
          // height the desktop branch hands it.
          //
          // chrome 183, MEASURED 2026-09-13 on the built artifact with the
          // arcade HUD in place, and it replaces 292 - which was measured the
          // same day against the shared grey bar. The HUD moved the three stat
          // cards ONTO the arena, so 109px of rows stopped existing; the board
          // went on reserving them and came out 152px wide at 1536x639 where it
          // had room for 234. A constant measured against the layout it is
          // about is correct exactly until that layout changes, which is why
          // the gate asserts this number against the rendered one rather than
          // trusting it - see a-threshold-tuned-against-todays-tree-goes-stale.md.
          // chrome 16, MEASURED by the board gate on the built artifact
          // 2026-09-13, and it replaces 183 - which was itself measured, in the
          // same way, against a panel that still carried a difficulty row, a
          // start strip and a stick row. All three are on the entrance screen
          // now, so the only height left under the board is the panel's own
          // `padding: "8px 0"`.
          //
          // I FIRST WROTE 60 HERE AND THE GATE REFUSED IT. That number came
          // from the mock rather than from a render, and it was wrong by 44px -
          // which the board then reserved and did not use, leaving the frame at
          // 87% of its box against a 90% floor. Worth leaving on the record: a
          // constant inferred from a picture is an estimate wearing a
          // measurement's clothes, and the only reason it cost nothing is that
          // the gate reads the RENDERED gap and refuses a declaration more than
          // 8px from it. That check is this repo's own
          // a-threshold-tuned-against-todays-tree-goes-stale.md, doing its job.
          //
          // `capPc: 1664` IS THE LANDSCAPE ARENA'S OTHER HALF, and without it
          // the ruling makes the game WORSE rather than better. The default
          // ceiling is `PANEL_USABLE` (684), which is the 700px reading-width
          // panel every other game lives in. A landscape board pinned at 684
          // measures 684 x 384 = 263k sq px at 1920x1080, against today's
          // portrait 565 x 753 = 425k - so capping it would have shipped a
          // 38% SMALLER game under the name of a bigger one. 1664 is the
          // showcase panel's own arithmetic (1680 - 8px of padding each side),
          // and 1680 is MEASURED: I first wrote 1440 here, derived from the
          // 1536x639 arm alone, and the board gate refused it - at 1920x1080
          // the ceiling bound before the window did and the frame filled 85%
          // against a 90% floor. A ceiling that decides the size is not a
          // ceiling. Written as a literal because
          // `game-panel-clears-widest-board.test.ts`
          // reads this field with a regex that can only see digits - a named
          // constant here would make the ceiling invisible to the one gate that
          // checks it, which is this repo's own
          // a-diagnostic-that-truncates-what-it-compares.md.
          ...boardVars({
            vw: 92,
            vh: 58,
            cap: 420,
            chrome: 16,
            ratio: arena.w / arena.h,
            capPc: 1664,
          }),
        }}
      >
        <div
          ref={hostRef}
          style={{
            width: "100%",
            // The SAME value the simulation was handed, so the drawn box and the
            // floor being played on cannot disagree about their shape.
            aspectRatio: `${arena.w} / ${arena.h}`,
            borderRadius: 14,
            overflow: "hidden",
            // Phaser's own `autoCenter` is off (see the config above), so the
            // centring happens here. This box carries the arena's aspect ratio,
            // so FIT fills it exactly and there is nothing to centre today - it
            // is here for the day the two stop matching.
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // The arena owns the gesture: no scroll, no pinch under a finger
            // that is mid-drag.
            touchAction: "none",
          }}
        />
        {mode === "pick" && (
          <WeaponPick
            locale={ctx.locale}
            weapon={startWeapon}
            open={weaponsOpenIn(careerStore)}
            names={WN}
            upgrades={UP}
            levels={{
              options: LEVEL_OPTIONS,
              value: status.level,
              onChange: (k) => {
                setLevel(k);
                sceneRef.current?.setLevel(k);
              },
            }}
            onPick={chooseWeapon}
            onPlay={(id) => {
              notifyRunStart();
              startQuick(id);
            }}
            onBack={() => go("title")}
            backLabel={neonCareerWords(ctx.locale).back}
          />
        )}
        {mode === "career" && (
          <CareerLayer
            ctx={ctx}
            title={T.title}
            phase={status.phase}
            // Hidden while the cards are up, so it never sits on their title.
            gold={choosing ? null : status.gold}
            scene={sceneRef}
            endRef={careerEndRef}
            weapon={startWeapon}
            onWeapon={chooseWeapon}
            names={WN}
            upgrades={UP}
            onTitle={() => go("title")}
          />
        )}
        {banner > 0 && (
          <div
            // `aria-live` so a player who cannot see it is still told. `polite`
            // rather than `assertive`: a stage boundary is news, not an alarm,
            // and the arena is already noisy.
            aria-live="polite"
            style={{
              position: "absolute",
              insetInlineStart: 0,
              insetInlineEnd: 0,
              top: "34%",
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                padding: "10px 22px",
                borderRadius: "var(--radius-pill)",
                // The arena's own near-black behind the weapon-card ink, which
                // is the pairing measured at 7.21:1 at worst for this game's
                // fills. Here it is the light-on-dark direction, which is the
                // easier one.
                background: "rgba(11, 13, 31, 0.86)",
                color: "#fff",
                fontFamily: "Fredoka, inherit",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              {T.stage} {banner}
            </span>
          </div>
        )}
        {choosing && (
          <div
            role="group"
            aria-label={T.pick}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              borderRadius: 14,
              // The same cover the entrance uses, now from the one token rather
              // than a second copy of the same rgba. Byte-identical value, so
              // every contrast figure measured below still stands.
              background: "var(--stage-cover)",
            }}
          >
            <b style={{ color: "#fff", fontSize: 18, fontFamily: "Fredoka, inherit" }}>
              {T.pick} {status.power}
            </b>
            {/* ILLUSTRATED, and each card still says three things rather than
                one: a drawing, the words in the player's own language, and a pip
                row for how many of this upgrade the run already holds. The
                drawing is for the five-year-old who cannot read the words - it
                never replaces them, and a player who reads the words loses
                nothing by ignoring it.

                CONTRAST, measured against the real composite rather than
                eyeballed: the cover is rgba(11,13,31,0.86) over the arena's own
                #0b0d1f, and this card's rgba(34,231,255,0.12) over that
                resolves to rgb(14,39,58). White text and the white art read
                15.33:1 on it, and the ice pips 13.99:1 - against floors of 4.5
                for the words and 3.0 for a graphic. The control in that same
                measurement (a mid-grey) comes back 2.22, so the arithmetic
                discriminates instead of passing everything.

                The row is NOT pinned `dir`: in Hebrew it should mirror, and the
                drawing belongs on the side the reading starts from. */}
            {/* THE CARDS (operator ruling 2026-10-02, card option B): a super
                arrives alone over the whole arena; anything else is the three
                big cards, the counts and the reroll (LevelCards.tsx). */}
            {status.offer[0]?.kind === "evolve" ? (
              <SuperCard
                key={`evolve-${status.offer[0].id}`}
                id={status.offer[0].id}
                weaponName={WN[status.offer[0].id][0]}
                locale={ctx.locale}
                onTake={() => sceneRef.current?.choose(status.offer[0]!)}
              />
            ) : (
              <LevelCards
                offer={status.offer}
                names={WN}
                ups={UP}
                words={CW}
                newWord={T.newWeapon}
                taken={status.taken}
                weapons={{ held: status.slots.length, of: SLOTS_MAX }}
                powers={{ held: UPGRADE_IDS.filter((id) => status.taken[id] > 0).length, of: UPGRADE_IDS.length }}
                rerolls={status.rerolls}
                onChoose={(card) => sceneRef.current?.choose(card)}
                onReroll={() => sceneRef.current?.reroll()}
              />
            )}
          </div>
        )}
      </div>
    </ArcadeChrome>
  );
}
