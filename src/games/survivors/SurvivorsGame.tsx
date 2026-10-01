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
import type { Card } from "./cards";
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
import { ARENA, ARENA_WIDE, RUN_MS, UPGRADE_CAP, UPGRADE_IDS, WEAPON_LV_MAX, type Arena,
} from "./logic";
import { UPGRADE_ART } from "./upgradeArt";
import { phoneArena, phoneBox } from "./phoneArena";
// THE CAREER (P3, 2026-09-29). The entrance is two tiles now - Career and Quick
// run (the operator's pick "quickB") - and everything the career draws lives in
// its own file; this component only switches between the two.
import { CareerLayer } from "./CareerLayer";
import { MenuButton } from "./careerScreens";
// THE TITLE SCREEN (2026-09-30): the game opens on key art and one Tap to start,
// which goes on to the mode cards (Career / Quick run, drawn by CareerLayer).
import { NeonTitle } from "./entrance/NeonTitle";
// THE WEAPON PICK and THE SUPER POWER CARD (operator ruling 2026-09-30, "like
// Survivor.io"): a run starts on one MAIN weapon picked from the whole
// collection, and a weapon's evolution arrives as a gold card of its own.
import { WeaponPick } from "./entrance/WeaponPick";
import { SuperCard } from "./entrance/SuperCard";
import { weaponWords } from "./entrance/weaponWords";
import { asMainWeapon, weaponsOpenIn } from "./weaponPool";
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

