import { textFor, type AppLocale } from "@i18n/index";
import type { TutorialStep } from "./tutorial";

// The guided first run's words, over the arena (operator ruling R2.5).
//
// The step line is TEXT, not a control: it tells the player what to do with
// the snake, it never asks them to press it, so it carries no button styling
// and takes no pointer - a thumb that lands on it still reaches the arena
// underneath to steer. Skip IS a control, so it is a real <button>, pressable
// and focusable on every step (`a-control-that-carries-an-imperative-must-be-a-control.md`).

type Step = Exclude<TutorialStep, "done">;

const ORDER: Step[] = ["loop", "eat", "pick"];

export const TUTORIAL_TEXT = {
  he: { loop: "הקיפו את העטלף בזנב שלכם", eat: "אכלו את היהלומים שהוא השאיר", pick: "בחרו כוח", skip: "דלגו", label: "איך משחקים" },
  en: { loop: "Loop your tail around the bat", eat: "Eat the gems it drops", pick: "Pick a power", skip: "Skip", label: "How to play" },
  es: { loop: "Rodea el murciélago con tu cola", eat: "Cómete las gemas que suelta", pick: "Elige un poder", skip: "Saltar", label: "Cómo se juega" },
  sv: { loop: "Slå en ögla runt fladdermusen med svansen", eat: "Ät ädelstenarna den tappar", pick: "Välj en kraft", skip: "Hoppa över", label: "Så spelar du" },
} satisfies Record<"he" | "en" | "es" | "sv", Record<Step | "skip" | "label", string>>;

export function TutorialBanner({ step, locale, onSkip }: { step: Step; locale: AppLocale; onSkip: () => void }) {
  const T = textFor(TUTORIAL_TEXT, locale);
  const n = ORDER.indexOf(step) + 1;
  return (
    <div
      role="status"
      aria-label={T.label}
      style={{
        position: "absolute",
        insetInline: 0,
        bottom: 24,
        zIndex: 2,
        display: "flex",
        justifyContent: "center",
        padding: "0 12px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          maxWidth: 440,
          paddingBlock: 8,
          paddingInlineStart: 14,
          paddingInlineEnd: 8,
          borderRadius: 14,
          background: "rgba(11, 14, 34, 0.86)",
          color: "#fff",
          fontFamily: "Fredoka, Heebo, sans-serif",
        }}
      >
        <span aria-hidden="true" style={{ color: "#ffd166", fontWeight: 800, fontSize: 14, flex: "0 0 auto" }}>
          {n}/3
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{T[step]}</span>
        <button
          type="button"
          onClick={onSkip}
          style={{
            pointerEvents: "auto",
            flex: "0 0 auto",
            minHeight: 40,
            padding: "0 14px",
            borderRadius: "var(--radius-pill)",
            border: "2px solid rgba(216, 251, 255, 0.5)",
            background: "transparent",
            color: "#fff",
            font: "inherit",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          {T.skip}
        </button>
      </div>
    </div>
  );
}
