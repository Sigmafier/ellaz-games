import type { Locale } from "@i18n/index";
import type { GameContext } from "@sdk/index";
import { Icon } from "./icons";
import { runRestart } from "./gameTools";
import { K } from "./kinds";

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

const BAR = "oklch(from var(--g) .30 calc(c * 1.05) h)"; // the page header's own colour
const SHADE = (n: number) => `color-mix(in srgb,var(--text) ${n}%,transparent)`;
const LIGHT = (n: number) => `color-mix(in srgb,var(--on-brand) ${n}%,transparent)`;

/**
 * THE KINDS (games-doctrine G8, operator ruling 2026-09-28: "we always
 * generalize buttons and make them modular so we can change them easily").
 * Every piece is one of a few kinds, and how a kind LOOKS - size, shape, tilt,
 * fill, ink, edge, shadow, type - is read only from that kind's settings:
 *
 *   mat-*   the mat under the board      disc-*   the level disc
 *   card-*  a number card                token-*  restart / pause
 *   tray-*  the tray, tray-key-* its keys
 *
 * A theme or a new style is a list of these settings and nothing else - never a
 * rule aimed at one button. Each is read with Day's value as its fallback, so a
 * sheet sets only what it changes and an unset setting draws exactly today. Set
 * them on `body` (or `:root[data-theme=x] body`): the game colour `--g` lives on
 * <body>, so a setting that reads it resolves there and not on :root.
 * The list is the kit's (./kinds.ts, beside the bar's and the keys' kinds);
 * `game-table-kinds.test.ts` refuses a literal look below.
 */
