import { K, TOOL_ROLES, type Setting } from "../ui/kinds";

/**
 * THE BAR'S BUTTONS, DRAWN FROM THEIR KINDS (games-doctrine G8; the kit is
 * src/ui/kinds.ts). Emitted into every screen document, after the rules that
 * lay the bar out, because the bar is painted before any script runs.
 *
 *   lid     home, the language globe, the "..." button, and the coins
 *   tool    pause, restart, sound, favourite, share, full screen, tell us -
 *           in the bar (a phone moves pause and restart up) or in the row
 *   sheet   the "..." menu and the language list
 *
 * Every look below is a setting with Day's value as its fallback, so with no
 * theme picked this draws exactly what the rules above it drew. A theme sheet
 * holds values only (operator ruling 2026-09-28, "Values only") and this is
 * the one place that knows which element wears them.
 *
 * Three techniques, each for one reason:
 *
 * - A ROLE's value reaches the look through a private property on the button
 *   (`--tr-fill: var(--tool-fill-pause)`). Unset, that property is invalid,
 *   and `var(--tr-fill, <the place's chain>)` falls through to the kind - so a
 *   role overrides whichever place the button is in without one rule per pair.
 *   The value must be resolved ON the button: a setting that reads another
 *   variable is resolved where it is declared (body), not where it is used.
 * - A pressed button that is also hovered gets its own rule, so an unset
 *   `-down` falls back to the hover fill and Day's press still reads as hover.
 * - The phone bar's tools are matched by exactly the selector of the rule
 *   that lays them out (DOCUMENT_CSS), so the kit wins that tie by coming later.
 *
 * Costs no first visit: the home page is not a screen document. Measured on
 * each game page's document when it shipped (see the build log).
 */

const LID = "body.screen .top .hbtn:not(.moresheet *)";
const PURSE = "body.screen .top .wallet-wrap:not(.moresheet *)";
const SOUND = "body.screen .top [data-sound]:not(.moresheet *)";
const BAR_TOOL = 'body[data-page="game"].screen .top .in>.ubtn';
const ROW_TOOL = "body.screen .urow .tools .ubtn";

// Day's values, each the one the rule it replaces carries.
const LID_FILL = "rgba(255,255,255,.12)";
const LID_HOVER = "rgba(255,255,255,.2)";
const HDR_INK = "var(--hdr-ink)";

/** `var(--a, var(--b, day))` - the first setting a style gave, else Day. */
const chain = (names: Setting[], day: string): string => names.reduceRight((acc, n) => K(n, acc), day);

const lidCss = `
${LID},${PURSE}{background:${K("lid-fill", LID_FILL)};color:${K("lid-ink", HDR_INK)};border:${K("lid-edge", "0")};
 border-radius:${K("lid-radius", "var(--hrad)")};box-shadow:${K("lid-shadow", "none")};clip-path:${K("lid-clip", "none")};
 transition:${K("lid-motion", "0s")};rotate:var(--lr-tilt,none)}
${PURSE}{border-radius:${K("lid-radius", "99px")};font-family:${K("wallet-font", "inherit")};font-size:${K("wallet-size", "inherit")}}
${PURSE} #wallet-slot>*{color:${chain(["wallet-ink", "lid-ink"], HDR_INK)}}
${LID}:hover{background:${K("lid-fill-hover", LID_HOVER)}}
${LID}:active{translate:${K("lid-press", "none")};scale:${K("lid-squash", "none")};
 box-shadow:${chain(["lid-shadow-down", "lid-shadow"], "none")};background:${chain(["lid-fill-down", "lid-fill"], LID_FILL)}}
${LID}:active:hover{background:${chain(["lid-fill-down", "lid-fill-hover"], LID_HOVER)}}
body.screen .top .hbtn.home{--lr-tilt:var(--lid-tilt-home)}
body.screen .top .lang:not(.moresheet *)>summary{--lr-tilt:var(--lid-tilt-lang)}
body.screen .top .more>summary{--lr-tilt:var(--lid-tilt-more)}
${PURSE}{--lr-tilt:var(--lid-tilt-wallet)}
@media (min-width:720px){${PURSE}::before{content:${K("wallet-label", "none")};color:${K("wallet-label-ink", "inherit")};
 margin-inline-end:10px;letter-spacing:1px}}`;

