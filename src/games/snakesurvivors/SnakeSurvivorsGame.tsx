import { textFor } from "@i18n/index";
import { useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { ArcadeChrome } from "@ui/ArcadeChrome";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import type { DifficultyOption } from "@ui/DifficultySelector";
import { useRememberedLevel } from "@shared/useRememberedLevel";
import { measureBoxUnscaled, type ScaleManagerLike } from "@shared/phaserBox";
import { phoneArena, phoneBox } from "../survivors/phoneArena";
import { CAPS, WEAPONS } from "./cards";
import { CARD_ART } from "./cardArt";
import { START_LEN } from "./body";
import { LEVELS } from "./crowd";
import { ARENA, ARENA_WIDE, hitsLeft } from "./logic";
import type { Arena, CardId, LevelKey } from "./types";
import type { SnakeSurvivorsScene, SnakeSurvivorsStatus } from "./SnakeSurvivorsScene";
import { TUTORIAL_TEXT, TutorialBanner } from "./TutorialBanner";

// Snake Survivors' chrome: the arcade HUD, the entrance, and the card picker,
// all drawn by the shared showcase components over a Phaser arena. Same shape
// as Neon Survival's, because the band's rules are the same.

const LEVEL_OPTIONS: DifficultyOption<LevelKey>[] = [
  { id: "calm", label: { he: "רגוע", en: "Calm", es: "Tranquilo", sv: "Lugn" } },
  { id: "normal", label: { he: "רגיל", en: "Normal", es: "Normal", sv: "Normal" } },
  { id: "wild", label: { he: "פראי", en: "Wild", es: "Salvaje", sv: "Vild" } },
];

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** The most hearts the HUD draws; see the `hearts` line below. */
const HEART_CAP = 10;

/** The length line's picture: a short neon snake. */
const LENGTH_ART = (
  <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
    <path d="M-6 4 C-6 -2 0 -2 0 2 C0 6 6 5 6 -1" fill="none" stroke="#55efc4" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

/** The entrance's "How to play": quieter than Play, and still plainly a button. */
const HOW_TO_STYLE = {
  minHeight: 40,
  padding: "0 16px",
  borderRadius: "var(--radius-pill)",
  border: "2px solid rgba(216, 251, 255, 0.55)",
  background: "transparent",
  color: "#fff",
  font: "inherit",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  touchAction: "manipulation",
} as const;

/** The two weapons get the HUD's slots, so a player sees which they carry. */
const weapons = new Set<CardId>(WEAPONS);

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
    left: LEVELS[level].stageMs,
    lv: 1,
    offer: [],
    taken: { fangs: 0, spikes: 0, magnet: 0, swift: 0, regrow: 0, shockwave: 0 },
    boss: null,
    newBest: false,
    tutorial: null,
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
        tagline: "הקיפו אותם. סגרו את הלולאה.",
        hint: "גררו כדי לנווט, או החצים",
        play: "שחקו",
        playAgain: "שחקו שוב",
        won: "השומר נפל!",
        over: "הזנב נגמר",
        crushed: "נמחצו",
        best: "שיא",
        newBest: "שיא חדש!",
        length: "אורך",
        pick: "עלייה לדרגה - בחרו אחד",
        warden: "שומר",
      },
      en: {
        title: "Snake Survivors",
        tagline: "Circle them. Close the loop.",
        hint: "Drag to steer, or the arrow keys",
        play: "Play",
        playAgain: "Play again",
        won: "The warden is down!",
        over: "Out of tail",
        crushed: "Crushed",
        best: "Best",
        newBest: "New best!",
        length: "Length",
        pick: "Level up - pick one",
        warden: "Warden",
      },
      es: {
        title: "Serpiente superviviente",
        tagline: "Rodéalos. Cierra el círculo.",
        hint: "Arrastra para girar, o las flechas",
        play: "Jugar",
        playAgain: "Otra vez",
        won: "¡El guardián cayó!",
        over: "Sin cola",
        crushed: "Aplastados",
        best: "Récord",
        newBest: "¡Nuevo récord!",
        length: "Largo",
        pick: "Subes de nivel - elige una",
        warden: "Guardián",
      },
      sv: {
        title: "Ormöverlevare",
        tagline: "Ring in dem. Slut cirkeln.",
        hint: "Dra för att styra, eller piltangenterna",
        play: "Spela",
        playAgain: "Spela igen",
        won: "Väktaren föll!",
        over: "Slut på svans",
        crushed: "Krossade",
        best: "Rekord",
        newBest: "Nytt rekord!",
        length: "Längd",
        pick: "Ny nivå - välj en",
        warden: "Väktare",
      },
    },
    ctx.locale,
  );

  // Each card's name and one line saying what it does.
  const CARD = textFor(
    {
      he: {
        fangs: ["ניבים", "נגיעה בראש נושכת במקום לפגוע בך"],
        spikes: ["זנב קוצני", "מי שנתקע בגוף שלך נפגע"],
        magnet: ["מגנט", "יהלומים עפים אליך"],
        swift: ["זריז", "מהר יותר ומסתובב חד יותר"],
        regrow: ["צמיחה", "הזנב גדל בחזרה לבד"],
        shockwave: ["גל הדף", "מחיצה הודפת את השאר"],
      },
      en: {
        fangs: ["Fangs", "a touch at the head bites them instead of you"],
        spikes: ["Spiked tail", "anything that bumps your body gets hurt"],
        magnet: ["Magnet", "gems fly to you"],
        swift: ["Swift", "faster, and turns tighter"],
        regrow: ["Regrow", "your tail grows back by itself"],
        shockwave: ["Shockwave", "a crush pushes the crowd back"],
      },
      es: {
        fangs: ["Colmillos", "si te tocan la cabeza, muerdes tú"],
        spikes: ["Cola con púas", "lo que choca con tu cuerpo se hace daño"],
        magnet: ["Imán", "las gemas vuelan hacia ti"],
        swift: ["Veloz", "más rápida y gira más cerrado"],
        regrow: ["Regenerar", "tu cola vuelve a crecer sola"],
        shockwave: ["Onda", "aplastar empuja a los demás"],
      },
      sv: {
        fangs: ["Huggtänder", "en stöt mot huvudet blir ett bett"],
        spikes: ["Taggsvans", "det som stöter i kroppen tar skada"],
        magnet: ["Magnet", "ädelstenar flyger till dig"],
        swift: ["Snabb", "snabbare och svänger tätare"],
        regrow: ["Återväxt", "svansen växer tillbaka själv"],
        shockwave: ["Tryckvåg", "en krossning knuffar bort resten"],
      },
    } satisfies Record<"he" | "en" | "es" | "sv", Record<CardId, [string, string]>>,
    ctx.locale,
  );

  const HOW_TO = textFor(TUTORIAL_TEXT, ctx.locale).label;
  const tutoring = status.tutorial !== null && status.tutorial !== "done";
  const asking = status.phase !== "playing";
  const choosing = status.offer.length > 0;
  const score = status.crushed;
  const result =
    status.phase === "won" || status.phase === "over"
      ? `${status.phase === "won" ? T.won : T.over} · ${T.crushed} ${score}${status.newBest ? ` · ${T.newBest}` : ""}`
      : undefined;

  return (
    <ArcadeChrome
      ctx={ctx}
      hud={{
        // The tail IS the health, so a heart is one HIT the tail can still
        // take (`hitsLeft`). The row was designed for three to five lives and
        // a 28-segment tail drew 28 hearts off the side of a phone (measured
        // 2026-09-27), so it shows at most HEART_CAP: above that the row stays
        // full and the exact length rides the line under it.
        hearts: { now: Math.min(HEART_CAP, hitsLeft(status.len)), max: Math.min(HEART_CAP, hitsLeft(Math.max(status.peak, START_LEN))) },
        chip: { art: LENGTH_ART, text: `${T.length} ${status.len}`, ready: true },
        score,
        best: Math.max(best, score),
        // The tutorial's run has no stage clock and no weapons, and its words sit
        // where these two would: on a phone they would cover both (2026-09-27).
        clock: tutoring ? "" : clock(status.left),
        slots: tutoring ? [] : WEAPONS.map((id) => ({
          id,
          art: status.taken[id] ? <span style={{ display: "flex", transform: "scale(0.55)" }}>{CARD_ART[id]()}</span> : null,
        })),
        boss: status.boss ? { now: status.boss.now, max: status.boss.max, label: T.warden } : null,
        labels: { hearts: T.length, score: T.crushed },
      }}
      levels={LEVEL_OPTIONS}
      level={status.level}
      onLevel={(k) => {
        setLevel(k);
        sceneRef.current?.setLevel(k);
      }}
      onRestart={() => sceneRef.current?.restartFromChrome()}
      paused={status.phase === "playing" ? status.paused : undefined}
      onPaused={status.phase === "playing" ? (next) => sceneRef.current?.setPaused(next) : undefined}
      entrance={
        asking && !choosing
          ? {
              title: T.title,
              tagline: T.tagline,
              action: status.phase === "ready" ? T.play : T.playAgain,
              result,
              onAction: () => sceneRef.current?.startFromChrome(),
              extra: (
                <>
                  <span style={{ color: "#fff", opacity: 0.8, fontSize: 13 }}>{T.hint}</span>
                  {/* A real button: it starts the guided run (ruling R2.5). */}
                  <button type="button" onClick={() => sceneRef.current?.startTutorial()} style={HOW_TO_STYLE}>
                    {HOW_TO}
                  </button>
                </>
              ),
            }
          : null
      }
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
        {tutoring && status.tutorial !== "done" && status.tutorial && (
          <TutorialBanner step={status.tutorial} locale={ctx.locale} onSkip={() => sceneRef.current?.endTutorial()} />
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
            {status.offer.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => sceneRef.current?.choose(id)}
                aria-label={`${CARD[id][0]} ${status.taken[id]}/${CAPS[id]}`}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  minHeight: 64,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-2)",
                  border: `2px solid ${weapons.has(id) ? "#ffd166" : "#6c5ce7"}`,
                  background: "rgba(28, 33, 80, 0.92)",
                  color: "#fff",
                  fontFamily: "Fredoka, Heebo, sans-serif",
                  cursor: "pointer",
                  touchAction: "manipulation",
                  textAlign: "start",
                }}
              >
                <span aria-hidden="true" style={{ display: "flex", flex: "0 0 auto" }}>
                  {CARD_ART[id]()}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{CARD[id][0]}</span>
                  <span style={{ fontSize: 13, opacity: 0.85 }}>{CARD[id][1]}</span>
                  <span aria-hidden="true" style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: CAPS[id] }, (_, i) => (
                      <span
                        key={i}
                        style={{ width: 8, height: 8, borderRadius: "50%", background: i < status.taken[id] ? "#d8fbff" : "rgba(216, 251, 255, 0.22)" }}
                      />
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </ArcadeChrome>
  );
}