const MAT = "color-mix(in oklab,var(--g) 13%,var(--bg))";
// 8%, not 14%: at 14% the page's quiet ink (--text-dim) read 4.27:1 on it, under
// the 4.5 a hint needs - measured by the contrast sweep on every table game,
// 2026-09-29. Lighter fill, same ink (a-contrast-floor-is-a-floor-not-a-target).
const TRAY = "color-mix(in oklab,var(--text) 8%,var(--surface-2))";
const TRAY_EDGE = `inset 0 4px 0 ${SHADE(8)}`;
// The page's own restart and pause (`[data-restart]`, `[data-pause]`) stay in
// the document and stay WIRED - the end-of-run strip's "Play again" goes
// through the same slot - they are only not drawn, because the piece on the
// mat is the one a player presses. Only settings and theme tokens below: no
// colour literal (token-hygiene.test.ts) and no literal look (the kinds test).
// Text lying on the mat or in the tray reads the page's quiet ink, --text-dim,
// and a dark mat or tray (Wood's) would leave it dark on dark (1.29:1, measured
// 2026-09-29). So the table hands its contents --text-dim from `mat-ink` and the
// tray's from `tray-ink`, each falling back to the page's own value, captured on
// <body> as --page-dim first so the two never read themselves. A white card
// lying in the tray is the page again, so it gets the page's value back - or
// Wood's cream tray ink lands on white (1.07:1, the first run of this fix).
const CSS = `
body[data-layout=table] [data-restart],body[data-layout=table] [data-pause]{display:none!important}
.gc-table{position:relative;isolation:isolate}
body{--page-dim:var(--text-dim)}
.gc-table{--text-dim:${K("mat-ink", "var(--page-dim)")}}
.gc-table>.ellaz-game-footer,.gc-table>.ellaz-game-side{--text-dim:${K("tray-ink", "var(--page-dim)")}}
.gc-table>:is(.ellaz-game-footer,.ellaz-game-side) [style*="background: var(--surface)"]{--text-dim:var(--page-dim)}
.gc-table::before{content:"";position:absolute;z-index:-1;inset:2px 3px 6px;border-radius:${K("mat-radius", "26px")};
 background:${K("mat-fill", MAT)};box-shadow:${K("mat-edge", `inset 0 0 0 3px ${SHADE(6)}`)}}
.gc-table>.gc-head{padding:5px 12px 0!important}
.gc-table>.ellaz-play-surface{padding:6px 0 6px!important}
.gt-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center}
.gt-disc{width:${K("disc-size", "64px")};height:${K("disc-size", "64px")};flex:none;border:0;border-radius:${K("disc-radius", "50%")};padding:0;cursor:pointer;
 background:${K("disc-fill", BAR)};color:${K("disc-ink", "var(--on-brand)")};display:grid;place-items:center;align-content:center;gap:4px;
 font:${K("disc-font", "800 12px/1 Heebo,system-ui,sans-serif")};text-transform:uppercase;transform:rotate(${K("disc-tilt", "-5deg")});
 box-shadow:${K("disc-shadow", `var(--shadow-2),inset 0 0 0 4px ${LIGHT(20)}`)}}
.gt-disc>span:first-child{max-width:56px;line-height:1.2;overflow:hidden;text-align:center;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.gt-dots{display:flex;gap:4px;font-size:${K("disc-dots-text", "11px")};letter-spacing:.04em}.gt-dots i{width:${K("disc-dot-size", "7px")};height:${K("disc-dot-size", "7px")};border-radius:${K("disc-dot-radius", "50%")};background:${K("disc-dot", LIGHT(35))}}
.gt-dots i.on{background:${K("disc-dot-on", "var(--on-brand)")}}
.gt-card{min-width:${K("card-min", "78px")};flex:none;padding:7px 8px;border-radius:${K("card-radius", "10px")};background:${K("card-fill", "var(--surface)")};color:${K("card-ink", "var(--text)")};
 text-align:center;box-shadow:${K("card-shadow", "var(--shadow-1)")};transform:rotate(${K("card-tilt", "3deg")});line-height:1.1}
.gt-card:nth-of-type(odd){transform:rotate(${K("card-tilt-alt", "-2deg")})}
.gt-card small{display:block;font:${K("card-label-font", "700 11px Heebo,system-ui,sans-serif")};letter-spacing:.04em;color:${K("card-label", "var(--text-dim)")};text-transform:uppercase}
.gt-card b{display:block;font:${K("card-value-font", "800 20px Fredoka,Heebo,system-ui,sans-serif")}}
.gt-card em{display:block;font:${K("card-note-font", "700 10.5px Heebo,system-ui,sans-serif")};font-style:normal;color:${K("card-label", "var(--text-dim)")}}
.gt-tok{width:${K("token-size", "56px")};height:${K("token-size", "56px")};flex:none;border:0;border-radius:${K("token-radius", "50%")};padding:0;cursor:pointer;display:grid;place-items:center;
 background:${K("token-fill", "var(--surface)")};color:${K("token-ink", "var(--text)")};font-size:${K("token-icon", "30px")};transform:rotate(${K("token-tilt", "-4deg")});
 box-shadow:${K("token-shadow", `var(--shadow-2),inset 0 0 0 4px ${BAR}`)}}
.gt-tok+.gt-tok{transform:rotate(${K("token-tilt-alt", "6deg")})}
.gc-table>.ellaz-game-footer{margin:2px 7px 10px!important;width:auto!important;padding:8px 7px!important;border-radius:${K("tray-radius", "18px")};
 background:${K("tray-fill", TRAY)};box-shadow:${K("tray-edge", TRAY_EDGE)};
 --key-bg:${K("tray-key-fill", "var(--surface)")};--key-ink:${K("tray-key-ink", "var(--text)")};--key-radius:${K("tray-key-radius", "14px")};--key-shadow:${K("tray-key-shadow", "var(--shadow-2)")}}
@media (min-width:900px){
 .gc-table::before{inset:6px 24px 6px;border-radius:${K("mat-radius-pc", "40px")}}
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
 .gc-table .gt-disc{width:${K("disc-size-pc", "120px")};height:${K("disc-size-pc", "120px")};font-size:${K("disc-text-pc", "17px")};gap:6px}.gc-table .gt-disc>span:first-child{max-width:96px}
 .gc-table .gt-tok{width:${K("token-size-pc", "76px")};height:${K("token-size-pc", "76px")};font-size:${K("token-icon-pc", "34px")}}
 .gc-table .gt-card{min-width:${K("card-min-pc", "96px")};padding:10px}
 .gc-table>.ellaz-game-footer{margin:0!important;padding:12px 16px!important;background:none;box-shadow:none}
 .gc-table>.ellaz-game-side>*,.gc-table>.ellaz-game-footer>*{width:100%;box-sizing:border-box;padding:14px;border-radius:${K("tray-radius-pc", "22px")};
  background:${K("tray-fill", TRAY)};box-shadow:${K("tray-edge", TRAY_EDGE)}}
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
  levelLabel,
  stats,
  paused,
  onPaused,
}: {
  t: GameContext["t"];
  locale: Locale;
  levels?: Level[];
  level?: string;
  onLevel?: (next: string) => void;
  /** What the disc picks when it is not a difficulty (GameChrome's `levelLabel`). */
  levelLabel?: string;
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
          aria-label={`${levelLabel ?? t("difficulty")}: ${current.label[locale]}`}
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
