import type { Locale } from "@i18n/index";
import type { GameContext } from "@sdk/index";
import { Icon } from "./icons";
import { runRestart } from "./gameTools";

/**
 * THE GAME TABLE - where a game's own buttons sit (operator ruling 2026-09-28).
 *
 * Picked off an art-studio round of eight layouts on six games, phone and PC,
 * and then kept plain after a second round of eight table materials did not
 * beat it ("lets keep the original and use it for now"). The idea:
 *
 *   GAME buttons - the level, the numbers, restart, pause - are PIECES laid on
 *   a mat in the game's own colour; the game's own controls (a keypad, arrows,
 *   a palette) sit in a TRAY; the APP's buttons stay small in the corners, off
 *   the mat. On a phone the pieces lie above the board and the tray is in the
 *   thumb zone; on a PC the pieces take the left column and the tray the right.
 *
 * A game opts in with `layout: "table"` in its meta. `GameHost` puts that on
 * the page as `data-layout` BEFORE the game's chunk loads, and this reads it
 * once at mount - so the same component serves both, and a standalone bundle
 * (no page, no attribute) keeps the shape it always had.
 *
 * The styles are INJECTED from here, not written into the page stylesheet:
 * that sheet ships inside every emitted document and counts against the first
 * visit, which had 45 B gz spare on 2026-09-28. This module rides the game's
 * own chunk, so a page that never mounts a table game pays nothing for it.
 *
 * The mock it was built from: .lab-shots/t/table.html, tab A (tablePhone,
 * tablePc), kept in the lab rounds ledger.
 */
/**
 * A board's PC chrome on the table: the panel's 8+8 and the surface's 14+14,
 * what the board gate measured around sudoku, 2026-09-28. Every table board
 * declares it, except one that draws something of its own above or below
 * itself inside its column (snake's score band): that board carries
 * `data-own-chrome` and declares this PLUS its own extra.
 */
export const TABLE_CHROME = 44;

export function isTablePage(): boolean {
  return typeof document !== "undefined" && document.body?.dataset.layout === "table";
}

// The page's own restart and pause (`[data-restart]`, `[data-pause]`) stay in
// the document and stay WIRED - the end-of-run strip's "Play again" goes
// through the same slot - they are only not drawn, because the piece on the
// mat is the one a player presses.
const BAR = "oklch(from var(--g) .30 calc(c * 1.05) h)"; // the page header's own colour
const SHADE = (n: number) => `color-mix(in srgb,var(--text) ${n}%,transparent)`;
const LIGHT = (n: number) => `color-mix(in srgb,var(--on-brand) ${n}%,transparent)`;
// ONLY THEME TOKENS, no colour literal: Day's --surface / --text / --text-dim
// are exactly the mock's card, ink and label, and a theme sheet that sets them
// repaints the table without this file knowing the theme exists
// (token-hygiene.test.ts holds it).
const CSS = `
body[data-layout=table] [data-restart],body[data-layout=table] [data-pause]{display:none!important}
.gc-table{position:relative;isolation:isolate}
.gc-table::before{content:"";position:absolute;z-index:-1;inset:2px 3px 6px;border-radius:26px;
 background:color-mix(in oklab,var(--g) 13%,var(--bg));box-shadow:inset 0 0 0 3px ${SHADE(6)}}
.gc-table>.gc-head{padding:5px 12px 0!important}
.gc-table>.ellaz-play-surface{padding:6px 0 6px!important}
.gt-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center}
.gt-disc{width:64px;height:64px;flex:none;border:0;border-radius:50%;padding:0;cursor:pointer;
 background:${BAR};color:var(--on-brand);display:grid;place-items:center;align-content:center;gap:4px;
 font:800 12px/1 Heebo,system-ui,sans-serif;text-transform:uppercase;transform:rotate(-5deg);
 box-shadow:var(--shadow-2),inset 0 0 0 4px ${LIGHT(20)}}
.gt-disc>span:first-child{max-width:56px;line-height:1.2;overflow:hidden;text-align:center;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.gt-dots{display:flex;gap:4px;font-size:11px;letter-spacing:.04em}.gt-dots i{width:7px;height:7px;border-radius:50%;background:${LIGHT(35)}}
.gt-dots i.on{background:var(--on-brand)}
.gt-card{min-width:78px;flex:none;padding:7px 8px;border-radius:10px;background:var(--surface);color:var(--text);
 text-align:center;box-shadow:var(--shadow-1);transform:rotate(3deg);line-height:1.1}
.gt-card:nth-of-type(odd){transform:rotate(-2deg)}
.gt-card small{display:block;font:700 11px Heebo,system-ui,sans-serif;letter-spacing:.04em;color:var(--text-dim);text-transform:uppercase}
.gt-card b{display:block;font:800 20px Fredoka,Heebo,system-ui,sans-serif}
.gt-card em{display:block;font:700 10.5px Heebo,system-ui,sans-serif;font-style:normal;color:var(--text-dim)}
.gt-tok{width:56px;height:56px;flex:none;border:0;border-radius:50%;padding:0;cursor:pointer;display:grid;place-items:center;
 background:var(--surface);color:var(--text);font-size:30px;transform:rotate(-4deg);
 box-shadow:var(--shadow-2),inset 0 0 0 4px ${BAR}}
.gt-tok+.gt-tok{transform:rotate(6deg)}
.gc-table>.ellaz-game-footer{margin:2px 7px 10px!important;width:auto!important;padding:8px 7px!important;border-radius:18px;
 background:color-mix(in oklab,var(--text) 14%,var(--surface-2));box-shadow:inset 0 4px 0 ${SHADE(8)};
 --key-bg:var(--surface);--key-ink:var(--text);--key-radius:14px;--key-shadow:var(--shadow-2)}
@media (min-width:900px){
 .gc-table::before{inset:6px 24px 6px;border-radius:40px}
 .gc-table>.ellaz-play-surface{padding:14px 16px!important}
 .gc-table.gc-cols{grid-template-rows:minmax(0,1fr)}
 .gc-table>*{grid-row:1!important}
 /* A game with a picker: the pieces on top, the picker under them, both in the
    left column; the board and the tray still span the whole height. */
 .gc-table.gc-cols:has(>.ellaz-game-side){grid-template-rows:auto minmax(0,1fr)}
 .gc-table.gc-cols:has(>.ellaz-game-side)>*{grid-row:1/-1!important}
 .gc-table.gc-cols:has(>.ellaz-game-side)>.gc-head{grid-row:1!important;align-self:end;padding-bottom:12px!important}
 .gc-table.gc-cols:has(>.ellaz-game-side)>.ellaz-game-side{grid-row:2!important}
 .gc-table>.gc-head{grid-column:1;align-self:center;max-width:none!important;margin:0!important}
 .gc-table .gt-row{gap:22px;max-width:280px;margin-inline:auto}
 .gc-table .gt-disc{width:120px;height:120px;font-size:17px;gap:6px}.gc-table .gt-disc>span:first-child{max-width:96px}
 .gc-table .gt-tok{width:76px;height:76px;font-size:34px}
 .gc-table .gt-card{min-width:96px;padding:10px}
 .gc-table>.ellaz-game-footer{margin:0!important;padding:12px 16px!important;background:none;box-shadow:none}
 .gc-table>.ellaz-game-side>*,.gc-table>.ellaz-game-footer>*{width:100%;box-sizing:border-box;padding:14px;border-radius:22px;
  background:color-mix(in oklab,var(--text) 14%,var(--surface-2));box-shadow:inset 0 4px 0 ${SHADE(8)}}
 .gc-table .ellaz-board:not([data-own-chrome]){--b-chrome:${TABLE_CHROME}px!important}
}`;