/**
 * One tool apart from the rest: its fill, ink, tilt and shadows, where a style
 * names them. Keyed on the role alone: only the tool rules below read --tr-*,
 * and none of them matches a row inside the "..." menu.
 */
const roleCss = TOOL_ROLES.map((r) =>
  `[data-${r}]{--tr-fill:var(--tool-fill-${r});--tr-ink:var(--tool-ink-${r});--tr-tilt:var(--tool-tilt-${r});` +
  `--tr-shadow:var(--tool-shadow-${r});--tr-down:var(--tool-shadow-down-${r})}`,
).join("\n");

// Each place works out its tool's fill (--tf) and shadow (--ts) once, on the
// button, and every state below starts from them.
const toolCss = `
${roleCss}
${BAR_TOOL},${SOUND},${ROW_TOOL}{border:${K("tool-edge", "0")};clip-path:${K("tool-clip", "none")};
 transition:${K("tool-motion", "0s")};rotate:var(--tr-tilt,none);background:var(--tf);box-shadow:var(--ts)}
${BAR_TOOL},${SOUND}{--tf:var(--tr-fill,${chain(["tool-fill-bar", "tool-fill"], LID_FILL)});
 --ts:var(--tr-shadow,${chain(["tool-shadow-bar", "tool-shadow"], "none")});
 color:var(--tr-ink,${chain(["tool-ink-bar", "tool-ink"], HDR_INK)});border-radius:${K("tool-radius", "var(--hrad)")}}
${ROW_TOOL}{--tf:var(--tr-fill,${K("tool-fill", "var(--doc-card)")});--ts:var(--tr-shadow,${K("tool-shadow", "0 2px 0 var(--doc-line)")});
 color:var(--tr-ink,${K("tool-ink", "var(--doc-ink)")});border-radius:${K("tool-radius", "var(--urad)")}}
${BAR_TOOL}:hover,${ROW_TOOL}:hover{background:${K("tool-fill-hover", "var(--tf)")}}
${SOUND}:hover{background:${chain(["tool-fill-hover", "lid-fill-hover"], LID_HOVER)}}
${BAR_TOOL}:active,${ROW_TOOL}:active{translate:${K("tool-press", "none")};scale:${K("tool-squash", "none")};
 box-shadow:var(--tr-down,${K("tool-shadow-down", "var(--ts)")})}
${SOUND}:active{background:${K("lid-fill-down", "var(--tf)")};translate:${chain(["tool-press", "lid-press"], "none")};
 scale:${chain(["tool-squash", "lid-squash"], "none")};box-shadow:var(--tr-down,${chain(["tool-shadow-down", "lid-shadow-down"], "var(--ts)")})}
${SOUND}:active:hover{background:${chain(["lid-fill-down", "tool-fill-hover", "lid-fill-hover"], LID_HOVER)}}
${ROW_TOOL}[data-restart]{box-shadow:${K("tool-shadow-restart-row", "var(--ts)")}}
${ROW_TOOL}[data-restart]:active{box-shadow:${K("tool-shadow-restart-row", `var(--tr-down,${K("tool-shadow-down", "var(--ts)")})`)}}`;

const sheetCss = `
body.screen .moresheet,.langsheet{background:${K("sheet-fill", "var(--doc-card)")};border:${K("sheet-edge", "1px solid var(--doc-line)")};
 box-shadow:${K("sheet-shadow", "0 10px 30px rgba(0,0,0,.25)")}}
body.screen .moresheet{border-radius:${K("sheet-radius", "var(--urad,14px)")};color:${K("sheet-ink", "var(--doc-ink)")}}
.langsheet{border-radius:${K("sheet-radius", "var(--urad)")};color:${K("sheet-ink", "inherit")}}`;

/** Motion is the player's call before it is a style's: reduced motion drops every kind's. */
const stillCss = `
@media (prefers-reduced-motion:reduce){${LID},${PURSE},${BAR_TOOL},${SOUND},${ROW_TOOL}{transition:0s}}`;

export const KIT_CSS = lidCss + toolCss + sheetCss + stillCss;