/** Where this device remembers the starting weapon. Persisted, so never renamed. */
const START_KEY = "startWeapon";

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
    | "setStartWeapon" | "freezeFromChrome" | "startCareer" | "leaveCareer"
  > | null>(null);

  /**
   * WHICH SCREEN THIS IS RIGHT NOW: the title, the mode cards, the quick run, or
   * the career. The game opens on the TITLE (operator, 2026-09-30: *"we have to
   * have 1 enter game screen"*); its one button goes to the mode cards. The
   * QUICK RUN is today's game byte for byte - the same entrance, the same
   * difficulty and weapon pick, the same scene - with one small "Menu" button
   * under its Play to get back to the mode cards.
   */
  const [mode, setMode] = useState<"title" | "menu" | "pick" | "quick" | "career">("title");
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
  // The MAIN weapon the next run starts with, remembered on this device and
  // validated on the way in - `asMainWeapon` reads anything this save may not
  // pick (locked, unknown, not ours) as the bolt, which is always open.
  const [startWeapon, setStartWeapon] = useState<WeaponId>(() => asMainWeapon(ctx.storage.get<string>(START_KEY, "bolt"), weaponsOpenIn(careerStore)));
  const startRef = useRef(startWeapon);
  startRef.current = startWeapon;
  /** Pick a main weapon: remembered, and handed to the scene before the run it starts. */
  const chooseWeapon = (id: WeaponId) => {
    setStartWeapon(id);
    // From the handler, never a state updater - the house rule.
    ctx.storage.set(START_KEY, id);
    sceneRef.current?.setStartWeapon(id);
  };
  // PLAY pressed on the pick before Phaser finished loading: the run starts the
  // moment the scene is ready, rather than dropping the press.
  const pendingPlay = useRef(false);

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
        beat: "הגולם נפל!",
        pick: "עלייה לדרגה",
        score: "צורות",
        time: "נשאר",
        hearts: "לבבות",
        pickWeapon: "בחרו נשק",
        newWeapon: "נשק חדש",
        takesSlot: "תופס תא {n} מתוך 4",
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
        beat: "The golem is down!",
        pick: "Level up",
        score: "Shapes",
        time: "Left",
        hearts: "Hearts",
        pickWeapon: "Pick your weapon",
        newWeapon: "New weapon",
        takesSlot: "takes slot {n} of 4",
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
        beat: "¡El gólem ha caído!",
        pick: "Subes de nivel",
        score: "Formas",
        time: "Queda",
        hearts: "Corazones",
        pickWeapon: "Elige tu arma",
        newWeapon: "Arma nueva",
        takesSlot: "ocupa la ranura {n} de 4",
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
        beat: "Golemen föll!",
        pick: "Du går upp i nivå",
        score: "Former",
        time: "Kvar",
        hearts: "Hjärtan",
        pickWeapon: "Välj ditt vapen",
        newWeapon: "Nytt vapen",
        takesSlot: "tar plats {n} av 4",
        dash: "Rusning",
        dashReady: "Rusning klar",
        freeze: "Frys",
      },
    },
    ctx.locale,
  );

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

  const asking = status.phase !== "playing";
  const choosing = status.offer.length > 0;

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
         * then picked this shape off four rendered over the live game.
         *
         * `choosing` is in the condition and it is load-bearing: the upgrade
         * picker is its own cover, drawn DURING a live run, and two covers on
         * one arena would stack. The run is not "asking" then either, but the
         * guard says so explicitly rather than relying on that.
         *
         * NOT A LOADING SCREEN, which is the other reading of what was asked.
         * The taste ledger already rules out a difficulty picker on the poster
         * before the game exists, and a spinner in an empty box while the chunk
         * downloads. This is drawn by the game, after it has mounted, so it
         * conflicts with neither.
         */
        mode === "quick" && asking && !choosing
          ? {
              title: T.title,
              // What used to be a strip UNDER the arena WHILE playing, where it
              // cost the board height on every frame of the run and told the
              // player how to play at the one moment they were already playing.
              // On the entrance it costs nothing and arrives before it is
              // needed.
              tagline: T.hint,
              action: status.phase === "ready" ? T.play : T.playAgain,
              result:
                status.phase === "won" ? T.beat : status.phase === "over" ? T.lost : undefined,
              onAction: () => sceneRef.current?.startFromChrome(),
              // After a run: back to the weapon pick (the run's main weapon is
              // chosen there now, from the whole collection), or to the mode cards.
              extra: (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <MenuButton label={weaponWords(ctx.locale).weapon} onPress={() => setMode("pick")} />
                  <MenuButton label={neonCareerWords(ctx.locale).menu} onPress={() => setMode("menu")} />
                </div>
              ),
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
        {mode === "title" && (
          <NeonTitle name={T.title} locale={ctx.locale} tap={neonCareerWords(ctx.locale).tap} onStart={() => setMode("menu")} />
        )}
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
              chooseWeapon(id);
              setMode("quick");
              notifyRunStart();
              if (sceneRef.current) sceneRef.current.startFromChrome();
              else pendingPlay.current = true;
            }}
            onBack={() => setMode("menu")}
            backLabel={neonCareerWords(ctx.locale).back}
          />
        )}
        {(mode === "menu" || mode === "career") && (
          <CareerLayer
            ctx={ctx}
            mode={mode}
            title={T.title}
            phase={status.phase}
            // Hidden while the cards are up, so it never sits on their title.
            gold={choosing ? null : status.gold}
            quickBest={best}
            scene={sceneRef}
            endRef={careerEndRef}
            onCareer={() => setMode("career")}
            onQuick={() => setMode("pick")}
            weapon={startWeapon}
            onWeapon={chooseWeapon}
            names={WN}
            upgrades={UP}
            onMenu={() => setMode("menu")}
            onTitle={() => setMode("title")}
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
            {status.offer.map((card: Card) => {
              if (card.kind === "weapon") {
                const id = card.id;
                return (
                  <button
                    key={`weapon-${id}`}
                    type="button"
                    onClick={() => sceneRef.current?.choose(card)}
                    aria-label={`${T.newWeapon}: ${WN[id][0]}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: 64,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-2)",
                      // The weapon's own ink as the border, so the card and the
                      // thing it adds to the arena read as one weapon.
                      border: `2px solid ${WEAPON_INK_CSS[id]}`,
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      font: "inherit",
                      fontFamily: "Fredoka, inherit",
                      cursor: "pointer",
                      touchAction: "manipulation",
                    }}
                  >
                    <span aria-hidden="true" style={{ display: "flex", flex: "0 0 auto", color: WEAPON_INK_CSS[id] }}>
                      {WEAPON_ART[id](36)}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, minWidth: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, textAlign: "start" }}>{WN[id][0]}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.9, textAlign: "start" }}>
                        {T.takesSlot.replace("{n}", String(status.slots.length + 1))}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        insetInlineEnd: 10,
                        top: -10,
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                        background: WEAPON_INK_CSS[id],
                        color: "#0b0d1f",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {T.newWeapon}
                    </span>
                  </button>
                );
              }
              // THE EVOLUTION - the SUPER POWER. It arrives alone (cards.ts), so it
              // is drawn as its own gold card over the whole arena rather than a
              // row among the upgrades: this is the moment the run was for, and
              // a card that looked like the routine picks would read as one.
              // The card covers the "Level up" heading under it.
              if (card.kind === "evolve") {
                return (
                  <SuperCard
                    key={`evolve-${card.id}`}
                    id={card.id}
                    weaponName={WN[card.id][0]}
                    locale={ctx.locale}
                    onTake={() => sceneRef.current?.choose(card)}
                  />
                );
              }
              // A LEVEL for a weapon the run already carries. Rendered from the
              // weapon's own art and ink, exactly like the new-weapon card above
              // it, because to a player they are the same object - one adds it,
              // the other makes it better. Polished in T10; this is the branch
              // that keeps it honest in the meantime.
              if (card.kind === "level") {
                const id = card.id;
                return (
                  <button
                    key={`level-${id}`}
                    type="button"
                    onClick={() => sceneRef.current?.choose(card)}
                    aria-label={`${WN[id][0]} ${card.to}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: 64,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-2)",
                      border: `2px solid ${WEAPON_INK_CSS[id]}`,
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      font: "inherit",
                      fontFamily: "Fredoka, inherit",
                      cursor: "pointer",
                      touchAction: "manipulation",
                    }}
                  >
                    <span aria-hidden="true" style={{ display: "flex", flex: "0 0 auto", color: WEAPON_INK_CSS[id] }}>
                      {WEAPON_ART[id](36)}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, minWidth: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, textAlign: "start" }}>{WN[id][0]}</span>
                      {/* PIPS, NOT "1 -> 2". Operator ruling 2026-09-22:
                          *"Some upgrades show like 1->2. Can u do them with the
                          bullets?"*

                          Every other card on this screen already says how far
                          along you are with a row of dots; this one said it with
                          two digits and an arrow, so the same fact was written
                          in two languages on one screen. The dots are drawn as
                          BULLETS rather than circles - a rounded upright capsule
                          - because this row counts a weapon's levels rather than
                          an upgrade's steps, and the shape is what tells the two
                          cards apart now that the fill no longer does.

                          `WEAPON_LV_MAX` is the length, read from the rules, so
                          a retuned cap redraws the row instead of lying about
                          it. `card.to` is the level this card WOULD take you to,
                          so it is filled rather than pending. */}
                      <span aria-hidden="true" style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {Array.from({ length: WEAPON_LV_MAX }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              width: 5,
                              height: 11,
                              borderRadius: "2.5px 2.5px 1.5px 1.5px",
                              background: i < card.to ? WEAPON_INK_CSS[id] : "rgba(255, 255, 255, 0.25)",
                            }}
                          />
                        ))}
                      </span>
                    </span>
                  </button>
                );
              }
              const id = card.id;
              const held = status.taken[id];
              const cap = UPGRADE_CAP[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => sceneRef.current?.choose(card)}
                  // The pips are a picture of the count, so the count is said
                  // here too - a screen reader gets the number rather than
                  // seven anonymous dots.
                  aria-label={`${UP[id]} ${held}/${cap}`}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-2)",
                    border: "2px solid #22e7ff",
                    background: "rgba(34, 231, 255, 0.12)",
                    color: "#fff",
                    font: "inherit",
                    fontFamily: "Fredoka, inherit",
                    cursor: "pointer",
                    touchAction: "manipulation",
                  }}
                >
                  <span aria-hidden="true" style={{ display: "flex", flex: "0 0 auto" }}>
                    {UPGRADE_ART[id]()}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 5,
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, textAlign: "start" }}>{UP[id]}</span>
                    {/* One pip per level this upgrade allows, filled up to what
                        the run holds. The cap is read from `UPGRADE_CAP`, so a
                        retuned cap redraws the row instead of lying about it. */}
                    <span aria-hidden="true" style={{ display: "flex", gap: 4 }}>
                      {Array.from({ length: cap }, (_, i) => (
                        <span
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: i < held ? "#d8fbff" : "rgba(216, 251, 255, 0.22)",
                          }}
                        />
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ArcadeChrome>
  );
}