let injected = false;
/** Once per document, and only when a table game actually mounts. */
export function injectTableCss(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const tag = document.createElement("style");
  tag.dataset.gameTable = "";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

type Level = { id: string; label: Record<Locale, string> };
type Stat = { label: string; value: string | number; ltr?: boolean; record?: string | number };

/** The pieces on the mat: the level disc, a card per number, restart and pause. */
export function TablePieces({
  t,
  locale,
  levels,
  level,
  onLevel,
  stats,
  paused,
  onPaused,
}: {
  t: GameContext["t"];
  locale: Locale;
  levels?: Level[];
  level?: string;
  onLevel?: (next: string) => void;
  stats: Stat[];
  paused?: boolean;
  onPaused?: (next: boolean) => void;
}) {
  const i = levels && level ? levels.findIndex((l) => l.id === level) : -1;
  const current = i >= 0 && levels ? levels[i] : undefined;
  return (
    <div className="gt-row">
      {levels && current && onLevel && (
        <button
          type="button"
          className="gt-disc"
          aria-label={`${t("difficulty")}: ${current.label[locale]}`}
          onClick={() => onLevel(levels[(i + 1) % levels.length].id)}
        >
          <span>{current.label[locale]}</span>
          {/* Past five, dots stop being countable and poke out of the disc:
              the same two facts as "3/6", like the chrome's DOT_MAX. */}
          <span dir="ltr" className="gt-dots" aria-hidden="true">
            {levels.length <= 5
              ? levels.map((l, k) => <i key={l.id} className={k <= i ? "on" : ""} />)
              : `${i + 1}/${levels.length}`}
          </span>
        </button>
      )}
      {stats.map((s) => (
        <div key={s.label} className="gt-card">
          <small>{s.label}</small>
          <b dir={s.ltr ? "ltr" : undefined}>{s.value}</b>
          {s.record !== undefined && (
            <em dir={s.ltr ? "ltr" : undefined}>
              {t("best")} {s.record}
            </em>
          )}
        </div>
      ))}
      {onPaused && (
        <button
          type="button"
          className="gt-tok"
          aria-label={paused ? t("resume") : t("pause")}
          onClick={() => onPaused(!paused)}
        >
          <Icon name={paused ? "play" : "pause"} />
        </button>
      )}
      <button type="button" className="gt-tok" aria-label={t("restart")} onClick={runRestart}>
        <Icon name="redo" />
      </button>
    </div>
  );
}
