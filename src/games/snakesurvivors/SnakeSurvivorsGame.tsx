import { textFor } from "@i18n/index";
import { useEffect, useRef, useState, type ReactElement } from "react";
import type { GameContext } from "@sdk/index";
import { ArcadeChrome } from "@ui/ArcadeChrome";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import type { DifficultyOption } from "@ui/DifficultySelector";
import { useRememberedLevel } from "@shared/useRememberedLevel";
import { measureBoxUnscaled, type ScaleManagerLike } from "@shared/phaserBox";
import { phoneArena, phoneBox } from "../survivors/phoneArena";
import { CAPS, LONG_STEP, NOVA_EVERY, WEAPONS, cardOffer, chainOf, noneTaken } from "./cards";
import { CARD_ART } from "./cardArt";
import { START_LEN } from "./body";
import { ARENA, ARENA_WIDE } from "./logic";
import { bossRow, heartBlock, runStats } from "./hud";
import { PauseCard, SnakeHud, crownIcon, crushIcon, levelIcon } from "./SnakeHud";
import type { Arena, CardId, LevelKey, Tier } from "./types";
import type { SnakeSurvivorsScene, SnakeSurvivorsStatus } from "./SnakeSurvivorsScene";
import { TUTORIAL_TEXT, TutorialBanner } from "./TutorialBanner";
import { HOW_ICON, SNAKE_INKS, SnakeTitleArt, snakeLines, snakeName } from "./SnakeTitle";
import { HINT_FADE_MS, HINT_MS, endOf, hintVisible, nextEnd, snakeScreen, type EndCard } from "./screens";
import { balancedLines } from "@ui/ArcadeTitle";

// Snake Survivors' chrome: the arcade HUD, the entrance, and the card picker,
// all drawn by the shared showcase components over a Phaser arena. Same shape
// as Neon Survival's, because the band's rules are the same.

const LEVEL_OPTIONS: DifficultyOption<LevelKey>[] = [
  { id: "calm", label: { he: "רגוע", en: "Calm", es: "Tranquilo", sv: "Lugn" } },
  { id: "normal", label: { he: "רגיל", en: "Normal", es: "Normal", sv: "Normal" } },
  { id: "wild", label: { he: "פראי", en: "Wild", es: "Salvaje", sv: "Vild" } },
];

/** The controls line's drawing: a drag cross, in the head's mint. */
const DRAG = (
  <svg aria-hidden="true" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#55efc4" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
    <circle cx="12" cy="12" r="2.2" fill="#55efc4" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
  </svg>
);

/**
 * Round four's tiers (games doctrine: a colour AND a word, never colour alone):
 * grey common, blue rare, gold epic - the border, the glow, the badge and the
 * level pips all wear it.
 */
const TIER_LOOK: Record<Tier, { ink: string; tile: string; glow: string }> = {
  common: { ink: "#9aa3c7", tile: "rgba(154, 163, 199, 0.16)", glow: "none" },
  rare: { ink: "#74b9ff", tile: "rgba(116, 185, 255, 0.18)", glow: "0 0 14px rgba(116, 185, 255, 0.45)" },
  epic: { ink: "#ffd166", tile: "rgba(255, 209, 102, 0.2)", glow: "0 0 20px rgba(255, 209, 102, 0.6)" },
};

/** Chain Crush's first level, and the others' single numbers, read off the rules. */
const CHAIN_AT_1 = chainOf({ taken: { ...noneTaken(), chain: 1 } });

export function SnakeSurvivorsGame({ ctx }: { ctx: GameContext }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Pick<SnakeSurvivorsScene, "setLevel" | "setPaused" | "restartFromChrome" | "startFromChrome" | "choose" | "startTutorial" | "endTutorial"> | null>(null);
  const [level, setLevel] = useRememberedLevel(ctx, LEVEL_OPTIONS.map((o) => o.id), "normal");
  const levelRef = useRef(level);
  levelRef.current = level;

  const [status, setStatus] = useState<SnakeSurvivorsStatus>({
    phase: "ready",
    paused: false,
    level,
    len: START_LEN,
    peak: START_LEN,
    crushed: 0,
    meter: { len: START_LEN, crushed: 0, stage: 1 },
    lv: 1,
    offer: [],
    taken: noneTaken(),
    boss: null,
    bite: 1,
    newBest: false,
    tutorial: null,
    banner: null,
  });
  const best = ctx.score?.best(status.level) ?? 0;

  // Portrait on a phone, landscape on a PC, picked once at mount and handed to
  // the simulation - the showcase rule, and Neon Survival's own two shapes.
  const [arena] = useState<Arena>(() => {
    if (isPcArena()) return ARENA_WIDE;
    if (typeof window === "undefined") return ARENA;
    const box = phoneBox();
    return box ? phoneArena(box.w, box.h) : ARENA;
  });

  useEffect(() => {
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    ctx.lifecycle.loadingStart();
    void (async () => {
      const [{ default: Phaser }, { SnakeSurvivorsScene: Scene }] = await Promise.all([
        import("phaser"),
        import("./SnakeSurvivorsScene"),
      ]);
      if (cancelled) return;
      const g = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: arena.w,
        height: arena.h,
        backgroundColor: "#0b0e22",
        // NO_CENTER: the host centres with CSS, see `@shared/phaserBox`.
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
        render: { preserveDrawingBuffer: true },
        scene: Scene,
      });
      game = g;
      measureBoxUnscaled(g.scale as unknown as ScaleManagerLike, host);
      g.scene.start("snakesurvivors", {
        ctx,
        arena,
        onStatus: (s: SnakeSurvivorsStatus) => {
          if (!cancelled) setStatus(s);
        },
        onReady: (scene: SnakeSurvivorsScene) => {
          if (cancelled) return;
          sceneRef.current = scene;
          scene.setLevel(levelRef.current);
        },
      });
      ctx.lifecycle.loadingFinished();
    })();
    return () => {
      cancelled = true;
      sceneRef.current = null;
      game?.destroy(true);
    };
  }, [ctx, arena]);

  const T = textFor(
    {
      he: {
        title: "נחש הישרדות",
        youWin: "ניצחתם!",
        ribbon: "שיא חדש",
        tagline: "הקיפו אותם. סגרו את הלולאה.",
        hint: "גררו כדי לנווט, או החצים",
        play: "שחקו",
        playAgain: "שחקו שוב",
        won: "שלושת השומרים נפלו!",
        over: "הזנב נגמר",
        crushed: "נמחצו",
        best: "שיא",
        newBest: "שיא חדש!",
        level: "דרגה",
        pick: "עלייה לדרגה - בחרו אחד",
        stage: "שלב",
        have: "כבר יש לך",
        tier: { common: "רגיל", rare: "נדיר", epic: "אפי" },
      },
      en: {
        title: "Snake Survivors",
        youWin: "You win!",
        ribbon: "New best",
        tagline: "Circle them. Close the loop.",
        hint: "Drag to steer, or the arrow keys",
        play: "Play",
        playAgain: "Play again",
        won: "All three wardens are down!",
        over: "Out of tail",
        crushed: "Crushed",
        best: "Best",
        newBest: "New best!",
        level: "Level",
        pick: "Level up - pick one",
        stage: "Stage",
        have: "you have it",
        tier: { common: "COMMON", rare: "RARE", epic: "EPIC" },
      },
      es: {
        title: "Serpiente superviviente",
        youWin: "¡Has ganado!",
        ribbon: "Nuevo récord",
        tagline: "Rodéalos. Cierra el círculo.",
        hint: "Arrastra para girar, o las flechas",
        play: "Jugar",
        playAgain: "Otra vez",
        won: "¡Los tres guardianes cayeron!",
        over: "Sin cola",
        crushed: "Aplastados",
        best: "Récord",
        newBest: "¡Nuevo récord!",
        level: "Nivel",
        pick: "Subes de nivel - elige una",
        stage: "Etapa",
        have: "ya la tienes",
        tier: { common: "COMÚN", rare: "RARA", epic: "ÉPICA" },
      },
      sv: {
        title: "Ormöverlevare",
        youWin: "Du vann!",
        ribbon: "Nytt rekord",
        tagline: "Ring in dem. Slut cirkeln.",
        hint: "Dra för att styra, eller piltangenterna",
        play: "Spela",
        playAgain: "Spela igen",
        won: "Alla tre väktarna föll!",
        over: "Slut på svans",
        crushed: "Krossade",
        best: "Rekord",
        newBest: "Nytt rekord!",
        level: "Nivå",
        pick: "Ny nivå - välj en",
        stage: "Etapp",
        have: "du har den",
        tier: { common: "VANLIG", rare: "SÄLLSYNT", epic: "EPISK" },
      },
    },
    ctx.locale,
  );

  // Each card's name, one line saying what it does, and - for a card already
  // owned - what its NEXT level gives against what the run has now (NePo: "if I
  // already have a magnet why do I get the same card a second time?"). The two
  // numbers are `cardOffer`'s, read off the rules.
  const CARD = textFor(
    {
      he: {
        fangs: ["ניבים", "נגיעה בראש נושכת במקום לפגוע בך", (n, w) => `נושכים צורות עם עד ${n} חיים, היה ${w}`],
        spikes: ["זנב קוצני", "מי שנתקע בגוף שלך נפגע", (n, w) => `עוקץ כל ${n} שנ׳, היה ${w}`],
        magnet: ["מגנט", "יהלומים עפים אליך", (n, w) => `המשיכה מגיעה ל-${n}, היה ${w}`],
        swift: ["זריז", "מהר יותר ומסתובב חד יותר", (n, w) => `+${n}% מהירות וסיבוב, היה +${w}%`],
        regrow: ["צמיחה", "הזנב גדל בחזרה לבד", (n, w) => `חוליה כל ${n} שנ׳, היה ${w}`],
        shockwave: ["גל הדף", "מחיצה הודפת את השאר", (n, w) => `הודף עד ${n}, היה ${w}`],
        spit: ["יריקה", "יורה בצורה הקרובה כל 2 שניות", (n, w) => `יורק כל ${n} שנ׳, היה ${w}`],
        lasso: ["לאסו", "הלולאה נסגרת ממרחק גדול יותר", (n, w) => `נסגרת ממרחק ${n}, היה ${w}`],
        shield: ["מגן", "חוסם מכה אחת, ואז נטען מחדש", (n, w) => `חוסם מכה כל ${n} שנ׳, היה ${w}`],
        chain: ["שרשרת מחיצה", `מחיצה מזנקת ל-${CHAIN_AT_1} הצורות הקרובות מחוץ ללולאה`, (n, w) => `פוגעת ב-${n} הקרובות, היה ${w}`],
        doubleGems: ["מיזוג יהלומים", "יהלומים מתמזגים לגדולים. פחות לרדוף, אותו ערך.", (n, w) => `מתמזגים ממרחק ${n}, היה ${w}`],
        frost: ["שובל כפור", "צורות שנוגעות בזנב שלך מואטות", (n, w) => `מאט ב-${n}%, היה ${w}%`],
        longBody: ["גוף ארוך", `אפשר לגדול עוד ${LONG_STEP} חוליות`, (n, w) => `+${n} לאורך המרבי, היה +${w}`],
        twinHead: ["ראש כפול", "ראש שני בקצה הזנב: סוגרים לולאות משני הצדדים", (n) => `${n} ראשים`],
        blackHole: ["חור שחור", "מחיצה משאירה מערבולת שמושכת צורות פנימה", (n) => `מערבולת ל-${n} שנ׳`],
        nova: ["נובה", `כל ${NOVA_EVERY} מחיצות מנקות את כל הצורות במסך חוץ מהבוס`, (n) => `כל ${n} מחיצות`],
      },
      en: {
        fangs: ["Fangs", "a touch at the head bites them instead of you", (n, w) => `bites shapes with up to ${n} health, was ${w}`],
        spikes: ["Spiked tail", "anything that bumps your body gets hurt", (n, w) => `stings every ${n} s, was ${w} s`],
        magnet: ["Magnet", "gems fly to you", (n, w) => `pull reaches ${n}, was ${w}`],
        swift: ["Swift", "faster, and turns tighter", (n, w) => `+${n}% speed and turn, was +${w}%`],
        regrow: ["Regrow", "your tail grows back by itself", (n, w) => `a segment every ${n} s, was ${w} s`],
        shockwave: ["Shockwave", "a crush pushes the crowd back", (n, w) => `throws back from ${n}, was ${w}`],
        spit: ["Spit", "shoots the nearest shape every 2 s", (n, w) => `spits every ${n} s, was ${w} s`],
        lasso: ["Lasso", "your loop snaps shut from further away", (n, w) => `snaps shut from ${n}, was ${w}`],
        shield: ["Shield", "blocks one bump, then recharges", (n, w) => `blocks a bump every ${n} s, was ${w} s`],
        chain: ["Chain Crush", `a crush zaps the ${CHAIN_AT_1} nearest shapes outside the loop`, (n, w) => `zaps the ${n} nearest, was ${w}`],
        doubleGems: ["Gem Merge", "Gems fuse into big ones. Fewer to chase, same value.", (n, w) => `fuses gems from ${n}, was ${w}`],
        frost: ["Frost Trail", "shapes touching your tail are slowed", (n, w) => `slows them ${n}%, was ${w}%`],
        longBody: ["Long Body", `grow up to ${LONG_STEP} segments longer`, (n, w) => `+${n} most length, was +${w}`],
        twinHead: ["Twin Head", "a second head on your tail - close loops from both ends", (n) => `${n} heads`],
        blackHole: ["Black Hole", "a crush leaves a vortex that pulls shapes in", (n) => `a vortex for ${n} s`],
        nova: ["Nova", `every ${NOVA_EVERY}th crush clears every shape on screen but the boss`, (n) => `every ${n} crushes`],
      },
      es: {
        fangs: ["Colmillos", "si te tocan la cabeza, muerdes tú", (n, w) => `muerdes figuras de hasta ${n} de vida, antes ${w}`],
        spikes: ["Cola con púas", "lo que choca con tu cuerpo se hace daño", (n, w) => `pincha cada ${n} s, antes ${w} s`],
        magnet: ["Imán", "las gemas vuelan hacia ti", (n, w) => `atrae desde ${n}, antes ${w}`],
        swift: ["Veloz", "más rápida y gira más cerrado", (n, w) => `+${n}% de velocidad y giro, antes +${w}%`],
        regrow: ["Regenerar", "tu cola vuelve a crecer sola", (n, w) => `un segmento cada ${n} s, antes ${w} s`],
        shockwave: ["Onda", "aplastar empuja a los demás", (n, w) => `empuja desde ${n}, antes ${w}`],
        spit: ["Escupir", "dispara a la figura más cercana cada 2 s", (n, w) => `escupe cada ${n} s, antes ${w} s`],
        lasso: ["Lazo", "tu círculo se cierra desde más lejos", (n, w) => `se cierra desde ${n}, antes ${w}`],
        shield: ["Escudo", "para un golpe y se recarga", (n, w) => `para un golpe cada ${n} s, antes ${w} s`],
        chain: ["Aplaste en cadena", `aplastar electrocuta a las ${CHAIN_AT_1} figuras más cercanas fuera del círculo`, (n, w) => `alcanza a las ${n} más cercanas, antes ${w}`],
        doubleGems: ["Fusión de gemas", "Las gemas se funden en grandes. Menos que perseguir, el mismo valor.", (n, w) => `funde gemas desde ${n}, antes ${w}`],
        frost: ["Estela helada", "las figuras que tocan tu cola van más lentas", (n, w) => `las frena un ${n}%, antes ${w}%`],
        longBody: ["Cuerpo largo", `puedes crecer ${LONG_STEP} segmentos más`, (n, w) => `+${n} de largo máximo, antes +${w}`],
        twinHead: ["Doble cabeza", "una segunda cabeza en la cola: cierra círculos por los dos lados", (n) => `${n} cabezas`],
        blackHole: ["Agujero negro", "aplastar deja un remolino que atrae a las figuras", (n) => `un remolino de ${n} s`],
        nova: ["Nova", `cada ${NOVA_EVERY} aplastes se borran todas las figuras en pantalla menos el jefe`, (n) => `cada ${n} aplastes`],
      },
      sv: {
        fangs: ["Huggtänder", "en stöt mot huvudet blir ett bett", (n, w) => `biter figurer med upp till ${n} liv (förut ${w})`],
        spikes: ["Taggsvans", "det som stöter i kroppen tar skada", (n, w) => `sticker var ${n} s (förut ${w} s)`],
        magnet: ["Magnet", "ädelstenar flyger till dig", (n, w) => `drar från ${n} (förut ${w})`],
        swift: ["Snabb", "snabbare och svänger tätare", (n, w) => `+${n} % fart och sväng (förut +${w} %)`],
        regrow: ["Återväxt", "svansen växer tillbaka själv", (n, w) => `ett segment var ${n} s (förut ${w} s)`],
        shockwave: ["Tryckvåg", "en krossning knuffar bort resten", (n, w) => `knuffar från ${n} (förut ${w})`],
        spit: ["Spott", "skjuter närmaste figur varannan sekund", (n, w) => `spottar var ${n} s (förut ${w} s)`],
        lasso: ["Lasso", "öglan sluts från längre håll", (n, w) => `sluts från ${n} (förut ${w})`],
        shield: ["Sköld", "stoppar en stöt och laddas om", (n, w) => `stoppar en stöt var ${n} s (förut ${w} s)`],
        chain: ["Kedjekross", `en krossning träffar de ${CHAIN_AT_1} närmaste figurerna utanför öglan`, (n, w) => `träffar de ${n} närmaste (förut ${w})`],
        doubleGems: ["Stensammanslagning", "Ädelstenar smälter ihop till stora. Färre att jaga, samma värde.", (n, w) => `smälter ihop från ${n} (förut ${w})`],
        frost: ["Frostspår", "figurer som rör svansen saktar in", (n, w) => `saktar in ${n} % (förut ${w} %)`],
        longBody: ["Lång kropp", `du kan växa ${LONG_STEP} segment längre`, (n, w) => `+${n} i största längd (förut +${w})`],
        twinHead: ["Tvillinghuvud", "ett andra huvud på svansen: slut öglor från båda hållen", (n) => `${n} huvuden`],
        blackHole: ["Svart hål", "en krossning lämnar en virvel som drar in figurer", (n) => `en virvel i ${n} s`],
        nova: ["Nova", `var ${NOVA_EVERY}:e krossning rensar alla figurer på skärmen utom bossen`, (n) => `var ${n}:e krossning`],
      },
    } satisfies Record<"he" | "en" | "es" | "sv", Record<CardId, [string, string, (now: string, was: string) => string]>>,
    ctx.locale,
  );
  const num = (n: number) => {
    try {
      return new Intl.NumberFormat(ctx.locale).format(n);
    } catch {
      return String(n);
    }
  };

  const HOW_TO = textFor(TUTORIAL_TEXT, ctx.locale).label;
  const tutoring = status.tutorial !== null && status.tutorial !== "done";
  const choosing = status.offer.length > 0;
  const score = status.crushed;
  // C3 (2026-10-01): crushed, best and level left the play screen. They are
  // here - on the game-over card, by name - and on the pause card below.
  const stats = runStats(score, best, status.lv);
  const statWords = { crushed: T.crushed, best: T.best, level: T.level };
  /**
   * THE ONE SCREEN (operator, 2026-10-01, "one-screen start, all four"): the
   * title holds the difficulty and one big PLAY - the plain card it used to lead
   * to is gone - and a run that ends shows its own card in the title's style.
   * That card is LATCHED (`nextEnd`): a difficulty tap on it restarts the scene
   * to "ready", and read off the phase alone the card would turn back into the
   * title under the finger.
   */
  const endNow = endOf(status, best);
  const [end, setEnd] = useState<EndCard | null>(null);
  useEffect(() => {
    setEnd((prev) => nextEnd(prev, status.phase, endNow));
    // The card snapshots the run as it ended; it is re-read only when the phase moves.
  }, [status.phase]);
  const screen = snakeScreen(status.phase, choosing, status.phase === "won" || status.phase === "over" ? endNow : end);
  const shown = status.phase === "won" || status.phase === "over" ? endNow : end;

  /**
   * THE CONTROLS LINE, in the arena for the first 3 s of a run and then gone -
   * where "Drag to steer, or the arrow keys" used to sit on the plain card.
   * Keyed on a REAL run starting: the guided run has its own words.
   */
  const live = status.phase === "playing" && !tutoring;
  const [runAt, setRunAt] = useState<number | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!live) return setRunAt(null);
    setRunAt(Date.now());
    const t = window.setTimeout(() => tick((n) => n + 1), HINT_MS);
    return () => window.clearTimeout(t);
  }, [live]);
  const hintOn = runAt !== null && hintVisible(Date.now() - runAt);
  const wide = arena.w > arena.h;

  const art = (box: { w: number; h: number; wide: boolean; rtl: boolean }): ReactElement => <SnakeTitleArt {...box} />;
  const entrance =
    screen === "title"
      ? {
          label: T.title,
          lines: snakeName(T.title, ctx.locale),
          tagline: T.tagline,
          action: T.play,
          onAction: () => sceneRef.current?.startFromChrome(),
          // A real button: it starts the guided run (ruling R2.5).
          secondary: { label: HOW_TO, icon: HOW_ICON, onPress: () => sceneRef.current?.startTutorial() },
          inks: SNAKE_INKS,
          split: true,
          bottom: [0.034, 0.05] as [number, number],
          children: art,
        }
      : screen === "over" && shown
        ? {
            label: shown.won ? T.youWin : T.over,
            lines: snakeLines(balancedLines(shown.won ? T.youWin : T.over, ctx.locale)),
            layout: "stack" as const,
            top: [0.045, 0.03] as [number, number],
            nameFs: [78, 62] as [number, number],
            result: shown.won ? T.won : undefined,
            ribbon: shown.newBest ? T.ribbon : undefined,
            tiles: shown.stats.map((st) => ({
              id: st.id,
              value: st.value,
              label: statWords[st.id],
              icon: st.id === "crushed" ? crushIcon() : st.id === "best" ? crownIcon() : levelIcon(),
              color: st.id === "crushed" ? "#ffd166" : st.id === "best" ? "#f5f6ff" : "#74b9ff",
            })),
            action: T.playAgain,
            again: true,
            onAction: () => sceneRef.current?.startFromChrome(),
            inks: SNAKE_INKS,
            split: true,
            play: { tall: [290, 78] as [number, number], wide: [290, 60] as [number, number] },
            scrim: "rgba(11, 13, 31, 0.66)",
            children: art,
          }
        : null;

  return (
    <ArcadeChrome
      ctx={ctx}
      // C3: the game draws its OWN HUD on the arena (<SnakeHud> below), so the
      // shared one is handed nothing and draws nothing. Neon Survival still
      // passes its hud and is unchanged.
      hud={null}
      levels={LEVEL_OPTIONS}
      level={status.level}
      onLevel={(k) => {
        setLevel(k);
        sceneRef.current?.setLevel(k);
      }}
      paused={status.phase === "playing" ? status.paused : undefined}
      onPaused={status.phase === "playing" ? (next) => sceneRef.current?.setPaused(next) : undefined}
      // The title before a run and the game-over card after one: one shared
      // card, in the title's style, with the difficulty on it.
      entrance={entrance}
      onRestart={() => {
        // The page's restart is a fresh start: back to the title.
        setEnd(null);
        sceneRef.current?.restartFromChrome();
      }}
    >
      <div
        className={BOARD_CLASS}
        style={{
          position: "relative",
          // Neon Survival's numbers, for the same arena on the same chrome:
          // chrome 16 is the panel's own padding once the entrance holds every
          // control, and capPc 1664 is the showcase panel's width. The board
          // gate reads the rendered gap and refuses either if it is wrong.
          ...boardVars({ vw: 92, vh: 58, cap: 420, chrome: 16, ratio: arena.w / arena.h, capPc: 1664 }),
        }}
      >
        <div
          ref={hostRef}
          style={{
            width: "100%",
            aspectRatio: `${arena.w} / ${arena.h}`,
            borderRadius: 14,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "none",
          }}
        />
        {/* THE CONTROLS LINE: the first 3 s of a run, then it fades. A
            picture, never a control - the arena under it is steered by touch. */}
        {live && !choosing && (
          <div
            data-hint="controls"
            aria-hidden={!hintOn}
            style={{
              position: "absolute",
              insetInline: 0,
              top: wide ? "79%" : "74%",
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 2,
              opacity: hintOn ? 1 : 0,
              transition: `opacity ${HINT_FADE_MS}ms ease`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(11, 13, 31, 0.82)",
                border: "2px solid #2a2f55",
                color: "#f5f6ff",
                fontFamily: "Fredoka, Heebo, sans-serif",
                fontWeight: 600,
                fontSize: 17,
                whiteSpace: "nowrap",
              }}
            >
              {DRAG}
              {T.hint}
            </div>
          </div>
        )}
        {/* THE HUD, "C3 Big hearts, length right" (operator, 2026-10-01):
            hearts top-left in a big 2x4 block, the length big top-right, the
            boss row at the bottom, the weapons on the side once owned. Only
            while a run is live - the title and the entrance own the arena
            otherwise. The boss row steps aside for the tutorial's words and
            the card picker, as the meter it replaces did. */}
        {status.phase === "playing" && (
          <SnakeHud
            hearts={heartBlock(status.len, status.peak, status.bite)}
            len={status.len}
            boss={tutoring || choosing ? null : bossRow(status.level, status.meter, status.boss)}
            cards={tutoring ? [] : WEAPONS.filter((id) => status.taken[id]).map((id) => ({ id, art: CARD_ART[id]() }))}
          />
        )}
        {tutoring && status.tutorial !== "done" && status.tutorial && (
          <TutorialBanner step={status.tutorial} locale={ctx.locale} onSkip={() => sceneRef.current?.endTutorial()} />
        )}
        {/* THE STAGE BANNER (round four): a couple of seconds of "Stage N",
            centred, the moment a warden falls and there is a next one - the
            operator's "clear moment between stages". A picture, never a
            control, same as the meter above. */}
        {status.banner && (
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
          >
            <b
              style={{
                color: "#ffd166",
                fontSize: "clamp(20px, 6cqw, 34px)",
                fontFamily: "Fredoka, Heebo, sans-serif",
                textShadow: "0 2px 10px rgba(11, 14, 34, 0.85)",
              }}
            >
              {`${T.stage} ${status.banner}`}
            </b>
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
              background: "var(--stage-cover)",
            }}
          >
            <b style={{ color: "#ffd166", fontSize: 20, fontFamily: "Fredoka, Heebo, sans-serif" }}>{T.pick}</b>
            {status.offer.map((id) => {
              const o = cardOffer(status.taken, id);
              const look = TIER_LOOK[o.tier];
              const [name, line, upgrade] = CARD[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => sceneRef.current?.choose(id)}
                  aria-label={`${T.tier[o.tier]} ${name} ${o.to}/${CAPS[id]}`}
                  data-tier={o.tier}
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 420,
                    minHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-2)",
                    border: `2px solid ${look.ink}`,
                    boxShadow: look.glow,
                    background: "rgba(28, 33, 80, 0.94)",
                    color: "#fff",
                    fontFamily: "Fredoka, Heebo, sans-serif",
                    cursor: "pointer",
                    touchAction: "manipulation",
                    textAlign: "start",
                  }}
                >
                  {/* The tier, as a WORD on the card's corner - colour alone is never the signal. */}
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      insetInlineEnd: 12,
                      background: look.ink,
                      color: "#0b0e22",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      borderRadius: 6,
                      padding: "1px 8px",
                    }}
                  >
                    {T.tier[o.tier]}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{ display: "flex", flex: "0 0 auto", padding: 4, borderRadius: 10, background: look.tile }}
                  >
                    {CARD_ART[id]()}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: "1 1 auto" }}>
                    <span style={{ fontSize: 17, fontWeight: 700 }}>
                      {/* An owned card is an UPGRADE, and says so: "Magnet 2 → 3". */}
                      {name}
                      {o.owned && <span dir="ltr">{` ${o.from} → ${o.to}`}</span>}
                    </span>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>
                      {o.owned && o.was !== null ? `${T.have}: ${upgrade(num(o.now), num(o.was))}` : line}
                    </span>
                  </span>
                  {/* Level pips, in the tier's colour: lit up to the level this pick gives. */}
                  {CAPS[id] > 1 && (
                    <span aria-hidden="true" style={{ display: "flex", gap: 4, flex: "0 0 auto", marginInlineStart: "auto" }}>
                      {Array.from({ length: CAPS[id] }, (_, i) => (
                        <span
                          key={i}
                          style={{ width: 10, height: 10, borderRadius: "50%", background: i < o.to ? look.ink : "rgba(216, 251, 255, 0.22)" }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {/* THE PAUSE CARD: Resume, and the three numbers that left play. */}
        {status.phase === "playing" && status.paused && (
          <PauseCard stats={stats} words={statWords} resume={ctx.t("resume")} onResume={() => sceneRef.current?.setPaused(false)} />
        )}
      </div>
    </ArcadeChrome>
  );
}
